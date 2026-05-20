/**
 * GST Calculation Utility — Pure functions, no side effects.
 *
 * Indian GST rules:
 * - Same state (intra-state): CGST + SGST (each half of the rate)
 * - Different state (inter-state): IGST (full rate)
 * - GSTIN format: 15 chars, first 2 = state code
 *
 * Pricing model: TAX-INCLUSIVE (MRP includes GST — standard Indian retail)
 */

export const DEFAULT_GST_RATE = 18;      // % — correct for mobile phones HSN 8517
export const DEFAULT_HSN_CODE = "8517";  // Telephones / mobile handsets

/** Extract 2-digit state code from a GSTIN (e.g. "27AAACR5055K1ZF" → "27") */
export function extractStateCode(gstin: string): string {
  return gstin.trim().slice(0, 2).toUpperCase();
}

/** Validate GSTIN format — 15 alphanumeric chars matching the Indian pattern */
export function isValidGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    gstin.trim().toUpperCase(),
  );
}

/**
 * Determine GST type based on seller and buyer state codes.
 * Falls back to CGST_SGST (intra-state) when buyer state is unknown.
 */
export function determineGstType(
  sellerGstin: string | undefined | null,
  buyerGstin?: string | null,
  buyerState?: string | null,
): "CGST_SGST" | "IGST" {
  if (!sellerGstin) return "CGST_SGST"; // no seller GSTIN → can't determine, default intra
  const sellerState = extractStateCode(sellerGstin);

  if (buyerGstin && isValidGstin(buyerGstin)) {
    const buyerStateCode = extractStateCode(buyerGstin);
    return sellerState !== buyerStateCode ? "IGST" : "CGST_SGST";
  }

  // No buyer GSTIN — can't confirm inter-state, stay intra
  return "CGST_SGST";
}

export interface GstBreakdown {
  taxableValue: number;   // amount before tax
  taxAmount: number;      // total tax
  cgstAmount: number;     // CGST (half rate, or 0 for IGST)
  sgstAmount: number;     // SGST (half rate, or 0 for IGST)
  igstAmount: number;     // IGST (full rate, or 0 for CGST_SGST)
  totalWithTax: number;   // taxableValue + taxAmount (= input amount if inclusive)
}

/**
 * Calculate GST breakdown for a single amount.
 *
 * @param amount       - The price (inclusive or exclusive of tax)
 * @param rate         - GST rate as percentage (e.g. 18)
 * @param type         - "CGST_SGST" or "IGST"
 * @param inclusive    - true = amount already includes GST (back-calculate taxable value)
 *                       false = amount is pre-tax (add GST on top)
 */
export function calculateGst(
  amount: number,
  rate: number = DEFAULT_GST_RATE,
  type: "CGST_SGST" | "IGST" = "CGST_SGST",
  inclusive: boolean = true,
): GstBreakdown {
  const r = rate / 100;

  const taxableValue = inclusive
    ? Math.round((amount / (1 + r)) * 100) / 100
    : Math.round(amount * 100) / 100;

  const taxAmount = Math.round((taxableValue * r) * 100) / 100;
  const totalWithTax = inclusive ? amount : Math.round((taxableValue + taxAmount) * 100) / 100;

  const cgstAmount = type === "CGST_SGST" ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const sgstAmount = type === "CGST_SGST" ? taxAmount - cgstAmount : 0; // absorbs rounding
  const igstAmount = type === "IGST" ? taxAmount : 0;

  return { taxableValue, taxAmount, cgstAmount, sgstAmount, igstAmount, totalWithTax };
}

/**
 * Calculate aggregate GST breakdown for a list of effective prices.
 */
export function calculateOrderGst(
  effectivePrices: number[],
  rate: number = DEFAULT_GST_RATE,
  type: "CGST_SGST" | "IGST" = "CGST_SGST",
  inclusive: boolean = true,
): {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  grandTotal: number;
} {
  const breakdowns = effectivePrices.map((p) => calculateGst(p, rate, type, inclusive));

  const subtotal = Math.round(breakdowns.reduce((s, b) => s + b.taxableValue, 0) * 100) / 100;
  const cgstTotal = Math.round(breakdowns.reduce((s, b) => s + b.cgstAmount, 0) * 100) / 100;
  const sgstTotal = Math.round(breakdowns.reduce((s, b) => s + b.sgstAmount, 0) * 100) / 100;
  const igstTotal = Math.round(breakdowns.reduce((s, b) => s + b.igstAmount, 0) * 100) / 100;
  const totalTax = type === "IGST" ? igstTotal : cgstTotal + sgstTotal;
  const grandTotal = Math.round(breakdowns.reduce((s, b) => s + b.totalWithTax, 0) * 100) / 100;

  return { subtotal, cgstTotal, sgstTotal, igstTotal, totalTax, grandTotal };
}
