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
      case "MONEY_ADDED":
      case "FUNDS_RELEASED":
        change = entry.amount;
        break;
      case "WITHDRAWAL":
        change = entry.amount; // usually negative
        break;
      case "FUNDS_PLEDGED":
        change = -entry.amount;
        break;
      case "PHONE_SALE":
        // In the selector, it only adds to sales, but typically cash is received
        // We'll follow the exact wallet selector logic for running balance:
        change = 0;
        break;
      case "FUNDS_CONSUMED":
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
      case "MONEY_ADDED":
      case "FUNDS_RELEASED":
        change = entry.amount;
        break;
      case "WITHDRAWAL":
        change = entry.amount; // negative
        break;
      case "FUNDS_PLEDGED":
        change = -entry.amount;
        break;
      case "PHONE_SALE":
        // if sales are considered cash in:
        change = entry.amount;
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
  XLSX.writeFile(wb, `StockFlow_Export_${timestamp}.xlsx`);
};
