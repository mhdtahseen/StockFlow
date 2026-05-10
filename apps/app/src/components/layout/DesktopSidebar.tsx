import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Crown, ChevronRight, LogOut, Plus, AlertCircle } from "lucide-react";
import clsx from "clsx";
import {
  DASHBOARD_NAV,
  OPERATIONS_NAV,
  FINANCE_CRM_NAV,
  ACCOUNT_NAV,
  type NavItem,
} from "./navConfig";
import { usePlan, type FeatureKey } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLAN_LABELS: Record<string, string> = {
  trial: "🟡 Trial Active",
  free: "⚪ Free Plan",
  starter: "🔵 Starter",
  pro: "🟣 Professional",
  enterprise: "🟢 Enterprise",
  expired: "🔴 Expired",
};

export default function DesktopSidebar() {
  const location = useLocation();
  const { canUse, plan } = usePlan();
  const { isAdmin, user, signOut, tenant, fullName, avatarUrl } = useAuth();
  const [showSignOut, setShowSignOut] = React.useState(false);

  const renderItem = (item: NavItem) => {
    const locked = item.feature ? !canUse(item.feature as FeatureKey) : false;
    const isActive =
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to);

    if (locked) {
      return (
        <NavLink
          key={item.to}
          to="/pricing"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-sm font-medium"
        >
          <item.icon size={18} className="shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          <Crown size={13} className="text-amber-400 shrink-0" />
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={clsx(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-sm font-medium",
          isActive
            ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100",
        )}
      >
        <item.icon size={18} className="shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {isActive && <ChevronRight size={14} className="opacity-70 shrink-0" />}
      </NavLink>
    );
  };

  return (
    <>
      <aside className="flex flex-col w-60 shrink-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-30">
        {/* Brand header — same height as DesktopTopBar (h-14) */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <img
            src="/logo.svg"
            alt="Finventree"
            className="h-8 w-8 dark:brightness-0 dark:invert shrink-0"
          />
          <div>
            <h1 className="text-[17px] tracking-tight text-slate-900 dark:text-slate-100 italic leading-tight">
              <span className="font-black">Finven</span>
              <span className="font-bold text-primary-500">Tree</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.16em] leading-none">
              Smart Manager
            </p>
          </div>
        </div>

        {/* Quick Add */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <NavLink
            to="/add"
            className={clsx(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all font-semibold text-sm w-full",
              location.pathname === "/add"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20 active:scale-[0.98]",
            )}
          >
            <Plus size={17} strokeWidth={2.5} />
            Add Phone
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto overscroll-contain">
          <div className="space-y-0.5">{renderItem(DASHBOARD_NAV)}</div>

          <div className="space-y-0.5">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
              Operations
            </p>
            {OPERATIONS_NAV.map(renderItem)}
          </div>

          <div className="space-y-0.5">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
              Finance & CRM
            </p>
            {FINANCE_CRM_NAV.map(renderItem)}
          </div>

          <div className="space-y-0.5">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
              Account
            </p>
            {renderItem(ACCOUNT_NAV[0])}
            {isAdmin && renderItem(ACCOUNT_NAV[1])}
            {renderItem(ACCOUNT_NAV[2])}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          {/* Plan badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              {PLAN_LABELS[plan] ?? `${plan} plan`}
            </span>
          </div>

          {/* User row */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-slate-500 uppercase">
                  {(fullName || user?.email || "?").charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {fullName || user?.email?.split("@")[0]}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => setShowSignOut(true)}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Sign-out confirmation dialog */}
      <Dialog open={showSignOut} onOpenChange={setShowSignOut}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="size-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <AlertCircle size={24} />
              </div>
            </div>
            <DialogTitle className="text-center">Sign Out?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to sign out from{" "}
              {tenant?.name || "the organisation"}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={() => {
                signOut();
                setShowSignOut(false);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Yes, Sign Out
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSignOut(false)}
              className="w-full font-bold text-slate-500 dark:text-slate-400"
            >
              Stay Logged In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
