import * as React from "react";
import { PurchaseOrder, PurchaseOrderItem } from "@/features/purchasing/types";
import { Customer as Supplier } from "@/features/customers/types";
import { TenantInfo } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";

interface PurchaseOrderPrintableProps {
  order: PurchaseOrder;
  supplier: Supplier | undefined;
  tenant: TenantInfo | null;
}

const HEX = {
  blue600: "#2563eb",
  blue800: "#1e40af",
  blue50: "#eff6ff",
  blue100: "#dbeafe",
  blue200: "#bfdbfe",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  emerald50: "#ecfdf5",
  emerald600: "#059669",
  emerald500: "#10b981",
  orange50: "#fff7ed",
  orange600: "#ea580c",
  rose500: "#f43f5e",
  white: "#ffffff",
  slate300: "#cbd5e1",
};

const formatCurrency = (amount: number) => {
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
};

const amountToWords = (num: number) => {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  };

  const split = num.toFixed(2).split(".");
  const whole = parseInt(split[0]);
  const decimal = split[1] ? parseInt(split[1]) : 0;

  let words = inWords(whole) + "Rupees ";
  if (decimal > 0) {
    words += "and " + inWords(decimal) + "Paise ";
  }
  return words + "Only";
};

export const PurchaseOrderPrintable: React.FC<PurchaseOrderPrintableProps> = ({
  order,
  supplier,
  tenant,
}) => {
  const acceptedItems = order.items.filter(item => item.status === "ACCEPTED");
  const rejectedItems = order.items.filter(item => item.status === "REJECTED");
  
  // Sum only fully processed items (Accepted + Rejected) to ignore ghost rows
  const initialTotal = order.items
    .filter(item => item.status === "ACCEPTED" || item.status === "REJECTED")
    .reduce((sum, item) => sum + item.purchasePrice, 0);
    
  const rejectedTotal = rejectedItems.reduce((sum, item) => sum + item.purchasePrice, 0);
  const platformFee = order.platformFee || 0;
  const netPayable = initialTotal - rejectedTotal + platformFee;
  const pendingAmount = netPayable - (order.amountPaid || 0);
  const isPaid = order.status === "SETTLED";

  return (
    <div
      id="invoice-printable"
      style={{
        width: "210mm",
        backgroundColor: HEX.white,
        color: HEX.slate800,
        padding: "15mm",
        fontFamily: "'Noto Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. HEADER SECTION (Tenant Info) */}
      <div
        id="invoice-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "40px",
          paddingBottom: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              color: HEX.blue600,
              fontSize: "26px",
              fontWeight: "900",
              margin: "0 0 16px 0",
              letterSpacing: "-0.025em",
            }}
          >
            PURCHASE ORDER
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ color: HEX.slate900, fontSize: "20px", fontWeight: "700", margin: "0" }}>
              {tenant?.name || "STOCKFLOW MERCHANT"}
            </h2>
            <p style={{ color: HEX.slate500, fontSize: "13px", lineHeight: "1.6", textTransform: "uppercase", margin: 0, maxWidth: "320px" }}>
              {tenant?.address || "Configure address in Settings"}
            </p>
            <div style={{ color: HEX.slate700, paddingTop: "8px", fontSize: "13px", fontWeight: "700" }}>
              <span style={{ color: HEX.slate400, fontWeight: "normal" }}>GSTIN:</span> {tenant?.gstin || "N/A"}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: HEX.blue600,
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            width: "160px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
                PO Number
              </p>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: "900" }}>
                PO-{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
                Date Issued
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                {format(parseISO(order.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: HEX.slate100, height: "1px", width: "100%", marginBottom: "32px" }} />

      {/* 2. PARTIES SECTION */}
      <div
        id="invoice-parties"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "40px",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: HEX.slate400, margin: "0 0 12px 0" }}>
            To Supplier:
          </p>
          <h3 style={{ color: HEX.slate900, margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700" }}>
            {supplier?.name || "Independent Reseller"}
          </h3>
          <p style={{ color: HEX.slate500, margin: "0 0 12px 0", fontSize: "13px", lineHeight: "1.6", maxWidth: "300px" }}>
            {supplier?.address || "Address not specified."}
          </p>
          <div style={{ color: HEX.slate700, fontSize: "13px", fontWeight: "700" }}>
            <span style={{ color: HEX.slate400, fontWeight: "normal" }}>Phone:</span> {supplier?.phone || "N/A"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: HEX.slate400, margin: "0 0 12px 0" }}>
            PO Status:
          </p>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: "9999px",
              fontWeight: "900",
              fontSize: "11px",
              display: "inline-block",
              backgroundColor: isPaid ? HEX.emerald50 : HEX.orange50,
              color: isPaid ? HEX.emerald600 : HEX.orange600,
              textTransform: "uppercase",
            }}
          >
            {isPaid ? "SETTLED" : order.status}
          </div>
        </div>
      </div>

      {/* 3. ACCEPTED ITEMS */}
      <div style={{ marginBottom: "32px", borderRadius: "16px", border: `1px solid ${HEX.slate100}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead id="invoice-table-header">
            <tr style={{ backgroundColor: HEX.slate50, borderBottom: `1px solid ${HEX.slate100}` }}>
              <th style={{ color: HEX.slate400, fontSize: "10px", fontWeight: "900", padding: "12px 24px", width: "40px" }}>No.</th>
              <th style={{ color: HEX.slate400, fontSize: "10px", fontWeight: "900", padding: "12px 24px" }}>Items Received</th>
              <th style={{ color: HEX.slate400, fontSize: "10px", fontWeight: "900", padding: "12px 24px", textAlign: "right" }}>Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            {acceptedItems.map((item, index) => (
              <tr key={item.id} id={`invoice-row-${index}`} style={{ borderBottom: `1px solid ${HEX.slate100}` }}>
                <td style={{ color: HEX.slate400, fontSize: "13px", padding: "16px 24px", textAlign: "center" }}>{(index + 1).toString().padStart(2, "0")}</td>
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ color: HEX.slate900, fontSize: "14px", fontWeight: "700" }}>{item.brand} {item.model}</div>
                  <div style={{ color: HEX.slate500, fontSize: "11px", fontWeight: "600" }}>{item.ram} / {item.storage}</div>
                </td>
                <td style={{ color: HEX.slate700, fontSize: "13px", fontWeight: "700", padding: "16px 24px", textAlign: "right" }}>{formatCurrency(item.purchasePrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. REJECTED ITEMS (If any) */}
      {rejectedItems.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ color: HEX.rose500, fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            ❌ Non-Compliant / Rejected Items
          </div>
          <div style={{ borderRadius: "16px", border: `1px solid ${HEX.rose500}20`, backgroundColor: `${HEX.rose500}05`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <tbody>
                {rejectedItems.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${HEX.rose500}10` }}>
                    <td style={{ color: HEX.rose500, opacity: 0.6, fontSize: "12px", padding: "12px 24px", width: "40px" }}>R-{index + 1}</td>
                    <td style={{ padding: "12px 24px" }}>
                      <div style={{ color: HEX.slate900, fontSize: "13px", fontWeight: "700" }}>{item.brand} {item.model}</div>
                      <div style={{ color: HEX.rose500, fontSize: "10px", fontWeight: "600" }}>Reason: {item.rejectionReason || "Mismatch"}</div>
                    </td>
                    <td style={{ color: HEX.slate400, fontSize: "12px", padding: "12px 24px", textAlign: "right", textDecoration: "line-through" }}>
                      {formatCurrency(item.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TOTALS SECTION */}
      <div id="invoice-totals" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div style={{ flex: 1, paddingRight: "40px" }}>
          <h4 style={{ color: HEX.slate400, fontSize: "10px", fontWeight: "900", textTransform: "uppercase", margin: "0 0 8px 0" }}>Amount in Words</h4>
          <p style={{ color: HEX.slate700, fontSize: "13px", fontWeight: "700", lineHeight: "1.5" }}>{amountToWords(netPayable)}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: HEX.slate400 }}>
            <span>Initial PO Total</span>
            <span style={{ color: HEX.slate700 }}>{formatCurrency(initialTotal)}</span>
          </div>
          {rejectedTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: HEX.rose500 }}>
              <span>Deductions (Rejected)</span>
              <span>- {formatCurrency(rejectedTotal)}</span>
            </div>
          )}
          {platformFee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: HEX.slate500 }}>
              <span>Platform / Logistics Fee</span>
              <span>+ {formatCurrency(platformFee)}</span>
            </div>
          )}
          
          <div style={{ backgroundColor: HEX.slate100, height: "1px", width: "280px", margin: "4px 0" }} />

          <div style={{ backgroundColor: HEX.blue50, borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "280px" }}>
            <span style={{ color: HEX.blue600, fontSize: "13px", fontWeight: "900", textTransform: "uppercase" }}>Net Payable</span>
            <span style={{ color: HEX.blue800, fontSize: "20px", fontWeight: "900" }}>{formatCurrency(netPayable)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", fontWeight: "700", paddingTop: "8px" }}>
            <span style={{ color: HEX.slate400 }}>Disbursed (Paid)</span>
            <span style={{ color: HEX.emerald500 }}>{formatCurrency(order.amountPaid)}</span>
          </div>
          
          {pendingAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", fontWeight: "700" }}>
              <span style={{ color: HEX.slate400 }}>Balance Outstanding</span>
              <span style={{ color: HEX.rose500 }}>{formatCurrency(pendingAmount)}</span>
            </div>
          )}
        </div>
      </div>

      <div id="invoice-footer" style={{ paddingTop: "24px", borderTop: `1px solid ${HEX.slate100}` }}>
        <h4 style={{ color: HEX.slate900, fontSize: "10px", fontWeight: "900", textTransform: "uppercase", margin: "0 0 12px 0" }}>Notes & Observations</h4>
        <p style={{ color: HEX.slate400, fontSize: "10px", margin: 0, lineHeight: "1.5" }}>
          This procurement request was generated via StockFlow. All items listed under "Items Received" have passed initial compliance inspection. 
          Rejected items are listed for record adjustment and must be reconciled by the supplier. This is a computer-generated document.
        </p>
      </div>
    </div>
  );
};
