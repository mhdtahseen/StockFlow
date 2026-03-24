import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { useNavigate } from "react-router-dom";
import { FileText, Search, ChevronRight, Plus } from "lucide-react";
import { parseISO, format } from "date-fns";
import clsx from "clsx";
import { SaleOrder } from "@/features/billing/types";
import { selectCustomers } from "@/features/customers/selectors";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";

export default function Orders() {
  const navigate = useNavigate();
  const saleOrders = useAppSelector((state) => state.billing.orders);
  const purchaseOrders = useAppSelector((state) => state.purchasing.orders);
  const customers = useAppSelector(selectCustomers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"TRADE" | "PURCHASE">("TRADE");
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [customers]);

  const filteredTrade = useMemo(() => {
    return saleOrders
      .map((o: SaleOrder) => ({
        ...o,
        customerName: customerMap[o.counterpartyId] || "Unknown",
      }))
      .filter((o) =>
        o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [saleOrders, customerMap, search]);

  const filteredPurchase = useMemo(() => {
    return purchaseOrders
      .map((o: any) => ({
        ...o,
        customerName: customerMap[o.counterpartyId] || "Unknown",
      }))
      .filter((o) =>
        o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [purchaseOrders, customerMap, search]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="px-4 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setActiveTab("TRADE")}
            className={clsx(
              "text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-colors",
              activeTab === "TRADE"
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-slate-400",
            )}
          >
            Sales ({saleOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("PURCHASE")}
            className={clsx(
              "text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-colors",
              activeTab === "PURCHASE"
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-slate-400",
            )}
          >
            Purchases ({purchaseOrders.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        <div className="space-y-3 pb-24">
          {activeTab === "TRADE" ? (
            filteredTrade.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <p className="text-slate-500 font-semibold mb-2">
                  No trade orders found.
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Create a trade order from the device detail screen.
                </p>
              </div>
            ) : (
              filteredTrade.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-primary-500/30 active:scale-[0.98] transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          "text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0",
                          o.status === "SETTLED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : o.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
                              : o.status === "OPEN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        {o.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        {format(parseISO(o.createdAt), "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {o.customerName}
                    </h3>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""} •{" "}
                      {o.orderType}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      ₹{o.totalAmount.toLocaleString()}
                    </span>
                    {o.status !== "SETTLED" && o.status !== "RETURNED" && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 block mt-0.5">
                        Bal: ₹{(o.totalAmount - o.amountPaid).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 -mr-1"
                  />
                </div>
              ))
            )
          ) : filteredPurchase.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <p className="text-slate-500 font-semibold mb-2">
                No purchase orders found.
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Use 'Stock Up' to create new purchase orders.
              </p>
            </div>
          ) : (
            filteredPurchase.map((o) => (
              <div
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-primary-500/30 active:scale-[0.98] transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={clsx(
                        "text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0",
                        o.status === "SETTLED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : o.status === "PARTIAL"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
                      )}
                    >
                      {o.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 truncate">
                      {format(parseISO(o.createdAt), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {o.customerName}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    {o.phonesOrdered}{" "}
                    {o.phonesOrdered === 1 ? "device" : "devices"} •{" "}
                    {o.acquisitionChannel}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="font-black text-rose-600 dark:text-rose-400">
                    ₹{o.totalAmount.toLocaleString()}
                  </span>
                  {o.status !== "SETTLED" && o.status !== "CANCELLED" && (
                    <span className="text-xs font-bold text-rose-500/60 block mt-0.5">
                      Owed: ₹{(o.totalAmount - o.amountPaid).toLocaleString()}
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 -mr-1"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Order FAB - Only show on Trade tab */}
      {activeTab === "TRADE" && (
        <button
          onClick={() => setShowCreateOrder(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-primary-500 hover:bg-blue-800 text-white rounded-full shadow-lg shadow-blue-900/20 flex items-center justify-center active:scale-[0.98] transition-all z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Order Sheet */}
      <CreateOrderSheet
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        initialPhones={[]} // Empty for manual order creation
      />
    </div>
  );
}
