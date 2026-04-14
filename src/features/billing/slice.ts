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
  },
});
export const { setOrders, addOrder, updateOrderPayment, returnOrder } =
  billingSlice.actions;
export default billingSlice.reducer;
