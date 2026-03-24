import * as React from "react"
import {
  CheckCircle,
  Database,
  Store,
} from "lucide-react"

import { Link } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Admin Navigation Data
const data = {
  user: {
    name: "Super Admin",
    email: "admin@stockflow.app",
    avatar: "/logo.svg",
  },
  navMain: [
    {
      title: "Tenant Management",
      url: "#",
      icon: Store,
      isActive: true,
      items: [
        {
          title: "Approvals",
          url: "/admin/approvals",
        },
        {
          title: "Supervision",
          url: "/admin/supervision",
        },
      ],
    },
    {
      title: "Device Catalog V2",
      url: "/admin/catalog",
      icon: Database,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="dark:bg-slate-950 bg-slate-50 border-r border-slate-200 dark:border-slate-800">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-500 text-white">
                  <Store className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">StockFlow Admin</span>
                  <span className="text-xs text-slate-500">Supervision</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
