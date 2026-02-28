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

    entries.forEach((entry) => {
      switch (entry.type) {
        case "MONEY_ADDED":
          wallet += entry.amount;
          break;
        case "WITHDRAWAL":
          wallet += entry.amount; // Usually a negative amount passing in, or subtracted
          break;
        case "FUNDS_PLEDGED":
          wallet -= entry.amount;
          lien += entry.amount;
          break;
        case "FUNDS_RELEASED":
          wallet += entry.amount;
          lien -= entry.amount;
          break;
        case "FUNDS_CONSUMED":
          lien -= entry.amount;
          purchases += entry.amount;
          break;
        case "PHONE_SALE":
          sales += entry.amount;
          break;
      }
    });

    return { wallet, lien, purchases, sales };
  },
);
