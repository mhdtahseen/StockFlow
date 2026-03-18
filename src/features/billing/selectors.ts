import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectOrders = (s: RootState) => s.billing.orders;

export const selectOrdersByCounterparty = (id: string) =>
  createSelector(selectOrders, (orders) =>
    orders.filter((o) => o.counterpartyId === id),
  );

export const selectOpenOrders = createSelector(selectOrders, (orders) =>
  orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    }),
);

// AR summary — reads from orders only (no ledger needed)
export const selectARSummary = createSelector(selectOrders, (orders) => ({
  totalInvoiced: orders.reduce((s, o) => s + o.totalAmount, 0),
  totalOutstanding: orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0),
}));
