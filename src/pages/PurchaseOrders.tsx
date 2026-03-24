import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { useNavigate } from "react-router-dom";
import { Package, Search, ChevronRight, Filter } from "lucide-react";
import { parseISO, format } from "date-fns";
import clsx from "clsx";
import { PurchaseOrder } from "@/features/purchasing/types";
import { selectCustomers } from "@/features/customers/selectors";
import { BatchAddSheet } from "@/components/shared/BatchAddSheet";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const purchaseOrders = useAppSelector((state) => state.purchasing.orders);
  const customers = useAppSelector(selectCustomers);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AWAITING_RECEIPT' | 'RECEIVED' | 'PARTIAL' | 'SETTLED'>('ALL');
  const [showBatchAdd, setShowBatchAdd] = useState(false);

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [customers]);

  const filteredOrders = useMemo(() => {
    return purchaseOrders
      .map((o: PurchaseOrder) => ({ ...o, customerName: customerMap[o.counterpartyId] || "Unknown" }))
      .filter((o) => {
        const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [purchaseOrders, customerMap, search, activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_RECEIPT': return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400";
      case 'RECEIVED': return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400";
      case 'PARTIAL': return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400";
      case 'SETTLED': return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400";
      case 'CANCELLED': return "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'DIRECT': return "bg-purple-50 text-purple-700 dark:text-purple-400";
      case 'PLATFORM': return "bg-teal-50 text-teal-700 dark:text-teal-400";
      case 'INTER_TENANT': return "bg-indigo-50 text-indigo-700 dark:text-indigo-400";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setShowBatchAdd(true)}
            className="bg-primary-500 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-[0.98] transition-all"
          >
            <Package size={16} />
            New PO
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {(['ALL', 'AWAITING_RECEIPT', 'RECEIVED', 'PARTIAL', 'SETTLED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              activeFilter === filter
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
            )}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="px-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
            <Package size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No purchase orders found</p>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
              {search || activeFilter !== 'ALL' ? "Try adjusting your search or filters." : "Create your first purchase order to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/purchase-orders/${order.id}`)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          getStatusColor(order.status)
                        )}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                      <span
                        className={clsx(
                          "px-2 py-1 rounded-full text-[10px] font-bold",
                          getChannelColor(order.acquisitionChannel)
                        )}
                      >
                        {order.acquisitionChannel}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{order.customerName}</h3>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">
                      {order.phonesOrdered} {order.phonesOrdered === 1 ? 'device' : 'devices'} ordered
                      {order.phonesReceived > 0 && ` • ${order.phonesReceived} received`}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-slate-900 dark:text-slate-100">₹{order.totalAmount.toLocaleString()}</span>
                    {order.status !== 'SETTLED' && order.status !== 'CANCELLED' && (
                      <span className="text-xs font-bold text-amber-500/60 block mt-0.5">
                        Owed: ₹{(order.totalAmount - order.amountPaid).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 -mr-1" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 truncate">
                  {format(parseISO(order.createdAt), "MMM d, yyyy · h:mm a")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Add Sheet */}
      <BatchAddSheet
        open={showBatchAdd}
        onOpenChange={setShowBatchAdd}
      />
    </div>
  );
}
