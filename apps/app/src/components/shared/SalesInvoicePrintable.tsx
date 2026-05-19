import * as React from "react";
import { SaleOrder } from "@/features/billing/types";
import { Customer } from "@/features/customers/types";
import { TenantInfo } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";

interface InvoicePrintableProps {
  order: SaleOrder;
  customer: Customer | undefined;
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
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  };

  const split = num.toString().split(".");
  const whole = parseInt(split[0]);
  const decimal = split[1] ? parseInt(split[1].slice(0, 2)) : 0;

  let words = inWords(whole) + "Rupees ";
  if (decimal > 0) {
    words += "and " + inWords(decimal) + "Paise ";
  }
  return words + "Only";
};

export const SalesInvoicePrintable: React.FC<InvoicePrintableProps> = ({
  order,
  customer,
  tenant,
}) => {
  const isPaid = order.status === "SETTLED";
  const pendingAmount = order.totalAmount - (order.amountPaid || 0);

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
      {/* 1. HEADER SECTION */}
      <div
        id="invoice-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "40px",
          paddingBottom: "16px", // Prevent cutting
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              color: HEX.blue600,
              fontSize: "30px",
              fontWeight: "900",
              margin: "0 0 16px 0",
              letterSpacing: "-0.025em",
            }}
          >
            TAX INVOICE
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2
              style={{
                color: HEX.slate900,
                fontSize: "20px",
                fontWeight: "700",
                margin: "0",
              }}
            >
              {tenant?.name || "SMART INVENTORY"}
            </h2>
            <p
              style={{
                color: HEX.slate500,
                fontSize: "14px",
                lineHeight: "1.625",
                textTransform: "uppercase",
                margin: 0,
                maxWidth: "320px",
              }}
            >
              {tenant?.address ||
                "123 Tech plaza, Silicon valley Road, Electronic city, Bengaluru - 560100"}
            </p>
            <div
              style={{
                color: HEX.slate700,
                paddingTop: "8px",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              <span style={{ color: HEX.slate400, fontWeight: "normal" }}>
                GSTIN:
              </span>{" "}
              {tenant?.gstin || "29AAAAA0000A1Z5"}
            </div>
            <div
              style={{
                color: HEX.slate700,
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              <span style={{ color: HEX.slate400, fontWeight: "normal" }}>
                Contact:
              </span>{" "}
              {tenant?.phone || "+91 9876543210"}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: HEX.blue600,
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            width: "150px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "flex-end",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  opacity: 0.7,
                }}
              >
                Invoice Number
              </p>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: "900" }}>
                INV-{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "flex-end",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  opacity: 0.7,
                }}
              >
                Date of Issue
              </p>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {format(parseISO(order.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: HEX.slate100,
          height: "1px",
          width: "100%",
          marginBottom: "32px",
        }}
      />

      {/* 2. PARTIES SECTION */}
      <div
        id="invoice-parties"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "48px",
          paddingBottom: "20px", // Prevent phone number cutting
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: HEX.slate400,
              margin: "0 0 12px 0",
            }}
          >
            Bill To:
          </p>
          <h3
            style={{
              color: HEX.slate900,
              margin: "0 0 4px 0",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            {customer?.name || "Walk-in Customer"}
          </h3>
          <p
            style={{
              color: HEX.slate500,
              margin: "0 0 12px 0",
              fontSize: "13px",
              lineHeight: "1.625",
              maxWidth: "384px",
            }}
          >
            {customer?.address || "No address provided."}
          </p>
          <div
            style={{ color: HEX.slate700, fontSize: "13px", fontWeight: "700" }}
          >
            <span style={{ color: HEX.slate400, fontWeight: "normal" }}>
              Phone:
            </span>{" "}
            {customer?.phone || "N/A"}
          </div>
          {(order as any).buyerGstin && (
            <div style={{ color: HEX.slate700, fontSize: "13px", fontWeight: "700", marginTop: "6px" }}>
              <span style={{ color: HEX.slate400, fontWeight: "normal" }}>GSTIN:</span>{" "}
              {(order as any).buyerGstin}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: HEX.slate400,
              margin: "0 0 12px 0",
            }}
          >
            Payment Status:
          </p>
          <div
            style={{
              display: "flex", // Deterministic flex
              alignItems: "center",
              justifyContent: "center",
              height: "24px", // Fixed height
              padding: "0 10px 10px",
              borderRadius: "9999px",
              fontWeight: "900",
              fontSize: "12px",
              letterSpacing: "0.1em",
              backgroundColor: isPaid ? HEX.emerald50 : HEX.orange50,
              color: isPaid ? HEX.emerald600 : HEX.orange600,
              lineHeight: "24px", // Match height
              alignSelf: "flex-end", // Maintain right alignment in parent
              transform: "translateY(0.5px)", // Precise centering
            }}
          >
            {isPaid ? "PAID - FULL" : "PENDING"}
          </div>
        </div>
      </div>

      {/* 3. ITEMS TABLE */}
      <div
        style={{
          marginBottom: "40px",
          borderRadius: "16px",
          border: `1px solid ${HEX.slate100}`,
          overflow: "hidden",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead
            id="invoice-table-header"
            style={{ display: "table-header-group" }}
          >
            <tr
              style={{
                backgroundColor: HEX.slate50,
                borderBottom: `1px solid ${HEX.slate100}`,
              }}
            >
              <th
                style={{
                  color: HEX.slate400,
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "16px 24px",
                  textAlign: "center",
                  width: "48px",
                }}
              >
                No.
              </th>
              <th
                style={{
                  color: HEX.slate400,
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "16px 24px",
                }}
              >
                Description
              </th>
              <th
                style={{
                  color: HEX.slate400,
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "16px 12px",
                  textAlign: "right",
                  width: "96px",
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  color: HEX.slate400,
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "16px 12px",
                  textAlign: "center",
                  width: "64px",
                }}
              >
                GST %
              </th>
              <th
                style={{
                  color: HEX.slate400,
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "16px 24px",
                  textAlign: "right",
                  width: "120px",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr
                key={index}
                id={`invoice-row-${index}`}
                style={{
                  borderBottom: `1px solid ${HEX.slate100}`,
                  pageBreakInside: "avoid",
                }}
              >
                <td
                  style={{
                    color: HEX.slate400,
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </td>
                <td style={{ padding: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        color: HEX.slate900,
                        fontSize: "14px",
                        fontWeight: "700",
                        lineHeight: "1.25",
                        marginBottom: "4px",
                      }}
                    >
                      {item.brandSnapshot} {item.modelSnapshot}
                    </div>

                    {/* @ts-ignore */}
                    {item.ramSnapshot || item.storageSnapshot || item.ram ? (
                      <div
                        style={{
                          color: HEX.slate500,
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        {/* @ts-ignore */}
                        {item.ramSnapshot || item.ram || ""}
                        {/* @ts-ignore */}
                        {(item.ramSnapshot || item.ram) && item.storageSnapshot
                          ? " / "
                          : ""}
                        {item.storageSnapshot || ""}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "flex", // 🔥 CHANGE: no inline-flex
                        alignItems: "center",
                        justifyContent: "center",
                        height: "18px", // 🔥 FIXED HEIGHT (CRITICAL)
                        padding: "0px 10px 10px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: "700",
                        backgroundColor: HEX.slate100,
                        color: HEX.slate500,
                        lineHeight: "18px", // 🔥 MATCH HEIGHT (VERY IMPORTANT)
                        marginTop: "4px",
                        transform: "translateY(0.5px)",
                        // 🔥 CRITICAL: deterministic width behavior
                        alignSelf: "flex-start",
                      }}
                    >
                      IMEI:{" "}
                      {item.imeiSnapshot && item.imeiSnapshot.length > 0
                        ? item.imeiSnapshot[0]
                        : "N/A"}
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    color: HEX.slate700,
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "24px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.salePrice)}
                </td>
                <td
                  style={{
                    color: HEX.slate500,
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  {(order as any).gstEnabled ? `${(order as any).gstRate || 18}%` : "0%"}
                </td>
                <td
                  style={{
                    color: HEX.blue600,
                    fontSize: "14px",
                    fontWeight: "900",
                    padding: "24px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.effectivePrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS SECTION */}
      <div
        id="invoice-totals"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "48px",
          paddingBottom: "32px",
        }}
      >
        <div style={{ flex: 1, paddingRight: "48px" }}>
          <h4
            style={{
              color: HEX.slate400,
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 8px 0",
            }}
          >
            Amount in Words
          </h4>
          <p
            style={{
              color: HEX.slate700,
              fontSize: "13px",
              fontWeight: "700",
              lineHeight: "1.5",
              margin: 0,
            }}
          >
            {amountToWords(order.totalAmount)}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "288px",
              fontSize: "13px",
              fontWeight: "700",
              color: HEX.slate400,
            }}
          >
            <span>Subtotal (Net)</span>
            <span style={{ color: HEX.slate700 }}>
              {formatCurrency((order as any).gstEnabled ? ((order as any).subtotal ?? order.totalAmount) : order.totalAmount)}
            </span>
          </div>
          {(order as any).gstEnabled ? (
            (order as any).gstType === "IGST" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "288px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: HEX.slate400,
                }}
              >
                <span>IGST ({(order as any).gstRate || 18}%)</span>
                <span style={{ color: HEX.slate700 }}>{formatCurrency((order as any).igstAmount || 0)}</span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "288px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: HEX.slate400,
                  }}
                >
                  <span>CGST ({((order as any).gstRate || 18) / 2}%)</span>
                  <span style={{ color: HEX.slate700 }}>{formatCurrency((order as any).cgstAmount || 0)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "288px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: HEX.slate400,
                  }}
                >
                  <span>SGST ({((order as any).gstRate || 18) / 2}%)</span>
                  <span style={{ color: HEX.slate700 }}>{formatCurrency((order as any).sgstAmount || 0)}</span>
                </div>
              </>
            )
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "288px",
                fontSize: "13px",
                fontWeight: "700",
                color: HEX.slate400,
              }}
            >
              <span>Output Tax (0%)</span>
              <span style={{ color: HEX.slate700 }}>₹ 0.00</span>
            </div>
          )}

          <div
            style={{
              backgroundColor: HEX.slate100,
              height: "1.5px",
              width: "320px",
              margin: "8px 0",
            }}
          />

          <div
            style={{
              backgroundColor: HEX.blue50,
              borderColor: HEX.blue100,
              borderStyle: "solid",
              borderWidth: "1px",
              borderRadius: "16px",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "320px",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <span
              style={{
                color: HEX.blue600,
                fontSize: "14px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Grand Total
            </span>
            <div
              style={{
                color: HEX.blue800,
                fontSize: "24px",
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {formatCurrency(order.totalAmount)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "288px",
              fontSize: "12px",
              fontWeight: "700",
              paddingTop: "16px",
            }}
          >
            <span style={{ color: HEX.slate400 }}>Amount Paid</span>
            <span
              style={{
                color: HEX.emerald500,
                fontWeight: "900",
              }}
            >
              {formatCurrency(order.amountPaid)}
            </span>
          </div>
          {pendingAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "288px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              <span style={{ color: HEX.slate400 }}>Amount Pending</span>
              <span
                style={{
                  color: HEX.rose500,
                  fontWeight: "900",
                }}
              >
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. FOOTER / TERMS */}
      <div
        id="invoice-footer"
        style={{
          paddingBottom: "40px", // CRITICAL: Prevent footer from being cut
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "32px",
            borderTop: `1px solid ${HEX.slate100}`,
          }}
        >
          <div style={{ flex: 1 }}>
            <h4
              style={{
                color: HEX.slate900,
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 16px 0",
              }}
            >
              Terms & Conditions
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {[
                "1. Goods once sold will not be taken back or exchanged.",
                "2. Standard warranty applies as per brand policy.",
                "3. Subject to authorized jurisdiction only.",
                "4. This is a computer generated invoice.",
              ].map((term, i) => (
                <p
                  key={i}
                  style={{
                    color: HEX.slate400,
                    fontSize: "10px",
                    fontWeight: "500",
                    margin: 0,
                  }}
                >
                  {term}
                </p>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                backgroundColor: HEX.slate200,
                height: "1px",
                width: "192px",
                marginBottom: "8px",
                marginLeft: "auto",
              }}
            />
            <p
              style={{
                color: HEX.slate900,
                fontSize: "12px",
                fontWeight: "700",
                lineHeight: "1.25",
                margin: 0,
              }}
            >
              Authorized Signatory
            </p>
            <p
              style={{
                color: HEX.slate400,
                fontSize: "10px",
                fontWeight: "500",
                margin: 0,
              }}
            >
              {tenant?.name || "SMART INVENTORY"}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "9px",
            fontWeight: "700",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: HEX.slate300,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Powered by</span>
            <span style={{ color: HEX.blue200 }}>Finventree Management</span>
          </div>
          <div>© {new Date().getFullYear()} - Digital Invoice Registry</div>
        </div>
      </div>
    </div>
  );
};
