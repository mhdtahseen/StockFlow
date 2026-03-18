import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PurchasingState, PurchaseOrder, PurchaseOrderItem } from "./types";

const initialState: PurchasingState = { orders: [] };

const purchasingSlice = createSlice({
  name: "purchasing",
  initialState,
  reducers: {
    setPurchaseOrders: (s, a: PayloadAction<PurchaseOrder[]>) => {
      s.orders = a.payload;
    },
    addPurchaseOrder: (s, a: PayloadAction<PurchaseOrder>) => {
      s.orders.unshift(a.payload);
    },
    updatePOPayment: (
      s,
      a: PayloadAction<{
        id: string;
        amountPaid: number;
        status: PurchaseOrder["status"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (o) {
        o.amountPaid = a.payload.amountPaid;
        o.status = a.payload.status;
      }
    },
    confirmReceipt: (
      s,
      a: PayloadAction<{
        id: string;
        phonesReceived: number;
        status: PurchaseOrder["status"];
        items: PurchaseOrderItem[];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (o) {
        o.phonesReceived = a.payload.phonesReceived;
        o.status = a.payload.status;
        o.items = a.payload.items;
      }
    },
  },
});
export const { setPurchaseOrders, addPurchaseOrder, updatePOPayment, confirmReceipt } =
  purchasingSlice.actions;
export default purchasingSlice.reducer;
