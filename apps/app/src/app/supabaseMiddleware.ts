import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { queueAction, removeAction } from "@/features/sync/slice";
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
          "tenant/",
        ];
        // Ignore setPhones, setEntries, setAll which are used for initial hydrations
        // NOTE: Old customers remain visible because they are cached in local storage/Redux 
        // and the sync logic only pushes new changes rather than performing a full state overwrite.
        const ignoredHydrationTypes = [
          "inventory/setPhones",
          "ledger/setEntries",
          "masterData/setAll",
          "billing/setOrders",
          "purchasing/setPurchaseOrders",
          "customers/setAll",
          "customers/setPayments",
          "purchasing/setPayments",
          "orderEdits/setOrderEdits",
        ];

        const isTrackable = trackablePrefixes.some((prefix) =>
          type.startsWith(prefix),
        );

        // 2a. Prevent double-sync for ledger entries that are part of an RPC transaction
        // (entries with a purchaseOrderId or saleOrderId are synced by the RPC itself)
        const isTransactionSegment = 
          type === "ledger/addEntry" && (action.payload?.purchaseOrderId || action.payload?.saleOrderId);

        // 2b. Prevent double-sync for phones linked to a PO
        const isPOLinkedPhone = 
          type === "inventory/addPhone" && action.payload?.purchaseOrderId;

        if (!isTrackable || ignoredHydrationTypes.includes(type) || isTransactionSegment || isPOLinkedPhone) return;

        const state = store.getState();

        // ONLINE MODE: "Queue-First" Strategy
        // 1. Generate ID and queue immediately (ensures persistence before network call)
        const syncId = crypto.randomUUID();
        store.dispatch(queueAction({ id: syncId, action }));

        // 2. Attempt to sync
        const success = await syncActionToSupabase(action);

        // 3. Cleanup: If success, remove from outbox. If fail, it's already there for retry.
        if (success) {
          store.dispatch(removeAction(syncId));
        }
      } catch (err) {
        console.error("Middleware Sync Exception:", err);
      }
    })();

    return result;
  };
