import React, { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";

// Auth pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import InviteSignup from "@/pages/InviteSignup";
import Verified from "@/pages/Verified";

// Main pages
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import AddPhone from "@/pages/AddPhone";
import PhoneDetail from "@/pages/PhoneDetail";
import EditPhone from "@/pages/EditPhone";
import Financials from "@/pages/Financials";
import LedgerPage from "@/pages/LedgerPage";
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

// Admin pages
import AdminLayout from "@/pages/AdminLayout";
import AdminApprovals from "@/pages/AdminApprovals";
import AdminSupervision from "@/pages/AdminSupervision";
import AdminCatalog from "@/pages/AdminCatalog";

import "./index.css";
import { useAuth } from "./context/AuthContext";
import IosInstallPrompt from "./components/shared/IosInstallPrompt";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  const hasLocalFlag = localStorage.getItem("stockflow_auth") === "true";

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

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isSuperAdmin, isLoading } = useAuth();
  const hasLocalFlag = localStorage.getItem("stockflow_auth") === "true";

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500 dark:text-blue-500" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/join" element={<InviteSignup />} />
            <Route path="/verified" element={<Verified />} />

            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="approvals" replace />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="supervision" element={<AdminSupervision />} />
              <Route path="catalog" element={<AdminCatalog />} />
            </Route>

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
              <Route path="add" element={<AddPhone />} />
              <Route path="inventory/:id" element={<PhoneDetail />} />
              <Route path="edit/:id" element={<EditPhone />} />
              <Route path="financials" element={<Financials />} />
              <Route path="ledger" element={<LedgerPage />} />
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
              <Route
                path="wallet"
                element={<Navigate to="/financials" replace />}
              />
              <Route path="analytics" element={<Analytics />} />
              <Route path="team" element={<ManageTeam />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="about" element={<AboutApp />} />
            </Route>
          </Routes>
          <IosInstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
}

export default App;
