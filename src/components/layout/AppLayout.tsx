import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AppDrawer from "./AppDrawer";
import AppHeader from "./AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { useOfflineSyncManager } from "@/app/useOfflineSyncManager";
import { usePlan } from "@/hooks/usePlan";
import TrialExpiredPaywall from "@/components/shared/TrialExpiredPaywall";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Initialize offline background syncing
  useOfflineSyncManager();

  const { isExpired } = usePlan();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {isExpired && <TrialExpiredPaywall />}
      <AppDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <AppHeader onMenuOpen={() => setDrawerOpen(true)} />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <Toaster />
      <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
    </div>
  );
}
