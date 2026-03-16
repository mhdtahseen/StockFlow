import React, { useState, useRef, useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { selectWalletBuckets } from "../features/wallet/selectors";
import { selectInventoryMetrics } from "../features/analytics/selectors";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Wallet,
  ShieldCheck,
  ShoppingCart,
  Landmark,
  TrendingUp,
  Package,
  Smartphone,
  History,
  ChevronRight,
  Settings2,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronLeft,
  Download,
  Info,
  Palette,
  Users,
  User,
  ArrowUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import clsx from "clsx";
import ExportModal from "../components/shared/ExportModal";
import ComingSoonModal from "../components/shared/ComingSoonModal";
import NotificationsPopover from "../components/shared/NotificationsPopover";

export default function Dashboard() {
  const navigate = useNavigate();
  const buckets = useAppSelector(selectWalletBuckets);
  const metrics = useAppSelector(selectInventoryMetrics);
  const phones = useAppSelector((state) => state.inventory.phones);
  const { mode, setMode, resolved } = useTheme();
  const { session, isAdmin } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "theme">("main");
  const settingsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight > clientHeight) {
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      setShowScrollTop(scrollPercentage > 0.5);
    }
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Close settings when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
        setTimeout(() => setSettingsView("main"), 200); // Reset view after closing
      }
    };
    if (showSettings) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  const themeOptions: {
    value: "system" | "light" | "dark";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "system", label: "System", icon: <Monitor size={14} /> },
    { value: "light", label: "Light", icon: <Sun size={14} /> },
    { value: "dark", label: "Dark", icon: <Moon size={14} /> },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogout = () => {
    localStorage.removeItem("stockflow_auth");
    navigate("/login");
  };

  const recentPhones = [...phones]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="StockFlow"
            className="h-9 w-9 dark:brightness-0 dark:invert"
          />
          <div>
            <h1 className="text-xl tracking-tight text-slate-900 dark:text-slate-100">
              <span className="font-bold">Stock</span>
              <span className="font-medium">Flow</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              Smart Manager
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative" ref={settingsRef}>
          <NotificationsPopover />

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
          >
            <Settings2
              size={18}
              className="text-slate-600 dark:text-slate-400"
            />
            <div
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white/80 dark:border-slate-900/80 transition-colors z-10"
              title={`Theme: ${mode}`}
            >
              {resolved === "dark" ? (
                <Moon size={9} className="text-blue-400" />
              ) : (
                <Sun size={9} className="text-amber-500" />
              )}
            </div>
          </button>

          {showSettings && (
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[180px] z-[60] transition-all">
              {settingsView === "main" ? (
                <>
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Main Menu
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <User size={14} />
                        Profile
                      </div>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          navigate("/team");
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users size={14} />
                          Manage Team
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings2 size={14} />
                        Settings
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        navigate("/about");
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Info size={14} />
                      About App
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors pb-3"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1">
                    <button
                      onClick={() => setSettingsView("main")}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                      Theme Selection
                    </p>
                  </div>
                  <div className="py-1">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setMode(opt.value);
                          setTimeout(() => setSettingsView("main"), 200); // Go back to main menu
                        }}
                        className={clsx(
                          "w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors",
                          mode === opt.value
                            ? "bg-[#064a98]/10 text-[#064a98] dark:bg-blue-500/20 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {opt.icon}
                          {opt.label}
                        </div>
                        {mode === opt.value && (
                          <div className="size-1.5 rounded-full bg-[#064a98] dark:bg-blue-400"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pb-12"
      >
        {/* Hero: Available Cash */}
        <section className="pt-4 pb-2">
          <div className="bg-[#064a98] dark:bg-[#0a3a7a] rounded-xl p-5 shadow-lg shadow-blue-900/20 dark:shadow-blue-950/40 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1 uppercase tracking-wide">
                  Available Cash
                </p>
                <h2 className="text-3xl font-bold tracking-tight">
                  {formatCurrency(buckets.wallet)}
                </h2>
              </div>
              <Link
                to="/wallet"
                className="bg-white/20 dark:bg-white/10 rounded-full p-2 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
              >
                <Wallet size={22} className="text-white" />
              </Link>
            </div>

            <div className="relative z-10 flex gap-3 mt-5 border-t border-white/15 pt-4">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <TrendingUp size={14} />
                {formatCurrency(metrics.netProfit)} Profit
              </div>
              <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <Package size={14} />
                {metrics.inStockCount} Units
              </div>
            </div>
          </div>
        </section>

        {/* 4 Widgets: Purchases, Pledged, Sales, Avg Profit */}
        <section className="py-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1">
            Capital Allocation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Purchases → routes to Wallet with Purchases filter */}
            <Link
              to="/wallet?filter=Purchases"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShoppingCart size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Purchases
                </p>
              </div>
              <p className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(buckets.purchases)}
              </p>
            </Link>

            {/* Pledged */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pledged (Lien)
                </p>
              </div>
              <p className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(buckets.lien)}
              </p>
            </div>

            {/* Sales → routes to Wallet with Sales filter */}
            <Link
              to="/wallet?filter=Sales"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Landmark size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sales Revenue
                </p>
              </div>
              <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatCurrency(buckets.sales)}
              </p>
            </Link>

            {/* Avg Profit Margin */}
            <Link
              to="/analytics"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-[#064a98]/20 dark:hover:border-blue-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Profit %
                </p>
              </div>
              <p
                className={clsx(
                  "font-bold text-xl tracking-tight",
                  metrics.avgMargin >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {metrics.avgMargin.toFixed(1)}%
              </p>
            </Link>
          </div>
        </section>

        {/* Inventory Pipeline */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
              Inventory Pipeline
            </h3>
            <Link
              to="/inventory"
              className="text-[#064a98] dark:text-blue-400 text-xs font-bold flex items-center gap-0.5 hover:underline"
            >
              See All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link
              to="/inventory?tab=PENDING"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 border-b-[3px] border-b-amber-500 dark:border-b-amber-400 flex flex-col items-center justify-center hover:shadow-md transition-all"
            >
              <div className="size-8 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Smartphone size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {metrics.pendingCount}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Pending
              </span>
            </Link>
            <Link
              to="/inventory?tab=IN_STOCK"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 border-b-[3px] border-b-[#064a98] dark:border-b-blue-500 flex flex-col items-center justify-center hover:shadow-md transition-all"
            >
              <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400 flex items-center justify-center mb-2">
                <Package size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {metrics.inStockCount}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                In Stock
              </span>
            </Link>
            <Link
              to="/inventory?tab=SOLD"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 border-b-[3px] border-b-emerald-500 dark:border-b-emerald-400 flex flex-col items-center justify-center hover:shadow-md transition-all"
            >
              <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <History size={16} />
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.soldCount}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Sold
              </span>
            </Link>
          </div>
        </section>

        {/* Recent Activity */}
        {recentPhones.length > 0 && (
          <section className="py-2 pb-8">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 mb-3">
              Recent Devices
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
              {recentPhones.map((phone) => {
                const statusConfig = {
                  PENDING: {
                    color:
                      "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
                    label: "Pending",
                  },
                  IN_STOCK: {
                    color:
                      "bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400",
                    label: "In Stock",
                  },
                  SOLD: {
                    color:
                      "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
                    label: "Sold",
                  },
                };
                const config = statusConfig[phone.status];
                return (
                  <Link
                    key={phone.id}
                    to={`/inventory/${phone.id}`}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-4"
                  >
                    <div
                      className={clsx(
                        "size-10 rounded-full flex items-center justify-center shrink-0",
                        config.color,
                      )}
                    >
                      <Smartphone size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2 text-sm">
                          {phone.brand} {phone.model}
                        </h4>
                        <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap text-sm">
                          {formatCurrency(
                            phone.salePrice || phone.purchasePrice,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 truncate">
                          {phone.storage} • {phone.color}
                          {phone.imeis &&
                          phone.imeis.filter((i) => i.length >= 4).length > 0
                            ? ` • ${phone.imeis
                                .filter((i) => i.length >= 4)
                                .map((i) => i.slice(-4))
                                .join(" / ")}`
                            : ""}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 size-12 bg-[#064a98] dark:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 dark:hover:bg-blue-700 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-5"
        >
          <ArrowUp size={24} />
        </button>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="Notifications Coming Soon"
        description="We are integrating real-time streaming notifications to alert you of alerts and updates. Stay tuned!"
      />
    </div>
  );
}
