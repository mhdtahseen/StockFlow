import React, { createContext, useContext, useState, useCallback } from "react";
import type { FeatureKey } from "@/hooks/usePlan";

interface UpgradeGateContextType {
  showUpgrade: (feature: FeatureKey) => void;
}

const UpgradeGateContext = createContext<UpgradeGateContextType | undefined>(undefined);

export function useUpgradeGate() {
  const ctx = useContext(UpgradeGateContext);
  if (!ctx) throw new Error("useUpgradeGate must be used within UpgradeGateProvider");
  return ctx;
}

export function UpgradeGateProvider({ children }: { children: React.ReactNode }) {
  const [activeFeature, setActiveFeature] = useState<FeatureKey | null>(null);

  const showUpgrade = useCallback((feature: FeatureKey) => {
    setActiveFeature(feature);
  }, []);

  const close = useCallback(() => setActiveFeature(null), []);

  return (
    <UpgradeGateContext.Provider value={{ showUpgrade }}>
      {children}
      {activeFeature && <UpgradeModal feature={activeFeature} onClose={close} />}
    </UpgradeGateContext.Provider>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

import { X, Lock, ArrowUpRight, Sparkles } from "lucide-react";
import { FEATURE_GATES } from "@/hooks/usePlan";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const PRICING_URL = "https://finventree.com/pricing";

const FEATURE_META: Record<FeatureKey, { name: string; description: string; requiredPlan: "pro" | "enterprise" }> = {
  // Pro features
  public_sharing:   { name: "Public Share Links",        description: "Share invoices and POs with customers via a public link — no login needed.",         requiredPlan: "pro" },
  imei_scanner:     { name: "IMEI Barcode Scanner",      description: "Scan IMEI numbers instantly with your camera instead of typing 15 digits manually.", requiredPlan: "pro" },
  catalog_autofill: { name: "Global Device Catalog",     description: "Auto-fill brand, model, RAM, storage and color from the global device registry.",    requiredPlan: "pro" },
  full_ledger:      { name: "Advanced P&L Ledger",       description: "Track all income, expenses, credits and debits with a real-time profit view.",        requiredPlan: "pro" },
  analytics:        { name: "Advanced Analytics",        description: "Visualise revenue trends, top sellers and customer behaviour over time.",             requiredPlan: "pro" },
  credit_tracking:  { name: "Credit Tracking",           description: "Monitor outstanding credit balances across all customers and suppliers.",             requiredPlan: "pro" },
  receivables:      { name: "Net Receivables Dashboard", description: "See exactly who owes you money and how much, updated in real-time.",                 requiredPlan: "pro" },
  customer_pnl:     { name: "Customer-level P&L",        description: "See profit and loss broken down per customer to know your most valuable accounts.",   requiredPlan: "pro" },
  unlimited_phones: { name: "Unlimited Inventory",       description: "Remove the 100-phone cap and add as many devices as your business needs.",            requiredPlan: "pro" },
  bulk_orders:      { name: "Multi-device Sale Orders",  description: "Add multiple devices to a single sale order — essential for batch transactions.",    requiredPlan: "pro" },
  // Enterprise features
  bulk_invoice:     { name: "Bulk PDF Invoices",         description: "Generate invoices for multiple orders in one batch — perfect for high-volume shops.", requiredPlan: "enterprise" },
  trade_network:    { name: "Dealer Trade Network",      description: "Trade and transfer stock directly with other verified dealers on the network.",       requiredPlan: "enterprise" },
  unlimited_seats:  { name: "Unlimited Team Seats",      description: "Add as many staff members as your team needs, with no per-seat limits.",              requiredPlan: "enterprise" },
  // Starter features (should never hit this modal in practice)
  trade_orders:     { name: "Sales Orders",              description: "Create and manage sale orders for your customers.",                                   requiredPlan: "pro" },
  purchase_orders:  { name: "Purchase Orders",           description: "Create and manage purchase orders from your suppliers.",                              requiredPlan: "pro" },
  customers:        { name: "Customer Directory",        description: "Manage your customer and supplier contacts.",                                         requiredPlan: "pro" },
  pdf_invoice:      { name: "PDF Invoice Generation",    description: "Generate professional PDF invoices for your orders.",                                 requiredPlan: "pro" },
};

const PLAN_BADGE: Record<"pro" | "enterprise", { label: string; color: string }> = {
  pro:        { label: "Pro",        color: "bg-blue-500" },
  enterprise: { label: "Enterprise", color: "bg-violet-600" },
};

async function openPricing() {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: PRICING_URL });
  } else {
    window.open(PRICING_URL, "_blank", "noopener,noreferrer");
  }
}

interface UpgradeModalProps {
  feature: FeatureKey;
  onClose: () => void;
}

function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const meta = FEATURE_META[feature];
  const badge = PLAN_BADGE[meta.requiredPlan];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon + Badge */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Lock size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full mb-4 ${badge.color}`}>
            {badge.label} Feature
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 text-center mb-2 leading-tight">
            {meta.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            {meta.description}
          </p>
        </div>

        {/* What you get hint */}
        <div className="mx-6 mb-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Upgrade to <strong className="text-slate-800 dark:text-slate-200">{badge.label}</strong> to unlock this
            feature and everything below it.
          </p>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => { openPricing(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/20"
          >
            Upgrade on finventree.com
            <ArrowUpRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-2xl text-slate-400 dark:text-slate-500 text-sm font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
