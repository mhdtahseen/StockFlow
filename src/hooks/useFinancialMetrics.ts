import { useMemo } from "react";
import { useAppSelector } from "../app/hooks";
import { selectLedgerEntries, selectWalletBuckets } from "../features/wallet/selectors";
import { 
  parseISO, 
  isToday, 
  startOfDay, 
  subDays, 
  isBefore, 
  isAfter, 
  endOfDay,
  format,
  isYesterday,
} from "date-fns";

export type FinancialHistoryFilter = "All" | "Sales" | "Purchases" | "Repairs";

export interface DateRange {
  from: string;
  to: string;
}

export function useFinancialData(dateRange?: DateRange) {
  const entries = useAppSelector(selectLedgerEntries);
  const buckets = useAppSelector(selectWalletBuckets);
  const billingOrders = useAppSelector((state) => state.billing.orders);
  const purchasingOrders = useAppSelector((state) => state.purchasing.orders);

  // AR Calculation (Accrual)
  const arMetrics = useMemo(() => {
    const invoiced = billingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const outstanding = billingOrders
      .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
      .reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);
    return { invoiced, outstanding, collected: invoiced - outstanding };
  }, [billingOrders]);

  // AP Calculation (Accrual)
  const apMetrics = useMemo(() => {
    const owed = purchasingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const outstanding = purchasingOrders
      .filter((o) => o.status !== "SETTLED" && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + Math.max(0, o.totalAmount - o.amountPaid), 0);
    return { owed, outstanding, paid: owed - outstanding };
  }, [purchasingOrders]);

  // EOD / Daily Velocity
  const dailyVelocity = useMemo(() => {
    const todayEntries = entries.filter((e) => isToday(parseISO(e.createdAt)));
    const moneyIn = todayEntries
      .filter((e) => e.type === "PHONE_SALE" || e.type === "MONEY_ADDED" || e.type === "FUNDS_RELEASED")
      .reduce((s, e) => s + Math.max(0, e.amount), 0);
    const moneyOut = todayEntries
      .filter((e) => ["FUNDS_PLEDGED", "WITHDRAWAL", "PROFIT_WITHDRAWAL", "REPAIR_COST"].includes(e.type))
      .reduce((s, e) => s + Math.abs(Math.min(0, e.amount)), 0);
    
    // Reverse calculation for opening balance
    const openingBalance = buckets.wallet - moneyIn + moneyOut;
    return { moneyIn, moneyOut, openingBalance, closingBalance: buckets.wallet };
  }, [entries, buckets.wallet]);

  // Range Stats (Month-to-date or Custom Range)
  const rangeStats = useMemo(() => {
    const from = dateRange?.from ? startOfDay(new Date(dateRange.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = dateRange?.to ? endOfDay(new Date(dateRange.to)) : endOfDay(new Date());

    const rangeEntries = entries.filter((e) => {
      const d = parseISO(e.createdAt);
      return (isAfter(d, from) || d.getTime() === from.getTime()) && 
             (isBefore(d, to) || d.getTime() === to.getTime());
    });

    const income = rangeEntries
      .filter((e) => e.type === "PHONE_SALE" || e.type === "MONEY_ADDED" || e.type === "FUNDS_RELEASED")
      .reduce((sum, e) => sum + Math.max(0, e.amount), 0);

    const expense = rangeEntries
      .filter((e) => e.type === "WITHDRAWAL" || e.type === "PROFIT_WITHDRAWAL" || e.type === "FUNDS_PLEDGED" || e.type === "REPAIR_COST")
      .reduce((sum, e) => sum + Math.abs(Math.min(0, e.amount)), 0);

    // ── Running Balance Logic ───────────────────────────────────────────────
    // Essential for 'Daily Balance' view in Ledger.
    const runningBalances: Record<string, number> = {};
    let currentWallet = 0;

    // Calculate historical balance by replaying ALL entries in order
    [...entries]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((entry) => {
        // Use the same sign-aware logic as our global wallet selector
        // Most entries directly affect the wallet balance.
        switch (entry.type) {
          case "MONEY_ADDED":
          case "PHONE_SALE":
          case "FUNDS_RELEASED":
          case "WITHDRAWAL":
          case "PROFIT_WITHDRAWAL":
          case "REPAIR_COST":
          case "FUNDS_PLEDGED":
            currentWallet += entry.amount;
            break;
          case "FUNDS_CONSUMED":
            // FUNDS_CONSUMED moves money from Lien to Purchase (already left wallet when pledged)
            // So it doesn't affect the wallet/cash balance again.
            break;
        }
        
        const dateKey = entry.createdAt.split("T")[0];
        runningBalances[dateKey] = currentWallet;
      });

    return {
      income,
      expense,
      runningBalances,
    };
  }, [entries, dateRange]);

  return {
    arMetrics,
    apMetrics,
    dailyVelocity,
    rangeStats,
    buckets,
    allEntries: entries
  };
}

export function useGroupedTransactions(filter: FinancialHistoryFilter, dateRange: DateRange) {
  const entries = useAppSelector(selectLedgerEntries);
  const hasDateFilter = dateRange.from || dateRange.to;
  const defaultCutoff = useMemo(() => startOfDay(subDays(new Date(), 2)), []);

  return useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filtered = sorted.filter((entry) => {
      if (filter === "Sales" && entry.type !== "PHONE_SALE") return false;
      if (filter === "Purchases" && entry.type !== "FUNDS_CONSUMED") return false;
      if (filter === "Repairs" && entry.type !== "REPAIR_COST") return false;

      const entryDate = parseISO(entry.createdAt);
      if (hasDateFilter) {
        if (dateRange.from && isBefore(entryDate, startOfDay(new Date(dateRange.from)))) return false;
        if (dateRange.to && isAfter(entryDate, endOfDay(new Date(dateRange.to)))) return false;
      } else {
        if (isBefore(entryDate, defaultCutoff)) return false;
      }
      return true;
    });

    const groups: Map<string, typeof entries> = new Map();
    filtered.forEach((entry) => {
      const date = parseISO(entry.createdAt);
      let dateKey = format(date, "MMM d");
      if (isToday(date)) dateKey = "Today";
      else if (isYesterday(date)) dateKey = "Yesterday";

      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(entry);
    });

    return Array.from(groups.entries());
  }, [entries, filter, dateRange, hasDateFilter, defaultCutoff]);
}
