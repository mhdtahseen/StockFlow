"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const ADMIN_TITLES: Record<string, string> = {
  "/approvals": "Approval Queue",
  "/supervision": "Supervision Lab",
  "/catalog": "Master Catalog",
  "/notifications": "Broadcast Center",
  "/pricing": "Rate Catalog",
  "/revenue": "Revenue Dashboard",
  "/analytics": "Usage Analytics",
  "/funnel": "Onboarding Funnel",
  "/audit": "Audit Log",
  "/flags": "Feature Flags",
  "/health": "System Health",
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
    if (!isLoading && session && !isSuperAdmin) {
      router.replace("/login?error=unauthorized");
    }
  }, [isLoading, session, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session || !isSuperAdmin) return null;

  const title = ADMIN_TITLES[pathname] ?? "Super Admin";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-3 h-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
        </header>
        <AnnouncementBanner />
        <div className="flex-1 w-full relative max-w-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
