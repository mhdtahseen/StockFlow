import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Share as ShareIcon } from "@capacitor/share";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Share,
  History,
  Circle,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  PhoneCall,
  Calendar,
  IndianRupee,
  FileText,
  BadgeCheck,
  BadgeAlert,
  Loader2,
  ShieldAlert,
  Smartphone,
  DollarSign,
  Plus,
  Pencil,
  Building2,
  ArrowRightLeft,
  Receipt,
} from "lucide-react";
import {
  SiApple,
  SiSamsung,
  SiGoogle,
  SiXiaomi,
  SiMotorola,
  SiOppo,
  SiVivo,
  SiOneplus,
  SiHuawei,
  SiNokia,
  SiAsus,
  SiSony,
} from "react-icons/si";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { addOrder, returnOrder } from "@/features/billing/slice";
import { markAsInStock } from "@/features/inventory/slice";
import { addEntry } from "@/features/ledger/slice";
import { addPurchaseOrder } from "@/features/purchasing/slice";
import { printDocument } from "@/utils/printDocument";
import { createShareLink, copyToClipboard } from "@/services/shareService";
import { syncTransferStatus } from "@/app/supabaseApi";
import posthog from "@/lib/posthog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { RecordPaymentSheet } from "@/components/shared/RecordPaymentSheet";
import { PurchaseOrderConfirmSheet } from "@/components/shared/PurchaseOrderConfirmSheet";
import { EditPurchaseOrderSheet } from "@/components/shared/EditPurchaseOrderSheet";
import { EditSaleOrderSheet } from "@/components/shared/EditSaleOrderSheet";
import HeaderActions from "@/components/layout/HeaderActions";
import { DeviceListItem } from "@/components/shared/DeviceListItem";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Turns an order_edits diff JSONB into a human-readable one-liner for the timeline. */
function buildEditDescription(diff: Record<string, any>): string {
  const parts: string[] = [];
  if (diff.counterparty_id) parts.push("Supplier changed");
  if (diff.platform_fee)
    parts.push(`Platform fee: ₹${diff.platform_fee.old} → ₹${diff.platform_fee.new}`);
  if (diff.notes) parts.push("Notes updated");
  if (diff.due_date) parts.push("Due date changed");
  if (diff.acquisition_channel) parts.push("Channel changed");
  if (diff.items_added?.length)
    parts.push(`${diff.items_added.length} item(s) added`);
  if (diff.items_removed?.length)
    parts.push(`${diff.items_removed.length} item(s) removed`);
  if (diff.items_changed?.length) {
    const priceEdits = diff.items_changed
      .map((c: any) => `${c.brand} ${c.model} ₹${c.old_price}→₹${c.new_price}`)
      .join(", ");
    parts.push(`Price updated: ${priceEdits}`);
  }
  return parts.length ? parts.join(" · ") : "Order details updated";
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canUse } = usePlan();
  const { tenant, user } = useAuth();

  const order = useAppSelector(
    (state) =>
      state.billing.orders.find((o) => o.id === id) ||
      state.purchasing.orders.find((o) => o.id === id),
  );
  const customer = useAppSelector((state) =>
    state.customers.customers.find((c) => c.id === order?.counterpartyId),
  );
  const phones = useAppSelector((state) => state.inventory.phones);
  const _ledgerEntries = useAppSelector((state) => state.ledger.entries);
  const _pendingEntries = useAppSelector(
    (state) => state.ledger.pendingEntries || [],
  );
  // Merge confirmed + optimistic pending entries for Finance tab display.
  // useMemo avoids creating a new array reference on every render (prevents Redux selector warning).
  const ledgerEntries = React.useMemo(() => {
    const official = [..._ledgerEntries];
    const filteredPending = (_pendingEntries || []).filter((pending) => {
      // 1. Explicit ID match
      if (official.some((o) => o.id === pending.id)) return false;

      // 2. Semantic match: same order + same type + same amount
      // This is the "Safety Net" for the FE buffer vs DB overlap
      const isRedundant = official.some((o) => {
        const oPoId = o.purchaseOrderId || (o as any).purchase_order_id;
        const oSoId = o.saleOrderId || (o as any).sale_order_id;
        const pPoId =
          pending.purchaseOrderId || (pending as any).purchase_order_id;
        const pSoId = pending.saleOrderId || (pending as any).sale_order_id;

        const matchesOrder =
          (oPoId && oPoId === pPoId) || (oSoId && oSoId === pSoId);

        // --- AUDIT FIX: Proximity check ---
        // Only deduplicate if they were created within 30 minutes of each other.
        // This stops UI from hiding legitimate separate payments of the same amount.
        const timeDiffMs = Math.abs(
          new Date(o.createdAt).getTime() -
            new Date(pending.createdAt).getTime(),
        );
        const isTimeMatch = timeDiffMs < 30 * 60 * 1000; // 30 mins

        return (
          matchesOrder &&
          o.type === pending.type &&
          Math.abs(o.amount) === Math.abs(pending.amount) &&
          isTimeMatch
        );
      });

      return !isRedundant;
    });

    return [...official, ...filteredPending];
  }, [_ledgerEntries, _pendingEntries]);

  const customerPayments = useAppSelector(
    (state) => state.customers.payments || [],
  );
  const purchasingPayments = useAppSelector(
    (state) => state.purchasing.payments || [],
  );

  // Payments fetched directly from DB for this order — stored locally to avoid
  // dispatching addCustomerPayment/addSupplierPayment (which would hit the outbox)
  const [fetchedCustomerPayments, setFetchedCustomerPayments] = React.useState<any[]>([]);
  const [fetchedSupplierPayments, setFetchedSupplierPayments] = React.useState<any[]>([]);

  // Merge Redux payments with locally-fetched ones, deduped by id
  const mergedCustomerPayments = React.useMemo(() => {
    const map = new Map<string, any>();
    [...customerPayments, ...fetchedCustomerPayments].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [customerPayments, fetchedCustomerPayments]);

  const mergedSupplierPayments = React.useMemo(() => {
    const map = new Map<string, any>();
    [...purchasingPayments, ...fetchedSupplierPayments].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [purchasingPayments, fetchedSupplierPayments]);

  const isPurchaseOrder = useAppSelector((state) =>
    state.purchasing.orders.some((o) => o.id === id),
  );
  const [activeTab, setActiveTab] = useState<
    "financials" | "settlement" | "items" | "timeline"
  >("financials");

  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showFullEditSheet, setShowFullEditSheet] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Order edits for timeline
  const orderEditHistory = useAppSelector(
    React.useCallback(
      (state: any) => state.orderEdits?.edits?.filter((e: any) => e.orderId === id) ?? [],
      [id],
    ),
  );

  // Always fetch financial data (ledger + payments) for this order from Supabase.
  // This runs on every id change so we never show stale/empty finance tabs,
  // even when the order is already in Redux from local creation.
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    async function fetchOrderFinancials() {
      try {
        // 1. Ledger entries for this order
        const { data: ledgerData } = await supabase
          .from("ledger")
          .select("*")
          .or(`sale_order_id.eq.${id},purchase_order_id.eq.${id},reference_id.eq.${id}`);
        if (ledgerData && mounted) {
          ledgerData.forEach((entry: any) => {
            dispatch(
              addEntry({
                id: entry.id,
                type: entry.type,
                amount: Number(entry.amount),
                paymentMode: entry.payment_mode ?? undefined,
                note: entry.note ?? undefined,
                saleOrderId: entry.sale_order_id ?? undefined,
                purchaseOrderId: entry.purchase_order_id ?? undefined,
                referenceId: entry.reference_id ?? undefined,
                customerPaymentId: entry.customer_payment_id ?? undefined,
                supplierPaymentId: entry.supplier_payment_id ?? undefined,
                settlementCount: entry.settlement_count ?? undefined,
                createdAt: entry.created_at,
              } as any),
            );
          });
        }

        // 2. Customer payments with allocations for this order — stored in local state,
        // NOT dispatched to Redux (avoids outbox/sync side effects)
        const { data: allocData } = await supabase
          .from("payment_allocations")
          .select("customer_payment_id")
          .eq("sale_order_id", id);
        if (allocData && allocData.length > 0 && mounted) {
          const paymentIds = allocData.map((a: any) => a.customer_payment_id).filter(Boolean);
          if (paymentIds.length > 0) {
            const { data: cpData } = await supabase
              .from("customer_payments")
              .select("*, payment_allocations(*)")
              .in("id", paymentIds);
            if (cpData && mounted) {
              setFetchedCustomerPayments(
                cpData.map((p: any) => ({
                  id: p.id,
                  counterpartyId: p.counterparty_id,
                  totalReceived: Number(p.total_received),
                  mode: p.mode,
                  receivedAt: p.received_at,
                  note: p.note ?? undefined,
                  recordedBy: p.recorded_by,
                  allocations: (p.payment_allocations || []).map((a: any) => ({
                    saleOrderId: a.sale_order_id,
                    amountAllocated: Number(a.amount_allocated),
                    note: a.note ?? undefined,
                  })),
                }))
              );
            }
          }
        }

        // 3. Supplier payment allocations for PO — same pattern
        const { data: spAllocData } = await supabase
          .from("supplier_allocations")
          .select("supplier_payment_id")
          .eq("purchase_order_id", id);
        if (spAllocData && spAllocData.length > 0 && mounted) {
          const spIds = spAllocData.map((a: any) => a.supplier_payment_id).filter(Boolean);
          if (spIds.length > 0) {
            const { data: spData } = await supabase
              .from("supplier_payments")
              .select("*, supplier_allocations(*)")
              .in("id", spIds);
            if (spData && mounted) {
              setFetchedSupplierPayments(
                spData.map((p: any) => ({
                  id: p.id,
                  counterpartyId: p.counterparty_id,
                  totalPaid: Number(p.total_paid),
                  mode: p.mode,
                  paidAt: p.paid_at,
                  note: p.note ?? undefined,
                  recordedBy: p.recorded_by,
                  allocations: (p.supplier_allocations || []).map((a: any) => ({
                    purchaseOrderId: a.purchase_order_id,
                    amountAllocated: Number(a.amount_allocated),
                    note: a.note ?? undefined,
                  })),
                }))
              );
            }
          }
        }
      } catch (e) {
        // Non-fatal — finance data will show from Redux if available
        console.warn("[OrderDetail] Financial data fetch failed:", e);
      }
    }
    fetchOrderFinancials();
    return () => { mounted = false; };
  }, [id, dispatch]);

  // Lazy-fetch settled/historical orders not in Redux state (A-004 / QA-011)
  useEffect(() => {
    if (order || !id || isFetching || fetchFailed) return;
    let mounted = true;
    async function fetchOrder() {
      setIsFetching(true);
      try {
        // Try Sales first
        let { data, error } = await supabase
          .from("sale_orders")
          .select("*, sale_order_items(*)")
          .eq("id", id)
          .maybeSingle();

        // If not found in Sales, try Purchases
        if (error || !data) {
          const { data: poData, error: poError } = await supabase
            .from("purchase_orders")
            .select("*, purchase_order_items(*)")
            .eq("id", id)
            .maybeSingle();

          if (poError || !poData) {
            if (mounted) setFetchFailed(true);
            return;
          }

          if (!mounted) return;

          // Map PO to PurchaseOrder shape
          dispatch(
            addPurchaseOrder({
              id: poData.id,
              counterpartyId: poData.counterparty_id,
              acquisitionChannel: poData.acquisition_channel || "DIRECT",
              platformFee: poData.platform_fee || 0,
              phonesOrdered:
                poData.phones_ordered ||
                (poData.purchase_order_items || []).length,
              phonesReceived:
                poData.phones_received ||
                (poData.purchase_order_items || []).length,
              status: poData.status,
              totalAmount: poData.total_amount,
              amountPaid: poData.amount_paid,
              dueDate: poData.due_date,
              createdAt: poData.created_at,
              items: (poData.purchase_order_items || []).map((i: any) => ({
                id: i.id,
                purchaseOrderId: i.purchase_order_id,
                phoneId: i.phone_id,
                purchasePrice: i.purchase_price ?? 0,
                status: i.status,
                rejectionReason: i.rejection_reason,
                brand: i.brand,
                model: i.model,
                storage: i.storage,
                color: i.color,
                ram: i.ram,
                imei: i.imei,
              })),
            }),
          );
          // Fetch ledger entries for this order
          const { data: ledgerData } = await supabase
            .from("ledger")
            .select("*")
            .or(
              `purchase_order_id.eq.${id},sale_order_id.eq.${id},reference_id.eq.${id}`,
            );

          if (ledgerData) {
            ledgerData.forEach((entry: any) => {
              dispatch(
                addEntry({
                  id: entry.id,
                  tenantId: entry.tenant_id,
                  userId: entry.user_id,
                  type: entry.type,
                  amount: entry.amount,
                  paymentMode: entry.payment_mode,
                  saleOrderId: entry.sale_order_id,
                  purchaseOrderId: entry.purchase_order_id,
                  referenceId: entry.reference_id,
                  note: entry.note,
                  createdAt: entry.created_at,
                } as any),
              );
            });
          }

          return;
        }

        if (!mounted) return;

        // Map sale_case to camelCase
        dispatch(
          addOrder({
            id: data.id,
            counterpartyId: data.counterparty_id,
            orderType: data.order_type,
            status: data.status,
            totalAmount: data.total_amount,
            amountPaid: data.amount_paid,
            paymentMode: data.payment_mode,
            dueDate: data.due_date,
            notes: data.notes,
            createdAt: data.created_at,
            items: (data.sale_order_items || []).map((i: any) => ({
              id: i.id,
              phoneId: i.phone_id,
              brandSnapshot: i.brand_snapshot,
              modelSnapshot: i.model_snapshot,
              storageSnapshot: i.storage_snapshot,
              colorSnapshot: i.color_snapshot,
              imeiSnapshot: i.imei_snapshot || [],
              salePrice: i.sale_price ?? 0,
              effectivePrice: i.effective_price ?? i.sale_price ?? 0,
              discountAmount: i.discount_amount ?? 0,
            })),
          }),
        );

        // Fetch ledger entries for this order
        const { data: ledgerData } = await supabase
          .from("ledger")
          .select("*")
          .or(
            `purchase_order_id.eq.${id},sale_order_id.eq.${id},reference_id.eq.${id}`,
          );

        if (ledgerData) {
          ledgerData.forEach((entry: any) => {
            dispatch(
              addEntry({
                id: entry.id,
                tenantId: entry.tenant_id,
                userId: entry.user_id,
                type: entry.type,
                amount: entry.amount,
                paymentMode: entry.payment_mode,
                saleOrderId: entry.sale_order_id,
                purchaseOrderId: entry.purchase_order_id,
                referenceId: entry.reference_id,
                note: entry.note,
                createdAt: entry.created_at,
              } as any),
            );
          });
        }
      } catch (e) {
        if (mounted) setFetchFailed(true);
      } finally {
        if (mounted) setIsFetching(false);
      }
    }
    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [id, order, dispatch, isFetching, fetchFailed]);

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_INSPECTION":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60";
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center gap-3">
        <Loader2 size={28} className="text-primary-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 justify-center items-center gap-3">
        <ShieldAlert size={36} className="text-red-400" />
        <p className="font-bold text-red-500">
          {fetchFailed ? "Order not found" : "Loading..."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const poAcceptedTotal = isPurchaseOrder
    ? order.items
        .filter((item: any) => item.status === "ACCEPTED")
        .reduce((sum: number, item: any) => sum + (item.purchasePrice || 0), 0)
    : 0;

  const poPendingCount = isPurchaseOrder
    ? order.items.filter((i: any) => i.status === "PENDING_INSPECTION").length
    : 0;

  const isInspected = React.useMemo(() => {
    if (!isPurchaseOrder) return true;
    return (order.items || []).some(
      (item: any) => item.status === "ACCEPTED" || item.status === "REJECTED",
    );
  }, [isPurchaseOrder, order.items]);

  const isAwaitingReceipt =
    isPurchaseOrder &&
    ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL"].includes(order.status) &&
    poPendingCount > 0;

  const outstanding = (order.totalAmount || 0) - (order.amountPaid || 0);

  const totalSaleProfit = !isPurchaseOrder
    ? order.items.reduce((sum, item) => {
        const phone = phones.find((p) => p.id === item.phoneId);
        if (!phone) return sum;
        const repairs = ledgerEntries
          .filter(
            (e) => e.type === "REPAIR_COST" && e.referenceId === item.phoneId,
          )
          .reduce((s, e) => s + Math.abs(e.amount), 0);
        return (
          sum +
          (((item as any).effectivePrice || 0) -
            (phone.purchasePrice + repairs))
        );
      }, 0)
    : 0;

  // ── Unified Payment Logic ──
  // Build a set of "covered" fingerprints: official entries that have customerPaymentId/
  // supplierPaymentId — these represent the authoritative DB record for a given payment.
  // Any entry without a payment ID that matches the same order+type+amount+timeWindow
  // is a pre-RPC optimistic local entry and should be excluded to avoid doubling.
  const coveredFingerprints = new Set(
    ledgerEntries
      .filter((e: any) =>
        (e.customerPaymentId || (e as any).customer_payment_id ||
         e.supplierPaymentId || (e as any).supplier_payment_id) &&
        (e.saleOrderId === order.id || e.purchaseOrderId === order.id ||
         e.referenceId === order.id || (e as any).sale_order_id === order.id ||
         (e as any).purchase_order_id === order.id)
      )
      .map((e: any) => `${e.type}:${Math.abs(e.amount)}:${Math.floor(new Date(e.createdAt).getTime() / 30000)}`),
  );

  // 1. Direct ledger entries — payments recorded individually against this order
  const directLedgerPayments = ledgerEntries
    .filter((e: any) => {
      const matchesOrder =
        e.purchaseOrderId === order.id ||
        e.saleOrderId === order.id ||
        e.referenceId === order.id;
      if (!matchesOrder) return false;

      // Exclude entries that belong to a bulk payment — they're captured via allocatedPayments below
      if (
        e.supplierPaymentId ||
        e.customerPaymentId ||
        (e as any).supplier_payment_id ||
        (e as any).customer_payment_id
      ) {
        return false;
      }

      // Exclude optimistic local entries that have already been confirmed by a
      // DB-fetched entry with a customerPaymentId/supplierPaymentId (same type+amount+timeWindow)
      const fingerprint = `${e.type}:${Math.abs(e.amount)}:${Math.floor(new Date(e.createdAt).getTime() / 30000)}`;
      if (coveredFingerprints.has(fingerprint)) {
        return false;
      }

      if (e.type === "DEBT_SETTLEMENT" || e.type === "ADVANCE_RECEIVED") {
        return false;
      }

      if (isPurchaseOrder) {
        return (
          (e.type === "SUPPLIER_PAYMENT") &&
          Math.abs(e.amount) > 0
        );
      } else {
        return (
          (e.type === "CUSTOMER_PAYMENT" ||
            e.type === "PHONE_SALE") &&
          Math.abs(e.amount) > 0
        );
      }
    })
    .map((e: any) => ({
      id: e.id,
      amount: Math.abs(e.amount),
      createdAt: e.createdAt,
      paymentMode: e.paymentMode || "UNKNOWN",
      source: "direct" as const,
    }));

  // 2. Bulk payment allocations — FIFO/manual settlements from the payment allocation sheet
  const allocatedPayments = isPurchaseOrder
    ? mergedSupplierPayments.flatMap((p) => {
        const alloc = p.allocations?.find(
          (a: any) => a.purchaseOrderId === order.id,
        );
        if (!alloc) return [];
        return [
          {
            id: p.id,
            amount: alloc.amountAllocated,
            createdAt: p.paidAt,
            paymentMode: p.mode || "UNKNOWN",
            source: "allocated" as const,
          },
        ];
      })
    : mergedCustomerPayments.flatMap((p) => {
        const alloc = p.allocations?.find((a: any) => a.saleOrderId === order.id);
        if (!alloc) return [];
        return [
          {
            id: p.id,
            amount: alloc.amountAllocated,
            createdAt: p.receivedAt,
            paymentMode: p.mode || "UNKNOWN",
            source: "allocated" as const,
          },
        ];
      });

  // 3. Merge, deduplicate (same real payment can appear in both paths), sort oldest-first
  const allocatedIds = new Set(allocatedPayments.map((p) => p.id));
  // Also deduplicate by amount+timestamp within a 5-second window to catch PO ledger duplicates
  const allocatedFingerprints = new Set(
    allocatedPayments.map(
      (p) =>
        `${p.amount}:${Math.floor(new Date(p.createdAt).getTime() / 5000)}`,
    ),
  );
  const dedupedDirectPayments = directLedgerPayments.filter(
    (p) =>
      !allocatedIds.has(p.id) &&
      !allocatedFingerprints.has(
        `${p.amount}:${Math.floor(new Date(p.createdAt).getTime() / 5000)}`,
      ),
  );

  const allOrderPaymentEntries = [
    ...dedupedDirectPayments,
    ...allocatedPayments,
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // 4. Tag each entry — first is Advance, subsequent direct entries are Direct Payment,
  //    bulk allocation entries are Bulk Settlement
  let runningTotal = 0;
  const unifiedPayments = allOrderPaymentEntries
    .map((e, idx) => {
      const amt = Math.abs(e.amount);
      runningTotal += amt;
      const isFirstEntry = idx === 0;

      let entryType: "ADVANCE" | "DIRECT" | "BULK_SETTLEMENT";
      if (isFirstEntry) {
        entryType = "ADVANCE";
      } else if (e.source === "allocated") {
        entryType = "BULK_SETTLEMENT";
      } else {
        entryType = "DIRECT";
      }

      return {
        id: e.id,
        amount: amt,
        runningTotal,
        receivedAt: e.createdAt,
        paymentMode: e.paymentMode || "UNKNOWN",
        source: e.source,
        entryType,
      };
    })
    .reverse();

  // --- REVERSE CHRONOLOGICAL TIMELINE ---
  const timelineEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    note?: string;
    color: string;
    diff?: Record<string, any>;
  }> = [
    {
      id: "creation",
      type: "CREATION",
      title: "Order Initiated",
      description: `${isPurchaseOrder ? "Purchase" : (order as any).orderType || "Sales"} Order Generated`,
      timestamp: order.createdAt,
      note: undefined,
      color: "bg-primary-500",
    },
    ...unifiedPayments.map((p) => ({
      id: p.id,
      type: "PAYMENT",
      title: isPurchaseOrder ? "Payment Sent" : "Payment Received",
      description: `₹${p.amount.toLocaleString()} via ${p.paymentMode}`,
      note: undefined,
      timestamp: p.receivedAt,
      color: "bg-emerald-500",
    })),
    // Audit trail: each edit shows as an EDIT event (amber dot)
    ...orderEditHistory.map((e: any) => ({
      id: e.id,
      type: "EDIT",
      title: "Order Edited",
      description: buildEditDescription(e.diff),
      timestamp: e.createdAt,
      note: e.editedByName ? `by ${e.editedByName}` : undefined,
      color: "bg-amber-500",
      diff: e.diff,
    })),
  ];

  if (order.status === "SETTLED" && unifiedPayments.length > 0) {
    timelineEvents.push({
      id: "settlement",
      type: "SETTLEMENT",
      title: "Order Settled",
      description: "Account Fully Cleared",
      timestamp: unifiedPayments[0].receivedAt, // Sorted by date desc, so index 0 is latest
      note: undefined,
      color: "bg-emerald-600",
    });
  }

  if (order.status === "RETURNED" || order.status === "CANCELLED") {
    timelineEvents.push({
      id: "void",
      type: "VOID",
      title: order.status === "RETURNED" ? "Order Returned" : "Order Cancelled",
      description:
        order.status === "RETURNED"
          ? "Devices restocked & Refunded"
          : "Transaction Voided",
      timestamp: new Date().toISOString(), // Use now as fallback for current status
      note: undefined,
      color: "bg-rose-500",
    });
  }

  const eventPriority: Record<string, number> = {
    VOID: 4,
    SETTLEMENT: 3,
    PAYMENT: 2,
    EDIT: 2,
    CREATION: 1,
  };

  const sortedTimeline = [...timelineEvents]
    // Dedupe by id (in case the same payment appears from both local + DB fetch)
    .filter((ev, idx, arr) => arr.findIndex((x) => x.id === ev.id) === idx)
    .sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (Math.abs(timeA - timeB) > 1000) return timeB - timeA;

    // Tie-breaker: Priority then ID
    const prioA = eventPriority[a.type] || 0;
    const prioB = eventPriority[b.type] || 0;
    if (prioB !== prioA) return prioB - prioA;
    return (b.id || "").localeCompare(a.id || "");
  });

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {},
  );
  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const CollapsibleNote = ({
    id,
    text,
    className,
  }: {
    id: string;
    text: string;
    className?: string;
  }) => {
    const isExpanded = expandedNotes[id];
    const isLong = text.length > 80;

    if (!isLong) return <p className={className}>{text}</p>;

    return (
      <div className={className}>
        <p className={clsx("transition-all", !isExpanded && "line-clamp-2")}>
          {text}
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleNote(id);
          }}
          className="text-primary-500 font-bold text-[10px] uppercase mt-1 hover:underline"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      </div>
    );
  };

  const handleReturn = () => {
    if (isReturning) return;
    if (
      window.confirm(
        "Are you sure you want to process a full return for this order? This will restock all devices and record a negative sale entry.",
      )
    ) {
      if (isPurchaseOrder) {
        // Full PO returns are handled via item rejection or manual adjustments.
        // If a full logic exists for PO return status, it should trigger here.
        toast.info("PO Return", {
          description:
            "Use individual item rejections for partial PO reconciliation.",
        });
      } else {
        // Handle sale order return - WATCHTOWER will auto-log the refund entry
        dispatch(returnOrder(order.id));

        // Restock phones
        order.items.forEach((item) => {
          if (item.phoneId) {
            dispatch(
              markAsInStock({
                id: item.phoneId,
                finalPrice: (item as any).effectivePrice,
              }),
            );
          }
        });
        setIsReturning(true);
        toast.success("Order Returned", {
          description: "Devices restocked and refund initiated.",
        });
      }
    }
  };

  const generateInvoice = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await printDocument(order as any, customer, tenant, isPurchaseOrder);
      posthog.capture("invoice.generated", { type: isPurchaseOrder ? "purchase" : "sale" });
      // On native the share sheet opens — no toast needed (user sees the sheet).
      // On web, the print dialog opens.
      if (!Capacitor.isNativePlatform()) {
        toast.success("Document Ready", {
          description: `Print dialog opened for ${order.id.slice(0, 8).toUpperCase()}.`,
        });
      }
    } catch (error) {
      console.error("Document Gen Error:", error);
      toast.error("Generation Failed", {
        description: (error as Error)?.message || "Could not create document.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (isSharing || !tenant) return;
    setIsSharing(true);

    try {
      // 1. Generate the public link
      const shareUrl = await createShareLink(
        order.id,
        isPurchaseOrder ? "PURCHASE" : "SALE",
        tenant.id,
      );
      posthog.capture("share_link.created", { type: isPurchaseOrder ? "purchase" : "sale" });

      const shareData = {
        title: `Finventree: ${order.id.slice(0, 8).toUpperCase()}`,
        text: `View the ${isPurchaseOrder ? "Purchase Order" : "Invoice"} for ${customer?.name || "Order"}.`,
        url: shareUrl,
      };

      // 2. Share via Capacitor (native) or Web Share API / clipboard fallback
      if (Capacitor.isNativePlatform()) {
        await ShareIcon.share(shareData);
        toast.success("Shared successfully");
      } else if (navigator.share) {
        try {
          await navigator.share(shareData);
          toast.success("Shared successfully");
        } catch {
          // AbortError = user cancelled — don't fall through to clipboard toast
          copyToClipboard(shareUrl);
          toast.success("Link copied", { description: "Paste it anywhere to share." });
        }
      } else {
        copyToClipboard(shareUrl);
        toast.success("Link copied", { description: "Sharing link copied to clipboard." });
      }
    } catch (err) {
      console.error("Share Error:", err);
      toast.error("Could not generate share link");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-4">
      <HeaderActions>
        <div className="flex items-center gap-2">
          {isInspected && (
            <FeatureGate feature="public_sharing">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Share Document"
              >
                {isSharing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Share size={18} />
                )}
              </button>
            </FeatureGate>
          )}

          <FeatureGate feature="pdf_invoice">
            <button
              onClick={generateInvoice}
              disabled={isGenerating}
              className="size-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-primary-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
              title="Download Document"
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
            </button>
          </FeatureGate>

          {!isPurchaseOrder &&
            order.status !== "RETURNED" && (
              <button
                onClick={() => setShowFullEditSheet(true)}
                className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Edit Order"
              >
                <Pencil size={16} />
              </button>
            )}

          {isPurchaseOrder &&
            order.status !== "CANCELLED" && (
              <button
                onClick={() => setShowFullEditSheet(true)}
                className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Edit Purchase Order"
              >
                <Pencil size={16} />
              </button>
            )}
        </div>
      </HeaderActions>

      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 z-20 relative">
        <div className="px-4 py-4 flex justify-between items-start">
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-slate-100">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-800/50">
                {isPurchaseOrder
                  ? (order as any).acquisitionChannel === "INTER_TENANT" ? "Transfer" : "PO"
                  : (order as any).orderType}
              </span>
              {/* Trade Network badges */}
              {isPurchaseOrder && (order as any).acquisitionChannel === "INTER_TENANT" && (
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/50 flex items-center gap-1">
                  <Building2 size={10} />
                  Trade Network
                </span>
              )}
              {!isPurchaseOrder && (order as any).orderType === "TRANSFER" && (
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/50 flex items-center gap-1">
                  <ArrowRightLeft size={10} />
                  Transfer
                </span>
              )}
            </div>
            <div className="font-bold text-sm text-slate-600 dark:text-slate-400 mb-1.5">
              {customer?.name || "Unknown Customer"}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <Calendar size={12} className="opacity-70" />
              <span>
                {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
              </span>
            </div>
          </div>
          <span
            className={clsx(
              "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border",
              order.status === "SETTLED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                : order.status === "PARTIAL"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                  : order.status === "RETURNED"
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            )}
          >
            {order.status}
          </span>
        </div>
        {!isPurchaseOrder && totalSaleProfit !== 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded overflow-hidden">
            <div
              className={clsx(
                "absolute inset-0 opacity-10",
                totalSaleProfit > 0 ? "bg-emerald-500" : "bg-rose-500",
              )}
            />
            {totalSaleProfit > 0 ? (
              <TrendingUp
                size={12}
                className="relative z-10 text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <TrendingDown
                size={12}
                className="relative z-10 text-rose-600 dark:text-rose-400"
              />
            )}
            <span
              className={clsx(
                "relative z-10 text-[10px] font-black tracking-wider uppercase",
                totalSaleProfit > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400",
              )}
            >
              {totalSaleProfit > 0 ? "+" : ""}₹
              {Math.abs(totalSaleProfit).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Transfer status banner */}
        {!isPurchaseOrder && (order as any).orderType === "TRANSFER" && (order as any).transferStatus && (
          <div className={clsx(
            "mx-4 mt-4 px-4 py-3 rounded-2xl border flex items-center gap-3",
            (order as any).transferStatus === "ACCEPTED"
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              : (order as any).transferStatus === "REJECTED"
              ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
              : (order as any).transferStatus === "PARTIAL"
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
              : "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400",
          )}>
            <ArrowRightLeft size={16} className="shrink-0" />
            <span className="text-xs font-bold">
              Transfer {(order as any).transferStatus === "PENDING"
                ? "— Awaiting inspection by receiving business"
                : (order as any).transferStatus === "ACCEPTED"
                ? "— All devices accepted ✓"
                : (order as any).transferStatus === "REJECTED"
                ? "— All devices rejected and returned to stock"
                : "— Partially accepted by receiving business"}
            </span>
          </div>
        )}
        {isPurchaseOrder && (order as any).acquisitionChannel === "INTER_TENANT" && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 flex items-center gap-3 text-violet-700 dark:text-violet-400">
            <Building2 size={16} className="shrink-0" />
            <span className="text-xs font-bold">
              Inbound Transfer — stock sent by {customer?.name ?? "another business"} via Trade Network
            </span>
          </div>
        )}

        {/* Master Summary Card - Reverted Structure */}
        <div className="px-5 py-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 grid grid-cols-3 gap-4 shadow-sm relative overflow-hidden">
            {outstanding > 0 && order.status !== "RETURNED" && (
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
            )}

            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Total
              </p>
              <p className="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tight">
                ₹{(order.totalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Paid
              </p>
              <p className="font-black text-emerald-600 dark:text-emerald-500 text-lg tracking-tight">
                ₹{(order.amountPaid || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                {isPurchaseOrder ? "Owed" : "Outstanding"}
              </p>
              <p
                className={clsx(
                  "font-black text-lg tracking-tight",
                  outstanding > 0
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-slate-400 dark:text-slate-500",
                )}
              >
                ₹{Math.max(0, outstanding).toLocaleString()}
              </p>
            </div>
          </div>

          {/* GST Breakdown Card */}
          {(order as any).gstEnabled && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Receipt size={13} className="text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  GST Breakdown
                </span>
                <span className={clsx(
                  "ml-auto text-[9px] font-black px-2 py-0.5 rounded-full",
                  (order as any).gstInclusive !== false
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                )}>
                  {(order as any).gstInclusive !== false ? "INCLUSIVE" : "EXCLUSIVE"}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Taxable Value</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    ₹{((order as any).subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(order as any).gstType === "IGST" ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">IGST ({(order as any).gstRate || 18}%)</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ₹{((order as any).igstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">CGST ({((order as any).gstRate || 18) / 2}%)</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ₹{((order as any).cgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">SGST ({((order as any).gstRate || 18) / 2}%)</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ₹{((order as any).sgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 font-black">
                  <span className="text-slate-700 dark:text-slate-300">
                    {(order as any).gstInclusive !== false ? "Total (incl. GST)" : "Total + GST"}
                  </span>
                  <span className="text-slate-900 dark:text-slate-100">
                    ₹{(order.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(isPurchaseOrder ? (order as any).sellerGstin : (order as any).buyerGstin) && (
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">{isPurchaseOrder ? "Supplier GSTIN" : "Buyer GSTIN"}</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                      {isPurchaseOrder ? (order as any).sellerGstin : (order as any).buyerGstin}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Actions - Moved Outside Tabs */}
          <div className="flex gap-3">
            {outstanding > 0 && order.status !== "RETURNED" && (
              <button
                onClick={() => setShowPayment(true)}
                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold h-12 rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
              >
                Record Payment
              </button>
            )}
            <FeatureGate feature="pdf_invoice">
              <button
                onClick={generateInvoice}
                disabled={isGenerating}
                className="px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold h-12 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {isGenerating ? "Generating..." : "Document"}
              </button>
            </FeatureGate>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/20 dark:shadow-black/20 mt-2 shrink-0">
          <div className="flex px-4 w-full">
            {[
              { id: "financials", label: "Finance", icon: IndianRupee },
              { id: "items", label: "Items", icon: Package },
              { id: "timeline", label: "Timeline", icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex-1 flex justify-center items-center gap-1.5 sm:gap-2 py-3 border-b-2 transition-all shrink-0",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-500 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-600 font-medium",
                )}
              >
                <tab.icon
                  size={14}
                  className="sm:size-4 shrink-0"
                  strokeWidth={activeTab === tab.id ? 2.5 : 2}
                />
                <span className="text-[10px] sm:text-xs uppercase tracking-tighter sm:tracking-wider">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <main className="p-4 sm:p-6 space-y-6 pb-10">
          {/* --- ITEMS TAB --- */}
          {activeTab === "items" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {isAwaitingReceipt && (
                <div className="bg-amber-50 dark:bg-amber-950 rounded-2xl p-4 border border-amber-100 dark:border-amber-800 flex items-center gap-4 shadow-sm">
                  <div className="size-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">
                      Inspection Required
                    </p>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Verify {poPendingCount} remaining units to update
                      inventory.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmSheet(true)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 shadow-lg shadow-amber-500/20"
                  >
                    Start
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {order.items.map((item) => {
                  const isPOItem = isPurchaseOrder;
                  const phone = phones.find((p) => p.id === item.phoneId);
                  const itemData = {
                    brand: phone?.brand || (item as any).brandSnapshot || (item as any).brand || "Unknown",
                    model: phone?.model || (item as any).modelSnapshot || (item as any).model || "Item",
                    storage: phone?.storage || (item as any).storageSnapshot || (item as any).storage || "N/A",
                    ram: phone?.ram || (item as any).ram || "N/A",
                    color: phone?.color || (item as any).colorSnapshot || (item as any).color || "N/A",
                    price: isPOItem
                      ? (item as any).purchasePrice || 0
                      : (item as any).salePrice || 0,
                    effectivePrice: isPOItem
                      ? (item as any).purchasePrice || 0
                      : (item as any).effectivePrice ||
                        (item as any).salePrice ||
                        0,
                    discountAmount: isPOItem
                      ? 0
                      : (item as any).discountAmount || 0,
                    imeis: isPOItem
                      ? phone?.imeis && phone.imeis.length > 0
                        ? phone.imeis
                        : (item as any).imei
                          ? [(item as any).imei]
                          : []
                      : (item as any).imeiSnapshot?.length > 0
                        ? (item as any).imeiSnapshot
                        : (item as any).imei
                          ? [(item as any).imei]
                          : [],
                    status: (item as any).status,
                  };

                  const repairs = ledgerEntries
                    .filter(
                      (e) =>
                        e.type === "REPAIR_COST" &&
                        e.referenceId === item.phoneId,
                    )
                    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                  const unitProfit =
                    !isPurchaseOrder && phone
                      ? itemData.effectivePrice -
                        (phone.purchasePrice + repairs)
                      : 0;

                  const config = {
                    container:
                      itemData.status === "ACCEPTED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : itemData.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-primary-500/10 text-primary-600 border-primary-500/20",
                    icon:
                      itemData.status === "ACCEPTED"
                        ? "bg-emerald-500 text-white"
                        : itemData.status === "REJECTED"
                          ? "bg-rose-500 text-white"
                          : "bg-primary-500 text-white",
                    label:
                      itemData.status?.replace("_", " ") ||
                      (isPurchaseOrder ? "Pending" : "Sold"),
                  };

                  return (
                    <Link
                      key={item.id}
                      to={item.phoneId ? `/inventory/${item.phoneId}` : "#"}
                      className="block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all active:scale-[0.99] overflow-hidden"
                    >
                      <DeviceListItem
                        brand={itemData.brand}
                        model={itemData.model}
                        storage={itemData.storage}
                        ram={itemData.ram}
                        color={itemData.color}
                        imeis={itemData.imeis}
                        price={itemData.effectivePrice}
                        isPurchaseOrder={isPurchaseOrder}
                        unitProfit={unitProfit}
                        rejectionReason={(item as any).rejectionReason}
                        config={config}
                      />
                    </Link>
                  );
                })}
              </div>

              {order.status === "SETTLED" && !isPurchaseOrder && (
                <button
                  onClick={handleReturn}
                  disabled={isReturning}
                  className="w-full py-4 border-2 border-dashed border-rose-100 dark:border-rose-900/30 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors disabled:opacity-60"
                >
                  <RotateCcw size={14} /> {isReturning ? "Processing…" : "Full Order Return"}
                </button>
              )}
            </div>
          )}

          {/* --- FINANCIALS TAB --- */}
          {activeTab === "financials" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Combined Receipts & Allocations from former Settlement tab */}
              <div className="pt-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                  Receipts & Allocations
                </h3>
                <div className="space-y-3">
                  {unifiedPayments.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                      <DollarSign
                        size={24}
                        className="mx-auto text-slate-300 mb-2"
                      />
                      <p className="text-xs font-bold text-slate-400">
                        No payments recorded yet.
                      </p>
                    </div>
                  ) : (
                    unifiedPayments.map((p) => {
                      const typeConfig = {
                        ADVANCE: {
                          label: "Advance",
                          subtitle: "Paid at order creation",
                          iconBg: "bg-primary-50 text-primary-500",
                        },
                        DIRECT: {
                          label: "Direct Payment",
                          subtitle: "Recorded manually",
                          iconBg: "bg-emerald-50 text-emerald-500",
                        },
                        BULK_SETTLEMENT: {
                          label: "Bulk Settlement",
                          subtitle: "FIFO allocation from bulk payment",
                          iconBg: "bg-violet-50 text-violet-500",
                        },
                      }[p.entryType] ?? {
                        label: "Payment",
                        subtitle: "",
                        iconBg: "bg-slate-50 text-slate-400",
                      };

                      const modeLabel =
                        p.paymentMode === "BANK_TRANSFER"
                          ? "Bank Transfer"
                          : p.paymentMode === "UPI"
                            ? "UPI"
                            : p.paymentMode === "CASH"
                              ? "Cash"
                              : p.paymentMode;

                      return (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center shadow-sm"
                        >
                          <div className="flex gap-3">
                            <div
                              className={clsx(
                                "size-10 rounded-xl flex items-center justify-center shrink-0",
                                typeConfig.iconBg,
                              )}
                            >
                              <CreditCard size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                {typeConfig.label}
                              </p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                {typeConfig.subtitle}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                {modeLabel} •{" "}
                                {format(parseISO(p.receivedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-900 dark:text-slate-100 text-base">
                              ₹{p.amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400">
                              Total: ₹{p.runningTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TIMELINE TAB --- */}
          {activeTab === "timeline" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg mx-auto">
              <div className="relative pl-8 pt-2">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />

                {/* Events */}
                <div className="space-y-10">
                  {sortedTimeline.map((ev) => (
                    <div key={ev.id} className="relative">
                      <div
                        className={clsx(
                          "absolute -left-[24px] z-10 size-4 rounded-full border-4 border-slate-50 dark:border-slate-950 shadow-lg",
                          ev.color,
                          ev.type === "CREATION" && "shadow-primary-500/20",
                          ev.type === "PAYMENT" && "shadow-emerald-500/20",
                          ev.type === "SETTLEMENT" && "shadow-emerald-500/20",
                          ev.type === "VOID" && "shadow-rose-500/20",
                          ev.type === "EDIT" && "shadow-amber-500/20",
                        )}
                      />
                      <div>
                        <p
                          className={clsx(
                            "text-[10px] font-black uppercase tracking-widest mb-1",
                            ev.type === "CREATION"
                              ? "text-primary-500"
                              : ev.type === "PAYMENT"
                                ? "text-emerald-500"
                                : ev.type === "SETTLEMENT"
                                  ? "text-emerald-600"
                                  : ev.type === "VOID"
                                    ? "text-rose-500"
                                    : ev.type === "EDIT"
                                      ? "text-amber-500"
                                      : "text-slate-500",
                          )}
                        >
                          {ev.title}
                        </p>
                        <p
                          className={clsx(
                            "font-bold leading-tight",
                            ev.type === "SETTLEMENT"
                              ? "text-emerald-700"
                              : ev.type === "VOID"
                                ? "text-rose-700"
                                : "text-slate-900 dark:text-slate-100",
                          )}
                        >
                          {ev.description}
                        </p>
                        {ev.note && (
                          <CollapsibleNote
                            id={`tm-${ev.id}`}
                            text={ev.note}
                            className="text-xs font-semibold text-slate-500 mt-1"
                          />
                        )}
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 italic">
                          {format(parseISO(ev.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <RecordPaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        orderId={order.id}
        counterpartyId={order.counterpartyId}
        currentAmountPaid={order.amountPaid}
        totalAmount={order.totalAmount}
        type={isPurchaseOrder ? "AP" : "AR"}
      />

      {isPurchaseOrder && (
        <PurchaseOrderConfirmSheet
          open={showConfirmSheet}
          onOpenChange={setShowConfirmSheet}
          order={order as any}
          onComplete={() => {
            // If this is an INTER_TENANT PO, sync status back to sender's SO
            if ((order as any).acquisitionChannel === "INTER_TENANT") {
              syncTransferStatus(order.id).catch((err) =>
                console.error("Transfer status sync failed:", err)
              );
            }
          }}
        />
      )}

      {/* Full Edit Sheets (items, prices, supplier/customer) */}
      {isPurchaseOrder && order && (
        <EditPurchaseOrderSheet
          open={showFullEditSheet}
          onOpenChange={setShowFullEditSheet}
          order={order as any}
        />
      )}
      {!isPurchaseOrder && order && (
        <EditSaleOrderSheet
          open={showFullEditSheet}
          onOpenChange={setShowFullEditSheet}
          order={order as any}
        />
      )}
    </div>
  );
}
