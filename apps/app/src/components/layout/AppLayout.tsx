import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import AppDrawer from "./AppDrawer";
import AppHeader from "./AppHeader";
import DesktopSidebar from "./DesktopSidebar";
import DesktopTopBar from "./DesktopTopBar";
import { Toaster } from "@/components/ui/sonner";
import { useOfflineSyncManager } from "@/app/useOfflineSyncManager";
import { usePlan } from "@/hooks/usePlan";
import SubscriptionPaywall from "@/components/shared/SubscriptionPaywall";
import PaymentBanner from "@/components/shared/PaymentBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/context/AuthContext";
import SuspendedScreen from "@/pages/SuspendedScreen";
import AnnouncementBanner from "./AnnouncementBanner";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { UpgradeGateProvider } from "@/context/UpgradeGateContext";
import CoachMarks from "@/components/onboarding/CoachMarks";
import FeatureTour from "@/components/onboarding/FeatureTour";
import { SyncContext } from "@/context/SyncContext";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  // Initialize offline background syncing — capture isSyncing for context
  const { isSyncing, refetch } = useOfflineSyncManager();

  // Scroll focused inputs into view when keyboard opens (iOS + Android)
  useKeyboard();

  // Initialize push notifications
  usePushNotifications();

  const { isExpired, isGrace, isRestricted, isPaymentFailed } = usePlan();
  const location = useLocation();
  const isLedgerRoute = location.pathname.startsWith('/ledger');
  const { tenant, isSuperAdmin } = useAuth();

  if (tenant && !tenant.isActive && !isSuperAdmin) {
    return <SuspendedScreen />;
  }

  return (
    <UpgradeGateProvider>
    <SyncContext.Provider value={{ isSyncing, refetch }}>
    <div className="flex h-[100dvh] overflow-hidden w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {isExpired && !isLedgerRoute && <SubscriptionPaywall />}
      {/* Payment failure / grace / restricted non-blocking banner */}
      {(isPaymentFailed || isGrace || isRestricted) && <PaymentBanner />}
      {/* Desktop: persistent sidebar; Mobile: slide-in drawer */}
      {!isMobile && <DesktopSidebar />}
      {isMobile && <AppDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AnnouncementBanner />
        {/* Conditionally render only one header to avoid duplicate subscriptions */}
        {isMobile ? (
          <AppHeader onMenuOpen={() => setDrawerOpen(true)} />
        ) : (
          <DesktopTopBar />
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Toaster />
        {/* Bottom nav — mobile only */}
        {isMobile && <BottomNav onMenuOpen={() => setDrawerOpen(true)} />}
      </div>
      <CoachMarks />
      <FeatureTour />
    </div>
    </SyncContext.Provider>
    </UpgradeGateProvider>
  );
}
