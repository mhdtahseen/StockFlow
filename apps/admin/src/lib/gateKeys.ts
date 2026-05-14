/**
 * Canonical feature gate key definitions for the admin panel.
 * Mirrors FEATURE_GATES in apps/app/src/hooks/usePlan.ts.
 * This is the authoritative display-layer reference used in:
 *  - /pricing  → which keys each subscription plan includes
 *  - /flags    → per-tenant overrides
 *  - /supervision → per-tenant feature access view
 */

export type FeatureKey =
  | "trade_orders"
  | "purchase_orders"
  | "customers"
  | "pdf_invoice"
  | "public_sharing"
  | "imei_scanner"
  | "catalog_autofill"
  | "full_ledger"
  | "analytics"
  | "credit_tracking"
  | "receivables"
  | "customer_pnl"
  | "unlimited_phones"
  | "bulk_orders"
  | "bulk_invoice"
  | "trade_network"
  | "unlimited_seats";

export type PlanTier = "starter" | "pro" | "enterprise";

export interface GateKeyMeta {
  key: FeatureKey;
  name: string;
  description: string;
  /** The minimum plan tier that includes this feature by default. */
  minTier: PlanTier;
  /** All tiers that include this feature by default. */
  tiers: PlanTier[];
}

/** All 17 gate keys with display metadata, ordered by tier then name. */
export const GATE_KEYS: GateKeyMeta[] = [
  // ── Starter + Pro + Enterprise ────────────────────────────────────────────
  {
    key: "trade_orders",
    name: "Sales Orders",
    description: "Create and manage sale orders for customers.",
    minTier: "starter",
    tiers: ["starter", "pro", "enterprise"],
  },
  {
    key: "purchase_orders",
    name: "Purchase Orders",
    description: "Create and manage purchase orders from suppliers.",
    minTier: "starter",
    tiers: ["starter", "pro", "enterprise"],
  },
  {
    key: "customers",
    name: "Customer Management",
    description: "Maintain a customer directory with contact and credit info.",
    minTier: "starter",
    tiers: ["starter", "pro", "enterprise"],
  },
  {
    key: "pdf_invoice",
    name: "PDF Invoices",
    description: "Generate and share printable PDF invoices for any order.",
    minTier: "starter",
    tiers: ["starter", "pro", "enterprise"],
  },

  // ── Pro + Enterprise ──────────────────────────────────────────────────────
  {
    key: "public_sharing",
    name: "Public Share Links",
    description: "Share invoices and POs with customers via a public link — no login needed.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "imei_scanner",
    name: "IMEI Barcode Scanner",
    description: "Scan IMEI numbers instantly with the camera instead of typing 15 digits.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "catalog_autofill",
    name: "Global Device Catalog",
    description: "Auto-fill brand, model, RAM, storage and color from the global device registry.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "full_ledger",
    name: "Advanced P&L Ledger",
    description: "Track all income, expenses, credits and debits with a real-time profit view.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "analytics",
    name: "Advanced Analytics",
    description: "Visualise revenue trends, top sellers and customer behaviour over time.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "credit_tracking",
    name: "Credit Tracking",
    description: "Monitor outstanding credit balances across all customers and suppliers.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "receivables",
    name: "Net Receivables Dashboard",
    description: "See exactly who owes money and how much, updated in real-time.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "customer_pnl",
    name: "Customer-level P&L",
    description: "See profit and loss broken down per customer to identify top accounts.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "unlimited_phones",
    name: "Unlimited Inventory",
    description: "Remove the 100-device cap and add as many devices as the business needs.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },
  {
    key: "bulk_orders",
    name: "Multi-device Sale Orders",
    description: "Add multiple devices to a single sale order — essential for batch transactions.",
    minTier: "pro",
    tiers: ["pro", "enterprise"],
  },

  // ── Enterprise only ───────────────────────────────────────────────────────
  {
    key: "bulk_invoice",
    name: "Bulk PDF Invoices",
    description: "Generate invoices for multiple orders in one batch — ideal for high-volume shops.",
    minTier: "enterprise",
    tiers: ["enterprise"],
  },
  {
    key: "trade_network",
    name: "Dealer Trade Network",
    description: "Trade and transfer stock directly with other verified dealers on the network.",
    minTier: "enterprise",
    tiers: ["enterprise"],
  },
  {
    key: "unlimited_seats",
    name: "Unlimited Team Seats",
    description: "Add as many staff members as the team needs, with no per-seat limits.",
    minTier: "enterprise",
    tiers: ["enterprise"],
  },
];

/** Default gate keys included in each plan, derived from GATE_KEYS. */
export const DEFAULT_PLAN_KEYS: Record<PlanTier, FeatureKey[]> = {
  starter: GATE_KEYS.filter((g) => g.tiers.includes("starter")).map((g) => g.key),
  pro: GATE_KEYS.filter((g) => g.tiers.includes("pro")).map((g) => g.key),
  enterprise: GATE_KEYS.filter((g) => g.tiers.includes("enterprise")).map((g) => g.key),
};

/** Lookup a single gate key's metadata. */
export function getGateMeta(key: FeatureKey): GateKeyMeta | undefined {
  return GATE_KEYS.find((g) => g.key === key);
}

/** Color classes for each plan tier (Tailwind). */
export const TIER_COLORS: Record<PlanTier | "trial" | "expired", { bg: string; text: string; border: string; dot: string }> = {
  starter: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  pro: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    dot: "bg-blue-500",
  },
  enterprise: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
  trial: {
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  expired: {
    bg: "bg-rose-50 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-700",
    dot: "bg-rose-500",
  },
};

/** Seat limits per plan (undefined = unlimited). */
export const PLAN_SEAT_LIMITS: Record<string, number | undefined> = {
  starter: 1,
  pro: 10,
  enterprise: undefined,
  trial: undefined,
  expired: 0,
};

/** Device limits per plan (undefined = unlimited). */
export const PLAN_DEVICE_LIMITS: Record<string, number | undefined> = {
  starter: 100,
  pro: undefined,
  enterprise: undefined,
  trial: undefined,
  expired: 0,
};
