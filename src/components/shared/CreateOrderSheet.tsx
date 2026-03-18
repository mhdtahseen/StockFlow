import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Percent } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { addOrder } from '@/features/billing/slice';
import { markAsSold } from '@/features/inventory/slice';
import { SaleOrder, OrderType, PayMode } from '@/features/billing/types';
import { Phone } from '@/features/inventory/types';
import { Customer } from '@/features/customers/types';
import { CustomerPicker } from '@/components/ui/CustomerPicker';
import { PhoneSelectorSheet } from './PhoneSelectorSheet';
import { usePlan } from '@/hooks/usePlan';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhones?: Phone[];
}

interface OrderItemDraft {
  phone: Phone;
  salePrice: number;
  discountAmount: number;
}

export function CreateOrderSheet({ open, onOpenChange, initialPhones = [] }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('RETAIL');
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [payMode, setPayMode] = useState<PayMode>('CASH');
  const [amountPaidStr, setAmountPaidStr] = useState<string>('');
  const [dueDateStr, setDueDateStr] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { canUse } = usePlan();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (open) {
      setItems(initialPhones.map(p => ({ phone: p, salePrice: p.salePrice || 0, discountAmount: 0 })));
      setCustomer(null);
      setOrderType('RETAIL');
      setPayMode('CASH');
      setAmountPaidStr('');
      setDueDateStr('');
      setNotes('');
    }
  }, [open, initialPhones]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, item.salePrice - item.discountAmount), 0), [items]);

  const amountPaid = payMode === 'CREDIT' ? 0 : amountPaidStr === '' ? totalAmount : parseFloat(amountPaidStr) || 0;
  const isCredit = payMode === 'CREDIT' || amountPaid < totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error("Please select a customer");
    if (items.length === 0) return toast.error("Please add at least one device");
    if (isCredit && !dueDateStr) return toast.error("Please provide a due date for the outstanding balance");
    
    const orderId = crypto.randomUUID();
    const order: SaleOrder = {
      id: orderId,
      counterpartyId: customer.id,
      orderType,
      totalAmount,
      amountPaid,
      status: amountPaid >= totalAmount ? 'SETTLED' : amountPaid > 0 ? 'PARTIAL' : 'OPEN',
      paymentMode: payMode,
      dueDate: isCredit ? new Date(dueDateStr).toISOString() : undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      items: items.map((draft) => ({
        id: crypto.randomUUID(),
        saleOrderId: orderId,
        phoneId: draft.phone.id,
        salePrice: draft.salePrice,
        discountAmount: draft.discountAmount,
        effectivePrice: Math.max(0, draft.salePrice - draft.discountAmount),
        imeiSnapshot: draft.phone.imeis || [],
        brandSnapshot: draft.phone.brand,
        modelSnapshot: draft.phone.model,
        storageSnapshot: draft.phone.storage,
        colorSnapshot: draft.phone.color,
      })),
    };
    
    dispatch(addOrder(order));
    order.items.forEach((item) =>
      item.phoneId && dispatch(markAsSold({ id: item.phoneId, salePrice: item.effectivePrice }))
    );
    
    onOpenChange(false);
    navigate(`/orders/${order.id}`);
    toast.success("Trade Order Created");
  };

  const updateItem = (id: string, field: keyof OrderItemDraft, val: number) => {
    setItems(items.map(it => it.phone.id === id ? { ...it, [field]: val } : it));
  };
  
  const removeItem = (id: string) => {
    setItems(items.filter(it => it.phone.id !== id));
  };
  
  const handleBulkAdd = () => {
    if (!canUse('bulk_orders')) return toast.error('Bulk orders require Pro plan');
    setSelectorOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <SheetHeader className="p-4 sm:p-6 pb-2 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <SheetTitle>Create Trade Order</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-24">
            <form id="order-form" onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto">
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Customer Counterparty</label>
                <CustomerPicker selectedId={customer?.id} onSelect={setCustomer} />
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">Order Type Target</label>
                <div className="grid grid-cols-3 gap-2">
                  {['RETAIL', 'BULK', 'TRANSFER'].map(type => {
                    const isLocked = type === 'BULK' ? !canUse('bulk_orders') : type === 'TRANSFER' ? !canUse('trade_network') : false;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          if (isLocked) return toast.error(`Upgrade to ${type === 'BULK' ? 'Pro' : 'Wholesaler'} to unlock.`);
                          setOrderType(type as OrderType);
                        }}
                        className={clsx(
                          "py-3 rounded-xl text-xs font-black tracking-wide transition-colors border",
                          orderType === type 
                            ? "bg-[#064a98] text-white border-[#064a98] shadow-md shadow-[#064a98]/20" 
                            : isLocked 
                              ? "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {type} {isLocked && '🔒'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Devices in Cart ({items.length})</label>
                  <button type="button" onClick={handleBulkAdd} className="text-[#064a98] dark:text-blue-400 text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Plus size={14} strokeWidth={3} /> Add Matrix
                  </button>
                </div>
                
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 font-medium text-sm">
                    No devices selected. Tap 'Add Matrix' to begin scan.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <div key={item.phone.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative group">
                        <button type="button" onClick={() => removeItem(item.phone.id)} className="absolute top-2 right-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                        <div className="font-bold text-slate-800 dark:text-slate-100 mb-0.5 pr-8">{item.phone.brand} {item.phone.model}</div>
                        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">{item.phone.storage} • {item.phone.imeis?.[0] || 'No IMEI'}</div>
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                             <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Base Sale Price (₹)</label>
                             <Input type="number" value={item.salePrice || ''} onChange={e => updateItem(item.phone.id, 'salePrice', parseFloat(e.target.value) || 0)} className="h-10 text-sm font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-sm" />
                           </div>
                           <div>
                             <label className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Apply Discount (₹)</label>
                             <div className="relative">
                               <Percent className="absolute left-2.5 top-3 text-rose-400" size={14} />
                               <Input type="number" value={item.discountAmount || ''} onChange={e => updateItem(item.phone.id, 'discountAmount', parseFloat(e.target.value) || 0)} className="h-10 pl-8 text-sm font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-sm" />
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 bg-[#064a98] h-full" />
                 <div className="flex justify-between items-center mb-5 ml-2">
                   <label className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Total Valuation</label>
                   <span className="text-3xl font-black text-[#064a98] dark:text-blue-400 tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                 </div>
                 
                 <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block ml-2">Collection Mode</label>
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
                    <div className="mb-5 ml-2">
                       <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block flex justify-between items-center">
                         <span>Downpayment Received</span>
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
                    <div className="mb-5 ml-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-500 mb-2 block">Dunning Schedule (Due Date)</label>
                       <Input required type="date" value={dueDateStr} onChange={e => setDueDateStr(e.target.value)} className="h-14 font-black text-lg border-2 border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl shadow-sm" />
                    </div>
                 )}
                 
                 <div className="ml-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2 block">Remarks / Notes</label>
                    <Input placeholder="Additional invoice remarks..." value={notes} onChange={e => setNotes(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium" />
                 </div>
              </div>

            </form>
          </div>
          
          <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
             <Button type="submit" form="order-form" className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-[#064a98] hover:bg-blue-800 text-white shadow-xl shadow-[#064a98]/20 transition-all active:scale-[0.98]">
               Commit Sales Ledger
             </Button>
          </div>
        </SheetContent>
      </Sheet>

      <PhoneSelectorSheet 
        open={selectorOpen} 
        onOpenChange={setSelectorOpen}
        selectedIds={items.map(it => it.phone.id)}
        onSelect={(phones) => {
           const currentIds = new Set(items.map(i => i.phone.id));
           const newItems = phones.filter(p => !currentIds.has(p.id)).map(p => ({ phone: p, salePrice: p.salePrice || 0, discountAmount: 0 }));
           const confirmIds = new Set(phones.map(p => p.id));
           const retained = items.filter(it => confirmIds.has(it.phone.id));
           setItems([...retained, ...newItems]);
        }}
      />
    </>
  );
}
