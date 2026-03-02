import React, { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import {
  selectLedgerEntries,
  selectWalletBuckets,
} from "../features/wallet/selectors";
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
  Package,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Calendar,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";

export default function Wallet() {
  const dispatch = useAppDispatch();
  const buckets = useAppSelector(selectWalletBuckets);
  const ledgerEntries = useAppSelector(selectLedgerEntries);
  const phones = useAppSelector((state) => state.inventory.phones);
  const [searchParams] = useSearchParams();
  const initialFilter =
    (searchParams.get("filter") as "All" | "Sales" | "Purchases") || "All";
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [actionType, setActionType] = useState<"ADD" | "WITHDRAW">("ADD");
  const [withdrawSource, setWithdrawSource] = useState<"WALLET" | "PROFITS">(
    "WALLET",
  );
  const [filter, setFilter] = useState<"All" | "Sales" | "Purchases">(
    ["All", "Sales", "Purchases"].includes(initialFilter)
      ? initialFilter
      : "All",
  );
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const sortedEntries = [...ledgerEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const runningBalances = useMemo(() => {
    // Sort oldest first to calculate running balance correctly
    const chronological = [...ledgerEntries].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let currentWallet = 0;
    const balances: Record<string, number> = {};
    chronological.forEach((entry) => {
      switch (entry.type) {
        case "MONEY_ADDED":
        case "WITHDRAWAL":
        case "PROFIT_WITHDRAWAL":
        case "FUNDS_RELEASED":
          currentWallet += entry.amount;
          break;
        case "FUNDS_PLEDGED":
          currentWallet -= entry.amount;
          break;
      }
      balances[entry.id] = currentWallet;
    });
    return balances;
  }, [ledgerEntries]);

  // Default to last 3 days when no explicit date filter
  const defaultCutoff = useMemo(() => startOfDay(subDays(new Date(), 2)), []); // 3 days: today, yesterday, day before

  const groupedEntries = useMemo(() => {
    const filtered = sortedEntries.filter((entry) => {
      if (filter === "Sales" && entry.type !== "PHONE_SALE") return false;
      if (filter === "Purchases" && entry.type !== "FUNDS_CONSUMED")
        return false;

      const entryDate = parseISO(entry.createdAt);

      if (hasDateFilter) {
        // Explicit date range
        if (dateFrom && isBefore(entryDate, startOfDay(new Date(dateFrom))))
          return false;
        if (dateTo && isAfter(entryDate, endOfDay(new Date(dateTo))))
          return false;
      } else {
        // Default: last 3 days only
        if (isBefore(entryDate, defaultCutoff)) return false;
      }

      return true;
    });

    // Group by date label
    const groups: Record<string, typeof ledgerEntries> = {};
    const groupOrder: string[] = [];

    filtered.forEach((entry) => {
      const date = parseISO(entry.createdAt);
      let dateKey = format(date, "MMM d");
      if (isToday(date)) dateKey = "Today";
      else if (isYesterday(date)) dateKey = "Yesterday";

      if (!groups[dateKey]) {
        groups[dateKey] = [];
        groupOrder.push(dateKey);
      }
      groups[dateKey].push(entry);
    });

    // Return as ordered array of [label, entries] to preserve chronological order
    // sortedEntries is already newest-first, so groupOrder is naturally Today → Yesterday → older
    const ordered: Record<string, typeof ledgerEntries> = {};
    groupOrder.forEach((key) => {
      ordered[key] = groups[key];
    });
    return ordered;
  }, [sortedEntries, filter, dateFrom, dateTo, hasDateFilter, defaultCutoff]);

  const rangeStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    ledgerEntries.forEach((entry) => {
      const d = parseISO(entry.createdAt);
      if (hasDateFilter) {
        if (dateFrom && isBefore(d, startOfDay(new Date(dateFrom)))) return;
        if (dateTo && isAfter(d, endOfDay(new Date(dateTo)))) return;
      } else {
        const now = new Date();
        if (
          d.getMonth() !== now.getMonth() ||
          d.getFullYear() !== now.getFullYear()
        )
          return;
      }
      if (["MONEY_ADDED", "PHONE_SALE"].includes(entry.type))
        income += entry.amount;
      else if (["FUNDS_CONSUMED", "WITHDRAWAL"].includes(entry.type))
        expense += Math.abs(entry.amount);
    });
    return { income, expense };
  }, [ledgerEntries, dateFrom, dateTo, hasDateFilter]);

  const handleManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) return;
    dispatch(
      addEntry({
        id: crypto.randomUUID(),
        type:
          actionType === "ADD"
            ? "MONEY_ADDED"
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
  };

  const getTransactionDetails = (entry: (typeof ledgerEntries)[0]) => {
    switch (entry.type) {
      case "MONEY_ADDED":
        return {
          label: "Bank Transfer Deposit",
          icon: <Landmark size={20} />,
          color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
          note: "Top Up",
        };
      case "WITHDRAWAL":
        return {
          label: "Owner Withdrawal",
          icon: <Banknote size={20} />,
          color:
            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
          note: "Transfer to Personal",
        };
      case "PROFIT_WITHDRAWAL":
        return {
          label: "Profit Withdrawal",
          icon: <Banknote size={20} />,
          color:
            "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
          note: "Taking Profits",
        };
      case "FUNDS_PLEDGED": {
        const p = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: p ? `Pending: ${p.brand} ${p.model}` : "Capital Pledged",
          icon: <ArrowRightLeft size={20} />,
          color:
            "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
          note: "Escrow Locked",
        };
      }
      case "FUNDS_RELEASED": {
        const r = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: r ? `Refund: ${r.brand} ${r.model}` : "Pledge Released",
          icon: <ArrowRightLeft size={20} />,
          color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
          note: "Escrow Refunded",
        };
      }
      case "FUNDS_CONSUMED": {
        const c = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: c ? `${c.brand} ${c.model} Purchase` : "Inventory Acquisition",
          icon: <Package size={20} />,
          color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
          note: "Acquisition",
        };
      }
      case "PHONE_SALE": {
        const s = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: s ? `${s.brand} ${s.model}` : "Phone Sale",
          icon: <ShoppingBag size={20} />,
          color:
            "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
          note: s ? `Sale ID: #${s.id.slice(0, 4)}` : "Sale",
        };
      }
      default:
        return {
          label: "Unknown",
          icon: <ArrowRightLeft size={20} />,
          color:
            "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
          note: "",
        };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header with calendar icon dropdown */}
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Wallet Ledger
          </h1>
          {dateRangeLabel && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-[#064a98] dark:text-blue-400 uppercase tracking-wider">
                {dateRangeLabel}
              </span>
              <button
                onClick={clearDateRange}
                className="text-slate-400 dark:text-slate-500 hover:text-rose-500"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowDateMenu(!showDateMenu);
              if (showDateMenu) setShowCustomDates(false);
            }}
            className={clsx(
              "size-10 rounded-full flex items-center justify-center transition-colors relative",
              hasDateFilter
                ? "bg-[#064a98] text-white"
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
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#064a98] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
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
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#064a98] dark:focus:border-blue-500"
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
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#064a98] dark:focus:border-blue-500"
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
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-12">
        {/* Hero Card */}
        <section className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4">
          <div className="bg-[#064a98] dark:bg-[#0a3a7a] rounded-xl p-5 shadow-lg shadow-blue-900/20 dark:shadow-blue-950/40 text-white relative flex flex-col justify-between h-32 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10 w-full">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1 uppercase tracking-wide">
                  Available Balance
                </p>
                <h2 className="text-3xl font-bold tracking-tight">
                  {formatCurrency(buckets.wallet)}
                </h2>
              </div>
              <div
                className="bg-white/20 dark:bg-white/10 rounded-full p-2 backdrop-blur-sm cursor-pointer shadow-sm hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                onClick={() => {
                  setActionType("ADD");
                  setShowAddModal(true);
                }}
              >
                <WalletIcon size={24} className="text-white" />
              </div>
            </div>

            <div className="flex gap-3 relative z-10 mt-auto w-full">
              <div
                onClick={() => {
                  setActionType("ADD");
                  setShowAddModal(true);
                }}
                className="cursor-pointer flex items-center gap-1 text-emerald-300 text-xs font-medium bg-black/20 px-2 py-1.5 rounded-lg backdrop-blur-sm hover:bg-black/30 transition-colors"
              >
                <ArrowUp size={14} /> {formatCurrency(rangeStats.income)}{" "}
                {hasDateFilter ? "(Range)" : "(Mo)"}
              </div>
              <div
                onClick={() => {
                  setActionType("WITHDRAW");
                  setShowAddModal(true);
                }}
                className="cursor-pointer flex items-center gap-1 text-rose-300 text-xs font-medium bg-black/20 px-2 py-1.5 rounded-lg backdrop-blur-sm hover:bg-black/30 transition-colors"
              >
                <ArrowDown size={14} /> {formatCurrency(rangeStats.expense)}{" "}
                {hasDateFilter ? "(Range)" : "(Mo)"}
              </div>
            </div>
          </div>
        </section>

        {/* Filter chips — type only */}
        <section className="py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {["All", "Sales", "Purchases"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              {f}
            </button>
          ))}
        </section>

        {/* Transaction List */}
        <section className="space-y-6 pt-2 pb-10">
          {Object.entries(groupedEntries).length === 0 ? (
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
            Object.entries(groupedEntries).map(([dateLabel, entries]) => (
              <div key={dateLabel}>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1">
                  {dateLabel}
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                  {entries.map((entry, index) => {
                    const details = getTransactionDetails(entry);
                    const isPositive = [
                      "MONEY_ADDED",
                      "PHONE_SALE",
                      "FUNDS_RELEASED",
                    ].includes(entry.type);

                    // Specific logic for running totals on this specific day (calculated by iterating backwards)
                    let dailyAccumulatedExpense = 0;
                    let dailyAccumulatedProfit = 0;
                    if (entry.type === "FUNDS_CONSUMED") {
                      for (let i = entries.length - 1; i >= index; i--) {
                        if (entries[i].type === "FUNDS_CONSUMED") {
                          dailyAccumulatedExpense += Math.abs(
                            entries[i].amount,
                          );
                        }
                      }
                    } else if (entry.type === "PHONE_SALE") {
                      // Note: Assuming amount is pure revenue, or we estimate profit. Without cost basis attached to the entry, we define "profit" as the full sale amount here as requested by context.
                      for (let i = entries.length - 1; i >= index; i--) {
                        if (entries[i].type === "PHONE_SALE") {
                          dailyAccumulatedProfit += entries[i].amount;
                        }
                      }
                    }

                    return (
                      <div
                        key={entry.id}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                                {details.label}
                              </h4>
                              <span
                                className={clsx(
                                  "font-bold whitespace-nowrap text-sm",
                                  isPositive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400",
                                )}
                              >
                                {isPositive ? "+" : "-"}
                                {formatCurrency(Math.abs(entry.amount))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 dark:text-slate-400 truncate">
                                {details.note} •{" "}
                                {format(parseISO(entry.createdAt), "h:mm a")}
                              </span>
                              {[
                                "MONEY_ADDED",
                                "WITHDRAWAL",
                                "PROFIT_WITHDRAWAL",
                                "FUNDS_PLEDGED",
                                "FUNDS_RELEASED",
                              ].includes(entry.type) ? (
                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                  Balance:{" "}
                                  {formatCurrency(runningBalances[entry.id])}
                                </span>
                              ) : entry.type === "FUNDS_CONSUMED" ? (
                                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                                  Expense:{" "}
                                  {formatCurrency(dailyAccumulatedExpense)}
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                                  Revenue:{" "}
                                  {formatCurrency(dailyAccumulatedProfit)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Daily Summary Footers */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 text-xs flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-medium">
                      Opening Bal:{" "}
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(
                          runningBalances[entries[entries.length - 1].id] -
                            ([
                              "MONEY_ADDED",
                              "WITHDRAWAL",
                              "PROFIT_WITHDRAWAL",
                              "FUNDS_RELEASED",
                            ].includes(entries[entries.length - 1].type)
                              ? entries[entries.length - 1].amount
                              : entries[entries.length - 1].type ===
                                  "FUNDS_PLEDGED"
                                ? -entries[entries.length - 1].amount
                                : 0),
                        )}
                      </span>
                    </div>
                    <div className="font-medium">
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
        </section>
      </main>

      {/* Manual Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
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
                      ? "bg-slate-50 dark:bg-slate-800 border-[#064a98] dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  <input
                    type="radio"
                    name="withdrawSource"
                    className="w-4 h-4 text-[#064a98] focus:ring-[#064a98]"
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
                      ? "bg-slate-50 dark:bg-slate-800 border-[#064a98] dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  <input
                    type="radio"
                    name="withdrawSource"
                    className="w-4 h-4 text-[#064a98] focus:ring-[#064a98]"
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

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xl">
                ₹
              </span>
              <input
                type="number"
                autoFocus
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 pl-10 outline-none focus:border-[#064a98] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-2xl font-bold text-slate-900 dark:text-slate-100"
                placeholder="0"
                min="0"
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
                className={clsx(
                  "flex-1 py-3.5 font-semibold text-white rounded-xl shadow-lg transition-all active:scale-[0.98]",
                  actionType === "ADD"
                    ? "bg-[#064a98] hover:bg-blue-800 shadow-blue-600/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
                )}
              >
                {actionType === "ADD" ? "Confirm Deposit" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
