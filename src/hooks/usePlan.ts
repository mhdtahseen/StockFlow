import { useAuth } from "@/context/AuthContext";

export const FEATURE_GATES = {
  unlimited_phones: ["pro", "wholesaler"],
  imei_scanner: ["pro", "wholesaler"],
  catalog_autofill: ["pro", "wholesaler"],
  full_ledger: ["pro", "wholesaler"],
  trade_orders: ["pro", "wholesaler"],
  customers: ["pro", "wholesaler"],
  pdf_invoice: ["pro", "wholesaler"],
  credit_tracking: ["pro", "wholesaler"],
  analytics: ["pro", "wholesaler"],
  purchase_orders: ["pro", "wholesaler"],
  bulk_orders: ["wholesaler"],
  bulk_invoice: ["wholesaler"],
  trade_network: ["wholesaler"],
  receivables: ["wholesaler"],
  customer_pnl: ["wholesaler"],
  unlimited_seats: ["wholesaler"],
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
      
      if (plan === "wholesaler") {
        return true; 
      }
      
      if (plan === "starter") {
        // Special case: Starter has basic features but limited counts
        const basic: FeatureKey[] = ["unlimited_phones", "imei_scanner", "catalog_autofill", "full_ledger"];
        if (basic.includes(f)) return true;
        return false;
      }

      return (FEATURE_GATES[f] as readonly string[]).includes(plan);
    },
  };
}
