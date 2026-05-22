import { useAuth } from "@/context/AuthContext";

// Which plans can access each feature.
// "starter" features are intentionally limited — IMEI scanner pain drives Pro upgrades.
// "bulk_invoice" and "trade_network" are Enterprise-only and NOT YET BUILT — placeholder gates.
export const FEATURE_GATES: Record<string, readonly string[]> = {
  // ── Starter + Pro + Enterprise ─────────────────────────────────────────────
  trade_orders:    ["starter", "pro", "enterprise"],
  purchase_orders: ["starter", "pro", "enterprise"],
  customers:       ["starter", "pro", "enterprise"],
  pdf_invoice:     ["starter", "pro", "enterprise"],

  // ── Pro + Enterprise ──────────────────────────────────────────────────────
  public_sharing:  ["pro", "enterprise"],
  imei_scanner:    ["pro", "enterprise"],
  catalog_autofill:["pro", "enterprise"],
  full_ledger:     ["pro", "enterprise"],
  analytics:       ["pro", "enterprise"],
  credit_tracking: ["pro", "enterprise"],
  receivables:     ["pro", "enterprise"],
  customer_pnl:    ["pro", "enterprise"],
  unlimited_phones:["pro", "enterprise"],
  bulk_orders:     ["pro", "enterprise"],

  // ── Enterprise only ───────────────────────────────────────────────────────
  bulk_invoice:    ["enterprise"], // TODO: not yet built
  trade_network:   ["enterprise"],
  unlimited_seats: ["enterprise"],
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;

export function usePlan() {
  const { tenant, featureFlags } = useAuth();
  const plan = tenant?.plan ?? "trial";
  const now = new Date().getTime();
  const expired = tenant?.planExpiresAt
    ? new Date(tenant.planExpiresAt).getTime() < now
    : false;

  const isFlagEnabled = (f: FeatureKey): boolean => {
    if (!featureFlags) return true; // if flags haven't loaded yet, don't block
    const flag = featureFlags[f as string];
    if (!flag) return true; // no flag entry for this key = not kill-switched
    const tenantOverride = tenant?.id ? flag.tenant_overrides?.[tenant.id] : undefined;
    if (tenantOverride !== undefined) return tenantOverride;
    return flag.enabled_globally;
  };

  return {
    plan,
    isExpired: expired || plan === "expired",
    canUse: (f: FeatureKey): boolean => {
      if (expired || plan === "expired") return false;
      // P4-ENH-35: INTENTIONAL — Trial gives full Enterprise access for 14 days. Do not remove.
      if (plan === "trial") return isFlagEnabled(f);
      if (plan === "enterprise") return isFlagEnabled(f);

      const planAllows = FEATURE_GATES[f]?.includes(plan) ?? false;
      return planAllows && isFlagEnabled(f);
    },
  };
}

