import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/app/hooks';
import { updateOrderPayment } from '@/features/billing/slice';
import { updatePOPayment, addSupplierPayment } from '@/features/purchasing/slice';
import { addCustomerPayment } from '@/features/customers/slice';
import type { PayMode } from '@/features/billing/types';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  counterpartyId: string;
  currentAmountPaid: number;
  totalAmount: number;
  type: 'AR' | 'AP';
}

export function RecordPaymentSheet({ open, onOpenChange, orderId, counterpartyId, currentAmountPaid, totalAmount, type }: Props) {
  const max = totalAmount - currentAmountPaid;
  const [amountStr, setAmountStr] = useState(max.toString());
  const [mode, setMode] = useState<Exclude<PayMode, 'CREDIT'>>('CASH');
  const dispatch = useAppDispatch();

  React.useEffect(() => { if (open) setAmountStr(max.toString()) }, [open, max]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0 || amount > max) return toast.error(`Invalid amount max is ${max}`);
    
    const paymentId = crypto.randomUUID();
    const totalNow = currentAmountPaid + amount;
    const status = totalNow >= totalAmount ? 'SETTLED' : 'PARTIAL';

    if (type === 'AR') {
      dispatch(updateOrderPayment({ id: orderId, amountPaid: totalNow, status }));
      dispatch(addCustomerPayment({
        id: paymentId,
        counterpartyId,
        totalReceived: amount,
        mode,
        receivedAt: new Date().toISOString(),
        recordedBy: 'system',
        allocations: [{ saleOrderId: orderId, amountAllocated: amount }]
      }));
      toast.success("Accounts Receivable Payment Recorded");
    } else {
      dispatch(updatePOPayment({ id: orderId, amountPaid: totalNow, status }));
      dispatch(addSupplierPayment({
        id: paymentId,
        counterpartyId,
        totalPaid: amount,
        mode,
        paidAt: new Date().toISOString(),
        recordedBy: 'system',
        allocations: [{ purchaseOrderId: orderId, amountAllocated: amount }]
      }));
      toast.success("Accounts Payable Transfer Dispatched");
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pt-8 pb-10">
        <SheetHeader className="mb-6"><SheetTitle>Log Payment Transaction</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
             <div className="flex justify-between items-center mb-5 ml-2">
               <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pending Dues</label>
               <span className="text-2xl font-black text-rose-500">₹{max.toLocaleString()}</span>
             </div>
             
             <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block ml-2">Tender Mode</label>
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
               <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block">Amount Transacted (₹)</label>
               <Input type="number" required max={max} min={1} value={amountStr} onChange={e => setAmountStr(e.target.value)} className="h-14 font-black tracking-tight text-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" />
             </div>
           </div>

           <Button type="submit" className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-xl shadow-primary-500/20">
             Register Transfer
           </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
