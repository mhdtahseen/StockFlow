import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { LedgerEntry } from "./types";

/**
 * Total Cash/Digital balance across all active buckets (CASH, UPI, BANK)
 */
export const selectCashBalance = createSelector(
  [(state: RootState) => state.ledger.entries],
  (entries) => {
    return entries
      .filter((e) => e.paymentMode !== "CREDIT")
      .reduce((sum, e) => sum + e.amount, 0);
  }
);

/**
 * Total Customer Debt (Receivables) calculated strictly from the Ledger
 */
export const selectTotalReceivables = createSelector(
  [(state: RootState) => state.ledger.entries],
  (entries) => {
    return entries
      .filter((e) => !e.isVoided)
      .reduce((sum, e) => {
        // Receivables: Debt Pledged increases what is owed to us
        if (e.type === "DEBT_PLEDGED")
          return (
            sum +
            Math.abs(e.amount === 0 ? (e as any).referenceAmount || 0 : e.amount)
          );
        // Settlements and Payments decrease what is owed
        if (
          ["CUSTOMER_PAYMENT", "DEBT_SETTLEMENT", "ADVANCE_RECEIVED"].includes(
            e.type,
          )
        ) {
          return sum - Math.abs(e.amount);
        }
        return sum;
      }, 0);
  },
);

/**
 * TRUE PROFIT (Landed Cost Basis)
 * SalePrice - (PurchasePrice + Repairs + OperatingCosts)
 */
export const selectTrueProfit = createSelector(
  [(state: RootState) => state.ledger.entries],
  (entries) => {
    const active = entries.filter((e) => !e.isVoided);
    // Income from sales (PHONE_SALE)
    const salesIncome = active
      .filter((e) => e.type === "PHONE_SALE")
      .reduce((sum, e) => sum + e.amount, 0);

    // Expenses: purchases via supplier payments + repair costs
    const costs = active
      .filter((e) =>
        ["SUPPLIER_PAYMENT", "REPAIR_COST", "PROFIT_WITHDRAWAL"].includes(e.type),
      )
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    // Note: ADVANCE_RECEIVED is a liability, not income, so it's correctly excluded here.
    return salesIncome - costs;
  },
);

/**
 * Customer Specific Balance
 * Positive = Customer owes us money
 * Negative = Customer has Advance Credit with us
 */
export const selectCustomerBalance = (customerId: string) =>
  createSelector([(state: RootState) => state.ledger.entries], (entries) => {
    return entries
      .filter(
        (e) =>
          !e.isVoided &&
          (e.referenceId === customerId ||
            (e as any).counterpartyId === customerId),
      )
      .reduce((sum, e) => {
        if (e.type === "DEBT_PLEDGED") return sum + Math.abs(e.amount);
        if (
          ["CUSTOMER_PAYMENT", "DEBT_SETTLEMENT", "ADVANCE_RECEIVED"].includes(
            e.type,
          )
        ) {
          return sum - Math.abs(e.amount);
        }
        return sum;
      }, 0);
  });
