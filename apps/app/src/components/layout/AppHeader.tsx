import React from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import NotificationsPopover from "@/components/shared/NotificationsPopover";

interface Props {
  onMenuOpen: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/add": "Add Phone",
  "/customers": "Customers",
  "/orders": "Sales Orders",
  "/financials": "Accounts Ledger",
  "/ledger": "Accounts Ledger",
  "/purchase-orders": "Purchase Orders",
  "/analytics": "Analytics",
  "/profile": "Profile Info",
  "/settings": "Settings",
  "/team": "Manage Team",
  "/about": "About App",
  "/pricing": "Upgrade Plan",
};

export default function AppHeader({ onMenuOpen }: Props) {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Handle dynamic routes
    if (path.startsWith("/inventory/")) return "Device Detail";
    if (path.startsWith("/customers/")) return "Customer Record";
    if (path.startsWith("/orders/")) return "Order Detail";
    if (path.startsWith("/purchase-orders/")) return "PO Details";
    if (path.startsWith("/edit/")) return "Edit Phone";

    return "Finventree";
  };

  return (
    <header className="shrink-0 z-30 flex items-center bg-white dark:bg-slate-900 px-4 py-3 justify-between border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 relative">
        <div
          id="header-actions-target"
          className="flex items-center gap-2"
        ></div>
        <NotificationsPopover />
      </div>
    </header>
  );
}
