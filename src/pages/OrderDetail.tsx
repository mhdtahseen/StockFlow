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
import { addPurchaseOrder, updatePurchaseOrder } from "@/features/purchasing/slice";
import { generateInvoicePDF } from "@/utils/generateInvoice";
import { generatePurchaseOrderPDF } from "@/utils/generatePurchaseOrderPDF";
import { createShareLink } from "@/services/shareService";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { RecordPaymentSheet } from "@/components/shared/RecordPaymentSheet";
import { POConfirmSheet } from "@/components/shared/POConfirmSheet";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import HeaderActions from "@/components/layout/HeaderActions";
import { DeviceListItem } from "@/components/shared/DeviceListItem";

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

  const isPurchaseOrder = useAppSelector((state) =>
    state.purchasing.orders.some((o) => o.id === id),
  );
  const [activeTab, setActiveTab] = useState<
    "financials" | "settlement" | "items" | "timeline"
  >("financials");

  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [poEditNotes, setPoEditNotes] = useState("");
  const [poEditDueDate, setPoEditDueDate] = useState("");
  const [showPOEditSheet, setShowPOEditSheet] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

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
          .single();

        // If not found in Sales, try Purchases
        if (error || !data) {
          const { data: poData, error: poError } = await supabase
            .from("purchase_orders")
            .select("*, purchase_order_items(*)")
            .eq("id", id)
            .single();

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

  // ── Unified Payment Logic (Chronological sequence — first = Advance, rest = Settlement) ──
  // 1. Get Direct Ledger Entries (Advances or single payments recorded directly against the order)
  const directLedgerPayments = ledgerEntries
    .filter((e: any) => {
      const matchesOrder =
        e.purchaseOrderId === order.id ||
        e.saleOrderId === order.id ||
        e.referenceId === order.id;
      if (!matchesOrder) return false;

      // Exclude ledger entries that belong to a bulk payment record to prevent duplicates.
      // The bulk payment record will be caught by `allocatedPayments` below.
      if (
        e.supplierPaymentId ||
        e.customerPaymentId ||
        (e as any).supplier_payment_id ||
        (e as any).customer_payment_id
      ) {
        return false;
      }

      // Exclude DEBT_SETTLEMENT and ADVANCE_RECEIVED entries - these are bulk allocations handled by allocation logic
      if (e.type === "DEBT_SETTLEMENT" || e.type === "ADVANCE_RECEIVED") {
        return false;
      }

      if (isPurchaseOrder) {
        return (
          (e.type === "SUPPLIER_PAYMENT" || e.type === "FUNDS_CONSUMED") &&
          Math.abs(e.amount) > 0
        );
      } else {
        return (
          (e.type === "CUSTOMER_PAYMENT" ||
            e.type === "PHONE_SALE" ||
            e.type === "FUNDS_CONSUMED") &&
          Math.abs(e.amount) > 0
        );
      }
    })
    .map((e: any) => ({
      id: e.id,
      amount: Math.abs(e.amount),
      createdAt: e.createdAt,
      paymentMode: e.paymentMode || "UNKNOWN",
      note: e.note,
    }));

  // 2. Get Settlement Allocations from Bulk Payments (which aren't linked directly in ledger)
  const allocatedPayments = isPurchaseOrder
    ? purchasingPayments.flatMap((p) => {
        const alloc = p.allocations?.find(
          (a) => a.purchaseOrderId === order.id,
        );
        if (!alloc) return [];
        return [
          {
            id: p.id,
            amount: alloc.amountAllocated,
            createdAt: p.paidAt, // paidAt is the correct field on SupplierPayment
            paymentMode: p.mode || "UNKNOWN",
            note: alloc.note || p.note || "Settlement Allocation",
          },
        ];
      })
    : customerPayments.flatMap((p) => {
        const alloc = p.allocations?.find((a) => a.saleOrderId === order.id);
        if (!alloc) return [];
        return [
          {
            id: p.id,
            amount: alloc.amountAllocated,
            createdAt: p.receivedAt, // receivedAt is the correct field on CustomerPayment
            paymentMode: p.mode || "UNKNOWN",
            note: alloc.note || p.note || "Settlement Allocation",
          },
        ];
      });

  // 2. Merge and Sort oldest-first
  const allOrderPaymentEntries = [
    ...directLedgerPayments,
    ...allocatedPayments,
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Tag all entries consistently - first entry (at order creation) is Advance, rest are Settlements
  let runningTotal = 0;
  const unifiedPayments = allOrderPaymentEntries
    .map((e: any, idx: number) => {
      const amt = Math.abs(e.amount);
      runningTotal += amt;
      const isFirstEntry = idx === 0; // First entry is the Advance/Opening
      return {
        id: e.id,
        amount: amt,
        runningTotal,
        receivedAt: e.createdAt,
        paymentMode: e.paymentMode || "UNKNOWN",
        type: isFirstEntry ? "ADVANCE" : "SETTLEMENT", // All entries after first are Settlements
        settlementNum: isFirstEntry ? undefined : idx, // Only settlement entries get numbers
        note:
          e.note ||
          (isFirstEntry
            ? isPurchaseOrder
              ? "Opening Advance"
              : "Opening Payment"
            : isPurchaseOrder
              ? "Settlement Payment"
              : "Payment Received"),
      };
    })
    // Display newest-first so the most recent payment is at the top
    .reverse();

  // --- REVERSE CHRONOLOGICAL TIMELINE ---
  const timelineEvents = [
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
      note: p.note,
      timestamp: p.receivedAt,
      color: "bg-emerald-500",
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
    CREATION: 1,
  };

  const sortedTimeline = [...timelineEvents].sort((a, b) => {
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
      if (isPurchaseOrder) {
        await generatePurchaseOrderPDF(order as any, customer, tenant);
      } else {
        await generateInvoicePDF(order as any, customer, tenant);
      }
      toast.success("Document Generated", {
        description: `PDF for Order ${order.id.slice(0, 8)} saved.`,
      });
    } catch (error) {
      console.error("Document Gen Error:", error);
      toast.error("Generation Failed", {
        description: "Could not create PDF document.",
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

      const shareData = {
        title: `StockFlow: ${order.id.slice(0, 8).toUpperCase()}`,
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
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied", { description: "Link copied to clipboard." });
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
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
            (order.status === "OPEN" || order.status === "PARTIAL") && (
              <button
                onClick={() => setShowEditSheet(true)}
                className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Edit Order"
              >
                <Pencil size={16} />
              </button>
            )}

          {isPurchaseOrder &&
            (order.status === "OPEN" || order.status === "PARTIAL") && (
              <button
                onClick={() => {
                  setPoEditNotes((order as any).notes || "");
                  setPoEditDueDate((order as any).dueDate || "");
                  setShowPOEditSheet(true);
                }}
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
                {isPurchaseOrder ? "PO" : (order as any).orderType}
              </span>
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
                  className="w-full py-4 border-2 border-dashed border-rose-100 dark:border-rose-900/30 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <RotateCcw size={14} /> Full Order Return
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
                    unifiedPayments.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center shadow-sm"
                      >
                        <div className="flex gap-4">
                          <div
                            className={clsx(
                              "size-10 rounded-xl flex items-center justify-center shrink-0",
                              p.type === "ADVANCE"
                                ? "bg-primary-50 text-primary-500"
                                : "bg-emerald-50 text-emerald-500",
                            )}
                          >
                            <CreditCard size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {p.type === "ADVANCE"
                                  ? "Advance"
                                  : `Settlement #${p.settlementNum}`}
                              </p>
                            </div>
                            <CollapsibleNote
                              id={`fin-${p.id}`}
                              text={p.note}
                              className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight"
                            />
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                              {p.paymentMode} •{" "}
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
                    ))
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
        <POConfirmSheet
          open={showConfirmSheet}
          onOpenChange={setShowConfirmSheet}
          order={order as any}
        />
      )}

      {!isPurchaseOrder && (
        <CreateOrderSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          existingOrder={order as any}
        />
      )}

      {isPurchaseOrder && (
        <Sheet open={showPOEditSheet} onOpenChange={setShowPOEditSheet}>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-auto"
          >
            <SheetHeader className="p-6 pb-4">
              <SheetTitle className="font-black text-slate-900 dark:text-slate-100">
                Edit Purchase Order
              </SheetTitle>
            </SheetHeader>
            <div className="px-6 pb-8 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Notes
                </label>
                <textarea
                  value={poEditNotes}
                  onChange={(e) => setPoEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Due Date
                </label>
                <input
                  type="date"
                  value={poEditDueDate}
                  onChange={(e) => setPoEditDueDate(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  if (poEditDueDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (new Date(poEditDueDate) <= today) {
                      toast.error("Due date must be a future date (after today)");
                      return;
                    }
                  }
                  dispatch(
                    updatePurchaseOrder({
                      id: order.id,
                      notes: poEditNotes || undefined,
                      dueDate: poEditDueDate || undefined,
                    }),
                  );
                  toast.success("Purchase order updated");
                  setShowPOEditSheet(false);
                }}
                className="w-full py-4 rounded-2xl bg-primary-500 text-white font-black text-sm shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
              >
                Save Changes
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
