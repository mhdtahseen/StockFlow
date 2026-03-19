import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { ChevronLeft, FileText, Banknote, CalendarClock, Phone } from 'lucide-react';
import { format, parseISO, compareDesc } from 'date-fns';
import clsx from 'clsx';
import { SaleOrder } from '@/features/billing/types';
import { CustomerPayment } from '@/features/customers/types';
import { AllocationSheet } from '@/components/shared/AllocationSheet';
import { SupplierAllocationSheet } from '@/components/shared/SupplierAllocationSheet';

type Tab = 'orders' | 'payments' | 'timeline';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = useAppSelector((state) => state.customers.customers.find((c) => c.id === id));
  const orders = useAppSelector((state) => state.billing.orders.filter((o) => o.counterpartyId === id));
  const payments = useAppSelector((state) => state.customers.payments.filter((p) => p.counterpartyId === id));

  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [arOpen, setArOpen] = useState(false);
  const [apOpen, setApOpen] = useState(false);

  if (!customer) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 justify-center items-center text-red-500 font-bold">
        Customer not found
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">Go Back</button>
      </div>
    );
  }

  const outstanding = orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0);

  const mergedTimeline = [...orders, ...payments].sort((a, b) => {
    const dateA = 'createdAt' in a ? (a as SaleOrder).createdAt : (a as CustomerPayment).receivedAt;
    const dateB = 'createdAt' in b ? (b as SaleOrder).createdAt : (b as CustomerPayment).receivedAt;
    return compareDesc(parseISO(dateA), parseISO(dateB));
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">
                {customer.type}
              </span>
            </div>
          </div>
        </div>
        
        {/* Balance Card */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative overflow-hidden flex justify-between items-center">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#064a98]"></div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">Net Outstanding</span>
            <span className={clsx("text-2xl font-black tracking-tight", outstanding > 0 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500")}>
              ₹{outstanding.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2">
            {outstanding > 0 && (customer.type === 'CUSTOMER' || customer.type === 'RETAILER') && (
              <button onClick={() => setArOpen(true)} className="px-3 py-1.5 bg-[#064a98] text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                Log Batch AR
              </button>
            )}
            {outstanding > 0 && (customer.type === 'WHOLESALER' || customer.type === 'PLATFORM') && (
              <button onClick={() => setApOpen(true)} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-lg shadow-rose-500/20 active:scale-95 transition-transform">
                Apply Payout
              </button>
            )}
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="size-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#064a98] dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Phone size={18} fill="currentColor" />
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {[
            { id: 'orders', label: 'Orders', icon: FileText },
            { id: 'payments', label: 'Payments', icon: Banknote },
            { id: 'timeline', label: 'Timeline', icon: CalendarClock }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
                activeTab === t.id
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              )}
            >
              <t.icon size={14} strokeWidth={2.5} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto pb-24">
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">No orders found.</div>
            ) : (
              orders.map(o => (
                <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:border-[#064a98]/30 active:scale-[0.98] transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1 border-slate-50">
                      <span className={clsx(
                        "text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm",
                        o.status === "SETTLED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400" :
                        o.status === "PARTIAL" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400" :
                        o.status === "OPEN" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400" :
                        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {o.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {format(parseISO(o.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-black text-slate-900 dark:text-slate-100">₹{o.totalAmount.toLocaleString()}</span>
                    {o.status !== 'SETTLED' && o.status !== 'RETURNED' && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 block mt-0.5">Bal: ₹{(o.totalAmount - o.amountPaid).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3">
             {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">No payments received.</div>
            ) : (
              payments.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-emerald-600 dark:text-emerald-500">₹{p.totalReceived.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-400">{format(parseISO(p.receivedAt), "MMM d, h:mm a")}</span>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{p.mode}</span>
                   </div>
                   {p.allocations && p.allocations.length > 0 && (
                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                       {p.allocations.map((a, i) => (
                         <div key={i} className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                           <span className="truncate">Applied to Order</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">₹{a.amountAllocated.toLocaleString()}</span>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-2 space-y-6">
            {mergedTimeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium -ml-4">No recent activity.</div>
            ) : (
              mergedTimeline.map((item) => {
                const isOrder = 'orderType' in item;
                const timestamp = isOrder ? (item as SaleOrder).createdAt : (item as CustomerPayment).receivedAt;
                const dateHeader = format(parseISO(timestamp), "MMM d, yyyy · h:mm a");

                if (isOrder) {
                  const o = item as SaleOrder;
                  return (
                    <div key={`order-${o.id}`} className="relative">
                      <div className="absolute -left-[23px] top-1 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-white dark:border-slate-950 p-1">
                         <div className="size-2 rounded-full bg-blue-500"></div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{dateHeader}</p>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-[#064a98]/30 transition-all" onClick={() => navigate(`/orders/${o.id}`)}>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block mb-1">Created {o.orderType} Order</span>
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>{o.items.length} items</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">₹{o.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const p = item as CustomerPayment;
                  return (
                    <div key={`payment-${p.id}`} className="relative">
                      <div className="absolute -left-[23px] top-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-white dark:border-slate-950 p-1">
                         <div className="size-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{dateHeader}</p>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm block mb-1">Payment Received</span>
                        <div className="flex justify-between text-xs text-emerald-600/80 dark:text-emerald-500/80 font-medium">
                          <span>Via {p.mode}</span>
                          <span className="font-black text-emerald-700 dark:text-emerald-400">₹{p.totalReceived.toLocaleString()}</span>
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

      <AllocationSheet open={arOpen} onOpenChange={setArOpen} customerId={customer.id} />
      <SupplierAllocationSheet open={apOpen} onOpenChange={setApOpen} supplierId={customer.id} />
    </div>
  );
}
