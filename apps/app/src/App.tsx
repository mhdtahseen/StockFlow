import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import posthog from "@/lib/posthog";

// Capacitor serves files via capacitor:// — BrowserRouter needs a server to
// resolve paths, so we use HashRouter in native builds only.
// NOTE: typeof window.Capacitor is always defined on web too (the package sets it),
// so we must use isNativePlatform() — the only reliable runtime check.
const Router = Capacitor.isNativePlatform()
  ? HashRouter
  : BrowserRouter;
import { Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";

// Auth pages
import Login from "@/pages/Login";

// Main pages
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import AddDevices from "@/pages/AddDevices";
import PhoneDetail from "@/pages/PhoneDetail";
import EditPhone from "@/pages/EditPhone";
import Ledger from "@/pages/Ledger";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderDetail from "@/pages/PurchaseOrderDetail";
import Pricing from "@/pages/Pricing";
import Analytics from "@/pages/Analytics";
import ManageTeam from "@/pages/ManageTeam";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AboutApp from "@/pages/AboutApp";
import PublicView from "@/pages/PublicView";
import AuthHandoff from "@/pages/AuthHandoff";

import "./index.css";
import { useAuth } from "./context/AuthContext";
import { usePlan, type FeatureKey } from "./hooks/usePlan";
import { useUpgradeGate } from "./context/UpgradeGateContext";

/** Web deep-link redirect: /connect/:code → /customers?connect=CODE */
const ConnectRedirect = () => {
  const { code } = { code: window.location.pathname.split("/connect/")[1] ?? "" };
  return <Navigate to={`/customers?connect=${code.toUpperCase()}`} replace />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  const hasLocalFlag = localStorage.getItem("finventree_auth") === "true";

  if (isLoading && !hasLocalFlag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500 dark:text-blue-500" />
      </div>
    );
  }

  if (!session && !hasLocalFlag) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Renders the page if the plan allows, otherwise shows the upgrade modal and
// renders an empty placeholder — so the user can't access the page content.
function GatedRoute({ feature, element }: { feature: FeatureKey; element: React.ReactNode }) {
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();

  if (canUse(feature)) return <>{element}</>;

  // Trigger the modal on first render, show a blank slate behind it
  React.useEffect(() => { showUpgrade(feature); }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 dark:text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin opacity-30" />
    </div>
  );
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: location.pathname });
  }, [location.pathname]);
  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <TooltipProvider>
      <Router>
        <PageViewTracker />
        {/* <AppGate> */}
        {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/handoff" element={<AuthHandoff />} />
          <Route path="/public/view/:token" element={<PublicView />} />
          {/* Trade Network connect deep link: /connect/:code → redirect to /customers?connect=CODE */}
          <Route
            path="/connect/:code"
            element={<ConnectRedirect />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="add" element={<AddDevices />} />
            <Route path="inventory/:id" element={<PhoneDetail />} />
            <Route path="edit/:id" element={<EditPhone />} />
            <Route path="ledger" element={<GatedRoute feature="full_ledger" element={<Ledger />} />} />
            <Route
              path="financials"
              element={<Navigate to="/ledger" replace />}
            />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route
              path="purchase-orders/:id"
              element={<PurchaseOrderDetail />}
            />
            <Route path="pricing" element={<Pricing />} />
            <Route path="wallet" element={<Navigate to="/ledger" replace />} />
            <Route path="analytics" element={<GatedRoute feature="analytics" element={<Analytics />} />} />
            <Route path="team" element={<ManageTeam />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<AboutApp />} />
          </Route>
        </Routes>
        {/* </AppGate> */}
      </Router>
    </TooltipProvider>
  );
}

export default App;
