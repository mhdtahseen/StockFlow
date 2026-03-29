import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  isAfter,
  parseISO,
} from "date-fns";

export type TimePeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "halfYearly"
  | "annually";

const selectLedgerEntries = (state: RootState) => state.ledger.entries;
const selectInventoryPhones = (state: RootState) => state.inventory.phones;

const getStartDate = (period: TimePeriod, now = new Date()): Date => {
  switch (period) {
    case "daily":
      return subDays(now, 1);
    case "weekly":
      return subWeeks(now, 1);
    case "monthly":
      return subMonths(now, 1);
    case "quarterly":
      return subQuarters(now, 1);
    case "halfYearly":
      return subMonths(now, 6);
    case "annually":
      return subYears(now, 1);
  }
};

export const selectCashflowSummary = (period: TimePeriod) =>
  createSelector([selectLedgerEntries], (entries) => {
    const now = new Date();
    const startDate = getStartDate(period, now);

    let grossSales = 0;
    let collections = 0;
    let capitalInvested = 0; // Money actually consumed for assets
    let repairCosts = 0;
    let pledgedCapital = 0; // Money tied up currently
    let injections = 0;
    let supplierPayments = 0;
    let personalWithdrawals = 0;

    entries.forEach((entry) => {
      const entryDate = parseISO(entry.createdAt);
      if (isAfter(entryDate, startDate)) {
        if (entry.type === "PHONE_SALE" || entry.type === "CUSTOMER_PAYMENT") {
          grossSales += entry.amount;
        }
        if (entry.type === "CUSTOMER_PAYMENT") collections += entry.amount;
        if (entry.type === "FUNDS_CONSUMED") capitalInvested += Math.abs(entry.amount);
        if (entry.type === "REPAIR_COST") repairCosts += Math.abs(entry.amount);
        if (entry.type === "SUPPLIER_PAYMENT") supplierPayments += Math.abs(entry.amount);
        if (entry.type === "FUNDS_PLEDGED") pledgedCapital += Math.abs(entry.amount);
        if (entry.type === "FUNDS_RELEASED") pledgedCapital -= Math.abs(entry.amount);
        if (entry.type === "CAPITAL_INJECTION") injections += entry.amount;
        if (entry.type === "WITHDRAWAL") personalWithdrawals += Math.abs(entry.amount);
        if (entry.type === "PROFIT_WITHDRAWAL") personalWithdrawals += Math.abs(entry.amount);
      }
    });

    const netOperatingCashflow = grossSales - capitalInvested - repairCosts;

    return {
      grossSales,
      collections,
      capitalInvested,
      repairCosts,
      pledgedCapital,
      injections,
      supplierPayments,
      personalWithdrawals,
      netOperatingCashflow,
    };
  });

