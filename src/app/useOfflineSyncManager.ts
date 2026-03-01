import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "./store";
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
      toast.success("Back Online", {
        description:
          "Your connection has been restored. Syncing pending data...",
      });
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      toast.error("Offline", {
        description:
          "You are currently offline. Changes will be saved locally.",
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

    async function processOutbox() {
      if (isProcessingOutboxRef.current) return;
      isProcessingOutboxRef.current = true;

      // We make a stable copy of the outbox array to process
      const currentOutbox = [...outbox];

      for (const item of currentOutbox) {
        if (!mounted || !isOnline) break;

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
    }

    processOutbox();

    return () => {
      mounted = false;
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
            purchasePrice: p.purchase_price,
            salePrice: p.sale_price ?? undefined,
            status: p.status as any,
            issueTags: p.issue_tags,
            createdAt: p.created_at,
          }));
          dispatch({ type: "inventory/setPhones", payload: phones });
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
            amount: e.amount,
            createdAt: e.created_at,
          }));
          dispatch({ type: "ledger/setEntries", payload: entries });
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
