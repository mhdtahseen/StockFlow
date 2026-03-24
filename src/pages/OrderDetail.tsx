import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import {
  FileText,
  Share,
  AlertTriangle,
  User,
  ShieldAlert,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { returnOrder, addOrder } from "@/features/billing/slice";
import { addEntry } from "@/features/ledger/slice";
import { markAsInStock } from "@/features/inventory/slice";
import { toast } from "sonner";
import { RecordPaymentSheet } from "@/components/shared/RecordPaymentSheet";
import { usePlan } from "@/hooks/usePlan";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { useAuth } from "@/context/AuthContext";
import { generateInvoicePDF } from "@/utils/generateInvoice";
import { supabase } from "@/lib/supabase";

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

  const [showPayment, setShowPayment] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Lazy-fetch settled/historical orders not in Redux state (A-004 / QA-011)
  useEffect(() => {
    if (order || !id || isFetching || fetchFailed) return;
    let mounted = true;
    async function fetchOrder() {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from('sale_orders')
          .select('*, sale_order_items(*)')
          .eq('id', id)
          .single();
        if (!mounted) return;
        if (error || !data) { setFetchFailed(true); return; }
        // Map snake_case to camelCase and dispatch into Redux
        dispatch(addOrder({
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
        }));
      } catch (e) {
        if (mounted) setFetchFailed(true);
      } finally {
        if (mounted) setIsFetching(false);
      }
    }
    fetchOrder();
    return () => { mounted = false; };
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
        <p className="font-bold text-red-500">{fetchFailed ? 'Order not found' : 'Loading...'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const outstanding = (order.totalAmount || 0) - (order.amountPaid || 0);

  // Get order allocations based on order type
  const orderAllocations = isPurchaseOrder
    ? [] // Purchase orders don't have customer payment allocations
    : payments
        .flatMap((p) =>
          (p.allocations || [])
            .filter((a) => a.saleOrderId === order.id)
            .map((a) => ({
              ...a,
              paymentId: p.id,
              receivedAt: p.receivedAt,
              mode: p.mode,
            })),
        )
        .sort(
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
            amount: -order.totalAmount, // Negative amount for refund
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
            note: `Refund for returned item(s) for Trade Order ${order.id.slice(
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-end gap-3 transition-colors">
        <FeatureGate feature="pdf_invoice">
          <button
            onClick={generateInvoice}
            className="text-primary-500 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Share size={20} />
          </button>
        </FeatureGate>
      </div>

      <div className="bg-white dark:bg-slate-900 px-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-start mt-4">
          <div>
            <div className="font-bold text-lg leading-tight mb-1">
              {customer?.name || "Unknown Customer"}
            </div>
            <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <span>
                {isPurchaseOrder
                  ? `PO ${order.id.slice(0, 8).toUpperCase()}`
                  : `${(order as any).orderType} ${order.id.slice(0, 8).toUpperCase()}`}
              </span>
              <span>{format(parseISO(order.createdAt), "MMM d, h:mm a")}</span>
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
                    : order.status === "RECEIVED"
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      : order.status === "AWAITING_RECEIPT"
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            )}
          >
            {order.status}
          </span>
        </div>
      </div>

      <main className="p-4 space-y-6">
        {/* Payment Summary */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1 flex items-center gap-2">
            {isPurchaseOrder ? (
              <Package size={16} className="text-orange-600" />
            ) : (
              <FileText size={16} className="text-primary-500" />
            )}
            {isPurchaseOrder ? "Purchase Order" : "Financials"}
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 grid grid-cols-3 gap-4 shadow-sm relative overflow-hidden">
            {outstanding > 0 && order.status !== "RETURNED" && (
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Total
              </p>
              <p className="font-black text-slate-900 dark:text-slate-100 text-lg">
                ₹{(order.totalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Paid
              </p>
              <p className="font-black text-emerald-600 dark:text-emerald-500 text-lg">
                ₹{(order.amountPaid || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                {isPurchaseOrder ? "Owed" : "Outstanding"}
              </p>
              <p
                className={clsx(
                  "font-black text-lg",
                  outstanding > 0
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-slate-400",
                )}
              >
                ₹{(outstanding > 0 ? outstanding : 0).toLocaleString()}
              </p>
            </div>
          </div>

          {outstanding > 0 && order.status !== "RETURNED" && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-3 bg-primary-500 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
              {isPurchaseOrder ? "Record Payment" : "Record Payment"}
            </button>
          )}

          {order.status === "SETTLED" && (
            <button
              onClick={handleReturn}
              className="w-full mt-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} /> Process Return
            </button>
          )}

          <button
            onClick={generateInvoice}
            className="w-full mt-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FileText size={18} /> Generate Invoice
          </button>
        </section>

        {/* Line Items */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1">
            {isPurchaseOrder
              ? `PO Items (${order.items.length})`
              : `Line Items (${order.items.length})`}
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => {
              // Handle different item structures for PO vs Sale orders
              const isPOItem = isPurchaseOrder;
              const itemData = {
                brand: isPOItem ? "Unknown" : (item as any).brandSnapshot || "Unknown",
                model: isPOItem 
                  ? `Item ${(item as any).id?.slice(0, 8) || "Unknown"}`
                  : (item as any).modelSnapshot || "Unknown",
                storage: isPOItem ? "N/A" : (item as any).storageSnapshot || "N/A",
                color: isPOItem ? "N/A" : (item as any).colorSnapshot || "N/A",
                price: isPOItem ? (item as any).purchasePrice || 0 : (item as any).salePrice || 0,
                effectivePrice: isPOItem 
                  ? (item as any).purchasePrice || 0 
                  : (item as any).effectivePrice || (item as any).salePrice || 0,
                discountAmount: isPOItem ? 0 : (item as any).discountAmount || 0,
                imeiSnapshot: isPOItem ? [] : (item as any).imeiSnapshot || [],
                status: (item as any).status,
                rejectionReason: (item as any).rejectionReason,
              };

                const phone = phones.find(p => p.id === item.phoneId);
                const repairs = ledgerEntries
                  .filter(e => e.type === "REPAIR_COST" && e.referenceId === item.phoneId)
                  .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                
                const unitProfit = phone 
                  ? itemData.effectivePrice - (phone.purchasePrice + repairs)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2 border-b border-slate-50 dark:border-slate-800/50 pb-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                        {itemData.brand} {itemData.model}
                      </div>
                      <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                        {itemData.storage} • {itemData.color}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-black text-slate-800 dark:text-slate-100">
                        ₹{itemData.effectivePrice.toLocaleString()}
                      </span>
                      {itemData.discountAmount > 0 && (
                        <span className="text-[10px] font-bold text-rose-500 line-through bg-rose-50 dark:bg-rose-900/20 px-1 rounded inline-block mt-0.5">
                          ₹{itemData.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-2">
                      {itemData.imeiSnapshot && itemData.imeiSnapshot.length > 0 && (
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded">
                          IMEI: •••• {itemData.imeiSnapshot[0].slice(-4)}
                        </div>
                      )}
                      {isPurchaseOrder && (
                        <div className={clsx(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                          getItemStatusColor(itemData.status)
                        )}>
                          {(item as any).status === "ACCEPTED" && <CheckCircle size={10} />}
                          {(item as any).status === "REJECTED" && <XCircle size={10} />}
                          {(item as any).status === "PENDING_INSPECTION" && <AlertTriangle size={10} />}
                          {itemData.status.replace("_", " ")}
                        </div>
                      )}
                    </div>

                    {!isPurchaseOrder && (
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unit Profit</span>
                        <span className={clsx(
                          "text-xs font-black",
                          unitProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {unitProfit >= 0 ? "+" : ""}₹{unitProfit.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {isPurchaseOrder && (item as any).rejectionReason && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded mt-2">
                      Rejection: {(item as any).rejectionReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Allocations (Provenance) */}
        {orderAllocations.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1">
              Payment History
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              {orderAllocations.map((a) => (
                <div
                  key={a.paymentId}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{(a.amountAllocated || 0).toLocaleString()}{" "}
                      <span className="text-xs font-semibold text-slate-400 ml-1">
                        from CP-{a.paymentId.slice(0, 6)}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {a.mode} •{" "}
                      {format(parseISO(a.receivedAt), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
    </div>
  );
}
