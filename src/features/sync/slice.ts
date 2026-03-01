import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnyAction } from "redux";

export interface SyncState {
  outbox: {
    id: string; // unique ID for the outbox task
    action: AnyAction;
    timestamp: number;
    retryCount: number;
  }[];
  isOnline: boolean;
}

const initialState: SyncState = {
  outbox: [],
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    queueAction: (state, action: PayloadAction<AnyAction>) => {
      state.outbox.push({
        id: crypto.randomUUID(),
        action: action.payload,
        timestamp: Date.now(),
        retryCount: 0,
      });
    },
    removeAction: (state, action: PayloadAction<string>) => {
      state.outbox = state.outbox.filter((item) => item.id !== action.payload);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const item = state.outbox.find((i) => i.id === action.payload);
      if (item) item.retryCount += 1;
    },
  },
});

export const { setOnlineStatus, queueAction, removeAction, incrementRetry } =
  syncSlice.actions;

export default syncSlice.reducer;
