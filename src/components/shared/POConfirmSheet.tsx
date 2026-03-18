import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/app/hooks';
import { confirmReceipt } from '@/features/purchasing/slice';
import { addPhone } from '@/features/inventory/inventorySlice';
import { PurchaseOrder, POItemStatus } from '@/features/purchasing/types';
import { Phone } from '@/features/inventory/types';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}

export function POConfirmSheet({ open, onOpenChange, order }: Props) {
  const pendingItems = order.items.filter(i => i.status === 'PENDING_INSPECTION');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [imei, setImei] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 13');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('Midnight');
  const [purchasePriceStr, setPurchasePriceStr] = useState('');
  
  const dispatch = useAppDispatch();
  const [processed, setProcessed] = useState<Record<string, { status: POItemStatus, phoneId: string | null, reason?: string, price?: number }>>({});

  React.useEffect(() => {
    if (open && pendingItems.length > 0) {
      setCurrentIndex(0);
      setProcessed({});
      setImei('');
      setBrand('Apple');
      setModel('iPhone 13');
      setStorage('128GB');
      setColor('Midnight');
      setPurchasePriceStr(pendingItems[0].purchasePrice.toString());
    }
  }, [open, order]);

  if (pendingItems.length === 0) return null;
  const currentItem = pendingItems[currentIndex];
  
  if (currentIndex >= pendingItems.length) {
     const handleFinalSubmit = () => {
        const newItems = order.items.map(it => {
           if (processed[it.id]) {
             return { ...it, status: processed[it.id].status, phoneId: processed[it.id].phoneId, rejectionReason: processed[it.id].reason, purchasePrice: processed[it.id].price || it.purchasePrice };
           }
           return it;
        });
        const anyPending = newItems.some(i => i.status === 'PENDING_INSPECTION');
        const approvedCount = newItems.filter(i => i.status === 'ACCEPTED').length;
        
        dispatch(confirmReceipt({ 
           id: order.id, 
           items: newItems, 
           status: anyPending ? 'PARTIAL' : order.amountPaid >= order.totalAmount ? 'SETTLED' : 'RECEIVED',
           phonesReceived: order.phonesReceived + approvedCount
        }));
        
        toast.success("PO Processing Finalized");
        onOpenChange(false);
     };

     return (
        <Sheet open={open} onOpenChange={onOpenChange}>
           <SheetContent side="bottom" className="h-[50vh] flex flex-col p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <SheetHeader className="mb-4"><SheetTitle>Inspection Complete</SheetTitle></SheetHeader>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                 <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{pendingItems.length}</div>
                 <div className="text-slate-500 uppercase tracking-widest font-bold">Devices Dispositioned</div>
              </div>
              <Button onClick={handleFinalSubmit} className="w-full h-14 rounded-xl text-lg font-black tracking-wide bg-[#064a98] hover:bg-blue-800 text-white shadow-xl shadow-[#064a98]/20 transition-all active:scale-[0.98]">Save Manifest Results</Button>
           </SheetContent>
        </Sheet>
     );
  }

  const handleAccept = () => {
      const price = parseFloat(purchasePriceStr) || currentItem.purchasePrice;
      const phoneId = crypto.randomUUID();
      const phone: Phone = {
         id: phoneId,
         brand, model, storage, color,
         purchasePrice: price, salePrice: price * 1.2,
         status: 'IN_STOCK', condition: 'A',
         imeis: imei ? [imei] : [],
         purchaseOrderId: order.id,
         createdAt: new Date().toISOString()
      };
      
      dispatch(addPhone(phone));
      setProcessed(prev => ({ ...prev, [currentItem.id]: { status: 'ACCEPTED', phoneId, price } }));
      advance();
  };

  const handleReject = () => {
      setProcessed(prev => ({ ...prev, [currentItem.id]: { status: 'REJECTED', phoneId: null, reason: 'Failed QC Inspection', price: currentItem.purchasePrice } }));
      advance();
  };

  const advance = () => {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (nextIdx < pendingItems.length) {
         setImei('');
         setPurchasePriceStr(pendingItems[nextIdx].purchasePrice.toString());
      }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
         <SheetHeader className="p-6 pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col items-start">
           <SheetTitle>Inspect Device {currentIndex + 1} of {pendingItems.length}</SheetTitle>
           <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">PO #{order.id.slice(0, 8)}</span>
         </SheetHeader>

         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block">Scan IMEI/Serial (Optional)</label>
               <Input value={imei} onChange={e => setImei(e.target.value)} placeholder="Barcode scan..." className="h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xl font-mono tracking-widest rounded-xl text-center" autoFocus />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block">Brand</label>
                 <Input value={brand} onChange={e => setBrand(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold rounded-xl" />
               </div>
               <div>
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block">Model</label>
                 <Input value={model} onChange={e => setModel(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold rounded-xl" />
               </div>
               <div>
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block">Storage</label>
                 <select value={storage} onChange={e => setStorage(e.target.value)} className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-3 font-bold text-sm">
                    <option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option>
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block">Color</label>
                 <Input value={color} onChange={e => setColor(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold rounded-xl" />
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 bg-[#064a98] h-full" />
               <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 mb-2 block ml-2">Final Allocated Cost (₹)</label>
               <Input type="number" value={purchasePriceStr} onChange={e => setPurchasePriceStr(e.target.value)} className="h-14 font-black tracking-tight text-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl ml-2 w-[calc(100%-0.5rem)]" />
               <p className="text-xs text-rose-500 mt-2 font-bold ml-2">Defaults to PO avg quote: ₹{currentItem.purchasePrice.toLocaleString()}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <Button variant="outline" onClick={handleReject} className="h-14 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-lg font-black tracking-wide">Q.C. Reject</Button>
            <Button onClick={handleAccept} className="h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black tracking-wide shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform">Accept & Add</Button>
         </div>
      </SheetContent>
    </Sheet>
  )
}
