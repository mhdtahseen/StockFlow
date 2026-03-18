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
    removeCustomer: (s, a: PayloadAction<string>) => {
      s.customers = s.customers.filter((c) => c.id !== a.payload);
    },
    setPayments: (s, a: PayloadAction<CustomerPayment[]>) => {
      s.payments = a.payload;
    },
    addCustomerPayment: (s, a: PayloadAction<CustomerPayment>) => {
      s.payments.unshift(a.payload);
    },
  },
});
export const { setAll, addCustomer, updateCustomer, removeCustomer, setPayments, addCustomerPayment } =
  customersSlice.actions;
export default customersSlice.reducer;
