import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BillingState, SaleOrder } from "./types";

const initialState: BillingState = { orders: [] };

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setOrders: (s, a: PayloadAction<SaleOrder[]>) => {
      s.orders = a.payload;
    },
    addOrder: (s, a: PayloadAction<SaleOrder>) => {
      s.orders.unshift(a.payload);
    },
    updateOrderPayment: (
      s,
      a: PayloadAction<{
        id: string;
        amountPaid: number;
        status: SaleOrder["status"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (o) {
        o.amountPaid = a.payload.amountPaid;
        o.status = a.payload.status;
      }
    },
    returnOrder: (s, a: PayloadAction<string>) => {
      const o = s.orders.find((o) => o.id === a.payload);
      if (o) o.status = "RETURNED";
    },
    updateOrder: (
      s,
      a: PayloadAction<{
        id: string;
        counterpartyId?: string;
        notes?: string;
        dueDate?: string;
        paymentMode?: SaleOrder["paymentMode"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (!o) return;
      if (a.payload.counterpartyId !== undefined) o.counterpartyId = a.payload.counterpartyId;
      if (a.payload.notes !== undefined) o.notes = a.payload.notes;
      if (a.payload.dueDate !== undefined) o.dueDate = a.payload.dueDate;
      if (a.payload.paymentMode !== undefined) o.paymentMode = a.payload.paymentMode;
    },
  },
});
export const { setOrders, addOrder, updateOrderPayment, returnOrder, updateOrder } =
  billingSlice.actions;
export default billingSlice.reducer;
