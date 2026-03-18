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
import { supabaseMiddleware } from "./supabaseMiddleware";

import inventoryReducer from "../features/inventory/slice";
import ledgerReducer from "../features/ledger/slice";
import masterDataReducer from "../features/masterData/slice";
import syncReducer from "../features/sync/slice";
import billingReducer from "../features/billing/slice";
import purchasingReducer from "../features/purchasing/slice";
import customersReducer from "../features/customers/slice";

const rootReducer = combineReducers({
  inventory: inventoryReducer,
  ledger: ledgerReducer,
  masterData: masterDataReducer,
  sync: syncReducer,
  billing: billingReducer,
  purchasing: purchasingReducer,
  customers: customersReducer,
});

const persistConfig = {
  key: "stockflow-root",
  storage: localforage,
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
