import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PurchasingState,
  PurchaseOrder,
  PurchaseOrderItem,
  SupplierPayment,
} from "./types";
import { addOrderEdit } from "../orderEdits/slice";

const initialState: PurchasingState = { orders: [], payments: [] };

const purchasingSlice = createSlice({
  name: "purchasing",
  initialState,
  reducers: {
    setPurchaseOrders: (s, a: PayloadAction<PurchaseOrder[]>) => {
      s.orders = a.payload;
    },
    addPurchaseOrder: (s, a: PayloadAction<PurchaseOrder>) => {
      const exists = s.orders.some((o) => o.id === a.payload.id);
      if (!exists) {
        s.orders.unshift(a.payload);
      } else {
        // Update existing record with fresh data if possible
        const idx = s.orders.findIndex((o) => o.id === a.payload.id);
        if (idx !== -1) s.orders[idx] = a.payload;
      }
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
        totalAmount?: number;
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (o) {
        o.phonesReceived = a.payload.phonesReceived;
        o.status = a.payload.status;
        o.items = a.payload.items;
        if (a.payload.totalAmount !== undefined) {
          o.totalAmount = a.payload.totalAmount;
        }
      }
    },
    markPOItemAccepted: (
      state,
      action: PayloadAction<{
        purchaseOrderId: string;
        itemId: string;
        phoneId: string;
        finalPrice: number;
      }>,
    ) => {
      const po = state.orders.find(
        (o) => o.id === action.payload.purchaseOrderId,
      );
      if (!po) return;
      const item = po.items.find((i) => i.id === action.payload.itemId);
      if (item) {
        item.status = "ACCEPTED";
        item.phoneId = action.payload.phoneId;
        item.purchasePrice = action.payload.finalPrice;
      }
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
        itemId: string;
        reason?: string;
      }>,
    ) => {
      const po = state.orders.find(
        (o) => o.id === action.payload.purchaseOrderId,
      );
      if (!po) return;
      const item = po.items.find((i) => i.id === action.payload.itemId);
      if (item) {
        item.status = "REJECTED";
        if (action.payload.reason) item.rejectionReason = action.payload.reason;
        
        // RECONCILIATION: Subtract price from total since we no longer owe for this unit
        po.totalAmount = (po.totalAmount || 0) - (item.purchasePrice || 0);
      }
      const allResolved = po.items.every(
        (i) => i.status !== "PENDING_INSPECTION",
      );
      if (allResolved) po.status = "RECEIVED";
    },
    updatePurchaseOrder: (
      s,
      a: PayloadAction<{
        id: string;
        counterpartyId?: string;
        notes?: string;
        dueDate?: string;
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (!o) return;
      if (a.payload.counterpartyId !== undefined) o.counterpartyId = a.payload.counterpartyId;
      if (a.payload.notes !== undefined) (o as any).notes = a.payload.notes;
      if (a.payload.dueDate !== undefined) o.dueDate = a.payload.dueDate;
    },
    editPurchaseOrder: (
      s,
      a: PayloadAction<{
        id: string;
        counterpartyId: string;
        acquisitionChannel: PurchaseOrder["acquisitionChannel"];
        platformFee: number;
        dueDate?: string;
        notes?: string;
        items: PurchaseOrderItem[];
        newTotalAmount: number;
        newStatus: PurchaseOrder["status"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (!o) return;
      o.counterpartyId    = a.payload.counterpartyId;
      o.acquisitionChannel = a.payload.acquisitionChannel;
      o.platformFee       = a.payload.platformFee;
      o.dueDate           = a.payload.dueDate;
      o.notes             = a.payload.notes;
      o.items             = a.payload.items;
      o.phonesOrdered     = a.payload.items.length;
      // phonesReceived is set by confirmReceipt only — do not overwrite here
      o.totalAmount       = a.payload.newTotalAmount;
      o.status            = a.payload.newStatus;
    },
    softDeletePurchaseOrder: (s, a: PayloadAction<string>) => {
      s.orders = s.orders.filter((o) => o.id !== a.payload);
    },
  },
  extraReducers: (builder) => {
    // Append audit record when an edit is confirmed from server
    builder.addCase(addOrderEdit, () => {
      // orderEdits slice handles storage; no PO state change needed
    });
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
  updatePurchaseOrder,
  editPurchaseOrder,
  softDeletePurchaseOrder,
} = purchasingSlice.actions;
export default purchasingSlice.reducer;
