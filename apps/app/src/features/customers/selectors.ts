import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectCustomers = (s: RootState) => s.customers.customers;
export const selectCustomerPayments = (s: RootState) => s.customers.payments;
export const selectSupplierPayments = (s: RootState) => s.purchasing.payments;

/** Customers/counterparties linked to a verified StockFlow business */
export const selectLinkedCounterparties = createSelector(
  selectCustomers,
  (customers) => customers.filter((c) => Boolean(c.linkedTenantId)),
);

export const selectCustomerById = (id: string) =>
  createSelector(selectCustomers, (customers) =>
    customers.find((c) => c.id === id),
  );

export const selectCustomerPaymentsByCounterparty = (id: string) =>
  createSelector(selectCustomerPayments, (payments) =>
    payments.filter((p) => p.counterpartyId === id),
  );

/**
 * Advance credit = total received/paid - total allocated across all payments.
 * arAdvance: overpayment from customer (receipt > invoices).
 * apAdvance: overpayment to supplier (payout > bills).
 */
export const selectCounterpartyAdvance = (counterpartyId: string) =>
  createSelector(
    selectCustomerPayments,
    selectSupplierPayments,
    (customerPayments, supplierPayments) => {
      const arPayments = customerPayments.filter(
        (p) => p.counterpartyId === counterpartyId,
      );
      const arReceived = arPayments.reduce((s, p) => s + p.totalReceived, 0);
      const arAllocated = arPayments.reduce((s, p) => {
        const allocSum = p.allocations.reduce((a, al) => a + al.amountAllocated, 0);
        // Legacy payments recorded without allocations were fully applied at time of entry
        return s + (p.allocations.length === 0 ? p.totalReceived : allocSum);
      }, 0);
      const arAdvance = Math.max(0, arReceived - arAllocated);

      const apPayments = supplierPayments.filter(
        (p) => p.counterpartyId === counterpartyId,
      );
      const apPaid = apPayments.reduce((s, p) => s + p.totalPaid, 0);
      const apAllocated = apPayments.reduce((s, p) => {
        const allocSum = p.allocations.reduce((a, al) => a + al.amountAllocated, 0);
        return s + (p.allocations.length === 0 ? p.totalPaid : allocSum);
      }, 0);
      const apAdvance = Math.max(0, apPaid - apAllocated);

      return { arAdvance, apAdvance };
    },
  );
