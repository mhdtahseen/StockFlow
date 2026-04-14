import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnyAction } from "redux";

export interface SyncState {
  outbox: {
    id: string; // unique ID for the outbox task
    action: AnyAction;
    timestamp: number;
    retryCount: number;
    nextAttemptAt: number;
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
    queueAction: (state, action: PayloadAction<AnyAction | { id: string; action: AnyAction }>) => {
      const payload = action.payload;
      const isFullPayload = "id" in payload && "action" in payload;
      
      state.outbox.push({
        id: isFullPayload ? (payload as any).id : crypto.randomUUID(),
        action: isFullPayload ? (payload as any).action : (payload as AnyAction),
        timestamp: Date.now(),
        retryCount: 0,
        nextAttemptAt: Date.now(),
      });
    },
    removeAction: (state, action: PayloadAction<string>) => {
      state.outbox = state.outbox.filter((item) => item.id !== action.payload);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const item = state.outbox.find((i) => i.id === action.payload);
      if (item) {
        item.retryCount += 1;
        const baseDelayMs = 1500;
        const maxDelayMs = 30000;
        const backoffMs = Math.min(
          maxDelayMs,
          baseDelayMs * Math.pow(2, Math.min(item.retryCount, 5)),
        );
        item.nextAttemptAt = Date.now() + backoffMs;
      }
    },
  },
});

export const { setOnlineStatus, queueAction, removeAction, incrementRetry } =
  syncSlice.actions;

export default syncSlice.reducer;
