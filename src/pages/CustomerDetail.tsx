import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  FileText,
  Banknote,
  CalendarClock,
  Phone,
  Edit,
  ShoppingBag,
  ShoppingCart,
  Filter,
  BadgeCheck,
  SlidersHorizontal,
} from "lucide-react";
import HeaderActions from "@/components/layout/HeaderActions";
import { format, parseISO, compareDesc } from "date-fns";
import clsx from "clsx";
import { SaleOrder } from "@/features/billing/types";
import { CustomerPayment } from "@/features/customers/types";
import { AllocationSheet } from "@/components/shared/AllocationSheet";
import { SupplierAllocationSheet } from "@/components/shared/SupplierAllocationSheet";
import { CustomerEditSheet } from "@/components/shared/CustomerEditSheet";

type Tab = "orders" | "payments" | "timeline";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = useAppSelector((state) =>
    state.customers.customers.find((c) => c.id === id),
  );
  const allSaleOrders = useAppSelector((state) => state.billing.orders) || [];
  const allPurchaseOrders =
    useAppSelector((state) => state.purchasing.orders) || [];
  const allCustomerPayments =
    useAppSelector((state) => state.customers.payments) || [];
  const allSupplierPayments =
    useAppSelector((state) => state.purchasing.payments) || [];

  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [arOpen, setArOpen] = useState(false);
  const [apOpen, setApOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "SALE" | "PURCHASE">("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | "ACTIVE" | "SETTLED">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const orders = React.useMemo(() => {
    const saleOrders = allSaleOrders
      .filter((o) => o.counterpartyId === id)
      .map((o) => ({ ...o, isPurchaseOrder: false }));
    const purchaseOrders = allPurchaseOrders
      .filter((o) => o.counterpartyId === id)
      .map((o) => ({ ...o, isPurchaseOrder: true }));
    return [...saleOrders, ...purchaseOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [allSaleOrders, allPurchaseOrders, id]);

  const filteredOrders = React.useMemo(() => {
    let result = orders;
    
    // Filter by type
    if (orderTypeFilter !== "ALL") {
      result = result.filter(o => 
        orderTypeFilter === "PURCHASE" ? (o as any).isPurchaseOrder : !(o as any).isPurchaseOrder
      );
    }
    
    // Filter by status (Active vs Settled)
    if (orderStatusFilter !== "ALL") {
      result = result.filter(o => {
        const isSettled = o.status === "SETTLED";
        return orderStatusFilter === "ACTIVE" ? !isSettled : isSettled;
      });
    }
    
    return result;
  }, [orders, orderTypeFilter, orderStatusFilter]);

  const payments = React.useMemo(() => {
    const arPayments = allCustomerPayments
      .filter((p) => p.counterpartyId === id)
      .map((p) => ({ ...p, isAr: true }));
    const apPayments = allSupplierPayments
      .filter((p) => p.counterpartyId === id)
      .map((p) => ({ ...p, isAp: true }));
    return [...arPayments, ...apPayments].sort((a, b) => {
      const dateA = (a as any).receivedAt || (a as any).paidAt;
      const dateB = (b as any).receivedAt || (b as any).paidAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [allCustomerPayments, allSupplierPayments, id]);

  if (!customer) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 justify-center items-center text-red-500 font-bold">
        Customer not found
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  const totalReceivable = allSaleOrders
    .filter(
      (o) =>
        o.counterpartyId === id &&
        o.status !== "SETTLED" &&
        o.status !== "RETURNED",
    )
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0);

  const totalPayable = allPurchaseOrders
    .filter(
      (o) =>
        o.counterpartyId === id &&
        o.status !== "SETTLED" &&
        o.status !== "CANCELLED",
    )
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0);
  const mergedTimeline = [...orders, ...payments].sort((a, b) => {
    const dateA =
      "createdAt" in a
        ? (a as SaleOrder).createdAt
        : (a as any).receivedAt || (a as any).paidAt;
    const dateB =
      "createdAt" in b
        ? (b as SaleOrder).createdAt
        : (b as any).receivedAt || (b as any).paidAt;
    return compareDesc(parseISO(dateA), parseISO(dateB));
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <HeaderActions>
        <button
          onClick={() => setEditOpen(true)}
          className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-sm active:scale-95"
          aria-label="Edit Customer"
        >
          <Edit size={18} />
        </button>
      </HeaderActions>

      {/* Header */}
      <div className="px-4 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4">
        {/* Customer Header */}
        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col pr-4">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {customer.name}
            </h1>
            {customer.phone && (
              <span className="text-sm font-semibold text-slate-500 mt-1">
                {customer.phone}
              </span>
            )}
            {customer.aadhaarLast4 && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 mt-0.5">
                Aadhaar: XXXX {customer.aadhaarLast4}
              </span>
            )}
            {customer.address && (
              <span className="text-xs font-medium text-slate-400 mt-1 line-clamp-2 leading-snug">
                {customer.address}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20 px-2 py-1 rounded border border-primary-100 dark:border-primary-900/30">
              {customer.type}
            </span>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary-500 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
              >
                <Phone size={14} fill="currentColor" />
              </a>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col gap-3">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>

          <div className="flex justify-between items-center w-full">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                Receivable (AR)
              </span>
              <span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">
                ₹{totalReceivable.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                Payable (AP)
              </span>
              <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-500">
                ₹{totalPayable.toLocaleString()}
              </span>
            </div>
          </div>

          {(totalReceivable > 0 || totalPayable > 0) && (
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {totalReceivable > 0 && (
                <button
                  onClick={() => setArOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  Log Receipt
                </button>
              )}
              {totalPayable > 0 && (
                <button
                  onClick={() => setApOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
                >
                  Log Payout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {[
            { id: "orders", label: "Orders", icon: FileText },
            { id: "payments", label: "Payments", icon: Banknote },
            { id: "timeline", label: "Timeline", icon: CalendarClock },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
                activeTab === t.id
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
              )}
            >
              <t.icon size={14} strokeWidth={2.5} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto pb-2">
        {activeTab === "orders" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {orders.length} Orders Total
              </span>
              
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={clsx(
                      "size-8 rounded-lg flex items-center justify-center transition-all relative active:scale-95 border",
                      isFilterOpen
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <SlidersHorizontal size={16} />
                    {(orderTypeFilter !== "ALL" || orderStatusFilter !== "ACTIVE") && (
                      <span className="absolute -top-1 -right-1 size-3 bg-primary-500 rounded-full border-2 border-white dark:border-slate-950" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-4 z-50">
                  <div className="space-y-4">
                    {/* Layer 1: Type Filters */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Order Type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "ALL", label: "All" },
                          { id: "SALE", label: "Sales" },
                          { id: "PURCHASE", label: "Purchases" },
                        ].map((pill) => (
                          <button
                            key={pill.id}
                            onClick={() => {
                              setOrderTypeFilter(pill.id as any);
                              setIsFilterOpen(false);
                            }}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                              orderTypeFilter === pill.id
                                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Layer 2: Status Filters */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Lifecycle State
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "ALL", label: "All" },
                          { id: "ACTIVE", label: "Active" },
                          { id: "SETTLED", label: "Settled" },
                        ].map((pill) => (
                          <button
                            key={pill.id}
                            onClick={() => {
                              setOrderStatusFilter(pill.id as any);
                              setIsFilterOpen(false);
                            }}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                              orderStatusFilter === pill.id
                                ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No orders found.
              </div>
            ) : (
              filteredOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() =>
                    navigate(
                      (o as any).isPurchaseOrder
                        ? `/purchase-orders/${o.id}`
                        : `/orders/${o.id}`,
                    )
                  }
                  className={clsx(
                    "bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:border-primary-500/30 active:scale-[0.98] transition-all relative overflow-hidden",
                    (o as any).isPurchaseOrder ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {/* ORDER ID */}
                      <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest">
                        #{o.id.substring(0, 8)}
                      </span>
                      {/* STATUS */}
                      <span
                        className={clsx(
                          "text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm",
                          o.status === "SETTLED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : o.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
                              : o.status === "OPEN" ||
                                  o.status === "AWAITING_RECEIPT" ||
                                  o.status === "RECEIVED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1">
                      {/* <span>
                        {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                      </span> */}
                      {/* DATE */}
                      <span className="text-[10px] font-bold text-slate-400">
                        {format(parseISO(o.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      ₹{o.totalAmount.toLocaleString()}
                    </span>
                    {o.status !== "SETTLED" && o.status !== "RETURNED" && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 block mt-0.5">
                        Bal: ₹{(o.totalAmount - o.amountPaid).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {payments.length} Transaction{payments.length !== 1 ? "s" : ""}
              </span>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No payment records yet.
              </div>
            ) : (
              payments.map((p: any) => {
                const isReceived = !!p.isAr;
                const amount = p.totalReceived || p.totalPaid || 0;
                const date = p.receivedAt || p.paidAt;
                const mode = p.mode || "—";
                // Collect all linked order IDs from allocations
                const linkedOrders: { id: string; isAp: boolean }[] =
                  (p.allocations || []).map((a: any) => ({
                    id: a.saleOrderId || a.purchaseOrderId,
                    isAp: !!a.purchaseOrderId,
                  })).filter((a: any) => !!a.id);

                return (
                  <div
                    key={p.id}
                    className={clsx(
                      "bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden",
                      isReceived
                        ? "border-emerald-100 dark:border-emerald-900/30"
                        : "border-amber-100 dark:border-amber-900/30",
                    )}
                  >
                    {/* Colour bar at top */}
                    <div
                      className={clsx(
                        "h-1 w-full",
                        isReceived ? "bg-emerald-500" : "bg-amber-500",
                      )}
                    />
                    <div className="p-4">
                      {/* Row 1: Direction label + amount */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span
                            className={clsx(
                              "text-[11px] font-black uppercase tracking-wider",
                              isReceived
                                ? "text-emerald-600 dark:text-emerald-500"
                                : "text-amber-600 dark:text-amber-500",
                            )}
                          >
                            {isReceived ? "▲ Money Received" : "▼ Payment Sent"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {date ? format(parseISO(date), "MMM d, yyyy · h:mm a") : "—"}
                          </span>
                        </div>
                        <span
                          className={clsx(
                            "font-black text-xl tracking-tight",
                            isReceived
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {isReceived ? "+" : "-"}₹{amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Row 2: Mode badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                          {mode}
                        </span>
                        {p.note && (
                          <span className="text-[10px] font-medium text-slate-400 truncate">
                            {p.note}
                          </span>
                        )}
                      </div>

                      {/* Row 3: Linked orders */}
                      {linkedOrders.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Applied To
                          </span>
                          {linkedOrders.map((lo, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <div
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() =>
                                  navigate(
                                    lo.isAp
                                      ? `/purchase-orders/${lo.id}`
                                      : `/orders/${lo.id}`,
                                  )
                                }
                              >
                                <span
                                  className={clsx(
                                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                    lo.isAp
                                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                                  )}
                                >
                                  {lo.isAp ? "PO" : "SO"}
                                </span>
                                <span className="text-xs font-extrabold text-primary-500 group-hover:underline uppercase tracking-wider">
                                  #{lo.id.substring(0, 8)}
                                </span>
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                ₹{
                                  (
                                    p.allocations?.find(
                                      (a: any) =>
                                        (a.saleOrderId || a.purchaseOrderId) ===
                                        lo.id,
                                    )?.amountAllocated || 0
                                  ).toLocaleString()
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-2 space-y-6">
            {mergedTimeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium -ml-4">
                No recent activity.
              </div>
            ) : (
              mergedTimeline.map((item) => {
                const isOrder = "createdAt" in item;
                const timestamp = isOrder
                  ? (item as any).createdAt
                  : (item as any).receivedAt || (item as any).paidAt;
                const dateHeader = format(
                  parseISO(timestamp),
                  "MMM d, yyyy · h:mm a",
                );

                if (isOrder) {
                  const o = item as SaleOrder;
                  return (
                    <div key={`order-${o.id}`} className="relative">
                      <div className="absolute -left-[23px] top-1 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-white dark:border-slate-950 p-1">
                        <div className="size-2 rounded-full bg-blue-500"></div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {dateHeader}
                      </p>
                      <div
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-primary-500/30 transition-all"
                        onClick={() =>
                          navigate(
                            (o as any).isPurchaseOrder
                              ? `/purchase-orders/${o.id}`
                              : `/orders/${o.id}`,
                          )
                        }
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block mb-1">
                          Created{" "}
                          {(o as any).isPurchaseOrder
                            ? "Purchase"
                            : o.orderType || "Sale"}{" "}
                          Order (#{o.id.substring(0, 8).toUpperCase()})
                        </span>
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>{o.items.length} items</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            ₹{o.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const p = item as any;
                  return (
                    <div key={`payment-${p.id}`} className="relative">
                      <div
                        className={clsx(
                          "absolute -left-[23px] top-1 rounded-full border border-white dark:border-slate-950 p-1",
                          p.isAr
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-amber-100 dark:bg-amber-900/40",
                        )}
                      >
                        <div
                          className={clsx(
                            "size-2 rounded-full",
                            p.isAr ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        ></div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {dateHeader}
                      </p>
                      <div
                        className={clsx(
                          "p-3 rounded-xl border shadow-sm",
                          p.isAr
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                            : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
                        )}
                      >
                          <span
                            className={clsx(
                              "font-bold text-sm block mb-1",
                              p.isAr
                                ? "text-emerald-800 dark:text-emerald-400"
                                : "text-amber-800 dark:text-amber-400",
                            )}
                          >
                            {p.isAr ? "Payment Received" : "Payment Sent (PO)"}
                            {p.allocations && p.allocations.length === 1 && (
                              <span className="opacity-70 ml-1">
                                (#{p.allocations[0].saleOrderId?.substring(0, 8).toUpperCase() || p.allocations[0].purchaseOrderId?.substring(0, 8).toUpperCase()})
                              </span>
                            )}
                          </span>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 capitalize">
                            Via {p.mode.toLowerCase()}
                          </span>
                          <span
                            className={clsx(
                              "font-black",
                              p.isAr
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-amber-700 dark:text-amber-400",
                            )}
                          >
                            ₹
                            {(
                              p.totalReceived ||
                              p.totalPaid ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>

      <AllocationSheet
        open={arOpen}
        onOpenChange={setArOpen}
        customerId={customer.id}
      />
      <SupplierAllocationSheet
        open={apOpen}
        onOpenChange={setApOpen}
        supplierId={customer.id}
      />
      <CustomerEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />
    </div>
  );
}
