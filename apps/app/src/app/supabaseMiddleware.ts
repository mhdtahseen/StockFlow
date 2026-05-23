import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { queueAction, removeAction, markStuck } from "@/features/sync/slice";
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
          // Local-only actions already handled server-side by parent RPCs:
          "inventory/linkPhoneToSO",    // create_trade_order RPC links the phone
          "customers/updateCustomerLink", // connect_by_trade_code RPC sets the link
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

        // 2c. Prevent double-sync for counterparties created by connect_by_trade_code RPC
        // (the RPC already created the record server-side — outbox INSERT causes 409)
        const isRPCCreatedCustomer =
          type === "customers/addCustomer" && action.payload?.linkedTenantId;

        if (!isTrackable || ignoredHydrationTypes.includes(type) || isTransactionSegment || isPOLinkedPhone || isRPCCreatedCustomer) return;

        const state = store.getState();

        // ONLINE MODE: "Queue-First" Strategy
        // 1. Generate ID and queue immediately (ensures persistence before network call)
        const syncId = crypto.randomUUID();
        store.dispatch(queueAction({ id: syncId, action }));

        // 2. Attempt to sync
        const result = await syncActionToSupabase(action);

        // 3. Cleanup based on result:
        //    success          → remove from outbox (confirmed written)
        //    permanent_conflict → mark stuck immediately (FK violation won't self-heal)
        //    auth_expired / retry → leave in outbox for sync manager to retry
        if (result === "success") {
          store.dispatch(removeAction(syncId));
        } else if (result === "permanent_conflict") {
          store.dispatch(markStuck(syncId));
        }
      } catch (err) {
        console.error("Middleware Sync Exception:", err);
      }
    })();

    return result;
  };
