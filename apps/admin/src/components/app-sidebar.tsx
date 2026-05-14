"use client";

import * as React from "react";
import { Bell, Database, Store, BarChart2, Flag, Shield, Activity, TrendingUp, Filter, DollarSign, AlertTriangle, Link2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Tenant Management",
    url: "#",
    icon: Store,
    isActive: true,
    items: [
      { title: "Approvals", url: "/approvals" },
      { title: "Supervision", url: "/supervision" },
    ],
  },
  {
    title: "Platform Analytics",
    url: "#",
    icon: BarChart2,
    items: [
      { title: "Revenue", url: "/revenue" },
      { title: "Financials", url: "/financials" },
      { title: "Usage", url: "/analytics" },
      { title: "Onboarding Funnel", url: "/funnel" },
    ],
  },
  {
    title: "Platform Controls",
    url: "#",
    icon: Bell,
    items: [
      { title: "Notifications", url: "/notifications" },
      { title: "Rate Pricing", url: "/pricing" },
      { title: "Feature Flags", url: "/flags" },
      { title: "Share Links", url: "/shares" },
    ],
  },
  {
    title: "Security & Ops",
    url: "#",
    icon: Shield,
    items: [
      { title: "Audit Log", url: "/audit" },
      { title: "System Health", url: "/health" },
      { title: "Overdue Orders", url: "/overdue" },
      { title: "IMEI Lookup", url: "/imei-lookup" },
    ],
  },
  {
    title: "Device Catalog V2",
    url: "/catalog",
    icon: Database,
    items: [],
  },
];

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { session } = useAuth();
  const user = {
    name: session?.user?.user_metadata?.full_name ?? "Super Admin",
    email: session?.user?.email ?? "admin@finventree.app",
    avatar: "/logo.svg",
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="dark:bg-slate-950 bg-slate-50 border-r border-slate-200 dark:border-slate-800"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-500 text-white">
                  <Store className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Finventree Admin
                  </span>
                  <span className="text-xs text-slate-500">Supervision</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
