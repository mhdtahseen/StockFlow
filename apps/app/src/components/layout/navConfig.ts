import {
  Smartphone,
  Users,
  FileText,
  ShoppingCart,
  TrendingUp,
  Banknote,
  LayoutDashboard,
  User,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { FeatureKey } from "@/hooks/usePlan";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  feature: FeatureKey | null;
  tourId?: string;
};

export const DASHBOARD_NAV: NavItem = {
  label: "Dashboard",
  to: "/",
  icon: LayoutDashboard,
  feature: null,
};

export const OPERATIONS_NAV: NavItem[] = [
  { label: "Inventory", to: "/inventory", icon: Smartphone, feature: null, tourId: "sidebar-inventory" },
  {
    label: "Purchase Orders",
    to: "/purchase-orders",
    icon: ShoppingCart,
    feature: "purchase_orders",
  },
  {
    label: "Sales Orders",
    to: "/orders",
    icon: FileText,
    feature: "trade_orders",
    tourId: "sidebar-orders",
  },
];

export const FINANCE_CRM_NAV: NavItem[] = [
  { label: "Ledger", to: "/ledger", icon: Banknote, feature: "full_ledger", tourId: "sidebar-ledger" },
  {
    label: "Analytics",
    to: "/analytics",
    icon: TrendingUp,
    feature: "analytics",
  },
  { label: "Customers", to: "/customers", icon: Users, feature: "customers" },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "My Profile", to: "/profile", icon: User, feature: null },
  { label: "Manage Team", to: "/team", icon: ShieldCheck, feature: null },
  { label: "App Settings", to: "/settings", icon: Settings2, feature: null },
];

export const PAGE_TITLES: Record<string, string> = {
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

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/inventory/")) return "Device Detail";
  if (pathname.startsWith("/customers/")) return "Customer Record";
  if (pathname.startsWith("/orders/")) return "Order Detail";
  if (pathname.startsWith("/purchase-orders/")) return "PO Details";
  if (pathname.startsWith("/edit/")) return "Edit Phone";
  return "Finventree";
}
