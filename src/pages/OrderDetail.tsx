import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { generateInvoicePDF } from "@/utils/generateInvoice";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { RecordPaymentSheet } from "@/components/shared/RecordPaymentSheet";
import { POConfirmSheet } from "@/components/shared/POConfirmSheet";
import HeaderActions from "@/components/layout/HeaderActions";
import { DeviceListItem } from "@/components/shared/DeviceListItem";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canUse } = usePlan();
  const { tenant } = useAuth();

  const order = useAppSelector(
    (state) =>
      state.billing.orders.find((o) => o.id === id) ||
      state.purchasing.orders.find((o) => o.id === id),
  );
  const customer = useAppSelector((state) =>
    state.customers.customers.find((c) => c.id === order?.counterpartyId),
  );
  const phones = useAppSelector((state) => state.inventory.phones);
  const ledgerEntries = useAppSelector((state) => state.ledger.entries);
  const payments = useAppSelector((state) => state.customers.payments);
  const isPurchaseOrder = useAppSelector((state) =>
    state.purchasing.orders.some((o) => o.id === id),
  );
  const [activeTab, setActiveTab] = useState<
    "financials" | "settlement" | "items" | "timeline"
  >("financials");

  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
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

          // Map PO to Order shape
          dispatch(
            addOrder({
              id: poData.id,
              counterpartyId: poData.counterparty_id,
              orderType: "PURCHASE",
              status: poData.status,
              totalAmount: poData.total_amount,
              amountPaid: poData.amount_paid,
              createdAt: poData.created_at,
              items: (poData.purchase_order_items || []).map((i: any) => ({
                id: i.id,
                phoneId: i.phone_id,
                brandSnapshot: i.brand_snapshot,
                modelSnapshot: i.model_snapshot,
                storageSnapshot: i.storage_snapshot,
                colorSnapshot: i.color_snapshot,
                imeiSnapshot: i.imei_snapshot || [],
                purchasePrice: i.purchase_price ?? 0,
                effectivePrice: i.purchase_price ?? 0,
                status: i.status,
              })),
            } as any),
          );
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

  const outstanding = isPurchaseOrder
    ? poAcceptedTotal - (order.amountPaid || 0)
    : (order.totalAmount || 0) - (order.amountPaid || 0);

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

  // ── Unified Payment Logic (Mapping Advances + Allocations) ──────────────
  // 1. Get Advance Payments from Ledger (recorded at SO/PO creation)
  const advancePayments = ledgerEntries
    .filter(
      (e) =>
        e.referenceId === order.id &&
        (e.type === "PHONE_SALE" || e.type === "FUNDS_CONSUMED") &&
        e.amount > 0,
    )
    .map((e) => ({
      id: e.id,
      amount: Math.abs(e.amount),
      receivedAt: e.createdAt,
      mode: e.paymentMode || "UNKNOWN",
      type: "ADVANCE" as const,
      note: e.note || "Initial Payment",
    }));

  // 2. Get Subsequent Allocations from Customer/Vendor payments
  const orderAllocations = isPurchaseOrder
    ? ledgerEntries
        .filter(
          (e) => e.referenceId === order.id && e.type === "FUNDS_CONSUMED",
        )
        .map((e) => ({
          id: e.id,
          amount: Math.abs(e.amount),
          receivedAt: e.createdAt,
          mode: e.paymentMode || "UNKNOWN",
          type: "ALLOCATION" as const,
          note: e.note || "Allocation",
        }))
    : payments.flatMap((p) =>
        (p.allocations || [])
          .filter((a) => a.saleOrderId === order.id)
          .map((a: any) => ({
            id: p.id,
            amount: a.amountAllocated,
            receivedAt: p.receivedAt,
            mode: p.mode,
            type: "ALLOCATION" as const,
            note: `Bulk Receipt #${p.id.slice(0, 5).toUpperCase()}`,
            totalPaymentAmount: p.totalReceived, // for context
          })),
      );

  // 3. Combined & Sorted Unified List
  const unifiedPayments = [...advancePayments, ...orderAllocations].sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );

  const handleReturn = () => {
    if (
      window.confirm(
        "Are you sure you want to process a full return for this order? This will restock all devices and record a negative sale entry.",
      )
    ) {
      if (isPurchaseOrder) {
        // Handle purchase order return (reverse the purchase)
        dispatch(
          addEntry({
            id: crypto.randomUUID(),
            type: "FUNDS_CONSUMED",
            referenceId: order.id,
            amount: order.totalAmount, // POSITIVE amount for refund (returning to escrow/purchases balance)
            note: `Refund for returned items for Purchase Order ${order.id.slice(
              0,
              8,
            )}`,
            createdAt: new Date().toISOString(),
          }),
        );
        toast.success("Purchase Order Returned", {
          description: "Refund processed successfully.",
        });
      } else {
        // Handle sale order return
        dispatch(returnOrder(order.id));
        dispatch(
          addEntry({
            id: crypto.randomUUID(),
            type: "PHONE_SALE",
            referenceId: order.id,
            amount: -order.totalAmount, // Negative amount
            note: `Refund for returned item(s) for Sales Order ${order.id.slice(
              0,
              8,
            )}`,
            createdAt: new Date().toISOString(),
          }),
        );
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
          description: "Devices restocked successfully.",
        });
      }
    }
  };

  const generateInvoice = () => {
    try {
      if (isPurchaseOrder) {
        toast.error("Not Available", {
          description: "Invoice generation not available for Purchase Orders",
        });
        return;
      }
      generateInvoicePDF(order as any, customer, tenant);
      toast.success("Invoice Generated", {
        description: `PDF for Order ${order.id.slice(0, 8)} saved.`,
      });
    } catch (error) {
      console.error("Invoice Gen Error:", error);
      toast.error("Generation Failed", {
        description: "Could not create PDF invoice.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-4">
      <HeaderActions>
        <FeatureGate feature="pdf_invoice">
          {!isPurchaseOrder && (
            <button
              onClick={generateInvoice}
              className="size-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-primary-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title="Download Invoice"
            >
              <FileText size={20} />
            </button>
          )}
        </FeatureGate>
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
              className="px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold h-12 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <FileText size={18} /> Invoice
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

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-10">
        {/* --- ITEMS TAB --- */}
        {activeTab === "items" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isPurchaseOrder && order.status === "AWAITING_RECEIPT" && (
              <div className="bg-amber-50 dark:bg-amber-950 rounded-2xl p-4 border border-amber-100 dark:border-amber-800 flex items-center gap-4 shadow-sm">
                <div className="size-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Package size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">
                    Inspection Pending
                  </p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Verify {order.items.length} units to update inventory.
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

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
              {order.items.map((item) => {
                const isPOItem = isPurchaseOrder;
                const phone = phones.find((p) => p.id === item.phoneId);
                const itemData = {
                  brand: isPOItem
                    ? phone?.brand || "Unknown"
                    : (item as any).brandSnapshot || "Unknown",
                  model: isPOItem
                    ? phone?.model || "Item"
                    : (item as any).modelSnapshot || "Unknown",
                  storage: isPOItem
                    ? phone?.storage || "N/A"
                    : (item as any).storageSnapshot || "N/A",
                  color: isPOItem
                    ? phone?.color || "N/A"
                    : (item as any).colorSnapshot || "N/A",
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
                    ? phone?.imeis || []
                    : (item as any).imeiSnapshot || [],
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
                    ? itemData.effectivePrice - (phone.purchasePrice + repairs)
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
                  label: itemData.status?.replace("_", " ") || "Pending",
                };

                return (
                  <DeviceListItem
                    key={item.id}
                    brand={itemData.brand}
                    model={itemData.model}
                    storage={itemData.storage}
                    color={itemData.color}
                    imeis={itemData.imeis}
                    price={itemData.effectivePrice}
                    isPurchaseOrder={isPurchaseOrder}
                    unitProfit={unitProfit}
                    config={config}
                  />
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            {p.type === "ADVANCE" ? "Advance" : "Follow-up"}
                          </p>
                          <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
                            {p.note}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {p.mode} •{" "}
                            {format(parseISO(p.receivedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 dark:text-slate-100 text-base">
                          ₹{p.amount.toLocaleString()}
                        </p>
                        <div className="size-2 bg-emerald-500 rounded-full inline-block mt-1" />
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
                {/* 1. Creation */}
                <div className="relative">
                  <div className="absolute -left-[24px] z-10 size-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-primary-500 shadow-lg shadow-primary-500/20" />
                  <div>
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">
                      Order Initiated
                    </p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Sales Order Generated
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 italic">
                      {format(parseISO(order.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>

                {/* 2. Payments (Interleaved) */}
                {[...unifiedPayments].reverse().map((p, idx) => (
                  <div key={p.id} className="relative">
                    <div className="absolute -left-[24px] z-10 size-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                        Payment Received
                      </p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        ₹{p.amount.toLocaleString()} via {p.mode}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {p.note}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5 italic">
                        {format(parseISO(p.receivedAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 3. Settlement / Status */}
                {order.status === "SETTLED" && (
                  <div className="relative">
                    <div className="absolute -left-[24px] z-10 size-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-emerald-600 shadow-lg shadow-emerald-500/20" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                        Order Settled
                      </p>
                      <p className="font-bold text-emerald-700 leading-tight">
                        Account Fully Cleared
                      </p>
                    </div>
                  </div>
                )}

                {order.status === "RETURNED" && (
                  <div className="relative">
                    <div className="absolute -left-[24px] z-10 size-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-rose-500 shadow-lg shadow-rose-500/20" />
                    <div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                        Return Processed
                      </p>
                      <p className="font-bold text-rose-700 leading-tight">
                        Order Voided & Restocked
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
}
