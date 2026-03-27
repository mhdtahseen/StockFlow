import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PurchasingState,
  PurchaseOrder,
  PurchaseOrderItem,
  SupplierPayment,
} from "./types";

const initialState: PurchasingState = { orders: [], payments: [] };

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
    setPayments: (s, a: PayloadAction<SupplierPayment[]>) => {
      s.payments = a.payload;
    },
    addSupplierPayment: (s, a: PayloadAction<SupplierPayment>) => {
      s.payments.unshift(a.payload);
    },
    addSupplierSettlement: (s, a: PayloadAction<{
      id?: string;
      counterpartyId: string;
      amount: number;
      mode: string;
      note?: string;
    }>) => {
      // Backend handles allocation
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
    markPOItemAccepted: (
      state,
      action: PayloadAction<{
        purchaseOrderId: string;
        phoneId: string;
        finalPrice: number;
      }>,
    ) => {
      const po = state.orders.find(
        (o) => o.id === action.payload.purchaseOrderId,
      );
      if (!po) return;
      const item = po.items.find((i) => i.phoneId === action.payload.phoneId);
      if (item) item.status = "ACCEPTED";
      po.phonesReceived = (po.phonesReceived ?? 0) + 1;
      // Check if all items resolved → update PO status
      const allResolved = po.items.every(
        (i) => i.status !== "PENDING_INSPECTION",
      );
      if (allResolved) po.status = "RECEIVED";
    },
    markPOItemRejected: (
      state,
      action: PayloadAction<{
        purchaseOrderId: string;
        phoneId: string;
        reason?: string;
      }>,
    ) => {
      const po = state.orders.find(
        (o) => o.id === action.payload.purchaseOrderId,
      );
      if (!po) return;
      const item = po.items.find((i) => i.phoneId === action.payload.phoneId);
      if (item) {
        item.status = "REJECTED";
        if (action.payload.reason)
          (item as any).rejectionReason = action.payload.reason;
      }
      const allResolved = po.items.every(
        (i) => i.status !== "PENDING_INSPECTION",
      );
      if (allResolved) po.status = "RECEIVED";
    },
  },
});
export const {
  setPurchaseOrders,
  addPurchaseOrder,
  updatePOPayment,
  confirmReceipt,
  setPayments,
  addSupplierPayment,
  addSupplierSettlement,
  markPOItemAccepted,
  markPOItemRejected,
} = purchasingSlice.actions;
export default purchasingSlice.reducer;
