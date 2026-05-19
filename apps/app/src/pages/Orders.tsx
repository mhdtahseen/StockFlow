import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, ChevronRight, Plus } from "lucide-react";
import { parseISO, format } from "date-fns";
import clsx from "clsx";
import { SaleOrder } from "@/features/billing/types";
import { selectCustomers } from "@/features/customers/selectors";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import HeaderActions from "@/components/layout/HeaderActions";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { BulkInvoiceSheet } from "@/components/shared/BulkInvoiceSheet";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { useAuth } from "@/context/AuthContext";

export default function Orders() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const saleOrders = useAppSelector((state) => state.billing.orders);
  const customers = useAppSelector(selectCustomers);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'PARTIAL' | 'SETTLED' | 'RETURNED'>('ALL');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showBulkSheet, setShowBulkSheet] = useState(false);

  const multi = useMultiSelect(saleOrders);

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [customers]);

  const customerObjMap = useMemo(() => {
    const map: Record<string, any> = {};
    customers.forEach((c) => (map[c.id] = c));
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
        const matchesId = o.id.toLowerCase().includes(searchLower);
        const matchesImei = o.items.some(item => 
          item.imeiSnapshot?.some(imei => imei.toLowerCase().includes(searchLower))
        );
        const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
        return (matchesName || matchesId || matchesImei) && matchesFilter;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [saleOrders, customerMap, search, activeFilter]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN': return {
        label: "Open",
        class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      };
      case 'PARTIAL': return {
        label: "Partial",
        class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
      };
      case 'SETTLED': return {
        label: "Settled",
        class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      };
      case 'RETURNED': return {
        label: "Returned",
        class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      };
      default: return { label: status, class: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const getChannelColor = (orderType: string) => {
    switch (orderType) {
      case 'SALES': return "text-indigo-600 dark:text-indigo-400 font-black";
      default: return "text-slate-500 font-medium";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 md:pb-12 font-sans selection:bg-primary-500/30">
      <HeaderActions>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateOrder(true)}
          className="size-11 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 active:scale-95 group transition-all"
        >
          <Plus size={22} className="group-hover:rotate-12 transition-transform" />
        </motion.button>
      </HeaderActions>

      {/* Sticky Header with Glassmorphism */}
      <div className="sticky top-0 z-20 pt-1 pb-1">
        <div className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by customer, ID or IMEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all shadow-sm shadow-slate-200/20 dark:shadow-none"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-0.5">
            {(['ALL', 'OPEN', 'PARTIAL', 'SETTLED', 'RETURNED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  "px-4 py-2.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0",
                  activeFilter === filter
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-lg shadow-slate-900/10 dark:shadow-white/10"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {filter === 'ALL' ? 'All Orders' : filter.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4">
        {/* Section header */}
        <div className="flex justify-between items-center mt-6 mb-1.5 px-1">
          <h2 className="font-bold tracking-tight text-xs uppercase text-slate-800 dark:text-slate-200">
            Orders
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </span>
            <FeatureGate feature="bulk_invoice" badge>
              <button
                onClick={() => multi.isMultiSelect ? multi.exitMultiSelect() : multi.enterMultiSelect()}
                className={clsx(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm",
                  multi.isMultiSelect
                    ? "bg-primary-500 text-white"
                    : "text-primary-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800",
                )}
              >
                {multi.isMultiSelect ? "Cancel" : "Select"}
              </button>
            </FeatureGate>
          </div>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mx-2 shadow-sm"
            >
              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                <Package size={32} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No results found</h3>
              <p className="text-xs mt-1.5 text-slate-500 dark:text-slate-500 max-w-[200px] leading-relaxed italic">
                {search || activeFilter !== 'ALL' ? "Adjust your search to find what you're looking for." : "Start by creating your first sales order."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3.5 md:space-y-0 mt-2 px-1 md:grid md:grid-cols-2 md:gap-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  onClick={() => {
                    if (multi.isMultiSelect) {
                      multi.toggleSelect(order.id);
                    } else {
                      navigate(`/orders/${order.id}`);
                    }
                  }}
                  onTouchStart={() => multi.startLongPress(order.id)}
                  onTouchEnd={multi.cancelLongPress}
                  onMouseDown={() => multi.startLongPress(order.id)}
                  onMouseUp={multi.cancelLongPress}
                  onMouseLeave={multi.cancelLongPress}
                  className={clsx(
                    "p-5 rounded-[24px] border shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-2xl hover:shadow-primary-500/10 transition-all cursor-pointer group active:scale-[0.985] relative",
                    multi.isMultiSelect && multi.selectedIds.includes(order.id)
                      ? "border-primary-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-primary-400/30"
                  )}
                >
                  {/* Checkbox overlay */}
                  {multi.isMultiSelect && (
                    <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 z-10 shadow-sm rounded-lg">
                      <div className={clsx(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        multi.selectedIds.includes(order.id)
                          ? "bg-primary-500 border-primary-500"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      )}>
                        {multi.selectedIds.includes(order.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight border",
                            getStatusConfig(order.status).class
                          )}
                        >
                          {getStatusConfig(order.status).label}
                        </span>
                        <span className={clsx("text-[9px] uppercase tracking-widest opacity-60", getChannelColor((order as any).orderType || 'SALES'))}>
                          {(order as any).orderType || 'SALES'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-mono text-base font-black text-slate-900 dark:text-slate-100 leading-none">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 mt-3">
                        <span className="flex items-center gap-1.5">
                          <Package size={13} className="opacity-40" />
                          <span className="text-slate-700 dark:text-slate-300">{order.items.length}</span> {order.items.length === 1 ? 'device' : 'devices'}
                        </span>
                        {(order.amountPaid > 0 && order.status !== 'SETTLED' && order.status !== 'RETURNED') && (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="text-primary-500/90 font-bold">{order.amountPaid} paid</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="text-base font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                        ₹{order.totalAmount.toLocaleString()}
                      </span>
                      {order.totalAmount - order.amountPaid > 0 && (
                        <span className="mt-1 px-1.5 py-0.5 rounded-md bg-rose-500/5 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase tracking-tighter">
                          Owed: ₹{(order.totalAmount - order.amountPaid).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/40">
                    <div className="text-[10px] font-bold text-slate-400/80 uppercase tracking-[0.1em]">
                      {format(parseISO(order.createdAt), "MMM dd · HH:mm aa")}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary-500 group-hover:text-primary-400 transition-colors uppercase tracking-[0.1em]">
                      View Details <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom multi-select action bar */}
      {multi.isMultiSelect && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 p-4 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Selected</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {multi.selectedIds.length} {multi.selectedIds.length === 1 ? "order" : "orders"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => multi.toggleAll(filteredOrders)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
            >
              {filteredOrders.every((o) => multi.selectedIds.includes(o.id)) ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => setShowBulkSheet(true)}
              disabled={multi.selectedIds.length === 0}
              className="bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg text-sm transition-colors"
            >
              Generate Invoices
            </button>
          </div>
        </div>
      )}

      {/* Create Order Sheet */}
      <CreateOrderSheet
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        initialPhones={[]}
      />

      {/* Bulk Invoice Sheet */}
      <BulkInvoiceSheet
        open={showBulkSheet}
        onOpenChange={(o) => { setShowBulkSheet(o); if (!o) multi.exitMultiSelect(); }}
        orders={multi.selectedItems}
        counterpartyMap={customerObjMap}
        tenant={tenant}
        isPurchaseOrder={false}
      />
    </div>
  );
}
