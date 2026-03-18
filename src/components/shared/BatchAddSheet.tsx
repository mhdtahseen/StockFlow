import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/app/hooks';
import { addPurchaseOrder } from '@/features/purchasing/slice';
import type { PurchaseOrder, AcquisitionChannel, PayMode } from '@/features/purchasing/types';
import { Customer } from '@/features/customers/types';
import { CustomerPicker } from '@/components/ui/CustomerPicker';
import { usePlan } from '@/hooks/usePlan';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchAddSheet({ open, onOpenChange }: Props) {
  const [supplier, setSupplier] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<AcquisitionChannel>('DIRECT');
  const [deviceCountStr, setDeviceCountStr] = useState<string>('1');
  const [totalCostStr, setTotalCostStr] = useState<string>('');
  const [platformFeeStr, setPlatformFeeStr] = useState<string>('');
  const [payMode, setPayMode] = useState<PayMode>('CASH');
  const [amountPaidStr, setAmountPaidStr] = useState<string>('');
  const [dueDateStr, setDueDateStr] = useState<string>('');
  
  const { canUse } = usePlan();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (open) {
      setSupplier(null);
      setChannel('DIRECT');
      setDeviceCountStr('1');
      setTotalCostStr('');
      setPlatformFeeStr('');
      setPayMode('CASH');
      setAmountPaidStr('');
      setDueDateStr('');
    }
  }, [open]);

  const deviceCount = parseInt(deviceCountStr) || 1;
  const totalCost = parseFloat(totalCostStr) || 0;
  const platformFee = parseFloat(platformFeeStr) || 0;

  const totalAmount = totalCost + platformFee;
  const amountPaid = payMode === 'CREDIT' ? 0 : amountPaidStr === '' ? totalAmount : parseFloat(amountPaidStr) || 0;
  const isCredit = payMode === 'CREDIT' || amountPaid < totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return toast.error("Please select a supplier");
    if (deviceCount < 1) return toast.error("Device count must be at least 1");
    if (isCredit && !dueDateStr) return toast.error("Please provide a due date");
    if (!canUse('purchase_orders')) return toast.error("Purchase Orders require Pro plan");

    const orderId = crypto.randomUUID();
    const orderItems = Array.from({ length: deviceCount }).map(() => ({
      id: crypto.randomUUID(),
      purchaseOrderId: orderId,
      phoneId: null,
      status: 'PENDING_INSPECTION' as const,
      purchasePrice: totalCost / deviceCount,
    }));

    const order: PurchaseOrder = {
      id: orderId,
      counterpartyId: supplier.id,
      acquisitionChannel: channel,
      totalAmount,
      platformFee,
      amountPaid,
      status: amountPaid >= totalAmount ? 'SETTLED' : 'AWAITING_RECEIPT',
      paymentMode: payMode,
      phonesOrdered: parseInt(deviceCountStr) || 1,
      phonesReceived: 0,
      dueDate: isCredit ? new Date(dueDateStr).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      items: []
    };
    
    dispatch(addPurchaseOrder(order));
    onOpenChange(false);
    toast.success("Purchase Order Dispatched");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <SheetHeader className="p-4 sm:p-6 pb-2 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <SheetTitle>Initialize Purchase Order</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-24">
          <form id="po-form" onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto">
             
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
               <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Supplier / Source Vendor</label>
               <CustomerPicker selectedId={supplier?.id} onSelect={setSupplier} />
             </div>

             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">Acquisition Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['DIRECT', 'PLATFORM', 'INTER_TENANT'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setChannel(c as AcquisitionChannel)}
                        className={clsx(
                          "py-3 rounded-xl text-xs font-black tracking-wide transition-colors border",
                          channel === c 
                            ? "bg-[#064a98] text-white border-[#064a98] shadow-md shadow-[#064a98]/20" 
                            : "bg-slate-50 border-slate-200 dark:bg-slate-950 text-slate-500 dark:border-slate-800"
                        )}
                      >
                        {c.replace('_',' ')}
                      </button>
                    ))}
                </div>
              </div>

             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">Count Expected</label>
                    <Input type="number" min="1" required value={deviceCountStr} onChange={e => setDeviceCountStr(e.target.value)} className="h-12 font-black text-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">Deal Cost (₹)</label>
                    <Input type="number" min="0" required value={totalCostStr} onChange={e => setTotalCostStr(e.target.value)} className="h-12 font-black text-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">Platform / Delivery Fees (₹)</label>
                  <Input type="number" min="0" value={platformFeeStr} onChange={e => setPlatformFeeStr(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl font-bold" />
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 bg-[#064a98] h-full" />
                 <div className="flex justify-between items-center mb-5 ml-2">
                   <label className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Total Capital Outflow</label>
                   <span className="text-3xl font-black text-[#064a98] dark:text-blue-400 tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                 </div>
                 
                 <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block ml-2">Payment Mode</label>
                 <div className="grid grid-cols-4 gap-2 mb-5 ml-2">
                    {['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT'].map(mode => (
                      <button
                        key={mode} type="button" onClick={() => setPayMode(mode as PayMode)}
                        className={clsx(
                          "py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-colors border text-center break-words",
                          payMode === mode 
                            ? "bg-[#064a98] text-white border-[#064a98] shadow-md shadow-[#064a98]/20" 
                            : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {mode.replace('_', '\n')}
                      </button>
                    ))}
                 </div>

                 {payMode !== 'CREDIT' && (
                    <div className="mb-2 ml-2">
                       <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block flex justify-between items-center">
                         <span>Initial Deposit Built</span>
                         {amountPaidStr !== '' && amountPaid < totalAmount && <span className="text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-sm">₹{(totalAmount - amountPaid).toLocaleString()} pending</span>}
                       </label>
                       <Input 
                         type="number" 
                         value={amountPaidStr} 
                         onChange={e => setAmountPaidStr(e.target.value)} 
                         placeholder={`Defaults to absolute total: ₹${totalAmount.toLocaleString()}`}
                         max={totalAmount}
                         className="h-14 font-black tracking-tight text-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" 
                       />
                    </div>
                 )}

                 {isCredit && (
                    <div className="mt-5 ml-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-500 mb-2 block">Promise Date to Settle Balance</label>
                       <Input required type="date" value={dueDateStr} onChange={e => setDueDateStr(e.target.value)} className="h-14 font-black text-lg border-2 border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl shadow-sm" />
                    </div>
                 )}
              </div>
          </form>
        </div>
        
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
           <Button type="submit" form="po-form" className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-[#064a98] hover:bg-blue-800 text-white shadow-xl shadow-[#064a98]/20 transition-all active:scale-[0.98]">
             Drop Purchase Contract
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
