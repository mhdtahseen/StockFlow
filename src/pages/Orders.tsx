import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { useNavigate } from "react-router-dom";
import { FileText, Search, ChevronRight, Plus, Filter, Package } from "lucide-react";
import { parseISO, format } from "date-fns";
import clsx from "clsx";
import { SaleOrder } from "@/features/billing/types";
import { selectCustomers } from "@/features/customers/selectors";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import HeaderActions from "@/components/layout/HeaderActions";

export default function Orders() {
  const navigate = useNavigate();
  const saleOrders = useAppSelector((state) => state.billing.orders);
  const customers = useAppSelector(selectCustomers);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'PARTIAL' | 'SETTLED' | 'RETURNED'>('ALL');
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [customers]);

  const filteredOrders = useMemo(() => {
    return saleOrders
      .map((o: SaleOrder) => ({
        ...o,
        customerName: customerMap[o.counterpartyId] || "Unknown",
      }))
      .filter((o) => {
        const searchLower = search.toLowerCase();
        const matchesName = o.customerName.toLowerCase().includes(searchLower);
        const matchesImei = o.items.some(item => 
          item.imeiSnapshot?.some(imei => imei.toLowerCase().includes(searchLower))
        );
        const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
        return (matchesName || matchesImei) && matchesFilter;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [saleOrders, customerMap, search, activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400";
      case 'PARTIAL': return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400";
      case 'SETTLED': return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400";
      case 'RETURNED': return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 font-sans">
      <HeaderActions>
        <button
          onClick={() => setShowCreateOrder(true)}
          className="size-10 rounded-full bg-primary-500 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </HeaderActions>

      {/* Header Search */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {(['ALL', 'OPEN', 'PARTIAL', 'SETTLED', 'RETURNED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={clsx(
              "px-5 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase whitespace-nowrap transition-all",
              activeFilter === filter
                ? "bg-primary-500 text-white shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="px-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 mt-2 shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full mb-4">
              <FileText size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">No sales orders found</p>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
              {search || activeFilter !== 'ALL' ? "Adjust your search or status filter to see more orders." : "Start by creating your first sales order today."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary-500/20 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                          getStatusColor(order.status)
                        )}
                      >
                        {order.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {(order as any).orderType || 'SALES'}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 truncate text-base leading-tight">
                      {order.customerName}
                    </h3>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-lg">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                    {order.status !== 'SETTLED' && order.status !== 'RETURNED' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bal:</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-500">
                          ₹{(order.totalAmount - order.amountPaid).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Package size={12} />
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 dark:text-slate-700">|</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {format(parseISO(order.createdAt), "MMM d, h:mm a")}
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Order Sheet */}
      <CreateOrderSheet
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        initialPhones={[]}
      />
    </div>
  );
}
