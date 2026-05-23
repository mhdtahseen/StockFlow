import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { RootState, store } from "./store";
import { Phone } from "@/features/inventory/types";
import { LedgerEntry } from "@/features/ledger/types";
import {
  removeAction,
  incrementRetry,
  setOnlineStatus,
  markStuck,
} from "@/features/sync/slice";
import { addCustomer } from "@/features/customers/slice";
import { removePendingEntryById } from "@/features/ledger/slice";
import { syncActionToSupabase } from "./supabaseApi";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { App as CapApp } from "@capacitor/app";

export function useOfflineSyncManager() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const dispatch = useDispatch();

  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const outbox = useSelector((state: RootState) => state.sync.outbox);
  // Counts only non-stuck items — used as an effect dep so the initial data fetch
  // re-triggers when pending items are marked stuck (outbox.length stays the same
  // but pendingCount drops, signalling that it's now safe to overwrite local state).
  const pendingCount = useSelector(
    (state: RootState) => state.sync.outbox.filter((i) => !i.stuck).length,
  );

  const [isSyncing, setIsSyncing] = useState(true);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  // Reset the fetch flag whenever the logged-in user changes so the new
  // user's tenant data is fetched fresh rather than showing the previous
  // user's persisted Redux state (fixes stale data on account switch).
  const prevUserIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      setHasFetchedInitial(false);
    }
  }, [session?.user?.id]);

  const isProcessingOutboxRef = useRef(false);
  // Debounce timer for online/offline toasts — prevents spam on flaky connections
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 1. ONLINE / OFFLINE LISTENERS
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        toast.success("System Online", {
          description:
            "Connection restored. Synchronizing pending transactions with the server.",
        });
      }, 300);
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        toast.error("System Offline", {
          description:
            "Connection lost. Operating in offline mode. Data is securely saved on this device.",
        });
      }, 300);
    };

    if (Capacitor.isNativePlatform()) {
      // Use @capacitor/network for reliable connectivity detection on native
      Network.getStatus().then((status) => {
        dispatch(setOnlineStatus(status.connected));
      });

      const listenerPromise = Network.addListener('networkStatusChange', (status) => {
        if (status.connected) {
          handleOnline();
        } else {
          handleOffline();
        }
      });

      return () => {
        clearTimeout(toastTimerRef.current);
        listenerPromise.then((handle) => handle.remove());
      };
    } else {
      // Web fallback
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      dispatch(setOnlineStatus(navigator.onLine));

      return () => {
        clearTimeout(toastTimerRef.current);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [dispatch]);

  // 2. APP RESUME — force a data refresh when the app comes back to the foreground.
  // This covers the TOKEN_REFRESHED case: the Supabase SDK silently refreshes the
  // access token while the app is backgrounded. Because the user ID doesn't change,
  // prevUserIdRef stays the same and hasFetchedInitial remains true — no re-fetch
  // would otherwise happen. Listening to the native resume event (or web
  // visibilitychange) resets hasFetchedInitial so fresh data is fetched on return.
  useEffect(() => {
    if (!session) return;

    const handleResume = async () => {
      // On Android/iOS, JS is suspended while backgrounded — the SDK's auto-refresh
      // setInterval never fires. Call getSession() to force a token refresh check
      // BEFORE resetting hasFetchedInitial, so data is fetched with a valid token.
      await supabase.auth.getSession();
      setHasFetchedInitial(false);
    };

    if (Capacitor.isNativePlatform()) {
      const listenerPromise = CapApp.addListener("resume", handleResume);
      return () => {
        listenerPromise.then((handle) => handle.remove());
      };
    } else {
      const handleVisibilityChange = () => {
        if (!document.hidden) handleResume();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [session]);

  // 3. PROCESS OUTBOX WHEN ONLINE
  useEffect(() => {
    if (!isOnline || outbox.length === 0 || !session) return;
    if (isProcessingOutboxRef.current) return;

    let mounted = true;
    let retryTimer: number | undefined;

    async function processOutbox() {
      if (isProcessingOutboxRef.current) return;
      isProcessingOutboxRef.current = true;

      try {
        let hasMore = true;
        while (hasMore && mounted && isOnline) {
          // Refresh outbox snapshot from store each iteration to catch new items
          const state = store.getState() as RootState;
          const currentOutbox = state.sync.outbox;

          if (currentOutbox.length === 0) {
            hasMore = false;
            break;
          }

          const now = Date.now();

          // Find the first item that is processable right now.
          // Skip: stuck items (awaiting user resolution), items in backoff, and
          // items <5s old with retryCount=0 (the middleware's immediate attempt
          // may still be in-flight — avoid firing the same RPC twice).
          const item = currentOutbox.find((i) => {
            if (i.stuck) return false;
            if (i.nextAttemptAt && i.nextAttemptAt > now) return false;
            if (i.retryCount === 0 && now - i.timestamp < 5_000) return false;
            return true;
          });

          if (!item) {
            hasMore = false;
            break;
          }

          const result = await syncActionToSupabase(item.action);

          if (result === "success") {
            dispatch(removeAction(item.id));
            // Clean up the optimistic pending ledger entry created when the
            // action was dispatched — prevents duplicate display after refresh.
            const { type, payload } = item.action as { type: string; payload: any };
            if (type === "customers/addCustomerPayment") {
              dispatch(removePendingEntryById(`v-cust-pay-${payload.id}`));
            } else if (type === "customers/addCustomerSettlement") {
              dispatch(removePendingEntryById(`v-set-main-${payload.id}`));
              dispatch(removePendingEntryById(`v-set-excess-${payload.id}`));
            } else if (type === "purchasing/addSupplierSettlement") {
              dispatch(removePendingEntryById(`v-sup-set-${payload.id}`));
            }

          } else if (result === "auth_expired") {
            // Session expired — stop processing ALL items. The sync manager will
            // re-trigger when the session auto-refreshes (session is in effect deps).
            // Do NOT increment retryCount — no retries wasted on auth failures.
            toast.error("Session expired", {
              description: "Some changes are pending sync. Please re-open the app or sign in again.",
              duration: 8_000,
            });
            hasMore = false;

          } else if (result === "permanent_conflict") {
            // FK violation — the referenced record no longer exists. This will
            // never succeed on its own. Mark stuck (skip in future iterations)
            // and surface the issue to the user. Continue processing the rest
            // of the queue — one stuck item must not block everything else.
            dispatch(markStuck(item.id));
            toast.error("A change couldn't be saved", {
              description: "One item needs your attention. Open the menu to view sync issues.",
              duration: 8_000,
            });
            // intentionally do NOT set hasMore = false — keep draining the queue

          } else {
            // "retry" — transient network/server error. Apply backoff and stop
            // hammering the server; the retry timer will wake us up.
            dispatch(incrementRetry(item.id));
            hasMore = false;
          }
        }
      } finally {
        isProcessingOutboxRef.current = false;
      }

      // Re-check for early retries, ignoring stuck items
      const state = store.getState() as RootState;
      const nextRetries = state.sync.outbox.filter(i => !i.stuck && i.nextAttemptAt && i.nextAttemptAt > Date.now());
      if (mounted && isOnline && nextRetries.length > 0) {
        const earliest = Math.min(...nextRetries.map(i => i.nextAttemptAt!));
        const delayMs = Math.max(0, earliest - Date.now());
        retryTimer = window.setTimeout(() => {
          processOutbox();
        }, delayMs);
      }
    }

    processOutbox();

    return () => {
      mounted = false;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [isOnline, outbox, session, dispatch]);

  // 4. INITIAL LOAD (Wait until outbox is empty)
  useEffect(() => {
    if (isAuthLoading || hasFetchedInitial || !session) {
      if (!isAuthLoading && !session) setIsSyncing(false); // guest user or unauthenticated
      return;
    }

    let mounted = true;

    async function fetchInitialData() {
      setIsSyncing(true);
      // Only overwrite local Redux state with server data if there are no unsynced
      // local mutations pending. Stuck items are excluded — they are permanently
      // failed and not going to be retried, so they don't block a server refresh.
      const noPendingMutations = () =>
        !store.getState().sync.outbox.some((i) => !i.stuck);

      try {
        // Fetch Phones
        const { data: phonesData } = await supabase
          .from("phones")
          .select("*")
          .order("created_at", { ascending: false });

        if (phonesData && mounted) {
          const phones: Phone[] = phonesData.map((p) => ({
            id: p.id,
            brand: p.brand,
            model: p.model,
            storage: p.storage,
            ram: p.ram,
            color: p.color,
            imeis: p.imeis || [],
            purchasePrice: Number(p.purchase_price),
            salePrice: p.sale_price ? Number(p.sale_price) : undefined,
            status: p.status as any,
            issueTags: p.issue_tags,
            createdAt: p.created_at,
          }));
          if (noPendingMutations()) {
            dispatch({ type: "inventory/setPhones", payload: phones });
          }
        }

        // Fetch Ledger
        const { data: ledgerData } = await supabase
          .from("ledger")
          .select("*")
          .order("created_at", { ascending: false });

        if (ledgerData && mounted) {
          const entries: LedgerEntry[] = ledgerData.map((e) => ({
            id: e.id,
            type: e.type as any,
            referenceId: e.reference_id ?? undefined,
            amount: Number(e.amount),
            paymentMode: e.payment_mode ?? undefined,
            note: e.note ?? undefined,
            settlementCount: e.settlement_count ?? undefined,
            customerPaymentId: e.customer_payment_id ?? undefined,
            supplierPaymentId: e.supplier_payment_id ?? undefined,
            saleOrderId: e.sale_order_id ?? undefined,
            purchaseOrderId: e.purchase_order_id ?? undefined,
            createdAt: e.created_at,
          }));
          if (noPendingMutations()) {
            dispatch({ type: "ledger/setEntries", payload: entries });
          }
        }

        // Fetch Master Data
        const { data: masterData } = await supabase
          .from("master_data")
          .select("*");

        if (masterData && mounted) {
          const categorized: Record<string, string[]> = {
            brand: [],
            model: [],
            ram: [],
            storage: [],
            color: [],
            issue_tag: [],
          };

          masterData.forEach((row) => {
            if (categorized[row.category]) {
              categorized[row.category].push(row.value);
            }
          });

          if (noPendingMutations()) {
            dispatch({
              type: "masterData/setAll",
              payload: {
                brands: categorized.brand,
                models: categorized.model,
                ramOptions: categorized.ram,
                storageOptions: categorized.storage,
                colorOptions: categorized.color,
                issueTags: categorized.issue_tag,
              },
            });
          }
        }

        if (session?.user?.user_metadata?.tenant_id) {
          const tenantId = session.user.user_metadata.tenant_id;
          
          // Customers (counterparties) — join tenants to get linked tenant name
          const { data: cpData } = await supabase
            .from("counterparties")
            .select("*, linked_tenant:tenants!counterparties_linked_tenant_id_fkey(name)")
            .eq("tenant_id", tenantId)
            .order("name");
          if (cpData && mounted && noPendingMutations()) {
            dispatch({
              type: "customers/setAll",
              payload: cpData.map((c: any) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                phone: c.phone,
                email: c.email,
                platformName: c.platform_name,
                linkedTenantId: c.linked_tenant_id,
                linkedTenantName: c.linked_tenant?.name ?? undefined,
                notes: c.notes,
                gstin: c.gstin ?? undefined,
                state: c.state ?? undefined,
                createdAt: c.created_at,
              })),
            });
          }

          // All recent sale orders (all statuses, last 90 days to avoid huge payloads)
          const ninetyDaysAgo = new Date(
            Date.now() - 90 * 24 * 3600 * 1000,
          ).toISOString();
          const { data: soData } = await supabase
            .from("sale_orders")
            .select("*, sale_order_items(*)")
            .eq("tenant_id", tenantId)
            .is("deleted_at", null)
            .gte("created_at", ninetyDaysAgo)
            .order("created_at", { ascending: false });
          if (soData && mounted && noPendingMutations()) {
            dispatch({ type: "billing/setOrders", payload: soData.map((o: any) => ({
              id: o.id, counterpartyId: o.counterparty_id, orderType: o.order_type,
              totalAmount: o.total_amount, amountPaid: o.amount_paid,
              status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
              notes: o.notes, createdAt: o.created_at,
              // ── GST fields ──
              gstEnabled: o.gst_enabled ?? false,
              gstType: o.gst_type ?? undefined,
              gstRate: o.gst_rate ?? undefined,
              subtotal: o.subtotal ?? undefined,
              cgstAmount: o.cgst_amount ?? undefined,
              sgstAmount: o.sgst_amount ?? undefined,
              igstAmount: o.igst_amount ?? undefined,
              buyerGstin: o.buyer_gstin ?? undefined,
              items: o.sale_order_items.map((i: any) => ({
                id: i.id, saleOrderId: i.sale_order_id, phoneId: i.phone_id,
                salePrice: i.sale_price, discountAmount: i.discount_amount,
                effectivePrice: i.sale_price - i.discount_amount,
                imeiSnapshot: i.imei_snapshot || [], brandSnapshot: i.brand_snapshot,
                modelSnapshot: i.model_snapshot, storageSnapshot: i.storage_snapshot, colorSnapshot: i.color_snapshot,
                hsnCode: i.hsn_code ?? undefined,
              }))
            })) });
          }

          // All non-archived purchase orders (all active statuses including SETTLED/CANCELLED)
          const { data: poData } = await supabase
            .from("purchase_orders")
            .select("*, purchase_order_items(*)")
            .eq("tenant_id", tenantId)
            .is("deleted_at", null)
            .in("status", ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL", "SETTLED", "CANCELLED"])
            .order("created_at", { ascending: false });
          if (poData && mounted && noPendingMutations()) {
            dispatch({
              type: "purchasing/setPurchaseOrders",
              payload: poData.map((o: any) => ({
                id: o.id,
                counterpartyId: o.counterparty_id,
                acquisitionChannel: o.acquisition_channel,
                platformFee: o.platform_fee,
                phonesOrdered: o.phones_ordered,
                phonesReceived: o.phones_received,
                totalAmount: o.total_amount,
                amountPaid: o.amount_paid,
                status: o.status,
                paymentMode: o.payment_mode,
                dueDate: o.due_date,
                notes: o.notes,
                createdAt: o.created_at,
                // ── GST fields ──
                gstEnabled: o.gst_enabled ?? false,
                gstType: o.gst_type ?? undefined,
                gstRate: o.gst_rate ?? undefined,
                subtotal: o.subtotal ?? undefined,
                cgstAmount: o.cgst_amount ?? undefined,
                sgstAmount: o.sgst_amount ?? undefined,
                igstAmount: o.igst_amount ?? undefined,
                sellerGstin: o.seller_gstin ?? undefined,
                items: o.purchase_order_items.map((i: any) => ({
                  id: i.id,
                  purchaseOrderId: i.purchase_order_id,
                  phoneId: i.phone_id,
                  purchasePrice: i.purchase_price,
                  status: i.status,
                  rejectionReason: i.rejection_reason,
                  brand: i.brand,
                  model: i.model,
                  storage: i.storage,
                  ram: i.ram,
                  color: i.color,
                  imei: i.imei,
                  hsnCode: i.hsn_code ?? undefined,
                }))
              })),
            });
          }

          // Customer payments (last 90 days — aligned with order window)
          const { data: cpPayData } = await supabase
            .from("customer_payments")
            .select("*, payment_allocations(*)")
            .eq("tenant_id", tenantId)
            .gte("received_at", ninetyDaysAgo)
            .order("received_at", { ascending: false });
          if (cpPayData && mounted && noPendingMutations()) {
            dispatch({
              type: "customers/setPayments",
              payload: cpPayData.map((p: any) => ({
                id: p.id, counterpartyId: p.counterparty_id, totalReceived: p.total_received,
                mode: p.mode, receivedAt: p.received_at, note: p.note, recordedBy: p.recorded_by,
                allocations: p.payment_allocations.map((a: any) => ({
                  saleOrderId: a.sale_order_id, amountAllocated: a.amount_allocated, note: a.note
                }))
              })),
            });
          }

          // Supplier payments (last 90 days — aligned with order window)
          const { data: spPayData } = await supabase
            .from("supplier_payments")
            .select("*, supplier_allocations(*)")
            .eq("tenant_id", tenantId)
            .gte("paid_at", ninetyDaysAgo)
            .order("paid_at", { ascending: false });
          if (spPayData && mounted && noPendingMutations()) {
            dispatch({
              type: "purchasing/setPayments",
              payload: spPayData.map((p: any) => ({
                id: p.id, counterpartyId: p.counterparty_id, totalPaid: p.total_paid,
                mode: p.mode, paidAt: p.paid_at, note: p.note, recordedBy: p.recorded_by,
                allocations: p.supplier_allocations.map((a: any) => ({
                  purchaseOrderId: a.purchase_order_id, amountAllocated: a.amount_allocated, note: a.note
                }))
              })),
            });
          }

          // Order edits audit log (last 90 days — drives timeline EDIT entries)
          const { data: editsData } = await supabase
            .from("order_edits")
            .select("*")
            .eq("tenant_id", tenantId)
            .gte("created_at", ninetyDaysAgo)
            .order("created_at", { ascending: false });
          if (editsData && mounted && noPendingMutations()) {
            dispatch({
              type: "orderEdits/setOrderEdits",
              payload: editsData.map((e: any) => ({
                id: e.id,
                orderId: e.order_id,
                orderType: e.order_type,
                editedBy: e.edited_by,
                editedByName: e.edited_by_name,
                diff: e.diff,
                createdAt: e.created_at,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching initial data from Supabase:", err);
      } finally {
        if (mounted) {
          setHasFetchedInitial(true);
          setIsSyncing(false);
        }
      }
    }

    // CRUCIAL: Do not fetch remote data over local data if outbox has unsynced local mutations.
    // Stuck items (permanent_conflict) are excluded — they no longer mutate server state.
    if (pendingCount === 0) {
      if (isOnline) {
        fetchInitialData();
      } else {
        // Offline on start: trust local persist, don't fetch
        setHasFetchedInitial(true);
        setIsSyncing(false);
      }
    }

    return () => {
      mounted = false;
    };
  }, [
    isAuthLoading,
    session,
    hasFetchedInitial,
    pendingCount,  // tracks non-stuck items only — drops when items are synced OR marked stuck
    isOnline,
    dispatch,
  ]);

  // 5. REALTIME: counterparty INSERTs — receiving side of a trade connection
  // When another tenant runs connect_by_trade_code, a row is inserted into THIS
  // tenant's counterparties table. Subscribe to that event so it appears
  // immediately without needing an app restart.
  useEffect(() => {
    const tenantId = session?.user?.user_metadata?.tenant_id;
    if (!tenantId || !hasFetchedInitial) return;

    const channel = supabase
      .channel(`counterparties:tenant:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "counterparties",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const c = payload.new as any;

          // Avoid duplicating a row the local device just optimistically added
          const existing = (store.getState() as RootState).customers.customers;
          if (existing.some((x) => x.id === c.id)) return;

          // Resolve the linked tenant name if present
          let linkedTenantName: string | undefined;
          if (c.linked_tenant_id) {
            const { data } = await supabase
              .from("tenants")
              .select("name")
              .eq("id", c.linked_tenant_id)
              .single();
            linkedTenantName = data?.name ?? undefined;
          }

          dispatch(
            addCustomer({
              id: c.id,
              name: c.name,
              type: c.type,
              phone: c.phone ?? undefined,
              email: c.email ?? undefined,
              platformName: c.platform_name ?? undefined,
              linkedTenantId: c.linked_tenant_id ?? undefined,
              linkedTenantName,
              notes: c.notes ?? undefined,
              createdAt: c.created_at,
            }),
          );

          toast.success(`"${c.name}" connected to your Trade Network!`, {
            description: "They can now appear in your contacts.",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, hasFetchedInitial, dispatch]);

  /** Force a fresh server-sync — safe to call only when outbox is empty. */
  const refetch = useCallback(() => {
    if (!isSyncing) setHasFetchedInitial(false);
  }, [isSyncing]);

  return { isSyncing, refetch };
}
