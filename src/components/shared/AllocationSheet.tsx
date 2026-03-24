import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectOrdersByCounterparty } from '@/features/billing/selectors';
import { addCustomerPayment } from '@/features/customers/slice';
import { updateOrderPayment } from '@/features/billing/slice';
import { addEntry } from '@/features/ledger/slice';
import type { PayMode } from '@/features/billing/types';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}

export function AllocationSheet({ open, onOpenChange, customerId }: Props) {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrdersByCounterparty(customerId)).filter(o => o.status === 'OPEN' || o.status === 'PARTIAL').sort((a,b) => new Date(a.dueDate || a.createdAt).getTime() - new Date(b.dueDate || b.createdAt).getTime());
  
  const [totalReceivedStr, setTotalReceivedStr] = useState('');
  const [mode, setMode] = useState<Exclude<PayMode, 'CREDIT'>>('CASH');

  const maxOwed = orders.reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);
  const totalReceived = parseFloat(totalReceivedStr) || 0;

  // Auto-allocate waterfall method
  const allocations = useMemo(() => {
     let remaining = totalReceived;
     return orders.map(o => {
        const owed = o.totalAmount - o.amountPaid;
        const take = Math.min(owed, remaining);
        remaining -= take;
        return { orderId: o.id, owed, allocated: take };
     });
  }, [totalReceived, orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalReceived <= 0 || totalReceived > maxOwed) return toast.error(`Invalid amount max is ${maxOwed}`);
    
    const allocationsToApply = allocations.filter(a => a.allocated > 0);
    const paymentId = crypto.randomUUID();

    dispatch(addCustomerPayment({
       id: paymentId,
       counterpartyId: customerId,
       totalReceived,
       mode,
       receivedAt: new Date().toISOString(),
       recordedBy: 'system',
       allocations: allocationsToApply.map(a => ({ saleOrderId: a.orderId, amountAllocated: a.allocated }))
    }));

    allocationsToApply.forEach(a => {
       const o = orders.find(ord => ord.id === a.orderId)!;
       const newAmount = o.amountPaid + a.allocated;
       const status = newAmount >= o.totalAmount ? 'SETTLED' : 'PARTIAL';
       dispatch(updateOrderPayment({ id: o.id, amountPaid: newAmount, status }));
    });
    
    toast.success("Accounts Receivable Batch Processed");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-[92vh] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle>Lump-Sum Allocation Tracker (AR)</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
           <form id="allocate-form" onSubmit={handleSubmit}>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
                <div className="flex justify-between items-center mb-5 ml-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Dues Pending</label>
                  <span className="text-2xl font-black text-rose-500 tracking-tight">₹{maxOwed.toLocaleString()}</span>
                </div>
                
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 block ml-2">Tender Mode Collection</label>
                <div className="grid grid-cols-4 gap-2 mb-5 ml-2">
                   {['CASH', 'UPI', 'BANK_TRANSFER'].map(m => (
                  <button key={m} type="button" onClick={() => setMode(m as Exclude<PayMode, 'CREDIT'>)}
                       className={clsx(
                         "py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-colors border text-center whitespace-normal wrap-break-word",
                         mode === m ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20" : "bg-slate-50 border-slate-200 dark:bg-slate-950 text-slate-500 dark:border-slate-800"
                       )}
                     >{m.replace('_','\n')}</button>
                   ))}
                </div>

                <div className="ml-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 block">Amount Surrendered (₹)</label>
                  <Input type="number" max={maxOwed} min={1} value={totalReceivedStr} onChange={e => setTotalReceivedStr(e.target.value)} className="h-14 font-black tracking-tight text-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" autoFocus />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block ml-1 mb-2">Automated Waterfall Allocation Stack (Oldest → Newest)</label>
                {allocations.map((a, i) => (
                   <div key={a.orderId} className={clsx("p-4 rounded-xl border-2 flex justify-between items-center transition-colors", a.allocated > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 shadow-sm" : "bg-white dark:bg-slate-900 border-transparent")}>
                      <div>
                        <div className={clsx("font-bold text-sm", a.allocated > 0 ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100")}>Trade Order #{a.orderId.slice(0, 5).toUpperCase()}</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider">Owed: ₹{a.owed.toLocaleString()}</div>
                      </div>
                      <div className={clsx("text-lg font-black tracking-tight", a.allocated > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600")}>
                        {a.allocated > 0 ? `+ ₹${a.allocated.toLocaleString()}` : "—"}
                      </div>
                   </div>
                ))}
                {allocations.length === 0 && (
                   <div className="text-center py-6 text-slate-400 font-medium border border-dashed rounded-xl">No pending orders to clear.</div>
                )}
              </div>
           </form>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
           <Button type="submit" form="allocate-form" disabled={totalReceived <= 0 || allocations.length === 0} className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 transition-all disabled:opacity-50">
             Process Waterfall Payout
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
