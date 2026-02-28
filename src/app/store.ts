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

import inventoryReducer from "../features/inventory/slice";
import ledgerReducer from "../features/ledger/slice";
import masterDataReducer from "../features/masterData/slice";

const rootReducer = combineReducers({
  inventory: inventoryReducer,
  ledger: ledgerReducer,
  masterData: masterDataReducer,
});

const persistConfig = {
  key: "stockflow-root",
  storage: localforage,
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
