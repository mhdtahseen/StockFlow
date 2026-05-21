import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, ArrowLeft } from "lucide-react";
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
  const navigate = useNavigate();

  // Any path with more than one segment (e.g. /orders/abc-123) is a detail/sub-page
  const isSubPage = location.pathname.split('/').filter(Boolean).length > 1;

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
        {isSubPage ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            data-tour="nav-menu"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 relative">
        <div className="header-actions-target flex items-center gap-2"></div>
        <NotificationsPopover />
      </div>
    </header>
  );
}
