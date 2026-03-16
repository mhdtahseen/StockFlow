import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Super Admin Area</h1>
        </header>
        <div className="flex-1 w-full relative max-w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
