import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InventoryState, Phone } from "./types";

const initialState: InventoryState = {
  phones: [],
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    addPhone: (state, action: PayloadAction<Phone>) => {
      state.phones.push(action.payload);
    },
    updatePhone: (state, action: PayloadAction<Phone>) => {
      const index = state.phones.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.phones[index] = action.payload;
      }
    },
    removePhone: (state, action: PayloadAction<string>) => {
      state.phones = state.phones.filter((p) => p.id !== action.payload);
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
  },
});

export const { addPhone, updatePhone, removePhone, markAsInStock, markAsSold } =
  inventorySlice.actions;
export default inventorySlice.reducer;
