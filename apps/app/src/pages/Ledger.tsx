import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import {
  selectLedgerEntries,
  selectWalletBuckets,
} from "../features/wallet/selectors";
import {
  useFinancialData,
  useGroupedTransactions,
} from "../hooks/useFinancialMetrics";
import { addEntry } from "../features/ledger/slice";
import { toast } from "sonner";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";
import {
  ArrowRightLeft,
  Banknote,
  Landmark,
  Wallet as WalletIcon,
  ShoppingBag,
  ArrowUp,
  ArrowUpRight,
  ArrowDown,
  ArrowDownLeft,
  Calendar,
  X,
  Wrench,
  ChevronRight,
  ChevronDown,
  Check,
  User,
  Building2,
  Clock,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useSearchParams, useNavigate } from "react-router-dom";
import CurrencyInput from "../components/ui/CurrencyInput";
import HeaderActions from "@/components/layout/HeaderActions";
import { supabase } from "../lib/supabase";
import { parseStructuredNote } from "@/utils/financeUtils";
import { FeatureGate } from "@/components/shared/FeatureGate";

export default function Ledger() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const buckets = useAppSelector(selectWalletBuckets);
  const ledgerEntries = useAppSelector(selectLedgerEntries);
  const phones = useAppSelector((state) => state.inventory.phones);
  const [searchParams] = useSearchParams();
  const initialFilter =
    (searchParams.get("filter") as "All" | "Sales" | "Purchases") || "All";
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [actionType, setActionType] = useState<"ADD" | "WITHDRAW">("ADD");
  const [isEodExpanded, setIsEodExpanded] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<"WALLET" | "PROFITS">(
    "WALLET",
  );
  const [filter, setFilter] = useState<
    "All" | "Sales" | "Purchases" | "Repairs"
  >(
    ["All", "Sales", "Purchases", "Repairs"].includes(initialFilter)
      ? (initialFilter as any)
      : "All",
  );
  const [dashboardCardIndex, setDashboardCardIndex] = useState(0);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // FIFO Settlement Expansion State
  const [expandedSettlementId, setExpandedSettlementId] = useState<
    string | null
  >(null);
  const [allocations, setAllocations] = useState<Record<string, any[]>>({});
  const [loadingAllocations, setLoadingAllocations] = useState<string | null>(
    null,
  );

  const fetchAllocations = async (
    entryId: string,
    paymentId: string,
    isCustomer: boolean,
  ) => {
    if (allocations[entryId]) return;
    setLoadingAllocations(entryId);

    try {
      const table = isCustomer ? "payment_allocations" : "supplier_allocations";
      const idField = isCustomer
        ? "customer_payment_id"
        : "supplier_payment_id";
      const orderField = isCustomer ? "sale_order_id" : "purchase_order_id";

      const { data, error } = await supabase
        .from(table)
        .select(`amount_allocated, ${orderField}`)
        .eq(idField, paymentId);

      if (error) throw error;
      setAllocations((prev) => ({ ...prev, [entryId]: data || [] }));
    } catch (err) {
      console.error("Failed to fetch allocations:", err);
    } finally {
      setLoadingAllocations(null);
    }
  };

  const hasDateFilter = dateFrom || dateTo;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const dateRangeLabel = useMemo(() => {
    if (!hasDateFilter) return null;
    const from = dateFrom ? format(new Date(dateFrom), "MMM d") : "";
    const to = dateTo ? format(new Date(dateTo), "MMM d") : "";
    if (from && to && from === to) return from;
    if (from && to) return `${from} – ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return null;
  }, [dateFrom, dateTo, hasDateFilter]);

  const applyPreset = (preset: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    switch (preset) {
      case "today":
        setDateFrom(today);
        setDateTo(today);
        break;
      case "7d":
        setDateFrom(format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd"));
        setDateTo(today);
        break;
      case "30d":
        setDateFrom(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
        setDateTo(today);
        break;
      case "month": {
        const now = new Date();
        setDateFrom(
          format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"),
        );
        setDateTo(today);
        break;
      }
    }
    setShowCustomDates(false);
    setShowDateMenu(false);
  };

  const clearDateRange = () => {
    setDateFrom("");
    setDateTo("");
    setShowDateMenu(false);
    setShowCustomDates(false);
  };

  const {
    arMetrics,
    apMetrics,
    dailyVelocity,
    performance,
    liquidity,
    runningBalances,
    buckets: financialBuckets,
  } = useFinancialData({
    from: dateFrom,
    to: dateTo,
  });

  const groupedTransactions = useGroupedTransactions(filter, {
    from: dateFrom,
    to: dateTo,
  });

  const handleManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) return;
    setIsSubmittingEntry(true);
    dispatch(
      addEntry({
        id: crypto.randomUUID(),
        type:
          actionType === "ADD"
            ? "CAPITAL_INJECTION"
            : withdrawSource === "PROFITS"
              ? "PROFIT_WITHDRAWAL"
              : "WITHDRAWAL",
        amount: actionType === "ADD" ? Number(addAmount) : -Number(addAmount),
        createdAt: new Date().toISOString(),
      }),
    );

    if (actionType === "ADD") {
      toast.success("Funds Added", {
        description: `₹${Number(addAmount)} added to your Available Cash.`,
      });
    } else {
      toast.success("Funds Withdrawn", {
        description: `₹${Number(addAmount)} removed from your ${withdrawSource === "PROFITS" ? "Profit Bucket" : "Available Cash"}.`,
      });
    }

    setAddAmount("");
    setShowAddModal(false);
    setIsSubmittingEntry(false);
  };

  const getTransactionDetails = (entry: (typeof ledgerEntries)[0]) => {
    const isCustomer = !!entry.customerPaymentId;
    const isSupplier = !!entry.supplierPaymentId;
    const orderId = entry.saleOrderId || entry.purchaseOrderId || entry.referenceId;
    const paymentId = entry.customerPaymentId || entry.supplierPaymentId;
    
    // Type Mapping (Generalised)
    const getType = () => {
      switch (entry.type) {
        case "CAPITAL_INJECTION": return "CAPITAL_TOPUP";
        case "CUSTOMER_PAYMENT": return "SETTLEMENT";
        case "SUPPLIER_PAYMENT": return "PAYOUT";
        case "WITHDRAWAL": return "WITHDRAWAL";
        case "PROFIT_WITHDRAWAL": return "PROFIT_TAKE";
        case "REPAIR_COST": return "REPAIR";
        case "PHONE_SALE": return "SALE";
        default: return entry.type;
      }
    };

    const type = getType();
    const ref = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : paymentId ? `PAY#${paymentId.slice(0, 6).toUpperCase()}` : "GENERAL";
    const mode = entry.paymentMode || "CASH";
    const timestamp = format(parseISO(entry.createdAt), "h:mm a");

    // UI Configuration
    const config = ({
      CAPITAL_TOPUP: { label: "Owner Injection", icon: <Landmark size={20} />, color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400" },
      SETTLEMENT: { label: "Bill Receipt", icon: <User size={20} />, color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" },
      PAYOUT: { label: "Bill Payout", icon: <Building2 size={20} />, color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400" },
      WITHDRAWAL: { label: "Owner Takeout", icon: <Banknote size={20} />, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
      PROFIT_TAKE: { label: "Profit Takeout", icon: <Banknote size={20} />, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400" },
      REPAIR: { label: "Repair Payout", icon: <Wrench size={20} />, color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400" },
      SALE: { label: "Stock Sale", icon: <ShoppingBag size={20} />, color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" },
    } as Record<string, { label: string; icon: React.ReactElement; color: string }>)[type] || { label: type, icon: <ArrowRightLeft size={20} />, color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };

    const parsedNote = parseStructuredNote(entry.note ?? "");

    return {
      ...config,
      type,
      ref,
      mode,
      timestamp,
      note: parsedNote ? `${parsedNote.type} • ${parsedNote.ref} • ${parsedNote.mode}` : (entry.note || `${ref} • ${mode} • ${timestamp}`),
      parsedNote,
      isSettlement: !!paymentId,
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <HeaderActions>
        <div className="relative">
          <button
            onClick={() => {
              setShowDateMenu(!showDateMenu);
              if (showDateMenu) setShowCustomDates(false);
            }}
            className={clsx(
              "size-10 rounded-full flex items-center justify-center transition-colors relative",
              hasDateFilter
                ? "bg-primary-500 text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
            )}
          >
            <Calendar size={20} />
            {hasDateFilter && (
              <span className="absolute -top-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          {showDateMenu && (
            <>
              <div
                className="fixed inset-0 z-[29]"
                onClick={() => {
                  setShowDateMenu(false);
                  setShowCustomDates(false);
                }}
              />
              <div className="absolute top-12 right-0 z-[35] bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[200px]">
                {[
                  { key: "today", label: "Today" },
                  { key: "7d", label: "Last 7 Days" },
                  { key: "30d", label: "Last 30 Days" },
                  { key: "month", label: "This Month" },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset.key)}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Calendar
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    {preset.label}
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowCustomDates(!showCustomDates)}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-primary-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                  >
                    Custom Range...
                  </button>

                  {showCustomDates && (
                    <div className="px-4 pb-3 space-y-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          max={dateTo || undefined}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#064a98] dark:focus:border-blue-500 uppercase [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          min={dateFrom || undefined}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#064a98] dark:focus:border-blue-500 uppercase [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowDateMenu(false);
                          setShowCustomDates(false);
                        }}
                        disabled={!dateFrom && !dateTo}
                        className="w-full py-2 text-xs font-bold text-white bg-[#064a98] rounded-lg disabled:opacity-40 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {hasDateFilter && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={clearDateRange}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      Clear Range
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </HeaderActions>

      <main className="flex-1 overflow-y-auto px-4 pb-12">
        {dateRangeLabel && (
          <div className="flex items-center justify-between pt-4 -mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/30">
              <span className="text-[10px] font-black text-primary-500 dark:text-blue-400 uppercase tracking-widest">
                {dateRangeLabel}
              </span>
              <button
                onClick={clearDateRange}
                className="text-blue-400 hover:text-rose-500 transition-colors"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* High-Momentum Carousel Slider Section (iOS Paging Style) */}
        <section className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-4 pb-3 -mx-4 px-4 overflow-hidden border-b border-slate-100 dark:border-slate-800/50 shadow-sm">
          <div className="relative h-[140px] w-full overflow-hidden rounded-xl">
            <motion.div
              drag="x"
              dragConstraints={{ left: -340, right: 0 }}
              dragElastic={0.05}
              animate={{ x: dashboardCardIndex === 0 ? "0%" : "-100%" }}
              onDragEnd={(_, info) => {
                const swipeThreshold = 40;
                if (info.offset.x < -swipeThreshold) setDashboardCardIndex(1);
                else if (info.offset.x > swipeThreshold)
                  setDashboardCardIndex(0);
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 35,
                mass: 0.8,
              }}
              className="flex w-full h-[140px] cursor-grab active:cursor-grabbing"
            >
              {/* Card 1 Wrapper */}
              <div className="w-full shrink-0">
                <div className="w-full h-full bg-primary-500 dark:bg-primary-600 rounded-xl p-5 shadow-lg shadow-blue-900/20 dark:shadow-blue-950/40 text-white relative flex flex-col justify-between overflow-hidden select-none">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-xl pointer-events-none"></div>

                  <div className="flex justify-between items-start relative z-10 w-full">
                    <div>
                      <p className="text-white/80 text-[10px] font-bold mb-0.5 uppercase tracking-widest">
                        Available Balance
                      </p>
                      <h2 className="text-3xl font-black tracking-tighter leading-none">
                        {formatCurrency(buckets.wallet)}
                      </h2>
                    </div>
                    <div
                      className="bg-white/20 dark:bg-white/10 rounded-full p-2 backdrop-blur-sm cursor-pointer shadow-sm hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionType("ADD");
                        setShowAddModal(true);
                      }}
                    >
                      <WalletIcon size={22} className="text-white" />
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10 mt-auto w-full">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionType("ADD");
                        setShowAddModal(true);
                      }}
                      className="cursor-pointer flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm hover:bg-black/30 transition-colors"
                    >
                      <ArrowUp size={14} /> {formatCurrency(performance.inflow)}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionType("WITHDRAW");
                        setShowAddModal(true);
                      }}
                      className="cursor-pointer flex items-center gap-1.5 text-rose-300 text-[10px] font-bold bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm hover:bg-black/30 transition-colors"
                    >
                      <ArrowDown size={14} />{" "}
                      {formatCurrency(performance.outflow)}
                    </div>
                  </div>

                  {/* Swipe Indicator */}
                  {dashboardCardIndex === 0 && (
                    <motion.div
                      animate={{ x: [0, 2, 0], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
                    >
                      <ChevronRight size={16} />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Card 2 Wrapper */}
              <div className="w-full shrink-0 px-0.5">
                <div className="w-full h-full bg-slate-900 dark:bg-slate-800 rounded-xl pt-7 pb-3 px-5 shadow-xl shadow-slate-900/10 text-white relative flex flex-col justify-between overflow-hidden border border-white/5 select-none">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-2 absolute top-4 left-5 right-5">
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-none">
                      BUSINESS HEALTH
                    </p>
                    <div className="bg-primary-500/10 text-primary-400 text-[8px] font-black px-1.5 py-0.5 rounded">
                      A+C+B HYBRID
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-0 mt-1 flex-1 items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                        Profit
                      </span>
                      <span
                        className={clsx(
                          "text-sm font-bold tracking-tight",
                          performance.netProfit >= 0
                            ? "text-emerald-400"
                            : "text-rose-400",
                        )}
                      >
                        {formatCurrency(performance.netProfit)}
                      </span>
                    </div>
                    <div className="flex flex-col border-x border-white/5 px-3">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                        Stock
                      </span>
                      <span className="text-sm font-bold tracking-tight text-white">
                        {formatCurrency(liquidity.stockValue)}
                      </span>
                    </div>
                    <div className="flex flex-col pl-3">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                        Burn
                      </span>
                      <span className="text-sm font-bold tracking-tight text-rose-400">
                        {formatCurrency(performance.operationalCosts)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-1 pt-1.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>{" "}
                        Liquid
                      </span>
                      <span className="text-white text-xs">
                        {formatCurrency(liquidity.availableToSpend)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* iOS System Pagination Indicators */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 pb-1 pointer-events-none z-30">
              <motion.div
                animate={{
                  opacity: dashboardCardIndex === 0 ? 1 : 0.3,
                  scale: dashboardCardIndex === 0 ? 1.1 : 1,
                }}
                className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"
              />
              <motion.div
                animate={{
                  opacity: dashboardCardIndex === 1 ? 1 : 0.3,
                  scale: dashboardCardIndex === 1 ? 1.1 : 1,
                }}
                className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Financial Metrics Cards */}
        <section className="pt-2 pb-4 space-y-3">
          <FeatureGate feature="receivables" badge>
          <div className="grid grid-cols-2 gap-3">
            {/* AR Card */}
            <div
              onClick={() => navigate("/orders")}
              className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            >
              <h3 className="text-[10px] font-black text-amber-800 dark:text-amber-500 mb-1 uppercase tracking-widest">
                Receivables (AR)
              </h3>
              <p className="text-xl font-black text-amber-700 dark:text-amber-400 leading-none">
                {formatCurrency(arMetrics.outstanding)}
              </p>
              <p className="text-[9px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-500 mt-1.5 mb-3">
                Uncollected
              </p>
              <div className="flex justify-between text-[10px] font-bold text-amber-700/60 dark:text-amber-500/60">
                <span>Invoiced: {formatCurrency(arMetrics.invoiced)}</span>
                <span>Paid: {formatCurrency(arMetrics.collected)}</span>
              </div>
            </div>

            {/* AP Card */}
            <div
              onClick={() => navigate("/purchase-orders")}
              className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/30 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            >
              <h3 className="text-[10px] font-black text-rose-800 dark:text-rose-500 mb-1 uppercase tracking-widest">
                Payables (AP)
              </h3>
              <p className="text-xl font-black text-rose-700 dark:text-rose-400 leading-none">
                {formatCurrency(apMetrics.outstanding)}
              </p>
              <p className="text-[9px] uppercase font-bold tracking-widest text-rose-600 dark:text-rose-500 mt-1.5 mb-3">
                Owed
              </p>
              <div className="flex justify-between text-[10px] font-bold text-rose-700/60 dark:text-rose-500/60">
                <span>Commits: {formatCurrency(apMetrics.owed)}</span>
                <span>Paid: {formatCurrency(apMetrics.paid)}</span>
              </div>
            </div>
          </div>
          </FeatureGate>

          {/* EOD Summary - Collapsible */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 dark:bg-slate-100" />

            <button
              onClick={() => setIsEodExpanded(!isEodExpanded)}
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <div className="flex items-center gap-2">
                {isEodExpanded ? (
                  <ChevronDown size={14} className="text-slate-400" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400" />
                )}
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Today's End of Day
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase px-2 py-0.5 rounded tracking-wider">
                  Net:{" "}
                  {formatCurrency(
                    dailyVelocity.moneyIn - dailyVelocity.moneyOut,
                  )}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isEodExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-50 dark:border-slate-800/50"
                >
                  <div className="px-4 pb-4 pt-4">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 capitalize mb-1 text-[10px] tracking-tight">
                          Opening
                        </p>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(dailyVelocity.openingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-500 capitalize mb-1 text-[10px] tracking-tight">
                          Cash In
                        </p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(dailyVelocity.moneyIn)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-rose-500 capitalize mb-1 text-[10px] tracking-tight">
                          Outflow
                        </p>
                        <p className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(dailyVelocity.moneyOut)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Filter chips — type only */}
        <section className="py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {["All", "Sales", "Purchases", "Repairs"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={clsx(
                "relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                filter === f
                  ? "text-white dark:text-slate-900"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              {filter === f && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-full shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{f}</span>
            </button>
          ))}
        </section>

        {/* Transaction List */}
        <AnimatePresence mode="wait">
          <motion.section
            key={filter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6 pt-2 pb-10"
          >
            {groupedTransactions.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
                <Calendar
                  size={32}
                  strokeWidth={1}
                  className="text-slate-300 dark:text-slate-600"
                />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  No transactions found
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {hasDateFilter
                    ? "Try adjusting your date range."
                    : "Start by adding funds to your wallet."}
                </p>
              </div>
            ) : (
              groupedTransactions.map(([dateLabel, entries]) => (
                <div key={dateLabel}>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1">
                    {dateLabel}
                  </h3>
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                    {entries.map((entry, index) => {
                      const details = getTransactionDetails(entry);
                      const isPositive = [
                        "CAPITAL_INJECTION",
                        "CUSTOMER_PAYMENT",
                        "MONEY_ADDED",
                        "PHONE_SALE",
                      ].includes(entry.type);

                      // Specific logic for running totals on this specific day (calculated by iterating backwards)
                      let dailyAccumulatedExpense = 0;
                      let dailyAccumulatedProfit = 0;
                      if (entry.type === "SUPPLIER_PAYMENT") {
                        for (let i = entries.length - 1; i >= index; i--) {
                          if (entries[i].type === "SUPPLIER_PAYMENT") {
                            dailyAccumulatedExpense += Math.abs(
                              entries[i].amount,
                            );
                          }
                        }
                      } else if (entry.type === "PHONE_SALE") {
                        for (let i = entries.length - 1; i >= index; i--) {
                          if (entries[i].type === "PHONE_SALE") {
                            dailyAccumulatedProfit += entries[i].amount;
                          }
                        }
                      }

                      const isSettlement = (details as any).isSettlement;
                      const entryAllocations = allocations[entry.id] || [];
                      const isExpanded = expandedSettlementId === entry.id;

                      return (
                        <div key={entry.id}>
                          <div
                            onClick={() => {
                              if (isSettlement) {
                                if (isExpanded) {
                                  setExpandedSettlementId(null);
                                } else {
                                  setExpandedSettlementId(entry.id);
                                  const paymentId =
                                    entry.customerPaymentId ||
                                    entry.supplierPaymentId;
                                  if (paymentId) {
                                    fetchAllocations(
                                      entry.id,
                                      paymentId,
                                      !!entry.customerPaymentId,
                                    );
                                  }
                                }
                              }
                            }}
                            className={clsx(
                              "p-4 transition-all duration-200",
                              isSettlement
                                ? "cursor-pointer active:scale-[0.99]"
                                : "",
                              isExpanded
                                ? "bg-slate-50 dark:bg-slate-800/50"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800",
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={clsx(
                                  "size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                  details.color,
                                )}
                              >
                                {details.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <h4 className={clsx(
                                      "font-bold text-slate-900 dark:text-slate-100 truncate",
                                      details.label.length > 30 ? "text-[11px]" : 
                                      details.label.length > 22 ? "text-[12px]" : 
                                      "text-sm"
                                    )}>
                                      {details.label}
                                    </h4>
                                    {isSettlement && (
                                      <ChevronDown
                                        size={14}
                                        className={clsx(
                                          "shrink-0 transition-transform duration-300 opacity-40",
                                          isExpanded &&
                                            "rotate-180 opacity-100",
                                        )}
                                      />
                                    )}
                                  </div>
                                  <span
                                    className={clsx(
                                      "font-bold whitespace-nowrap text-sm shrink-0 ml-3",
                                      isPositive
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400",
                                    )}
                                  >
                                    {isPositive ? "+" : "-"}
                                    {formatCurrency(Math.abs(entry.amount))}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  {(details as any).parsedNote ? (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                      <span className="text-slate-900 dark:text-slate-200 font-bold">{(details as any).parsedNote.type}</span>
                                      <span>•</span>
                                      <span>{(details as any).parsedNote.ref}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1"><Clock size={10} /> {(details as any).parsedNote.time}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 dark:text-slate-400 truncate font-medium">
                                      {details.note}
                                    </span>
                                  )}
                                  {[
                                    "CAPITAL_INJECTION",
                                    "CUSTOMER_PAYMENT",
                                    "SUPPLIER_PAYMENT",
                                    "WITHDRAWAL",
                                    "PROFIT_WITHDRAWAL",
                                  ].includes(entry.type) ? (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 ml-2">
                                      Balance:{" "}
                                      {formatCurrency(
                                        runningBalances[entry.id],
                                      )}
                                    </span>
                                  ) : entry.type === "SUPPLIER_PAYMENT" ? (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] shrink-0 ml-2">
                                      Expense:{" "}
                                      {formatCurrency(dailyAccumulatedExpense)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] shrink-0 ml-2">
                                      Revenue:{" "}
                                      {formatCurrency(dailyAccumulatedProfit)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Settlement Detail Accordion */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800"
                              >
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Allocation Trail
                                    </span>
                                    {loadingAllocations === entry.id && (
                                      <span className="text-[10px] text-primary-500 animate-pulse font-bold">
                                        Fetching...
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    {entryAllocations.map((alloc, idx) => {
                                      const orderId =
                                        alloc.sale_order_id ||
                                        alloc.purchase_order_id;
                                      return (
                                        <div
                                          key={idx}
                                          onClick={() =>
                                            navigate(
                                              alloc.sale_order_id
                                                ? `/orders?id=${orderId}`
                                                : `/purchase-orders?id=${orderId}`,
                                            )
                                          }
                                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-[0.98] transition-all"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="size-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                              {idx + 1}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                              <span className="uppercase">
                                                #{orderId?.slice(0, 6)}
                                              </span>
                                            </span>
                                          </div>
                                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(
                                              alloc.amount_allocated,
                                            )}
                                          </span>
                                        </div>
                                      );
                                    })}

                                    {!loadingAllocations &&
                                      entryAllocations.length === 0 && (
                                        <p className="text-[10px] text-slate-400 italic text-center py-2">
                                          No direct allocations found for this
                                          entry.
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* Daily Summary Footers */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 text-xs flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                      <div className="font-medium text-[10px]">
                        Opening Bal:{" "}
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(
                            runningBalances[entries[entries.length - 1].id] -
                              ([
                                "CAPITAL_INJECTION",
                                "CUSTOMER_PAYMENT",
                                "PHONE_SALE",
                              ].includes(entries[entries.length - 1].type)
                                ? entries[entries.length - 1].amount
                                : 0) +
                              ([
                                "WITHDRAWAL",
                                "SUPPLIER_PAYMENT",
                                "PROFIT_WITHDRAWAL",
                                "REPAIR_COST",
                              ].includes(entries[entries.length - 1].type)
                                ? Math.abs(entries[entries.length - 1].amount)
                                : 0),
                          )}
                        </span>
                      </div>
                      <div className="font-medium text-[10px]">
                        EOD Bal:{" "}
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(runningBalances[entries[0].id])}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Manual Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl dark:shadow-black/40 border border-transparent dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
              {actionType === "ADD" ? "Top Up Wallet" : "Withdraw Funds"}
            </h3>

            {actionType === "ADD" ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
                Available Cash:{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(buckets.wallet)}
                </span>
              </p>
            ) : (
              <div className="mb-6 mt-3 space-y-3">
                <label
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    withdrawSource === "WALLET"
                      ? "bg-slate-50 dark:bg-slate-800 border-primary-500 dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  <input
                    type="radio"
                    name="withdrawSource"
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    checked={withdrawSource === "WALLET"}
                    onChange={() => setWithdrawSource("WALLET")}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Cash at Hand
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Available: {formatCurrency(buckets.wallet)}
                    </p>
                  </div>
                </label>
                <label
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    withdrawSource === "PROFITS"
                      ? "bg-slate-50 dark:bg-slate-800 border-primary-500 dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  <input
                    type="radio"
                    name="withdrawSource"
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    checked={withdrawSource === "PROFITS"}
                    onChange={() => setWithdrawSource("PROFITS")}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Profit Bucket
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Available:{" "}
                      {formatCurrency(
                        buckets.sales -
                          buckets.purchases -
                          (buckets.profitWithdrawals || 0),
                      )}
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="mb-6">
              <CurrencyInput
                value={addAmount}
                onChange={setAddAmount}
                autoFocus
                className="rounded-2xl"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddAmount("");
                }}
                className="flex-[0.5] py-3.5 font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualTransaction}
                disabled={isSubmittingEntry}
                className={clsx(
                  "flex-1 py-3.5 font-semibold text-white rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70",
                  actionType === "ADD"
                    ? "bg-primary-500 hover:bg-blue-800 shadow-blue-600/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
                )}
              >
                {isSubmittingEntry ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : actionType === "ADD" ? "Confirm Deposit" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
