import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { addSupplierSettlement } from '@/features/purchasing/slice';
import { addEntry } from '@/features/ledger/slice';
import type { PayMode } from '@/features/purchasing/types';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export function SupplierAllocationSheet({ open, onOpenChange, supplierId }: Props) {
  const dispatch = useAppDispatch();
  const allOrders = useAppSelector((state) => state.purchasing.orders);
  
  const orders = useMemo(() => 
    allOrders.filter(o => o.counterpartyId === supplierId && (o.status === 'AWAITING_RECEIPT' || o.status === 'RECEIVED' || o.status === 'PARTIAL'))
    .sort((a,b) => new Date(a.dueDate || a.createdAt).getTime() - new Date(b.dueDate || b.createdAt).getTime())
  , [allOrders, supplierId]);
  
  const [totalPaidStr, setTotalPaidStr] = useState('');
  const [mode, setMode] = useState<Exclude<PayMode, 'CREDIT'>>('CASH');

  const maxOwed = orders.reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);
  const totalPaid = parseFloat(totalPaidStr) || 0;

  const allocations = useMemo(() => {
     let remaining = totalPaid;
     return orders.map(o => {
        const owed = o.totalAmount - o.amountPaid;
        const take = Math.min(owed, remaining);
        remaining -= take;
        return { orderId: o.id, owed, allocated: take };
     });
  }, [totalPaid, orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPaid <= 0 || totalPaid > maxOwed) return toast.error(`Invalid amount max is ${maxOwed}`);
    
    // Using the optimized FIFO Settlement RPC flow for AP
    dispatch(addSupplierSettlement({
       counterpartyId: supplierId,
       amount: totalPaid,
       mode,
       note: `Supplier lump-sum settlement for ${orders.length} orders`
    }));

    // Optimistic Ledger entry for immediate Wallet balance update
    dispatch(addEntry({
       id: crypto.randomUUID(),
       type: 'WITHDRAWAL',
       amount: totalPaid,
       note: `Supplier Settlement (FIFO)`,
       createdAt: new Date().toISOString(),
    }));
    
    toast.success("Accounts Payable Settlement Dispatched");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-[92vh] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle>Capital Payout Waterfall (AP)</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
           <form id="payout-form" onSubmit={handleSubmit}>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
                <div className="flex justify-between items-center mb-5 ml-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Payable Dues Remaining</label>
                  <span className="text-2xl font-black text-rose-500 tracking-tight">₹{maxOwed.toLocaleString()}</span>
                </div>
                
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 block ml-2">Tender Method Outflow</label>
                <div className="grid grid-cols-4 gap-2 mb-5 ml-2">
                   {['CASH', 'UPI', 'BANK_TRANSFER'].map(m => (
                  <button key={m} type="button" onClick={() => setMode(m as Exclude<PayMode, 'CREDIT'>)}
                       className={clsx(
                         "py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-colors border text-center wrap-break-word",
                         mode === m ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20" : "bg-slate-50 border-slate-200 dark:bg-slate-950 text-slate-500 dark:border-slate-800"
                       )}
                     >{m.replace('_','\n')}</button>
                   ))}
                </div>

                <div className="ml-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 block">Amount Disbursed (₹)</label>
                  <Input type="number" max={maxOwed} min={1} value={totalPaidStr} onChange={e => setTotalPaidStr(e.target.value)} className="h-14 font-black tracking-tight text-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" autoFocus />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block ml-1 mb-2">Automated Payout Stack (FIFO Basis)</label>
                {allocations.map((a, i) => (
                   <div key={a.orderId} className={clsx("p-4 rounded-xl border-2 flex justify-between items-center transition-colors", a.allocated > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 shadow-sm" : "bg-white dark:bg-slate-900 border-transparent")}>
                      <div>
                        <div className={clsx("font-bold text-sm", a.allocated > 0 ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100")}>Purchase Order #{a.orderId.slice(0, 5).toUpperCase()}</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider">Owed: ₹{a.owed.toLocaleString()}</div>
                      </div>
                      <div className={clsx("text-lg font-black tracking-tight", a.allocated > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-300 dark:text-slate-600")}>
                        {a.allocated > 0 ? `- ₹${a.allocated.toLocaleString()}` : "—"}
                      </div>
                   </div>
                ))}
                {allocations.length === 0 && (
                   <div className="text-center py-6 text-slate-400 font-medium border border-dashed rounded-xl">No pending payables.</div>
                )}
              </div>
           </form>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
           <Button type="submit" form="payout-form" disabled={totalPaid <= 0 || allocations.length === 0} className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-xl shadow-primary-500/20 transition-all disabled:opacity-50">
             Execute Capital Outflow
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
