import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet, useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"

const ADMIN_TITLES: Record<string, string> = {
  "/admin/approvals": "Approval Queue",
  "/admin/supervision": "Supervision Lab",
  "/admin/catalog": "Master Catalog",
};

export default function AdminLayout() {
  const location = useLocation();

  const getTitle = () => {
    return ADMIN_TITLES[location.pathname] || "Super Admin";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 border-b border-slate-100 dark:border-slate-800">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-3 h-4" />
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {getTitle()}
          </h1>
        </header>
        <div className="flex-1 w-full relative max-w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
