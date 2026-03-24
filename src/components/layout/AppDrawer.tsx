import React, { useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Smartphone,
  Users,
  FileText,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Banknote,
  X,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { usePlan, FeatureKey } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";

const PLAN_LABELS: Record<string, string> = {
  trial: '🟡 Trial Active',
  free: '⚪ Free Plan',
  starter: '🔵 Starter',
  pro: '🟣 Professional',
  enterprise: '🟢 Enterprise',
  expired: '🔴 Expired',
};

const INVENTORY_SECTIONS = [
  { label: "Inventory", to: "/inventory", icon: Smartphone, feature: null },
  {
    label: "Purchase Orders",
    to: "/purchase-orders",
    icon: ShoppingCart,
    feature: "purchase_orders" as const,
  },
  {
    label: "Trade Orders",
    to: "/orders",
    icon: FileText,
    feature: "trade_orders" as const,
  },
];

const FINANCE_SECTIONS = [
  {
    label: "Ledger",
    to: "/ledger",
    icon: ReceiptText,
    feature: "full_ledger" as const,
  },
  { label: "Financials", to: "/financials", icon: Banknote, feature: null },
  {
    label: "Analytics",
    to: "/analytics",
    icon: TrendingUp,
    feature: "analytics" as const,
  },
  {
    label: "Customers",
    to: "/customers",
    icon: Users,
    feature: "customers" as const,
  },
];

interface Props { isOpen: boolean; onClose: () => void; }

export default function AppDrawer({ isOpen, onClose }: Props) {
  const location = useLocation();
  const { canUse, plan } = usePlan();
  const { signOut } = useAuth();
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 80) onClose(); // Swipe left to close
  };

  const renderSection = (section: any) => {
    const locked = section.feature
      ? !canUse(section.feature as FeatureKey)
      : false;
    const isActive = location.pathname.startsWith(section.to);
    return (
      <div key={section.to}>
        {locked ? (
          <NavLink
            to="/pricing"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <section.icon size={20} />
            <span className="text-sm font-medium flex-1 text-left">
              {section.label}
            </span>
            <Crown size={14} className="text-amber-400" />
          </NavLink>
        ) : (
          <NavLink
            to={section.to}
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
              isActive
                ? "bg-primary-500 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
            )}
          >
            <section.icon size={20} />
            <span className="text-sm font-medium flex-1">{section.label}</span>
            {isActive && <ChevronRight size={16} />}
          </NavLink>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop — stopPropagation prevents iOS scroll from bubbling here */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        />
      )}
      {/* Drawer panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full w-72 md:w-80 z-50 transition-transform duration-300",
          "bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800",
          "shadow-2xl flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="StockFlow"
              className="h-9 w-9 dark:brightness-0 dark:invert shrink-0"
            />
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl tracking-tight text-slate-900 dark:text-slate-100 italic">
                  <span className="font-black">Stock</span>
                  <span className="font-bold text-primary-500">Flow</span>
                </h1>
                {plan === "enterprise" && (
                  <span className="bg-linear-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter flex items-center gap-1">
                    Enterprise
                  </span>
                )}
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                Smart Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Nav items — overscroll-contain prevents iOS rubber-band from hitting backdrop */}
        <nav
          className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dashboard Item */}
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                location.pathname === "/"
                  ? "bg-primary-500 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
              )}
            >
              <LayoutDashboard size={20} />
              <span className="text-sm font-medium flex-1">Dashboard</span>
              {location.pathname === "/" && <ChevronRight size={16} />}
            </NavLink>
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Active Inventory
            </h3>
            {INVENTORY_SECTIONS.map((section) => renderSection(section))}
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Fintech Admin
            </h3>
            {FINANCE_SECTIONS.map((section) => renderSection(section))}
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors mt-4"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium flex-1 text-left">
                Sign Out
              </span>
            </button>
          </div>
        </nav>

        {/* Plan badge at bottom */}
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Crown size={14} className="text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {PLAN_LABELS[plan] ?? `${plan} plan`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

