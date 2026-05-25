import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AnyAction = { type: string; [key: string]: any };

export interface OutboxItem {
  id: string;
  action: AnyAction;
  timestamp: number;
  retryCount: number;
  nextAttemptAt: number;
  /** True when the item has permanently failed (e.g. FK violation) and is
   *  awaiting manual user resolution. Stuck items are never auto-retried
   *  or auto-dropped — they stay in the outbox until the user discards them. */
  stuck?: boolean;
}

export interface SyncState {
  outbox: OutboxItem[];
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
    /** Mark an outbox item as permanently stuck (FK violation or similar).
     *  Stuck items are skipped by the sync loop and surfaced in the UI until
     *  the user explicitly discards them. */
    markStuck: (state, action: PayloadAction<string>) => {
      const item = state.outbox.find((i) => i.id === action.payload);
      if (item) item.stuck = true;
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const item = state.outbox.find((i) => i.id === action.payload);
      if (item) {
        item.retryCount += 1;
        const baseDelayMs = 1500;
        const maxDelayMs = 60_000; // cap at 60s (was 30s)
        const backoffMs = Math.min(
          maxDelayMs,
          baseDelayMs * Math.pow(2, Math.min(item.retryCount, 6)),
        );
        item.nextAttemptAt = Date.now() + backoffMs;
      }
    },
    /** Purge outbox items older than maxAgeMs (default 7 days).
     *  Called on app startup to prevent stale items from prior sessions
     *  blocking data fetches indefinitely. */
    purgeExpiredItems: (state, action: PayloadAction<number | undefined>) => {
      const maxAgeMs = action.payload ?? 7 * 24 * 60 * 60 * 1000; // 7 days default
      const cutoff = Date.now() - maxAgeMs;
      const before = state.outbox.length;
      state.outbox = state.outbox.filter((i) => i.timestamp > cutoff);
      if (state.outbox.length < before) {
        console.warn(
          `[sync] Purged ${before - state.outbox.length} expired outbox items (older than ${Math.round(maxAgeMs / 86400000)}d)`,
        );
      }
    },
  },
});

export const { setOnlineStatus, queueAction, removeAction, markStuck, incrementRetry, purgeExpiredItems } =
  syncSlice.actions;

export default syncSlice.reducer;
