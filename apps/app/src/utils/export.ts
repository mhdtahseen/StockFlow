import * as XLSX from "xlsx";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  parseISO,
} from "date-fns";
import { Phone } from "../features/inventory/types";
import { LedgerEntry } from "../features/ledger/types";

type Period = "daily" | "weekly" | "monthly";

export const generateExport = (
  phones: Phone[],
  ledgerEntries: LedgerEntry[],
  period: Period,
) => {
  // 1. Ledger Export
  const sortedLedger = [...ledgerEntries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let runningBalance = 0;
  const ledgerData = sortedLedger.map((entry) => {
    let change = 0;
    switch (entry.type) {
      case "CAPITAL_INJECTION":
      case "CUSTOMER_PAYMENT":
      case "FUNDS_RELEASED":
      case "PHONE_SALE":
        change = entry.amount; // positive
        break;
      case "WITHDRAWAL":
      case "SUPPLIER_PAYMENT":
      case "PROFIT_WITHDRAWAL":
      case "REPAIR_COST":
        change = entry.amount; // negative
        break;
      case "FUNDS_PLEDGED":
        // This moves money OUT of wallet into lien
        change = entry.amount; // usually negative
        break;
      case "FUNDS_CONSUMED":
        // This is money spent from the lien, doesn't affect wallet balance again
        change = 0;
        break;
    }
    runningBalance += change;

    const refPhone = entry.referenceId
      ? phones.find((p) => p.id === entry.referenceId)
      : null;
    const refString = refPhone
      ? `${refPhone.brand} ${refPhone.model} (${entry.referenceId})`
      : entry.referenceId || "N/A";

    return {
      Date: format(parseISO(entry.createdAt), "yyyy-MM-dd HH:mm:ss"),
      "Transaction Type": entry.type,
      Reference: refString,
      Amount: entry.amount,
      "Running Balance": runningBalance,
    };
  });

  // 2. Inventory Export
  const inventoryData = phones.map((p) => {
    return {
      Brand: p.brand,
      Model: p.model,
      RAM: p.ram,
      Storage: p.storage,
      Color: p.color,
      "Purchase Price": p.purchasePrice,
      "Sale Price": p.salePrice || "N/A",
      Status: p.status,
      "Profit/Loss":
        p.status === "SOLD" && p.salePrice
          ? p.salePrice - p.purchasePrice
          : "N/A",
      "Issue Tags": p.issueTags.join(", ") || "None",
      "Created Date": format(parseISO(p.createdAt), "yyyy-MM-dd HH:mm:ss"),
    };
  });

  // 3. Sold Phones Export
  const soldData = inventoryData.filter((p) => p.Status === "SOLD");

  // 4. Cashflow Summary Export
  const cashflowBuckets: Record<string, { in: number; out: number }> = {};

  sortedLedger.forEach((entry) => {
    const d = parseISO(entry.createdAt);
    let key = "";
    if (period === "daily") {
      key = format(startOfDay(d), "yyyy-MM-dd");
    } else if (period === "weekly") {
      key = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd (Week)");
    } else {
      key = format(startOfMonth(d), "yyyy-MM (Month)");
    }

    if (!cashflowBuckets[key]) {
      cashflowBuckets[key] = { in: 0, out: 0 };
    }

    let change = 0;
    switch (entry.type) {
      case "CAPITAL_INJECTION":
      case "CUSTOMER_PAYMENT":
      case "FUNDS_RELEASED":
      case "PHONE_SALE":
        change = entry.amount;
        break;
      case "WITHDRAWAL":
      case "SUPPLIER_PAYMENT":
      case "PROFIT_WITHDRAWAL":
      case "REPAIR_COST":
      case "FUNDS_PLEDGED":
        change = entry.amount; // usually negative
        break;
      case "FUNDS_CONSUMED":
        change = 0;
        break;
    }

    if (change > 0) {
      cashflowBuckets[key].in += change;
    } else if (change < 0) {
      cashflowBuckets[key].out += Math.abs(change);
    }
  });

  let prevBalance = 0;
  const cashflowData = Object.keys(cashflowBuckets).map((key) => {
    const b = cashflowBuckets[key];
    const net = b.in - b.out;
    const end = prevBalance + net;
    const row = {
      Period: key,
      "Beginning Balance": prevBalance,
      "Total Cash In": b.in,
      "Total Cash Out": b.out,
      "Net Change": net,
      "Ending Balance": end,
    };
    prevBalance = end;
    return row;
  });

  // Guard against completely empty arrays which crash XLSX
  if (ledgerData.length === 0)
    ledgerData.push({
      Date: "-",
      "Transaction Type": "-",
      Reference: "-",
      Amount: 0,
      "Running Balance": 0,
    } as any);
  if (inventoryData.length === 0)
    inventoryData.push({
      Brand: "-",
      Model: "-",
      RAM: "-",
      Storage: "-",
      Color: "-",
      "Purchase Price": 0,
      "Sale Price": "-",
      Status: "-",
      "Profit/Loss": "-",
      "Issue Tags": "-",
      "Created Date": "-",
    } as any);
  if (soldData.length === 0)
    soldData.push({
      Brand: "-",
      Model: "-",
      RAM: "-",
      Storage: "-",
      Color: "-",
      "Purchase Price": 0,
      "Sale Price": "-",
      Status: "-",
      "Profit/Loss": "-",
      "Issue Tags": "-",
      "Created Date": "-",
    } as any);
  if (cashflowData.length === 0)
    cashflowData.push({
      Period: "-",
      "Beginning Balance": 0,
      "Total Cash In": 0,
      "Total Cash Out": 0,
      "Net Change": 0,
      "Ending Balance": 0,
    } as any);

  // Create workbook and append sheets
  const wb = XLSX.utils.book_new();

  const wsLedger = XLSX.utils.json_to_sheet(ledgerData);
  XLSX.utils.book_append_sheet(wb, wsLedger, "Ledger");

  const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
  XLSX.utils.book_append_sheet(wb, wsInventory, "Inventory");

  const wsSold = XLSX.utils.json_to_sheet(soldData);
  XLSX.utils.book_append_sheet(wb, wsSold, "Sold Phones");

  const wsCashflow = XLSX.utils.json_to_sheet(cashflowData);
  XLSX.utils.book_append_sheet(wb, wsCashflow, "Cashflow Summary");

  // Output file
  const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

  // Use base64 approach to bypass buffer/array issues in Vite
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  const a = document.createElement("a");
  a.href =
    "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," +
    wbout;
  a.download = `Finventree_Export_${timestamp}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
