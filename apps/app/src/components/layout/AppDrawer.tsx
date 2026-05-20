import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
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
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { usePlan, FeatureKey } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";
import { useUpgradeGate } from "@/context/UpgradeGateContext";
import { RootState } from "@/app/store";

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
    icon: Banknote,
    feature: "full_ledger" as const,
  },
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
  const { isAdmin, user, signOut, tenant, fullName, avatarUrl } = useAuth();
  const { showUpgrade } = useUpgradeGate();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const touchStartX = useRef<number>(0);
  const stuckCount = useSelector(
    (state: RootState) => state.sync.outbox.filter((i) => i.stuck).length,
  );

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
          // Locked: show the nav item in a muted style with a PRO badge.
          // Tapping opens the upgrade modal — user understands what they're missing.
          <button
            type="button"
            onClick={() => { showUpgrade(section.feature as FeatureKey); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
          >
            <section.icon size={20} className="shrink-0" />
            <span className="text-sm font-medium flex-1 text-left">
              {section.label}
            </span>
            <span className="text-[8px] font-black uppercase tracking-wider leading-none bg-amber-400/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-amber-950 transition-colors">
              PRO
            </span>
          </button>
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
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        />
      )}
      {/* Drawer panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full w-72 md:w-80 z-[60] transition-transform duration-300",
          "bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800",
          "shadow-2xl flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Finventree"
              className="h-9 w-9 dark:brightness-0 dark:invert shrink-0"
            />
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl tracking-tight text-slate-900 dark:text-slate-100 italic">
                  <span className="font-black">Finven</span>
                  <span className="font-bold text-primary-500">Tree</span>
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
          {/* Sync issues banner — only shown when an outbox item is permanently stuck */}
          {stuckCount > 0 && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-tight">
                  {stuckCount} item{stuckCount > 1 ? "s" : ""} couldn't sync
                </p>
                <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-0.5 leading-tight">
                  Data saved locally. You may need to re-enter.
                </p>
              </div>
            </div>
          )}

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
        <div className="px-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black text-slate-500 uppercase">
                    {(fullName || user?.email || "?").charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {fullName || user?.email?.split('@')[0]}
                  {tenant?.name && (
                    <span className="text-slate-400 dark:text-slate-500 font-medium ml-1.5 opacity-80 decoration-slate-300">
                      ({tenant.name})
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500 truncate leading-tight">
                  {user?.email}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest scale-90 origin-left">
                    Connected
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowSignOutConfirm(true)}
              className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95 border border-transparent active:border-rose-100 dark:active:border-rose-900/30 group"
              title="Sign Out"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          {/* <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <Crown size={14} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              {PLAN_LABELS[plan] ?? `${plan} plan`}
            </span>
          </div> */}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
          <DialogContent className="sm:max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-center p-6 gap-0">
            <DialogHeader className="flex flex-col items-center">
              <div className="size-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400">
                <AlertCircle size={28} />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sign Out?
              </DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to log out from {tenant?.name || "the Organisation"}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-6">
              <Button 
                onClick={() => {
                  signOut();
                  onClose();
                  setShowSignOutConfirm(false);
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-rose-600/20"
              >
                Yes, Sign Out
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowSignOutConfirm(false)}
                className="w-full h-11 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Stay Logged In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