export const selectInventoryMetrics = createSelector(
  [
    selectInventoryPhones,
    selectLedgerEntries,
    (state: RootState) => state.billing?.orders ?? [],
  ],
  (phones, entries, billingOrders) => {
    const inStock = phones.filter((p) => p.status === "IN_STOCK");
    const pending = phones.filter((p) => p.status === "PENDING");
    const sold = phones.filter((p) => p.status === "SOLD");

    // Sum repair costs from ledger keyed by phone id
    const repairByPhone: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.type === "REPAIR_COST" && e.referenceId) {
        repairByPhone[e.referenceId] =
          (repairByPhone[e.referenceId] || 0) + e.amount;
      }
    });

    const investment = inStock.reduce(
      (acc, p) => acc + p.purchasePrice + (repairByPhone[p.id] || 0),
      0,
    );
    const totalSales = sold.reduce((acc, p) => acc + (p.salePrice || 0), 0);
    const costOfGoodsSold = sold.reduce(
      (acc, p) => acc + p.purchasePrice + (repairByPhone[p.id] || 0),
      0,
    );
    const netProfit = totalSales - costOfGoodsSold;

    let avgMargin = 0;
    if (costOfGoodsSold > 0) {
      avgMargin = (netProfit / costOfGoodsSold) * 100;
    }

    let avgTimeOnShelfDays = 0;
    if (sold.length > 0) {
      let totalDays = 0;
      let validPhones = 0;

      sold.forEach((phone) => {
        let soldAt: Date | null = null;
        if ((phone as any).saleOrderId) {
          const order = billingOrders.find(
            (o) => o.id === (phone as any).saleOrderId,
          );
          if (order) soldAt = new Date(order.createdAt);
        } else {
          const entry = entries.find(
            (e) => e.type === "PHONE_SALE" && e.referenceId === phone.id,
          );
          if (entry) soldAt = new Date(entry.createdAt);
        }
        if (soldAt) {
          const days = Math.max(0, (soldAt.getTime() - new Date(phone.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          totalDays += days;
          validPhones++;
        }
      });

      if (validPhones > 0) {
        avgTimeOnShelfDays = totalDays / validPhones;
      }
    }

    // NEW: Avg Collection Period
    let avgCollectionPeriodDays = 0;
    const settledOrders = billingOrders.filter((o) => o.status === "SETTLED");
    if (settledOrders.length > 0) {
      const totalDays = settledOrders.reduce((acc, o) => {
        const orderDate = new Date(o.createdAt);
        // Find the LATEST payment recorded for this order
        const lastPayment = entries.find(
          (e) => e.type === "PHONE_SALE" && e.referenceId?.includes(o.id),
        ); // This is a heuristic, real app uses customer.payments
        const settleDate = lastPayment ? new Date(lastPayment.createdAt) : orderDate;
        return acc + Math.max(0, (settleDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgCollectionPeriodDays = totalDays / settledOrders.length;
    }

    return {
      inStockCount: inStock.length,
      pendingCount: pending.length,
      soldCount: sold.length,
      investment,
      totalSales,
      netProfit,
      avgMargin,
      avgTimeOnShelfDays,
      avgCollectionPeriodDays,
    };
  },
);

export const selectPaymentDistribution = createSelector(
  [
    (state: RootState) => state.customers?.payments ?? [],
    (state: RootState) => state.purchasing?.payments ?? [],
  ],
  (customerPayments, supplierPayments) => {
    const dist: Record<string, number> = { CASH: 0, UPI: 0, BANK_TRANSFER: 0 };

    customerPayments.forEach((p) => {
      const mode = p.mode as string;
      if (dist[mode] !== undefined) dist[mode] += p.totalReceived;
    });

    supplierPayments.forEach((p) => {
      const mode = p.mode as string;
      if (dist[mode] !== undefined) dist[mode] += p.totalPaid;
    });

    const total = Object.values(dist).reduce((a, b) => a + b, 0);

    return Object.entries(dist).map(([mode, amount]) => ({
      mode,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }));
  },
);

export const selectCreditAging = createSelector(
  [
    (state: RootState) => state.billing?.orders ?? [],
    (state: RootState) => state.purchasing?.orders ?? [],
  ],
  (saleOrders, purchaseOrders) => {
    const now = new Date();
    const arBuckets = { current: 0, due: 0, overdue: 0 };
    const apBuckets = { current: 0, due: 0, overdue: 0 };

    saleOrders.forEach((o) => {
      const due = o.totalAmount - o.amountPaid;
      if (due <= 0) return;

      const days = Math.floor(
        (now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days < 7) arBuckets.current += due;
      else if (days < 15) arBuckets.due += due;
      else arBuckets.overdue += due;
    });

    purchaseOrders.forEach((o) => {
      const due = o.totalAmount - o.amountPaid;
      if (due <= 0) return;

      const days = Math.floor(
        (now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days < 7) apBuckets.current += due;
      else if (days < 15) apBuckets.due += due;
      else apBuckets.overdue += due;
    });

    return { ar: arBuckets, ap: apBuckets };
  },
);

export const selectSupplierYields = createSelector(
  [
    (state: RootState) => state.purchasing?.orders ?? [],
    (state: RootState) => state.customers?.customers ?? [],
  ],
  (pos, customers) => {
    const supplierStats: Record<
      string,
      { total: number; rejected: number; name: string }
    > = {};

    pos.forEach((po) => {
      if (!supplierStats[po.counterpartyId]) {
        const contact = customers.find((c) => c.id === po.counterpartyId);
        supplierStats[po.counterpartyId] = {
          total: 0,
          rejected: 0,
          name: contact?.name || "Unknown Supplier",
        };
      }

      po.items.forEach((item) => {
        supplierStats[po.counterpartyId].total++;
        if (item.status === "REJECTED") {
          supplierStats[po.counterpartyId].rejected++;
        }
      });
    });

    return Object.entries(supplierStats)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        yield:
          stats.total > 0
            ? ((stats.total - stats.rejected) / stats.total) * 100
            : 100,
        count: stats.total,
      }))
      .sort((a, b) => b.yield - a.yield);
  },
);

export const selectNetCreditPosition = createSelector([selectCreditAging], (aging) => {
  const arTotal = Object.values(aging.ar).reduce((a, b) => a + b, 0);
  const apTotal = Object.values(aging.ap).reduce((a, b) => a + b, 0);
  return { arTotal, apTotal, net: arTotal - apTotal };
});

export const selectModelVelocity = createSelector(
  [
    selectInventoryPhones,
    (state: RootState) => state.billing?.orders ?? [],
    selectLedgerEntries,
  ],
  (phones, orders, entries) => {
    const sold = phones.filter((p) => p.status === "SOLD");
    const stats: Record<string, { totalDays: number; count: number; name: string }> = {};

    sold.forEach((phone) => {
      const modelKey = `${phone.brand} ${phone.model}`;
      if (!stats[modelKey]) stats[modelKey] = { totalDays: 0, count: 0, name: modelKey };

      let soldAt: Date | null = null;
      if ((phone as any).saleOrderId) {
        const order = orders.find((o) => o.id === (phone as any).saleOrderId);
        if (order) soldAt = new Date(order.createdAt);
      } else {
        const entry = entries.find((e) => e.type === "PHONE_SALE" && e.referenceId === phone.id);
        if (entry) soldAt = new Date(entry.createdAt);
      }

      if (soldAt) {
        const days = Math.max(0.1, (soldAt.getTime() - new Date(phone.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        stats[modelKey].totalDays += days;
        stats[modelKey].count++;
      }
    });

    return Object.values(stats)
      .map((s) => ({
        name: s.name,
        avgDays: s.totalDays / s.count,
        count: s.count,
      }))
      .sort((a, b) => a.avgDays - b.avgDays); // Fastest first
  },
);

