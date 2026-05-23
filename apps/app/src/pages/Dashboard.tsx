import React, { useState } from "react";
import { useAppSelector } from "../app/hooks";
import { useFreshFetch } from "../hooks/useFreshFetch";
import { selectWalletBuckets } from "../features/wallet/selectors";
import { selectInventoryMetrics } from "../features/analytics/selectors";
import { useAuth } from "../context/AuthContext";
import { usePlan } from "../hooks/usePlan";
import { useUpgradeGate } from "../context/UpgradeGateContext";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Wallet,
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
  Handshake, // Added Handshake icon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import clsx from "clsx";
import ExportModal from "../components/shared/ExportModal";
import ComingSoonModal from "../components/shared/ComingSoonModal";
import NotificationsPopover from "../components/shared/NotificationsPopover";
import { useSyncState } from "@/context/SyncContext";
import { DashboardSkeleton } from "@/components/shared/SkeletonScreens";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PtrIndicator } from "@/components/shared/PtrIndicator";
import {
  SiApple,
  SiSamsung,
  SiGoogle,
  SiXiaomi,
  SiMotorola,
  SiOppo,
  SiVivo,
  SiOneplus,
  SiHuawei,
  SiNokia,
  SiAsus,
  SiSony,
} from "react-icons/si";

const BrandIcon = ({ brand }: { brand: string }) => {
  const b = brand.toLowerCase().trim();

  // Square/Icon-dominant logos (Smaller size works)
  if (b.includes("apple") || b.includes("iphone")) return <SiApple size={18} />;
  if (b.includes("google") || b.includes("pixel"))
    return <SiGoogle size={18} />;
  if (b.includes("xiaomi") || b.includes("redmi") || b.includes("mi "))
    return <SiXiaomi size={20} />;
  if (b.includes("nothing")) return <Smartphone size={18} />;
  if (b.includes("oneplus")) return <SiOneplus size={18} />;
  if (b.includes("motorola") || b.includes("moto"))
    return <SiMotorola size={18} />;

  // Text-dominant/Wide logos (Needs larger size to be readable)
  if (b.includes("samsung")) return <SiSamsung size={26} />;
  if (b.includes("oppo")) return <SiOppo size={26} />;
  if (b.includes("vivo")) return <SiVivo size={26} />;
  if (b.includes("huawei")) return <SiHuawei size={24} />;
  if (b.includes("realme")) return <Smartphone size={18} />; // SiRealme missing
  if (b.includes("infinix")) return <Smartphone size={18} />; // SiInfinix missing
  if (b.includes("nokia")) return <SiNokia size={24} />;
  if (b.includes("asus")) return <SiAsus size={24} />;
  if (b.includes("sony")) return <SiSony size={24} />;

  return <Smartphone size={18} />;
};

export default function Dashboard() {
  useFreshFetch("inventory");

  const navigate = useNavigate();
  const buckets = useAppSelector(selectWalletBuckets);
  const metrics = useAppSelector(selectInventoryMetrics);
  const phones = useAppSelector((state) => state.inventory.phones);
  const { mode, setMode, resolved } = useTheme();
  const { session, isAdmin, tenant } = useAuth();
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();
  const { isSyncing, refetch } = useSyncState();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { containerRef: mainRef, pullDistance, isTriggered, threshold, ptrHandlers } =
    usePullToRefresh(refetch, isSyncing);

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


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recentPhones = [...phones]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  // Profile Completion logic
  const completionItems = [
    { label: "Business Name", value: !!tenant?.name || !!session?.user.user_metadata?.org_name },
    { label: "Business Address", value: !!tenant?.address },
    {
      label: "Phone Number",
      value: !!session?.user.user_metadata?.phone || !!tenant?.phone,
    },
    { label: "Full Name", value: !!session?.user.user_metadata?.full_name },
  ];

  const completedCount = completionItems.filter((item) => item.value).length;
  const completionPercentage = (completedCount / completionItems.length) * 100;
  const isProfileIncomplete = completionPercentage < 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <main
        ref={mainRef}
        onScroll={handleScroll}
        {...ptrHandlers}
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-12"
        style={{ overscrollBehaviorY: "contain" }}
      >
        <PtrIndicator pullDistance={pullDistance} isTriggered={isTriggered} threshold={threshold} isSyncing={isSyncing} />
        {isSyncing && phones.length === 0 ? (
          <DashboardSkeleton />
        ) : (
        <div className="md:max-w-5xl md:mx-auto">
        {isProfileIncomplete && (
          <div
            onClick={() => navigate("/profile")}
            className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 shadow-sm flex items-center justify-between cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  Profile Incomplete ({completionPercentage}%)
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Please complete your business & personal details to unlock all
                  features.
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-amber-400 group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        )}

        {/* Hero: Available Cash */}
        <section className="pt-4 pb-2">
          <div className="bg-primary-500 dark:bg-[#0a3a7a] rounded-xl p-5 shadow-lg shadow-blue-900/20 dark:shadow-blue-950/40 text-white relative overflow-hidden">
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
              <button
                type="button"
                onClick={() => canUse("full_ledger") ? navigate("/ledger") : showUpgrade("full_ledger")}
                className="bg-white/20 dark:bg-white/10 rounded-full p-2 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
              >
                <Wallet size={22} className="text-white" />
              </button>
            </div>

            <div className="relative z-10 flex gap-3 mt-5 border-t border-white/15 pt-4">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <TrendingUp size={14} />
                {formatCurrency(metrics.netProfit)} Profit
              </div>
              <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <Handshake size={14} />
                {metrics.avgCollectionPeriodDays.toFixed(1)}d Coll.
              </div>
            </div>
          </div>
        </section>

        {/* 4 Widgets: Purchases, Sales, Avg Profit */}
        <section className="py-4" data-tour="dashboard-metrics">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1">
            Capital Allocation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Purchases → routes to Ledger with Purchases filter */}
            <div
              onClick={() => canUse("full_ledger") ? navigate("/ledger?filter=Purchases") : showUpgrade("full_ledger")}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 transition-all group cursor-pointer"
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
            </div>

            {/* Sales → routes to Ledger with Sales filter */}
            <div
              onClick={() => canUse("full_ledger") ? navigate("/ledger?filter=Sales") : showUpgrade("full_ledger")}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group cursor-pointer"
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
            </div>

            {/* Avg Profit Margin */}
            <div
              onClick={() => canUse("analytics") ? navigate("/analytics") : showUpgrade("analytics")}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-primary-500/20 dark:hover:border-blue-500/30 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400 flex items-center justify-center shrink-0">
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
            </div>

            {/* Active Stock Value */}
            <div
              onClick={() => navigate("/inventory?tab=IN_STOCK")}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Package size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Stock Value
                </p>
              </div>
              <p className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(metrics.investment)}
              </p>
            </div>
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
              className="text-primary-500 dark:text-blue-400 text-xs font-bold flex items-center gap-0.5 hover:underline"
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
              <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400 flex items-center justify-center mb-2">
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
                      "bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400",
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
                      <BrandIcon brand={phone.brand} />
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
        </div>
        )}
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 size-12 bg-primary-500 dark:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 dark:hover:bg-blue-700 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-5"
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
