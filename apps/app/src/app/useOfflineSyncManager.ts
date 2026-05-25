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
  purgeExpiredItems,
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
  // Tracks whether we've successfully fetched from the server at least once this session.
  // Distinguishes "offline cold start with cached data" from "actually synced".
  const hasRemoteFetchedRef = useRef(false);
  // On native, defer fetch until Network.getStatus() resolves — navigator.onLine is unreliable.
  const [networkReady, setNetworkReady] = useState(!Capacitor.isNativePlatform());
  // Retry tracking for initial fetch failures
  const fetchRetryCountRef = useRef(0);
  const fetchRetryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── OUTBOX EXPIRY ──────────────────────────────────────────────────────────
  // Purge outbox items older than 7 days on mount. Prevents stale items from a
  // previous session/login from blocking the initial data fetch indefinitely.
  const hasPurgedRef = useRef(false);
  useEffect(() => {
    if (!hasPurgedRef.current) {
      hasPurgedRef.current = true;
      dispatch(purgeExpiredItems(undefined));
    }
  }, [dispatch]);

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
      // If we started offline and never fetched remotely, trigger a fresh fetch now
      if (!hasRemoteFetchedRef.current && hasFetchedInitial) {
        setHasFetchedInitial(false);
      }
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
        setNetworkReady(true); // Signal that native network state is now known
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
  }, [dispatch, hasFetchedInitial]);

  // 2. APP RESUME (warm start) — force a data refresh when the app comes back
  // to the foreground. Also re-checks network state and handles expired sessions.
  useEffect(() => {
    if (!session) return;

    const handleResume = async () => {
      // Re-check connectivity first — it may have changed while backgrounded
      if (Capacitor.isNativePlatform()) {
        try {
          const { connected } = await Network.getStatus();
          dispatch(setOnlineStatus(connected));
          if (!connected) return; // Still offline, nothing to do
        } catch {
          // Network plugin failed — proceed optimistically
        }
      }

      // On Android/iOS, JS is suspended while backgrounded — the SDK's auto-refresh
      // setInterval never fires. Call getSession() with a timeout to force a token
      // refresh check BEFORE resetting hasFetchedInitial.
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
        ]);

        if (!result) {
          // Timeout on resume — don't reset fetch flag, user keeps seeing cached data
          console.warn("Resume: getSession timed out, using cached data");
          return;
        }

        // If session is now null (refresh token expired while backgrounded),
        // the onAuthStateChange listener will fire SIGNED_OUT and handle cleanup.
        if (!result.data.session) {
          console.warn("Resume: session expired while backgrounded");
          return;
        }
      } catch (err) {
        console.warn("Resume: getSession failed, using cached data", err);
        return;
      }

      // Token is valid — trigger a fresh data fetch
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
  }, [session, dispatch]);

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
    if (isAuthLoading || hasFetchedInitial || !session || !networkReady) {
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
        // ── Phase 1: Fetch core data + resolve tenant_id in parallel ──
        // These are all independent — firing concurrently cuts total time by ~3x
        const [phonesResult, ledgerResult, masterResult, tenantIdResult] = await Promise.all([
          supabase.from("phones").select("*").order("created_at", { ascending: false }),
          supabase.from("ledger").select("*").order("created_at", { ascending: false }),
          supabase.from("master_data").select("*"),
          // Resolve tenant_id: prefer user_metadata, fall back to profiles table
          (async () => {
            const tid = session?.user?.user_metadata?.tenant_id;
            if (tid) return tid;
            if (!session?.user?.id) return null;
            const { data } = await supabase
              .from("profiles").select("tenant_id").eq("id", session.user.id).single();
            return data?.tenant_id ?? null;
          })(),
        ]);

        if (!mounted) return;

        // ── Dispatch Phase 1 results ──
        const { data: phonesData } = phonesResult;
        if (phonesData && noPendingMutations()) {
          dispatch({
            type: "inventory/setPhones",
            payload: phonesData.map((p) => ({
              id: p.id, brand: p.brand, model: p.model, storage: p.storage,
              ram: p.ram, color: p.color, imeis: p.imeis || [],
              purchasePrice: Number(p.purchase_price),
              salePrice: p.sale_price ? Number(p.sale_price) : undefined,
              status: p.status as any, issueTags: p.issue_tags, createdAt: p.created_at,
            })) as Phone[],
          });
        }

        const { data: ledgerData } = ledgerResult;
        if (ledgerData && noPendingMutations()) {
          dispatch({
            type: "ledger/setEntries",
            payload: ledgerData.map((e) => ({
              id: e.id, type: e.type as any, referenceId: e.reference_id ?? undefined,
              amount: Number(e.amount), paymentMode: e.payment_mode ?? undefined,
              note: e.note ?? undefined, settlementCount: e.settlement_count ?? undefined,
              customerPaymentId: e.customer_payment_id ?? undefined,
              supplierPaymentId: e.supplier_payment_id ?? undefined,
              saleOrderId: e.sale_order_id ?? undefined,
              purchaseOrderId: e.purchase_order_id ?? undefined, createdAt: e.created_at,
              isVoided: (e as any).is_voided ?? false,
            })) as LedgerEntry[],
          });
        }

        const { data: masterData } = masterResult;
        if (masterData && noPendingMutations()) {
          const categorized: Record<string, string[]> = {
            brand: [], model: [], ram: [], storage: [], color: [], issue_tag: [],
          };
          masterData.forEach((row) => {
            if (categorized[row.category]) categorized[row.category].push(row.value);
          });
          dispatch({
            type: "masterData/setAll",
            payload: {
              brands: categorized.brand, models: categorized.model,
              ramOptions: categorized.ram, storageOptions: categorized.storage,
              colorOptions: categorized.color, issueTags: categorized.issue_tag,
            },
          });
        }

        // ── Phase 2: Tenant-scoped data in parallel ──
        const tenantId = tenantIdResult;
        if (tenantId && mounted) {
          const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

          const [cpResult, soResult, poResult, cpPayResult, spPayResult, editsResult] = await Promise.all([
            supabase.from("counterparties")
              .select("*, linked_tenant:tenants!counterparties_linked_tenant_id_fkey(name)")
              .eq("tenant_id", tenantId).order("name"),
            supabase.from("sale_orders").select("*, sale_order_items(*)")
              .eq("tenant_id", tenantId).is("deleted_at", null)
              .gte("created_at", ninetyDaysAgo).order("created_at", { ascending: false }),
            supabase.from("purchase_orders").select("*, purchase_order_items(*)")
              .eq("tenant_id", tenantId).is("deleted_at", null)
              .in("status", ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL", "SETTLED", "CANCELLED"])
              .order("created_at", { ascending: false }),
            supabase.from("customer_payments").select("*, payment_allocations(*)")
              .eq("tenant_id", tenantId).gte("received_at", ninetyDaysAgo)
              .order("received_at", { ascending: false }),
            supabase.from("supplier_payments").select("*, supplier_allocations(*)")
              .eq("tenant_id", tenantId).gte("paid_at", ninetyDaysAgo)
              .order("paid_at", { ascending: false }),
            supabase.from("order_edits").select("*")
              .eq("tenant_id", tenantId).gte("created_at", ninetyDaysAgo)
              .order("created_at", { ascending: false }),
          ]);

          if (!mounted) return;

          const { data: cpData } = cpResult;
          if (cpData && noPendingMutations()) {
            dispatch({
              type: "customers/setAll",
              payload: cpData.map((c: any) => ({
                id: c.id, name: c.name, type: c.type, phone: c.phone, email: c.email,
                platformName: c.platform_name, linkedTenantId: c.linked_tenant_id,
                linkedTenantName: c.linked_tenant?.name ?? undefined,
                notes: c.notes, gstin: c.gstin ?? undefined, state: c.state ?? undefined,
                address: c.address ?? undefined, pincode: c.pincode ?? undefined,
                aadhaarEncrypted: c.aadhaar_encrypted ?? undefined,
                aadhaarLast4: c.aadhaar_last4 ?? undefined,
                tags: c.tags?.length ? c.tags : undefined,
                createdAt: c.created_at,
              })),
            });
          }

          const { data: soData } = soResult;
          if (soData && noPendingMutations()) {
            dispatch({ type: "billing/setOrders", payload: soData.map((o: any) => ({
              id: o.id, counterpartyId: o.counterparty_id, orderType: o.order_type,
              totalAmount: o.total_amount, amountPaid: o.amount_paid,
              status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
              notes: o.notes, createdAt: o.created_at,
              gstEnabled: o.gst_enabled ?? false, gstType: o.gst_type ?? undefined,
              gstRate: o.gst_rate ?? undefined, subtotal: o.subtotal ?? undefined,
              cgstAmount: o.cgst_amount ?? undefined, sgstAmount: o.sgst_amount ?? undefined,
              igstAmount: o.igst_amount ?? undefined, buyerGstin: o.buyer_gstin ?? undefined,
              items: o.sale_order_items.map((i: any) => ({
                id: i.id, saleOrderId: i.sale_order_id, phoneId: i.phone_id,
                salePrice: i.sale_price, discountAmount: i.discount_amount,
                effectivePrice: i.sale_price - i.discount_amount,
                imeiSnapshot: i.imei_snapshot || [], brandSnapshot: i.brand_snapshot,
                modelSnapshot: i.model_snapshot, storageSnapshot: i.storage_snapshot,
                colorSnapshot: i.color_snapshot, hsnCode: i.hsn_code ?? undefined,
              }))
            })) });
          }

          const { data: poData } = poResult;
          if (poData && noPendingMutations()) {
            dispatch({
              type: "purchasing/setPurchaseOrders",
              payload: poData.map((o: any) => ({
                id: o.id, counterpartyId: o.counterparty_id,
                acquisitionChannel: o.acquisition_channel, platformFee: o.platform_fee,
                phonesOrdered: o.phones_ordered, phonesReceived: o.phones_received,
                totalAmount: o.total_amount, amountPaid: o.amount_paid,
                status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
                notes: o.notes, createdAt: o.created_at,
                gstEnabled: o.gst_enabled ?? false, gstType: o.gst_type ?? undefined,
                gstRate: o.gst_rate ?? undefined, subtotal: o.subtotal ?? undefined,
                cgstAmount: o.cgst_amount ?? undefined, sgstAmount: o.sgst_amount ?? undefined,
                igstAmount: o.igst_amount ?? undefined, sellerGstin: o.seller_gstin ?? undefined,
                items: o.purchase_order_items.map((i: any) => ({
                  id: i.id, purchaseOrderId: i.purchase_order_id, phoneId: i.phone_id,
                  purchasePrice: i.purchase_price, status: i.status,
                  rejectionReason: i.rejection_reason, brand: i.brand, model: i.model,
                  storage: i.storage, ram: i.ram, color: i.color, imei: i.imei,
                  hsnCode: i.hsn_code ?? undefined,
                }))
              })),
            });
          }

          const { data: cpPayData } = cpPayResult;
          if (cpPayData && noPendingMutations()) {
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

          const { data: spPayData } = spPayResult;
          if (spPayData && noPendingMutations()) {
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

          const { data: editsData } = editsResult;
          if (editsData && noPendingMutations()) {
            dispatch({
              type: "orderEdits/setOrderEdits",
              payload: editsData.map((e: any) => ({
                id: e.id, orderId: e.order_id, orderType: e.order_type,
                editedBy: e.edited_by, editedByName: e.edited_by_name,
                diff: e.diff, createdAt: e.created_at,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching initial data from Supabase:", err);
        // Retry with exponential backoff: 5s, 10s, 20s — then give up
        if (mounted && fetchRetryCountRef.current < 3) {
          const delay = [5_000, 10_000, 20_000][fetchRetryCountRef.current] ?? 20_000;
          fetchRetryCountRef.current += 1;
          console.warn(`Initial fetch failed, retrying in ${delay / 1000}s (attempt ${fetchRetryCountRef.current}/3)`);
          fetchRetryTimerRef.current = setTimeout(() => {
            if (mounted) setHasFetchedInitial(false); // re-trigger the effect
          }, delay);
          setIsSyncing(false);
          return; // Do NOT mark hasFetchedInitial — allow retry
        }
        // Max retries exhausted — mark complete so user can still use cached data
        console.error("Initial fetch failed after 3 retries, using cached data");
      } finally {
        if (mounted) {
          setHasFetchedInitial(true);
          setIsSyncing(false);
          hasRemoteFetchedRef.current = true;
          fetchRetryCountRef.current = 0; // reset for next session/resume cycle
        }
      }
    }

    // CRUCIAL: Do not fetch remote data over local data if outbox has unsynced local mutations.
    // Stuck items (permanent_conflict) are excluded — they no longer mutate server state.
    if (pendingCount === 0) {
      if (isOnline) {
        fetchInitialData();
      } else {
        // Offline on start: trust local persist, don't fetch.
        // hasRemoteFetchedRef stays false so connectivity-restore handler will trigger fetch.
        setHasFetchedInitial(true);
        setIsSyncing(false);
      }
    }

    return () => {
      mounted = false;
      clearTimeout(fetchRetryTimerRef.current);
    };
  }, [
    isAuthLoading,
    session,
    hasFetchedInitial,
    pendingCount,  // tracks non-stuck items only — drops when items are synced OR marked stuck
    isOnline,
    networkReady,
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
              gstin: c.gstin ?? undefined,
              state: c.state ?? undefined,
              address: c.address ?? undefined,
              pincode: c.pincode ?? undefined,
              aadhaarEncrypted: c.aadhaar_encrypted ?? undefined,
              aadhaarLast4: c.aadhaar_last4 ?? undefined,
              tags: c.tags?.length ? c.tags : undefined,
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
