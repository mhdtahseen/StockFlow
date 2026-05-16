import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderEdit } from "../purchasing/types";

interface OrderEditsState {
  edits: OrderEdit[];
}

const initialState: OrderEditsState = { edits: [] };

const orderEditsSlice = createSlice({
  name: "orderEdits",
  initialState,
  reducers: {
    setOrderEdits: (s, a: PayloadAction<OrderEdit[]>) => {
      s.edits = a.payload;
    },
    addOrderEdit: (s, a: PayloadAction<OrderEdit>) => {
      const exists = s.edits.some((e) => e.id === a.payload.id);
      if (!exists) s.edits.unshift(a.payload);
    },
  },
});

export const { setOrderEdits, addOrderEdit } = orderEditsSlice.actions;
export default orderEditsSlice.reducer;
