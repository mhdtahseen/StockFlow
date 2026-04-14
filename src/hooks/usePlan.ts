import { useAuth } from "@/context/AuthContext";

export const FEATURE_GATES = {
  unlimited_phones: ["pro", "enterprise"],
  imei_scanner: ["pro", "enterprise"],
  catalog_autofill: ["pro", "enterprise"],
  full_ledger: ["pro", "enterprise"],
  trade_orders: ["pro", "enterprise"],
  customers: ["pro", "enterprise"],
  pdf_invoice: ["pro", "enterprise"],
  credit_tracking: ["pro", "enterprise"],
  analytics: ["pro", "enterprise"],
  purchase_orders: ["pro", "enterprise"],
  bulk_orders: ["enterprise"],
  bulk_invoice: ["enterprise"],
  trade_network: ["enterprise"],
  receivables: ["enterprise"],
  customer_pnl: ["enterprise"],
  unlimited_seats: ["enterprise"],
} as const;
export type FeatureKey = keyof typeof FEATURE_GATES;

export function usePlan() {
  const { tenant } = useAuth();
  const plan = tenant?.plan ?? "trial";
  const Math_now = new Date().getTime();
  const expired = tenant?.planExpiresAt
    ? new Date(tenant.planExpiresAt).getTime() < Math_now
    : false;

  return {
    plan,
    isExpired: expired || plan === "expired",
    canUse: (f: FeatureKey): boolean => {
      if (expired || plan === "expired") return false;
      // P4-ENH-35: INTENTIONAL — Trial gives full Enterprise access for 14 days. Do not remove.
      if (plan === "trial") return true;

      if (plan === "enterprise") {
        return true;
      }

      if (plan === "starter") {
        // P2-BUG-15: Starter only has basic access — no IMEI scanner, no advanced features.
        // The 200-phone limit is enforced at DB level via RLS. No feature gates here.
        return false;
      }

      return (FEATURE_GATES[f] as readonly string[]).includes(plan);
    },
  };
}

