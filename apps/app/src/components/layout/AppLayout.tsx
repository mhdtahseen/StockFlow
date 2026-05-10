import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AppDrawer from "./AppDrawer";
import AppHeader from "./AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { useOfflineSyncManager } from "@/app/useOfflineSyncManager";
import { usePlan } from "@/hooks/usePlan";
import TrialExpiredPaywall from "@/components/shared/TrialExpiredPaywall";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/context/AuthContext";
import SuspendedScreen from "@/pages/SuspendedScreen";
import AnnouncementBanner from "./AnnouncementBanner";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Initialize offline background syncing
  useOfflineSyncManager();

  // Scroll focused inputs into view when keyboard opens (iOS + Android)
  useKeyboard();

  // Initialize push notifications
  usePushNotifications();

  const { isExpired } = usePlan();
  const location = useLocation();
  const isLedgerRoute = location.pathname.startsWith('/ledger');
  const { tenant, isSuperAdmin } = useAuth();

  if (tenant && !tenant.isActive && !isSuperAdmin) {
    return <SuspendedScreen />;
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {isExpired && !isLedgerRoute && <TrialExpiredPaywall />}
      <AppDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <AnnouncementBanner />
      <AppHeader onMenuOpen={() => setDrawerOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster />
      <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
    </div>
  );
}
