import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectLedgerEntries = (state: RootState) => state.ledger.entries;

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
          wallet += entry.amount; // Positive
          break;
        case "WITHDRAWAL":
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
          // Sales add to both wallet (real money) and the separate sales metric
          wallet += entry.amount; // Positive
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
