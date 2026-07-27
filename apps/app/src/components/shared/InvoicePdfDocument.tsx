/**
 * InvoicePdfDocument.tsx
 *
 * Option B — @react-pdf/renderer invoice component.
 *
 * Produces a real, selectable-text vector PDF entirely client-side.
 * Layout mirrors OrderPrintView.tsx exactly:
 *   - Document header (title, tenant, invoice-number card)
 *   - Bill To / Supplier section + Payment Status pill
 *   - Item table (Sr, Particulars, HSN, Rate, GST%, Amount)
 *   - Financials (Subtotal, GST lines, Paid, Pending, Grand Total)
 *   - Amount in words
 *   - Terms & Conditions + Authorized Signatory
 *   - Thank you + footer
 *
 * ⚠️ TEST ONLY — not wired into the main PDF flow.
 */

import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";

// ─── Register system fonts (Helvetica is built-in to @react-pdf/renderer) ────
// No external font download needed — we use the PDF standard Helvetica family.

export interface InvoicePdfDocumentProps {
  order: SaleOrder | PurchaseOrder;
  counterparty: Customer | undefined;
  tenant: TenantInfo | null;
  type: "SALE" | "PURCHASE";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  `Rs. ${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

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

// ─── Colour palette — mirrors OrderPrintView.tsx C object ─────────────────────
const C = {
  blue600:   "#2563eb",
  blue700:   "#1d4ed8",
  green100:  "#dcfce7",
  green700:  "#15803d",
  green600:  "#16a34a",
  orange100: "#ffedd5",
  orange700: "#c2410c",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray300:   "#d1d5db",
  gray400:   "#9ca3af",
  gray500:   "#6b7280",
  gray600:   "#4b5563",
  gray700:   "#374151",
  gray800:   "#1f2937",
  gray900:   "#111827",
  white:     "#ffffff",
  red600:    "#dc2626",
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 40,
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
    paddingBottom: 10,
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.blue600,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tenantInitial: {
    width: 24,
    height: 24,
    backgroundColor: C.blue600,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tenantInitialText: {
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  tenantName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
  },
  tenantMeta: {
    fontSize: 7,
    color: C.gray500,
    marginTop: 2,
    maxWidth: 260,
  },
  invoiceCard: {
    backgroundColor: C.blue600,
    padding: "8 12",
    borderRadius: 5,
    minWidth: 150,
  },
  invoiceCardLabel: {
    fontSize: 7,
    color: C.white,
    opacity: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  invoiceCardValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // ── Billing/Counterparty + Status row ──
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  cpName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    marginBottom: 2,
  },
  cpMeta: {
    fontSize: 8,
    color: C.gray600,
    marginBottom: 1,
  },
  cpGstin: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  // ── Item Table ──
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.gray50,
    borderTopWidth: 1.5,
    borderTopColor: C.blue600,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray200,
    paddingVertical: 5,
  },
  thText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray600,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.3,
    borderBottomColor: C.gray100,
    paddingVertical: 5,
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  tdSr: { width: "7%",  paddingHorizontal: 3 },
  tdDesc: { width: "39%", paddingHorizontal: 3 },
  tdHSN: { width: "10%", paddingHorizontal: 3 },
  tdRate: { width: "16%", paddingHorizontal: 3, alignItems: "flex-end" },
  tdGST: { width: "10%", paddingHorizontal: 3, alignItems: "center" },
  tdAmt: { width: "18%", paddingHorizontal: 3, alignItems: "flex-end" },
  itemBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    marginBottom: 1,
  },
  itemSpec: {
    fontSize: 7,
    color: C.gray500,
    marginBottom: 1,
  },
  itemImei: {
    fontSize: 6.5,
    color: C.gray500,
    fontFamily: "Courier",
  },

  // ── Financials ──
  financialsContainer: {
    alignItems: "flex-end",
    marginTop: 14,
  },
  financialsBox: {
    width: "46%",
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  finLabel: {
    fontSize: 8.5,
    color: C.gray500,
  },
  finValue: {
    fontSize: 8.5,
    color: C.gray700,
  },
  finLabelBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
  },
  finDivider: {
    borderTopWidth: 0.5,
    borderTopColor: C.gray100,
    marginVertical: 5,
  },
  grandTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.blue600,
    padding: "8 12",
    borderRadius: 5,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 11,
    color: C.white,
  },
  grandTotalValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  amountInWords: {
    fontSize: 7,
    color: C.gray400,
    fontStyle: "italic",
    textAlign: "right",
    marginTop: 5,
  },

  // ── Terms + Signature ──
  termsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.gray200,
    paddingTop: 12,
    marginTop: 16,
  },
  termsTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gray700,
    textTransform: "uppercase",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  termItem: {
    fontSize: 7,
    color: C.gray500,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  sigBlock: {
    alignItems: "center",
    width: 140,
  },
  sigLine: {
    borderTopWidth: 0.5,
    borderTopColor: C.gray400,
    width: "100%",
    marginBottom: 6,
  },
  sigName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gray800,
    marginBottom: 2,
  },
  sigCompany: {
    fontSize: 7.5,
    color: C.gray500,
    textTransform: "uppercase",
  },
  sigElectronic: {
    fontSize: 8,
    color: C.gray300,
    fontStyle: "italic",
    marginBottom: 30,
  },

  // ── Thank you + Footer ──
  thankYou: {
    textAlign: "center",
    color: C.blue600,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.3,
    borderTopColor: C.gray100,
    paddingTop: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: C.gray300,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.blue600,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────
export const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({
  order,
  counterparty,
  tenant,
  type,
}) => {
  const isPO           = type === "PURCHASE";
  const isPaid         = order.status === "SETTLED";
  const pendingAmount  = (order.totalAmount || 0) - (order.amountPaid || 0);
  const docTitle       = isPO ? "PURCHASE ORDER" : "TAX INVOICE";
  const docPrefix      = isPO ? "PO" : "INV";
  const counterpartyLabel = isPO ? "Supplier" : "Bill To";

  const statusText = isPaid
    ? `Paid${(order as any).paymentMode ? ` - ${(order as any).paymentMode}` : ""}`
    : order.status === "PARTIAL"
      ? "Partial"
      : "Pending";

  const statusColors = isPaid
    ? { bg: C.green100, text: C.green700 }
    : pendingAmount > 0
      ? { bg: C.orange100, text: C.orange700 }
      : { bg: "#dbeafe", text: C.blue700 };

  let dateStr = "N/A";
  try {
    dateStr = format(parseISO(order.createdAt), "MMMM d, yyyy");
  } catch {
    try { dateStr = format(new Date(order.createdAt), "MMMM d, yyyy"); } catch { /* keep */ }
  }

  const generatedAt = format(new Date(), "dd MMM yyyy, hh:mm a");

  // Determine if the order was saved with inclusive or exclusive prices
  const sumEffPrice = (order.items || []).reduce((sum: number, item: any) => {
    return sum + (isPO ? (item.purchasePrice || 0) : (item.effectivePrice || item.salePrice || 0));
  }, 0);
  const isInclusive = Math.abs(sumEffPrice - order.totalAmount) < 5;

  // Normalize items
  const items = (order.items || []).map((item: any) => {
    const effPrice = isPO
      ? (item.purchasePrice || 0)
      : (item.effectivePrice || item.salePrice || 0);

    let taxable = item.taxableValue;
    if (taxable == null) {
      if ((order as any).gstEnabled) {
        taxable = isInclusive ? effPrice / (1 + ((order as any).gstRate || 18) / 100) : effPrice;
      } else {
        taxable = effPrice;
      }
    }

    return {
      brand:         item.brandSnapshot  || item.brand   || "Unknown",
      model:         item.modelSnapshot  || item.model   || "Item",
      storage:       item.storageSnapshot || item.storage || "",
      color:         item.colorSnapshot  || item.color   || "",
      ram:           item.ramSnapshot    || item.ram     || "",
      imei:          item.imeiSnapshot?.[0] || item.imei || "",
      hsnCode:       item.hsnCode || "8517",
      unitPrice:     taxable,
      effectivePrice: effPrice,
      status: item.status,
    };
  });

  const tenantMeta = [
    tenant?.address,
    tenant?.phone && `Ph: ${tenant.phone}`,
    tenant?.gstin && `GSTIN: ${tenant.gstin}`,
  ].filter(Boolean).join("  ·  ");

  return (
    <Document title={`${docTitle} - ${tenant?.name || "Finventree"}`} author={tenant?.name || "Finventree"}>
      <Page size="A4" style={s.page} wrap>

        {/* ═══ HEADER ═══ */}
        <View style={s.headerRow}>
          {/* Left — title + tenant */}
          <View>
            <Text style={s.docTitle}>{docTitle}</Text>
            <View style={s.tenantRow}>
              <View style={s.tenantInitial}>
                <Text style={s.tenantInitialText}>
                  {(tenant?.name || "S")[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={s.tenantName}>{tenant?.name || "Smart Inventory"}</Text>
                {tenantMeta ? <Text style={s.tenantMeta}>{tenantMeta}</Text> : null}
              </View>
            </View>
          </View>

          {/* Right — invoice number card */}
          <View>
            <View style={s.invoiceCard}>
              <View style={{ marginBottom: 6 }}>
                <Text style={s.invoiceCardLabel}>{isPO ? "PO Number" : "Invoice Number"}</Text>
                <Text style={s.invoiceCardValue}>{docPrefix}-{order.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={s.invoiceCardLabel}>Date of Issue</Text>
                <Text style={s.invoiceCardValue}>{dateStr}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ BILL TO + PAYMENT STATUS ═══ */}
        <View style={s.billingRow}>
          {/* Bill To / Supplier */}
          <View style={{ flex: 1, marginRight: 20 }}>
            <Text style={s.sectionLabel}>{counterpartyLabel}:</Text>
            <Text style={s.cpName}>
              {counterparty?.name || (isPO ? "Supplier" : "Walk-in Customer")}
            </Text>
            {counterparty?.address
              ? <Text style={s.cpMeta}>{counterparty.address}</Text>
              : <Text style={s.cpMeta}>No address provided.</Text>}
            <Text style={s.cpMeta}>Phone: {counterparty?.phone || "N/A"}</Text>
            {!isPO && (order as any).buyerGstin
              ? <Text style={s.cpGstin}>GSTIN: {(order as any).buyerGstin}</Text>
              : null}
            {isPO && (order as any).sellerGstin
              ? <Text style={s.cpGstin}>GSTIN: {(order as any).sellerGstin}</Text>
              : null}
          </View>

          {/* Payment Status */}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.sectionLabel}>Payment Status:</Text>
            <View style={[s.statusPill, { backgroundColor: statusColors.bg }]}>
              <Text style={[s.statusPillText, { color: statusColors.text }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ ITEM TABLE ═══ */}
        {/* Table header */}
        <View style={s.tableHeaderRow}>
          <View style={s.tdSr}><Text style={s.thText}>Sr.</Text></View>
          <View style={s.tdDesc}><Text style={s.thText}>Particulars</Text></View>
          <View style={s.tdHSN}><Text style={s.thText}>HSN</Text></View>
          <View style={s.tdRate}><Text style={s.thText}>Rate</Text></View>
          <View style={s.tdGST}><Text style={s.thText}>GST%</Text></View>
          <View style={s.tdAmt}><Text style={s.thText}>Amount</Text></View>
        </View>

        {/* Item rows */}
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
            wrap={false}
          >
            <View style={s.tdSr}>
              <Text style={{ fontSize: 8, color: C.gray500 }}>
                {String(idx + 1).padStart(2, "0")}
              </Text>
            </View>
            <View style={s.tdDesc}>
              <Text style={s.itemBrand}>{item.brand} {item.model}</Text>
              {(item.color || item.storage || item.ram) ? (
                <Text style={s.itemSpec}>
                  {[item.color, item.storage, item.ram && `${item.ram} RAM`]
                    .filter(Boolean)
                    .join(" | ")}
                </Text>
              ) : null}
              {item.imei
                ? <Text style={s.itemImei}>IMEI: {item.imei}</Text>
                : null}
            </View>
            <View style={s.tdHSN}>
              <Text style={{ fontSize: 8, color: C.gray600 }}>{item.hsnCode}</Text>
            </View>
            <View style={s.tdRate}>
              <Text style={{ fontSize: 8, color: C.gray700 }}>
                {formatCurrency(item.unitPrice)}
              </Text>
            </View>
            <View style={s.tdGST}>
              <Text style={{ fontSize: 8, color: C.gray600 }}>
                {(order as any).gstEnabled ? `${(order as any).gstRate || 18}%` : "0%"}
              </Text>
            </View>
            <View style={s.tdAmt}>
              <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.gray800 }}>
                {formatCurrency(item.unitPrice)}
              </Text>
            </View>
          </View>
        ))}

        {/* ═══ FINANCIALS ═══ */}
        <View style={s.financialsContainer}>
          <View style={s.financialsBox}>
            {(() => {
              let subtotalAmount = (order as any).subtotal;
              if (subtotalAmount == null) {
                subtotalAmount = (order as any).gstEnabled 
                  ? order.totalAmount / (1 + ((order as any).gstRate || 18) / 100)
                  : order.totalAmount;
              }

              return (
                <>
                  {/* Subtotal */}
                  <View style={s.finRow}>
                    <Text style={s.finLabel}>Subtotal (Before Tax)</Text>
                    <Text style={s.finValue}>{formatCurrency(subtotalAmount)}</Text>
                  </View>

                  {/* GST lines */}
                  {(order as any).gstEnabled && (order as any).gstType === "IGST" ? (
                    <View style={s.finRow}>
                      <Text style={s.finLabel}>IGST ({(order as any).gstRate || 18}%)</Text>
                      <Text style={s.finValue}>{formatCurrency((order as any).igstAmount || (order.totalAmount - subtotalAmount))}</Text>
                    </View>
                  ) : (order as any).gstEnabled ? (
                    <>
                      <View style={s.finRow}>
                        <Text style={s.finLabel}>CGST ({((order as any).gstRate || 18) / 2}%)</Text>
                        <Text style={s.finValue}>{formatCurrency((order as any).cgstAmount || ((order.totalAmount - subtotalAmount) / 2))}</Text>
                      </View>
                      <View style={[s.finRow, { marginBottom: 0 }]}>
                        <Text style={s.finLabel}>SGST ({((order as any).gstRate || 18) / 2}%)</Text>
                        <Text style={s.finValue}>{formatCurrency((order as any).sgstAmount || ((order.totalAmount - subtotalAmount) / 2))}</Text>
                      </View>
                      <View style={s.finDivider} />
                    </>
                  ) : null}
                </>
              );
            })()}

            {/* Amount Paid */}
            <View style={s.finRow}>
              <Text style={s.finLabelBold}>Amount Paid</Text>
              <Text style={[s.finValue, { color: C.green600, fontFamily: "Helvetica-Bold" }]}>
                {formatCurrency(order.amountPaid || 0)}
              </Text>
            </View>

            {/* Amount Pending */}
            {pendingAmount > 0 ? (
              <View style={s.finRow}>
                <Text style={s.finLabelBold}>Amount Pending</Text>
                <Text style={[s.finValue, { color: C.red600, fontFamily: "Helvetica-Bold" }]}>
                  {formatCurrency(pendingAmount)}
                </Text>
              </View>
            ) : null}

            {/* Grand Total */}
            <View style={s.grandTotalBox}>
              <Text style={s.grandTotalLabel}>Grand Total</Text>
              <Text style={s.grandTotalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>

            {/* Amount in words */}
            <Text style={s.amountInWords}>
              Amount in words: {amountToWords(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* ═══ TERMS & CONDITIONS + SIGNATORY ═══ */}
        <View style={s.termsRow}>
          {/* Terms */}
          <View style={{ flex: 1, marginRight: 24 }}>
            <Text style={s.termsTitle}>Terms &amp; Conditions</Text>
            {[
              "Goods once sold will not be taken back or exchanged.",
              "Manufacturer's warranty applies as per their standard policy.",
              "Subject to local jurisdiction only.",
              "This is a computer generated invoice and does not require a physical signature.",
            ].map((term, i) => (
              <Text key={i} style={s.termItem}>{i + 1}. {term}</Text>
            ))}
          </View>

          {/* Signatory */}
          <View style={s.sigBlock}>
            <Text style={s.sigElectronic}>Electronically Signed</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>Authorized Signatory</Text>
            <Text style={s.sigCompany}>{tenant?.name || "Smart Inventory"}</Text>
          </View>
        </View>

        {/* ═══ THANK YOU ═══ */}
        <Text style={s.thankYou}>Thank you for your business!</Text>

        {/* ═══ FOOTER ═══ */}
        <View style={s.footer}>
          <Text style={s.footerText}>Generated on {generatedAt}</Text>
          <Text style={s.footerBrand}>Powered by Finventree</Text>
        </View>

      </Page>
    </Document>
  );
};
