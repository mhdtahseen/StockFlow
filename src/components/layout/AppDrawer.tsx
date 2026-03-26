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
  User,
  Settings2,
  ShieldCheck,
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

const OPERATIONS_SECTIONS = [
  { label: "Inventory", to: "/inventory", icon: Smartphone, feature: null },
  {
    label: "Purchase Orders",
    to: "/purchase-orders",
    icon: ShoppingCart,
    feature: "purchase_orders" as const,
  },
  {
    label: "Sales Orders",
    to: "/orders",
    icon: FileText,
    feature: "trade_orders" as const,
  },
];

const FINANCE_CRM_SECTIONS = [
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
  const { isAdmin, user, signOut, tenant } = useAuth();
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
      {/* Backdrop */}
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

        {/* Nav items */}
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
              Operations
            </h3>
            {OPERATIONS_SECTIONS.map((section) => renderSection(section))}
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Finance & CRM
            </h3>
            {FINANCE_CRM_SECTIONS.map((section) => renderSection(section))}
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Account & Security
            </h3>
            {renderSection({ label: "My Profile", to: "/profile", icon: User })}
            {isAdmin && renderSection({ label: "Manage Team", to: "/team", icon: ShieldCheck })}
            {renderSection({ label: "App Settings", to: "/settings", icon: Settings2 })}
          </div>
        </nav>

        {/* User Profile & Plan Badge at bottom */}
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  {tenant?.name && (
                    <span className="text-slate-400 dark:text-slate-500 font-medium ml-1.5 opacity-80">
                      ({tenant.name})
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500 truncate leading-tight">
                  {user?.email}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest scale-90 origin-left">
                    Signed in
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                signOut();
                onClose();
              }}
              className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95 border border-transparent active:border-rose-100 dark:active:border-rose-900/30"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <Crown size={14} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              {PLAN_LABELS[plan] ?? `${plan} plan`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
