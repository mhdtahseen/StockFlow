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
    let lien = 0;
    let purchases = 0;
    let sales = 0;
    let profitWithdrawals = 0;

    entries.forEach((entry) => {
      // Basic principle: All sign-aware amounts are added to wallet balance, 
      // except for those specifically moving money to/from the Lien (escrow).
      
      switch (entry.type) {
        case "MONEY_ADDED":
        case "CAPITAL_INJECTION":
        case "CUSTOMER_PAYMENT":
          wallet += entry.amount; // Positive
          break;
        case "WITHDRAWAL":
        case "SUPPLIER_PAYMENT":
        case "PROFIT_WITHDRAWAL":
          wallet += entry.amount; // Negative
          if (entry.type === "PROFIT_WITHDRAWAL") {
            profitWithdrawals += Math.abs(entry.amount);
          }
          break;
        case "REPAIR_COST":
          wallet += entry.amount; // Negative
          break;
        case "PHONE_SALE":
          // Sales only add to the separate sales metric (Accrual)
          // Liquid cash is tracked via CUSTOMER_PAYMENT (Cash basis)
          sales += entry.amount;
          break;
        case "FUNDS_PLEDGED":
          // Money moving from Wallet -> Lien (amount usually negative)
          wallet += entry.amount; 
          lien += Math.abs(entry.amount);
          break;
        case "FUNDS_RELEASED":
          // Money moving from Lien -> Wallet (amount usually positive)
          wallet += entry.amount;
          lien -= entry.amount;
          break;
        case "FUNDS_CONSUMED":
          // Money finalized from Lien -> Purchase Expense (amount usually negative)
          // Reduces the lien bucket as it's no longer 'held', it's spent.
          lien += entry.amount; 
          purchases += Math.abs(entry.amount);
          break;
      }
    });

    return { wallet, lien, purchases, sales, profitWithdrawals };
  },
);
