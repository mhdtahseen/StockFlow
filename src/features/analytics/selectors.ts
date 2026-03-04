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
    let capitalInvested = 0; // Money actually consumed for assets
    let pledgedCapital = 0; // Money tied up currently
    let topUps = 0;
    let withdrawals = 0;

    entries.forEach((entry) => {
      const entryDate = parseISO(entry.createdAt);
      if (isAfter(entryDate, startDate)) {
        if (entry.type === "PHONE_SALE") grossSales += entry.amount;
        if (entry.type === "FUNDS_CONSUMED") capitalInvested += entry.amount;
        if (entry.type === "REPAIR_COST") capitalInvested += entry.amount;
        if (entry.type === "FUNDS_PLEDGED") pledgedCapital += entry.amount;
        if (entry.type === "FUNDS_RELEASED") pledgedCapital -= entry.amount;
        if (entry.type === "MONEY_ADDED") topUps += entry.amount;
        if (entry.type === "WITHDRAWAL") withdrawals += Math.abs(entry.amount);
      }
    });

    const netOperatingCashflow = grossSales - capitalInvested;

    return {
      grossSales,
      capitalInvested,
      pledgedCapital,
      topUps,
      withdrawals,
      netOperatingCashflow,
    };
  });

export const selectInventoryMetrics = createSelector(
  [selectInventoryPhones, selectLedgerEntries],
  (phones, entries) => {
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
        const saleEntry = entries.find(
          (e) => e.type === "PHONE_SALE" && e.referenceId === phone.id,
        );
        if (saleEntry) {
          const created = new Date(phone.createdAt).getTime();
          const soldAt = new Date(saleEntry.createdAt).getTime();
          const days = Math.max(0, (soldAt - created) / (1000 * 60 * 60 * 24));
          totalDays += days;
          validPhones++;
        }
      });

      if (validPhones > 0) {
        avgTimeOnShelfDays = totalDays / validPhones;
      }
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
    };
  },
);
