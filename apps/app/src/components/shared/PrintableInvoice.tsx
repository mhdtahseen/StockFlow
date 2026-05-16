import * as React from "react";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";

interface PrintableInvoiceProps {
  order: SaleOrder | PurchaseOrder;
  counterparty: Customer | undefined;
  tenant: TenantInfo | null;
  type: "SALE" | "PURCHASE";
}

const formatCurrency = (amount: number) =>
  `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const amountToWords = (num: number): string => {
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

  const split = Math.abs(num).toFixed(2).split(".");
  const whole = parseInt(split[0]);
  const decimal = parseInt(split[1] || "0");

  let words = inWords(whole) + "Rupees ";
  if (decimal > 0) words += "and " + inWords(decimal) + "Paise ";
  return words + "Only";
};

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  order,
  counterparty,
  tenant,
  type,
}) => {
  const isPO = type === "PURCHASE";
  const isPaid = order.status === "SETTLED";
  const pendingAmount = (order.totalAmount || 0) - (order.amountPaid || 0);
  const docTitle = isPO ? "PURCHASE ORDER" : "TAX INVOICE";
  const docPrefix = isPO ? "PO" : "INV";
  const counterpartyLabel = isPO ? "Supplier" : "Bill To";

  // Normalize items for display
  const items = (order.items || []).map((item: any) => ({
    brand: item.brandSnapshot || item.brand || "Unknown",
    model: item.modelSnapshot || item.model || "Item",
    storage: item.storageSnapshot || item.storage || "",
    color: item.colorSnapshot || item.color || "",
    ram: item.ramSnapshot || item.ram || "",
    imei: item.imeiSnapshot?.[0] || item.imei || "",
    unitPrice: isPO ? (item.purchasePrice || 0) : (item.salePrice || 0),
    effectivePrice: isPO
      ? (item.purchasePrice || 0)
      : (item.effectivePrice || item.salePrice || 0),
    discountAmount: item.discountAmount || 0,
    status: item.status,
  }));

  let dateStr = "N/A";
  try {
    dateStr = format(parseISO(order.createdAt), "MMMM d, yyyy");
  } catch {
    try {
      dateStr = format(new Date(order.createdAt), "MMMM d, yyyy");
    } catch { /* keep N/A */ }
  }

  // ─── Color Palette ───
  const C = {
    blue600: "#2563eb",
    blue100: "#dbeafe",
    blue700: "#1d4ed8",
    green100: "#dcfce7",
    green700: "#15803d",
    green600: "#16a34a",
    orange100: "#ffedd5",
    orange700: "#c2410c",
    red100: "#fee2e2",
    red700: "#b91c1c",
    red600: "#dc2626",
    amber100: "#fef3c7",
    amber700: "#b45309",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
    white: "#ffffff",
  };

  const statusColor = isPaid
    ? { bg: C.green100, text: C.green700 }
    : pendingAmount > 0
      ? { bg: C.orange100, text: C.orange700 }
      : { bg: C.blue100, text: C.blue700 };

  const statusText = isPaid
    ? `Paid${(order as any).paymentMode ? ` - ${(order as any).paymentMode}` : ""}`
    : order.status === "PARTIAL"
      ? "Partial"
      : "Pending";

  const generatedAt = format(new Date(), "dd MMM yyyy, hh:mm a");

  return (
    <div
      id="printable-invoice-root"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: C.gray800, backgroundColor: C.white }}
    >
      <style>{`
        #printable-invoice-root, #printable-invoice-root * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box;
        }
        @media print {
          body { background: none !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .pi-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; min-height: auto !important; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          @page { margin: 12mm 15mm; }
        }
      `}</style>

      <div
        className="pi-container"
        style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", background: C.white, padding: "12mm 15mm" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {/* ═══ REPEATING COLUMN HEADERS ONLY ═══ */}
          {/* <thead style={{ display: "table-header-group" }}>
            <tr style={{ borderBottom: `2px solid ${C.blue600}` }}>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, width: "48px", textAlign: "center" }}>No.</th>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, textAlign: "left" }}>Description</th>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, textAlign: "center", width: "60px" }}>HSN</th>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, textAlign: "right", width: "110px" }}>Unit Price</th>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, textAlign: "center", width: "60px" }}>GST %</th>
              <th style={{ padding: "16px 8px", fontWeight: "bold", fontSize: "14px", color: C.gray900, textAlign: "right", width: "120px" }}>Amount</th>
            </tr>
          </thead> */}

          {/* ═══ BODY ═══ */}
          <tbody>
            {/* ─── Document Header (prints once, page 1 only) ─── */}
            <tr>
              <td colSpan={6} style={{ padding: 0, border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid ${C.gray200}` }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: "bold", color: C.blue600, letterSpacing: "-0.025em", margin: "0 0 10px 0" }}>
                      {docTitle}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", backgroundColor: C.blue600, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: "bold", fontSize: "16px" }}>
                        {(tenant?.name || "S")[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: "15px", fontWeight: "bold", color: C.gray900, margin: 0, lineHeight: 1.2 }}>
                          {tenant?.name || "Smart Inventory"}
                        </h2>
                        <p style={{ fontSize: "10px", color: C.gray500, margin: 0, lineHeight: 1.4 }}>
                          {[tenant?.address, tenant?.phone && `Ph: ${tenant.phone}`, tenant?.gstin && `GSTIN: ${tenant.gstin}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ backgroundColor: C.blue600, color: C.white, padding: "10px 14px", borderRadius: "6px", display: "inline-block", textAlign: "left", minWidth: "170px" }}>
                      <div style={{ marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", opacity: 0.8, display: "block" }}>
                          {isPO ? "PO Number" : "Invoice Number"}
                        </span>
                        <span style={{ fontWeight: "bold" }}>
                          {docPrefix}-{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", opacity: 0.8, display: "block" }}>Date of Issue</span>
                        <span style={{ fontWeight: "bold" }}>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* Billing / Supplier Info Section */}
            <tr>
              <td colSpan={6} style={{ padding: "10px 0", border: "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <h3 style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: C.gray400, marginBottom: "6px", letterSpacing: "0.1em" }}>
                      {counterpartyLabel}:
                    </h3>
                    <div>
                      <p style={{ fontWeight: "bold", color: C.gray900, fontSize: "14px", margin: "0 0 2px 0" }}>
                        {counterparty?.name || (isPO ? "Supplier" : "Walk-in Customer")}
                      </p>
                      <p style={{ fontSize: "12px", color: C.gray600, margin: "0 0 4px 0" }}>
                        {counterparty?.address || "No address provided."}
                      </p>
                      <p style={{ fontSize: "12px", margin: 0 }}>
                        <span style={{ fontWeight: "600" }}>Phone:</span>{" "}
                        {counterparty?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", maxWidth: "200px" }}>
                      <h3 style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: C.gray400, marginBottom: "6px", letterSpacing: "0.1em", textAlign: "right" }}>
                        Payment Status:
                      </h3>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", backgroundColor: statusColor.bg, color: statusColor.text }}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* ─── Item Column Headers ─── */}
            <tr style={{ backgroundColor: C.gray50, borderTop: `2px solid ${C.blue600}`, borderBottom: `1px solid ${C.gray200}` }}>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "center", width: "40px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sr.</th>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>Particulars</th>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "center", width: "56px", textTransform: "uppercase", letterSpacing: "0.05em" }}>HSN</th>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "right", width: "96px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</th>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "center", width: "52px", textTransform: "uppercase", letterSpacing: "0.05em" }}>GST%</th>
              <th style={{ padding: "7px 6px", fontSize: "11px", fontWeight: "700", color: C.gray600, textAlign: "right", width: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
            </tr>

            {/* ─── Item Rows ─── */}
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                <td style={{ padding: "7px 6px", textAlign: "center", color: C.gray500, fontSize: "12px" }}>
                  {(index + 1).toString().padStart(2, "0")}
                </td>
                <td style={{ padding: "7px 6px" }}>
                  <span style={{ fontWeight: "bold", display: "block", color: C.gray900, fontSize: "13px" }}>
                    {item.brand} {item.model}
                  </span>
                  {(item.ram || item.storage || item.color) && (
                    <span style={{ fontSize: "11px", color: C.gray500, display: "block", marginTop: "2px" }}>
                      {[item.color, item.storage, item.ram && `${item.ram} RAM`]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                  )}
                  {item.imei && (
                    <span style={{ fontSize: "9px", fontFamily: "monospace", backgroundColor: C.gray50, padding: "1px 4px", marginTop: "2px", display: "inline-block", border: `1px solid ${C.gray100}` }}>
                      IMEI: {item.imei}
                    </span>
                  )}
                  {isPO && item.status && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      marginLeft: "8px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: item.status === "ACCEPTED" ? C.green100 : item.status === "REJECTED" ? C.red100 : C.amber100,
                      color: item.status === "ACCEPTED" ? C.green700 : item.status === "REJECTED" ? C.red700 : C.amber700,
                    }}>
                      {item.status.replace("_", " ")}
                    </span>
                  )}
                </td>
                <td style={{ padding: "7px 6px", textAlign: "center", color: C.gray600, fontSize: "12px" }}>8517</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: "500", fontSize: "12px" }}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td style={{ padding: "7px 6px", textAlign: "center", color: C.gray600, fontSize: "12px" }}>0%</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>
                  {formatCurrency(item.effectivePrice)}
                </td>
              </tr>
            ))}

            {/* ─── Financials Section ─── */}
            <tr>
              <td colSpan={6} style={{ paddingTop: "14px", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: "46%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.gray600, marginBottom: "6px" }}>
                      <span>Subtotal (Before Tax)</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.gray600, marginBottom: "6px" }}>
                      <span>CGST (0%)</span>
                      <span>₹0.00</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.gray600, borderBottom: `1px solid ${C.gray100}`, paddingBottom: "6px", marginBottom: "6px" }}>
                      <span>SGST (0%)</span>
                      <span>₹0.00</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", color: C.gray700, marginBottom: "4px" }}>
                      <span>Amount Paid</span>
                      <span style={{ color: C.green600 }}>
                        {formatCurrency(order.amountPaid || 0)}
                      </span>
                    </div>
                    {pendingAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", color: C.gray700, marginBottom: "6px" }}>
                        <span>Amount Pending</span>
                        <span style={{ color: C.red600 }}>
                          {formatCurrency(pendingAmount)}
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", backgroundColor: C.blue600, color: C.white, borderRadius: "6px", marginTop: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>Grand Total</span>
                      <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <div style={{ fontSize: "9px", textAlign: "right", color: C.gray400, fontStyle: "italic", marginTop: "6px" }}>
                      Amount in words: {amountToWords(order.totalAmount)}
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* ─── Terms & Signature ─── */}
            <tr>
              <td colSpan={6} style={{ paddingTop: "14px", border: "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", paddingBottom: "14px", borderBottom: `1px solid ${C.gray200}` }}>
                  <div style={{ fontSize: "9px", color: C.gray500, lineHeight: "1.5" }}>
                    <h4 style={{ fontWeight: "bold", color: C.gray700, textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em", fontSize: "9px" }}>
                      Terms &amp; Conditions
                    </h4>
                    <ol style={{ paddingLeft: "14px", margin: 0 }}>
                      <li style={{ marginBottom: "2px" }}>Goods once sold will not be taken back or exchanged.</li>
                      <li style={{ marginBottom: "2px" }}>Manufacturer's warranty applies as per their standard policy.</li>
                      <li style={{ marginBottom: "2px" }}>Subject to local jurisdiction only.</li>
                      <li style={{ marginBottom: "2px" }}>This is a computer generated invoice and does not require a physical signature.</li>
                    </ol>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
                    <div style={{ width: "160px", textAlign: "center" }}>
                      <div style={{ height: "40px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        <p style={{ fontSize: "10px", color: C.gray300, fontStyle: "italic", marginBottom: "8px" }}>
                          Electronically Signed
                        </p>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.gray400}`, paddingTop: "8px" }}>
                        <p style={{ fontSize: "12px", fontWeight: "bold", color: C.gray800, margin: "0 0 2px 0" }}>Authorized Signatory</p>
                        <p style={{ fontSize: "10px", color: C.gray500, textTransform: "uppercase", margin: 0 }}>
                          {tenant?.name || "Smart Inventory"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* ─── Thank You ─── */}
            <tr>
              <td colSpan={6} style={{ border: "none" }}>
                <div style={{ textAlign: "center", color: C.blue600, fontWeight: "500", fontSize: "12px", padding: "10px 0" }}>
                  Thank you for your business!
                </div>
              </td>
            </tr>

            {/* ─── Footer ─── */}
            <tr>
              <td colSpan={6} style={{ padding: 0, border: "none" }}>
                <footer style={{ paddingTop: "10px", marginTop: "10px", borderTop: `1px solid ${C.gray100}`, color: C.gray400, fontSize: "9px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "8px", color: C.gray300, margin: 0, letterSpacing: "0.03em" }}>
                      Generated on {generatedAt}
                    </p>
                    <p style={{ fontSize: "8px", color: C.gray300, margin: 0, letterSpacing: "0.04em" }}>
                      Powered by{" "}
                      <span style={{ color: C.blue600, fontWeight: "600" }}>Finventree</span>
                    </p>
                  </div>
                </footer>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
