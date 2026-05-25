import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BillingState, OrderItem, SaleOrder } from "./types";

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
    returnOrder: (
      s,
      a: PayloadAction<{ orderId: string; refundAmount: number; paymentMode: string }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.orderId);
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
    editSaleOrder: (
      s,
      a: PayloadAction<{
        id: string;
        counterpartyId: string;
        dueDate?: string;
        notes?: string;
        items: OrderItem[];
        newTotalAmount: number;
        newStatus: SaleOrder["status"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (!o) return;
      o.counterpartyId  = a.payload.counterpartyId;
      o.dueDate         = a.payload.dueDate;
      o.notes           = a.payload.notes;
      o.items           = a.payload.items;
      o.totalAmount     = a.payload.newTotalAmount;
      o.status          = a.payload.newStatus;
    },
    softDeleteSaleOrder: (s, a: PayloadAction<string>) => {
      s.orders = s.orders.filter((o) => o.id !== a.payload);
    },
    cancelSaleOrder: (s, a: PayloadAction<string>) => {
      const o = s.orders.find((o) => o.id === a.payload);
      if (o) o.status = 'CANCELLED';
    },
  },
});
export const { setOrders, addOrder, updateOrderPayment, returnOrder, updateOrder, editSaleOrder, softDeleteSaleOrder, cancelSaleOrder } =
  billingSlice.actions;
export default billingSlice.reducer;
