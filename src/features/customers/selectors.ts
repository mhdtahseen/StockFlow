import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectCustomers = (s: RootState) => s.customers.customers;
export const selectCustomerPayments = (s: RootState) => s.customers.payments;

export const selectCustomerById = (id: string) =>
  createSelector(selectCustomers, (customers) =>
    customers.find((c) => c.id === id),
  );

export const selectCustomerPaymentsByCounterparty = (id: string) =>
  createSelector(selectCustomerPayments, (payments) =>
    payments.filter((p) => p.counterpartyId === id),
  );
