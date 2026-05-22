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
  const now  = Date.now();

  // Client-side fallback ONLY for plan='trial' — prevents an up-to-1hr gap if the cron hasn't
  // run yet. Intentionally scoped to 'trial' so that grace/restricted plans (whose
  // plan_expires_at is the old billing date, already in the past) are NOT incorrectly expired.
  const trialExpired = plan === "trial" && !!tenant?.planExpiresAt
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

  // Graduated expiry states
  const isGrace      = plan === "grace";
  const isRestricted = plan === "restricted";
  const isExpired    = trialExpired || plan === "expired";

  // Payment failed but plan not yet changed (banner only, full access)
  const isPaymentFailed = !!tenant?.paymentFailedAt && !isGrace && !isRestricted && !isExpired;

  // Countdown helpers for grace/restricted banners
  const planHaltedMs = tenant?.planHaltedAt ? new Date(tenant.planHaltedAt).getTime() : null;
  const daysUntilRestricted = planHaltedMs !== null
    ? Math.max(0, 7  - Math.floor((now - planHaltedMs) / 86400000))
    : null;
  const daysUntilSuspended = planHaltedMs !== null
    ? Math.max(0, 14 - Math.floor((now - planHaltedMs) / 86400000))
    : null;

  return {
    plan,
    isExpired,
    isGrace,
    isRestricted,
    isPaymentFailed,
    daysUntilRestricted,
    daysUntilSuspended,
    canUse: (f: FeatureKey): boolean => {
      // Hard locks — no write access
      if (isExpired || isRestricted) return false;
      // P4-ENH-35: INTENTIONAL — Trial and Grace both give full Enterprise access. Do not remove.
      if (plan === "trial" || isGrace) return isFlagEnabled(f);
      if (plan === "enterprise") return isFlagEnabled(f);

      const planAllows = FEATURE_GATES[f]?.includes(plan) ?? false;
      return planAllows && isFlagEnabled(f);
    },
  };
}

