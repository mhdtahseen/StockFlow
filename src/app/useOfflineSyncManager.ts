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
import { syncActionToSupabase } from "./supabaseApi";
import { toast } from "sonner";

export function useOfflineSyncManager() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const dispatch = useDispatch();

  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const outbox = useSelector((state: RootState) => state.sync.outbox);

  const [isSyncing, setIsSyncing] = useState(true);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    dispatch(setOnlineStatus(navigator.onLine));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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

      // We make a stable copy of the outbox array to process
      const currentOutbox = [...outbox];
      const now = Date.now();
      let earliestNextAttemptAt: number | null = null;

      for (const item of currentOutbox) {
        if (!mounted || !isOnline) break;

        if (item.nextAttemptAt && item.nextAttemptAt > now) {
          if (
            earliestNextAttemptAt === null ||
            item.nextAttemptAt < earliestNextAttemptAt
          ) {
            earliestNextAttemptAt = item.nextAttemptAt;
          }
          continue;
        }

        // Hard cap: permanently discard after 5 retries to prevent infinite loops
        if (item.retryCount >= 5) {
          console.error(`[Outbox] Permanently dropping action after 5 retries:`, item.action.type);
          dispatch(removeAction(item.id));
          continue;
        }

        const success = await syncActionToSupabase(item.action);

        if (success) {
          // Task succeeded
          dispatch(removeAction(item.id));
        } else {
          // Task failed
          dispatch(incrementRetry(item.id));
          // If a task fails (likely connection hit a blip), we break and wait for next tick
          break;
        }
      }

      isProcessingOutboxRef.current = false;

      if (mounted && isOnline && earliestNextAttemptAt !== null) {
        const delayMs = Math.max(0, earliestNextAttemptAt - Date.now());
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
          
          // Customers (counterparties)
          const { data: cpData } = await supabase
            .from("counterparties")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("name");
          if (cpData && mounted && store.getState().sync.outbox.length === 0) {
            dispatch({
              type: "customers/setAll",
              payload: cpData.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                phone: c.phone,
                email: c.email,
                platformName: c.platform_name,
                linkedTenantId: c.linked_tenant_id,
                notes: c.notes,
                createdAt: c.created_at,
              })),
            });
          }

          // Open + Partial sales orders (with items)
          const { data: soData } = await supabase
            .from("sale_orders")
            .select("*, sale_order_items(*)")
            .eq("tenant_id", tenantId)
            .in("status", ["OPEN", "PARTIAL"])
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

          // Open + Awaiting purchase orders (with items)
          const { data: poData } = await supabase
            .from("purchase_orders")
            .select("*, purchase_order_items(*)")
            .eq("tenant_id", tenantId)
            .in("status", ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL"])
            .order("created_at", { ascending: false });
          if (poData && mounted && store.getState().sync.outbox.length === 0) {
            dispatch({
              type: "purchasing/setPurchaseOrders",
              payload: poData.map((o: any) => ({
                id: o.id, counterpartyId: o.counterparty_id, acquisitionChannel: o.acquisition_channel,
                platformFee: o.platform_fee, phonesOrdered: o.phones_ordered,
                phonesReceived: o.phones_received, totalAmount: o.total_amount,
                amountPaid: o.amount_paid, status: o.status, paymentMode: o.payment_mode,
                dueDate: o.due_date, notes: o.notes, createdAt: o.created_at,
                items: o.purchase_order_items.map((i: any) => ({
                  id: i.id, purchaseOrderId: i.purchase_order_id, phoneId: i.phone_id,
                  purchasePrice: i.purchase_price, status: i.status, rejectionReason: i.rejection_reason
                }))
              })),
            });
          }

          // Recent customer payments (last 30 days)
          const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 3600 * 1000,
          ).toISOString();
          const { data: cpPayData } = await supabase
            .from("customer_payments")
            .select("*, payment_allocations(*)")
            .eq("tenant_id", tenantId)
            .gte("received_at", thirtyDaysAgo)
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

          // Recent supplier payments (last 30 days)
          const { data: spPayData } = await supabase
            .from("supplier_payments")
            .select("*, supplier_allocations(*)")
            .eq("tenant_id", tenantId)
            .gte("paid_at", thirtyDaysAgo)
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

  return { isSyncing };
}
