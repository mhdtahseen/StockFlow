import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import localforage from "localforage";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabaseMiddleware } from "./supabaseMiddleware";

import inventoryReducer from "../features/inventory/slice";
import ledgerReducer from "../features/ledger/slice";
import masterDataReducer from "../features/masterData/slice";
import syncReducer from "../features/sync/slice";
import billingReducer from "../features/billing/slice";
import purchasingReducer from "../features/purchasing/slice";
import customersReducer from "../features/customers/slice";
import tenantReducer from "../features/tenant/slice";

// ─── Native Storage Engine ────────────────────────────────────────────────────
// On native (Android/iOS), use @capacitor/preferences for persistent storage.
// This is never evicted by the OS unlike browser localStorage/IndexedDB.
// On web, fall back to localforage (IndexedDB-backed).
const nativeStorageEngine = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

const storageEngine = Capacitor.isNativePlatform() ? nativeStorageEngine : localforage;

const rootReducer = combineReducers({
  inventory: inventoryReducer,
  ledger: ledgerReducer,
  masterData: masterDataReducer,
  sync: syncReducer,
  billing: billingReducer,
  purchasing: purchasingReducer,
  customers: customersReducer,
  tenant: tenantReducer,
});

const persistConfig = {
  key: "stockflow-root",
  storage: storageEngine,
  version: 2,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: false, // Disabling as per warning for large states
    }).concat(supabaseMiddleware as any),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
