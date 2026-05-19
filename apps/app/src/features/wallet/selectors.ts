import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const selectRawEntries = (state: RootState) => state.ledger.entries;
const selectRawPendingEntries = (state: RootState) => state.ledger.pendingEntries;

export const selectLedgerEntries = createSelector(
  [selectRawEntries, selectRawPendingEntries],
  (entries = [], pendingEntries = []) => {
    // Create a set of purchaseOrderIds already in official entries to avoid double-counting
    const safeEntries = entries || [];
    const safePending = pendingEntries || [];

    const existingPOIds = new Set(
      safeEntries
        .filter((e) => e && e.purchaseOrderId)
        .map((e) => e.purchaseOrderId),
    );

    // Filter out pending entries that have already been synced
    const filteredPending = safePending.filter(
      (e) => e && (!e.purchaseOrderId || !existingPOIds.has(e.purchaseOrderId)),
    );

    return [...safeEntries, ...filteredPending].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
);

export const selectWalletBuckets = createSelector(
  [selectLedgerEntries],
  (entries) => {
    let wallet = 0;
    let purchases = 0;
    let sales = 0;
    let profitWithdrawals = 0;

    entries.forEach((entry) => {
      switch (entry.type) {
        case "MONEY_ADDED":
        case "CAPITAL_INJECTION":
        case "CUSTOMER_PAYMENT":
          wallet += entry.amount;
          break;
        case "WITHDRAWAL":
        case "PROFIT_WITHDRAWAL":
          wallet += entry.amount;
          if (entry.type === "PROFIT_WITHDRAWAL") {
            profitWithdrawals += Math.abs(entry.amount);
          }
          break;
        case "SUPPLIER_PAYMENT":
          wallet += entry.amount;
          purchases += Math.abs(entry.amount);
          break;
        case "REPAIR_COST":
          wallet += entry.amount;
          break;
        case "PHONE_SALE":
          sales += entry.amount;
          break;
      }
    });

    return { wallet, purchases, sales, profitWithdrawals };
  },
);
