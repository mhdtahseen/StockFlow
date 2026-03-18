import React, { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import clsx from 'clsx';
import { SaleOrder } from '@/features/billing/types';

export default function Orders() {
  const navigate = useNavigate();
  const orders = useAppSelector((state) => state.billing.orders);
  const customers = useAppSelector((state) => state.customers.customers);
  const [search, setSearch] = useState('');

  const enrichedOrders = orders.map((o) => {
    const customer = customers.find(c => c.id === o.counterpartyId);
    return { ...o, customerName: customer?.name || 'Unknown' };
  });

  const filtered = enrichedOrders
    .filter((o) => o.customerName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <FileText className="text-[#064a98]" size={24} />
          Trade Orders
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{orders.length} Records</p>
      </header>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm focus:border-[#064a98] outline-none transition-colors"
          />
        </div>

        <div className="space-y-3 pb-24">
           {filtered.length === 0 ? (
             <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <p className="text-slate-500 font-semibold mb-2">No orders found.</p>
                <p className="text-xs text-slate-400 font-medium">Create a trade order from the device detail screen or multi-select.</p>
             </div>
           ) : (
             filtered.map((o) => (
               <div
                 key={o.id}
                 onClick={() => navigate(`/orders/${o.id}`)}
                 className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-[#064a98]/30 active:scale-[0.98] transition-all group"
               >
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className={clsx(
                        "text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0",
                        o.status === "SETTLED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400" :
                        o.status === "PARTIAL" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400" :
                        o.status === "OPEN" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400" :
                        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {o.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        {format(parseISO(o.createdAt), "MMM d, yyyy · h:mm a")}
                      </span>
                   </div>
                   <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{o.customerName}</h3>
                   <div className="text-xs font-semibold text-slate-500 mt-0.5">{o.items.length} item{o.items.length !== 1 ? 's' : ''} • {o.orderType}</div>
                 </div>
                 
                 <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-slate-900 dark:text-slate-100">₹{o.totalAmount.toLocaleString()}</span>
                    {o.status !== 'SETTLED' && o.status !== 'RETURNED' && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 block mt-0.5">Bal: ₹{(o.totalAmount - o.amountPaid).toLocaleString()}</span>
                    )}
                  </div>
                 <ChevronRight size={18} className="text-slate-300 group-hover:text-[#064a98] transition-colors shrink-0 -mr-1" />
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
