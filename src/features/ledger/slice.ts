import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LedgerEntry, LedgerState } from "./types";

const initialState: LedgerState = {
  entries: [],
};

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    setEntries: (state, action: PayloadAction<LedgerEntry[]>) => {
      state.entries = action.payload;
    },
    addEntry: (state, action: PayloadAction<LedgerEntry>) => {
      state.entries.push(action.payload);
    },
    removeEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload,
      );
    },
  },
});

export const { setEntries, addEntry, removeEntry } = ledgerSlice.actions;
export default ledgerSlice.reducer;
