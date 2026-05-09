import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectPurchaseOrders = (s: RootState) => s.purchasing.orders;

export const selectPurchaseOrdersByCounterparty = (id: string) =>
  createSelector(selectPurchaseOrders, (orders) =>
    orders.filter((o) => o.counterpartyId === id),
  );

export const selectOpenPurchaseOrders = createSelector(selectPurchaseOrders, (orders) =>
  orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "CANCELLED")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    }),
);

// AP summary — reads from orders only
export const selectAPSummary = createSelector(selectPurchaseOrders, (orders) => ({
  totalOrdered: orders.reduce((s, o) => s + o.totalAmount, 0),
  totalOutstanding: orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "CANCELLED")
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0),
}));
