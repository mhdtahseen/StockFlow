import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CustomersState, Customer, CustomerPayment } from "./types";

const initialState: CustomersState = { customers: [], payments: [] };

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setAll: (s, a: PayloadAction<Customer[]>) => {
      s.customers = a.payload;
    },
    addCustomer: (s, a: PayloadAction<Customer>) => {
      s.customers.push(a.payload);
      s.customers.sort((x, y) => x.name.localeCompare(y.name));
    },
    updateCustomer: (s, a: PayloadAction<Customer>) => {
      const idx = s.customers.findIndex((c) => c.id === a.payload.id);
      if (idx !== -1) s.customers[idx] = a.payload;
      s.customers.sort((x, y) => x.name.localeCompare(y.name));
    },
    /** Link or unlink a counterparty to a StockFlow tenant */
    updateCustomerLink: (s, a: PayloadAction<{ id: string; linkedTenantId: string | undefined; linkedTenantName: string | undefined }>) => {
      const c = s.customers.find((c) => c.id === a.payload.id);
      if (c) {
        c.linkedTenantId   = a.payload.linkedTenantId;
        c.linkedTenantName = a.payload.linkedTenantName;
      }
    },
    removeCustomer: (s, a: PayloadAction<string>) => {
      s.customers = s.customers.filter((c) => c.id !== a.payload);
    },
    setPayments: (s, a: PayloadAction<CustomerPayment[]>) => {
      s.payments = a.payload;
    },
    addCustomerPayment: (s, a: PayloadAction<CustomerPayment>) => {
      s.payments.unshift(a.payload);
    },
    addCustomerSettlement: (s, a: PayloadAction<{
      id: string;
      counterpartyId: string;
      amount: number;
      mode: "CASH" | "UPI" | "BANK_TRANSFER";
      allocations: {
        orderId: string;
        amount: number;
      }[];
      note?: string;
      recordedBy: string;
    }>) => {
      const { id, counterpartyId, amount, mode, note, recordedBy, allocations } = a.payload;
      
      const newPayment: CustomerPayment = {
        id,
        counterpartyId,
        totalReceived: amount,
        mode,
        receivedAt: new Date().toISOString(),
        note,
        recordedBy,
        allocations: allocations.map(al => ({
          saleOrderId: al.orderId,
          amountAllocated: al.amount,
        }))
      };

      s.payments.unshift(newPayment);
    },
  },
});
export const { setAll, addCustomer, updateCustomer, updateCustomerLink, removeCustomer, setPayments, addCustomerPayment, addCustomerSettlement } =
  customersSlice.actions;
export default customersSlice.reducer;
