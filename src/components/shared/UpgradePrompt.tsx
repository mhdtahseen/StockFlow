import React from "react";
import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FeatureKey } from "@/hooks/usePlan";

interface Props {
  feature: FeatureKey;
  currentPlan: string;
}

const FEATURE_NAMES: Record<FeatureKey, string> = {
  unlimited_phones: "Unlimited Inventory",
  imei_scanner: "IMEI Barcode Scanner",
  catalog_autofill: "Global Device Catalog",
  full_ledger: "Advanced P&L Ledger",
  trade_orders: "Sales Orders & Billing",
  customers: "Customer Directory",
  pdf_invoice: "PDF Invoice Generation",
  credit_tracking: "Credit Tracking",
  analytics: "Advanced Analytics",
  purchase_orders: "Purchase Orders",
  bulk_orders: "Bulk Sale Orders",
  bulk_invoice: "Bulk PDF Invoices",
  trade_network: "Dealer Trade Network",
  receivables: "Net Receivables Dashboard",
  customer_pnl: "Customer specific P&L",
  unlimited_seats: "Unlimited Team Seats",
};

export function UpgradePrompt({ feature, currentPlan }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center max-w-sm mx-auto my-4 w-full">
      <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Lock className="text-slate-400 dark:text-slate-500" size={24} />
      </div>
      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
        {FEATURE_NAMES[feature] || "Premium Feature"}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
        This feature is not available on the current <strong className="capitalize text-slate-700 dark:text-slate-300">{currentPlan}</strong> plan. Upgrade your subscription to unlock it.
      </p>
      <Link
        to="/pricing"
        className="flex items-center gap-2 bg-[#064a98] hover:bg-blue-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors w-full justify-center shadow-md shadow-blue-900/20"
      >
        View Pricing <ArrowRight size={18} />
      </Link>
    </div>
  );
}
