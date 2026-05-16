import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InventoryState, Phone } from "./types";
import { editPurchaseOrder, softDeletePurchaseOrder } from "../purchasing/slice";
import { softDeleteSaleOrder } from "../billing/slice";

const initialState: InventoryState = {
  phones: [],
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setPhones: (state, action: PayloadAction<Phone[]>) => {
      state.phones = action.payload;
    },
    addPhone: (state, action: PayloadAction<Phone>) => {
      state.phones.push(action.payload);
    },
    updatePhone: (
      state,
      action: PayloadAction<{
        id: string;
        phone: Partial<Phone>;
        prevPrice?: number; // Added to help Watchtower track adjustments
      }>,
    ) => {
      const index = state.phones.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.phones[index] = {
          ...state.phones[index],
          ...action.payload.phone,
        };
      }
    },
    removePhone: (state, action: PayloadAction<string>) => {
      state.phones = state.phones.filter((p) => p.id !== action.payload);
    },
    addRepairLog: (
      state,
      action: PayloadAction<{
        phoneId: string;
        amount: number;
        note: string;
        recordedBy?: string;
      }>,
    ) => {
      // Logic for adding repair to a phone's sub-history if needed
    },
    removeRepairLog: (
      state,
      action: PayloadAction<{ phoneId: string; entryId: string }>,
    ) => {
      // Logic for removing repair from history
    },
    markAsInStock: (
      state,
      action: PayloadAction<{ id: string; finalPrice: number }>,
    ) => {
      const phone = state.phones.find((p) => p.id === action.payload.id);
      if (phone) {
        phone.status = "IN_STOCK";
        phone.purchasePrice = action.payload.finalPrice;
      }
    },
    markAsSold: (
      state,
      action: PayloadAction<{ id: string; salePrice: number }>,
    ) => {
      const phone = state.phones.find((p) => p.id === action.payload.id);
      if (phone) {
        phone.status = "SOLD";
        phone.salePrice = action.payload.salePrice;
      }
    },
    linkPhoneToPO: (
      state,
      action: PayloadAction<{ phoneId: string; purchaseOrderId: string }>,
    ) => {
      const phone = state.phones.find((p) => p.id === action.payload.phoneId);
      if (phone)
        (phone as any).purchaseOrderId = action.payload.purchaseOrderId;
    },
    linkPhoneToSO: (
      state,
      action: PayloadAction<{ phoneId: string; saleOrderId: string }>,
    ) => {
      const phone = state.phones.find((p) => p.id === action.payload.phoneId);
      if (phone) (phone as any).saleOrderId = action.payload.saleOrderId;
    },
  },
  extraReducers: (builder) => {
    // When a PO is edited, propagate price changes to existing phones
    builder.addCase(editPurchaseOrder, (state, action) => {
      const { items } = action.payload;
      for (const item of items) {
        if (item.phoneId) {
          const phone = state.phones.find((p) => p.id === item.phoneId);
          if (phone && phone.purchasePrice !== item.purchasePrice) {
            phone.purchasePrice = item.purchasePrice;
          }
        }
      }
    });
    // When a PO is soft-deleted, no inventory change needed (phones stay)

    // When an SO is soft-deleted, restock phones back to IN_STOCK
    builder.addCase(softDeleteSaleOrder, (state, action) => {
      const orderId = action.payload;
      for (const phone of state.phones) {
        if ((phone as any).saleOrderId === orderId) {
          phone.status = "IN_STOCK";
          phone.salePrice = undefined;
          (phone as any).saleOrderId = undefined;
        }
      }
    });
  },
});

export const {
  setPhones,
  addPhone,
  updatePhone,
  removePhone,
  addRepairLog,
  removeRepairLog,
  markAsInStock,
  markAsSold,
  linkPhoneToPO,
  linkPhoneToSO,
} = inventorySlice.actions;
export default inventorySlice.reducer;
