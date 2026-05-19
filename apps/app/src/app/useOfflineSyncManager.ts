import { useEffect, useState, useRef } from "react";
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
} from "@/features/sync/slice";
import { addCustomer } from "@/features/customers/slice";
import { syncActionToSupabase } from "./supabaseApi";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

export function useOfflineSyncManager() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const dispatch = useDispatch();

  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const outbox = useSelector((state: RootState) => state.sync.outbox);

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

  // 1. ONLINE / OFFLINE LISTENERS
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      toast.success("System Online", {
        description:
          "Connection restored. Synchronizing pending transactions with the server.",
      });
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      toast.error("System Offline", {
        description:
          "Connection lost. Operating in offline mode. Data is securely saved on this device.",
      });
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
        listenerPromise.then((handle) => handle.remove());
      };
    } else {
      // Web fallback
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      dispatch(setOnlineStatus(navigator.onLine));

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [dispatch]);

  // 2. PROCESS OUTBOX WHEN ONLINE
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
          const item = currentOutbox[0]; // Always process the first available item

          if (item.nextAttemptAt && item.nextAttemptAt > now) {
            hasMore = false; // Wait for scheduled retry
            break;
          }

          if (item.retryCount >= 5) {
            console.error(`[Outbox] Permanently dropping action after 5 retries:`, item.action.type);
            dispatch(removeAction(item.id));
            continue;
          }

          const success = await syncActionToSupabase(item.action);

          if (success) {
            dispatch(removeAction(item.id));
          } else {
            dispatch(incrementRetry(item.id));
            hasMore = false; // Stop on failure to avoid hammering
          }
        }
      } finally {
        isProcessingOutboxRef.current = false;
      }

      // Re-check for early retries
      const state = store.getState() as RootState;
      const nextRetries = state.sync.outbox.filter(i => i.nextAttemptAt);
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

  // 3. INITIAL LOAD (Wait until outbox is empty)
  useEffect(() => {
    if (isAuthLoading || hasFetchedInitial || !session) {
      if (!isAuthLoading && !session) setIsSyncing(false); // guest user or unauthenticated
      return;
    }

    let mounted = true;

    async function fetchInitialData() {
      setIsSyncing(true);

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
          // ONLY OVERWRITE IF NO MUTATIONS OCCURRED DURING FETCH
          if (store.getState().sync.outbox.length === 0) {
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
          if (store.getState().sync.outbox.length === 0) {
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

          if (store.getState().sync.outbox.length === 0) {
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
          if (cpData && mounted && store.getState().sync.outbox.length === 0) {
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
          if (soData && mounted && store.getState().sync.outbox.length === 0) {
            dispatch({ type: "billing/setOrders", payload: soData.map((o: any) => ({
              id: o.id, counterpartyId: o.counterparty_id, orderType: o.order_type,
              totalAmount: o.total_amount, amountPaid: o.amount_paid,
              status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
              notes: o.notes, createdAt: o.created_at,
              items: o.sale_order_items.map((i: any) => ({
                id: i.id, saleOrderId: i.sale_order_id, phoneId: i.phone_id,
                salePrice: i.sale_price, discountAmount: i.discount_amount,
                imeiSnapshot: i.imei_snapshot || [], brandSnapshot: i.brand_snapshot,
                modelSnapshot: i.model_snapshot, storageSnapshot: i.storage_snapshot, colorSnapshot: i.color_snapshot
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
          if (poData && mounted && store.getState().sync.outbox.length === 0) {
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
          if (cpPayData && mounted && store.getState().sync.outbox.length === 0) {
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
          if (spPayData && mounted && store.getState().sync.outbox.length === 0) {
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
          if (editsData && mounted && store.getState().sync.outbox.length === 0) {
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

    // CRUCIAL: Do not fetch remote data over local data if outbox has unsynced local mutations
    if (outbox.length === 0) {
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
    outbox.length,
    isOnline,
    dispatch,
  ]);

  // 4. REALTIME: counterparty INSERTs — receiving side of a trade connection
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

  return { isSyncing };
}
