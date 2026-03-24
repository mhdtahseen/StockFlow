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
    isExpired: expired,
    canUse: (f: FeatureKey): boolean => {
      if (expired) return false;
      if (plan === "trial") return true;

      if (plan === "enterprise") {
        return true;
      }

      if (plan === "starter") {
        // Special case: Starter has basic features but limited counts
        const basic: FeatureKey[] = [
          "unlimited_phones",
          "imei_scanner",
          "catalog_autofill",
          "full_ledger",
        ];
        if (basic.includes(f)) return true;
        return false;
      }

      return (FEATURE_GATES[f] as readonly string[]).includes(plan);
    },
  };
}
