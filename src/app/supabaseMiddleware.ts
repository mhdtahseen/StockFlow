import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { queueAction } from "@/features/sync/slice";
import { syncActionToSupabase } from "./supabaseApi";

export const supabaseMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action: any) => {
    // 1. Let the reducers process the action first (Optimistic Update)
    const result = next(action);

    // 2. Perform side effects asynchronously based on action type
    (async () => {
      try {
        const type = action.type;
        if (!type || typeof type !== "string") return;

        // Skip syncing if it's an initialization, persist action, or sync action itself
        if (
          type.startsWith("persist/") ||
          type.startsWith("@@") ||
          type.startsWith("sync/")
        ) {
          return;
        }

        const trackablePrefixes = [
          "inventory/",
          "ledger/",
          "masterData/",
          "billing/",
          "purchasing/",
          "customers/",
        ];
        // Ignore setPhones, setEntries, setAll which are used for initial hydrations
        const ignoredHydrationTypes = [
          "inventory/setPhones",
          "ledger/setEntries",
          "masterData/setAll",
          "billing/setOrders",
          "purchasing/setPurchaseOrders",
          "customers/setAll",
          "customers/setPayments",
        ];

        const isTrackable = trackablePrefixes.some((prefix) =>
          type.startsWith(prefix),
        );

        if (!isTrackable || ignoredHydrationTypes.includes(type)) return;

        const state = store.getState();

        // If offline, queue immediately
        if (!state.sync.isOnline) {
          store.dispatch(queueAction(action));
          return;
        }

        // Online mode: attempt to sync instantly
        const success = await syncActionToSupabase(action);

        // If it failed (e.g. timeout or sudden drop in connection), queue it
        if (!success) {
          store.dispatch(queueAction(action));
        }
      } catch (err) {
        console.error("Middleware Sync Exception:", err);
      }
    })();

    return result;
  };
