import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/app/hooks';
import { confirmReceipt } from '@/features/purchasing/slice';
import { addPhone } from '@/features/inventory/slice';
import { PurchaseOrder, POItemStatus } from '@/features/purchasing/types';
import { Phone } from '@/features/inventory/types';
import { CatalogAutocomplete } from '@/components/ui/CatalogAutocomplete';
import { useDeviceCatalog, sortBySize } from '@/hooks/useDeviceCatalog';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Smartphone, 
  Zap,
  Info
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}

type RejectionReason = 'SCRATCHED' | 'DEAD' | 'WRONG_MODEL' | 'OTHER';

export function POConfirmSheet({ open, onOpenChange, order }: Props) {
  const dispatch = useAppDispatch();
  const { getBrandOptions, getModelOptions, getStorageOptions, getColorOptions } = useDeviceCatalog();
  
  const pendingItems = order.items.filter(i => i.status === 'PENDING_INSPECTION');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Inspection State
  const [imei, setImei] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [purchasePriceStr, setPurchasePriceStr] = useState('');
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('OTHER');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
  const [processed, setProcessed] = useState<Record<string, { status: POItemStatus, phoneId: string | null, reason?: string, price?: number }>>({});

  useEffect(() => {
    if (open && pendingItems.length > 0) {
      setCurrentIndex(0);
      setProcessed({});
      resetForm(0);
    }
  }, [open, order.id]);

  const resetForm = (idx: number) => {
    if (idx < pendingItems.length) {
      const item = pendingItems[idx];
      setImei('');
      setBrand('Apple'); // Default to Apple for speed
      setModel('');
      setStorage('');
      setColor('');
      setPurchasePriceStr(item.purchasePrice.toString());
      setShowRejectionForm(false);
      setRejectionReason('OTHER');
    }
  };

  if (pendingItems.length === 0) return null;
  const currentItem = pendingItems[currentIndex];
  
  if (currentIndex >= pendingItems.length) {
     const handleFinalSubmit = () => {
        const newItems = order.items.map(it => {
           if (processed[it.id]) {
             return { 
               ...it, 
               status: processed[it.id].status, 
               phoneId: processed[it.id].phoneId, 
               rejectionReason: processed[it.id].reason, 
               purchasePrice: processed[it.id].price || it.purchasePrice 
             };
           }
           return it;
        });
        
        const anyPending = newItems.some(i => i.status === 'PENDING_INSPECTION');
        const approvedCount = Object.values(processed).filter(p => p.status === 'ACCEPTED').length;
        
        dispatch(confirmReceipt({ 
           id: order.id, 
           items: newItems, 
           status: anyPending ? 'PARTIAL' : 'RECEIVED',
           phonesReceived: order.phonesReceived + approvedCount
        }));
        
        toast.success("Manifest Updated", {
          description: `Processed ${Object.keys(processed).length} units successfully.`
        });
        onOpenChange(false);
     };

     const summary = {
       accepted: Object.values(processed).filter(p => p.status === 'ACCEPTED').length,
       rejected: Object.values(processed).filter(p => p.status === 'REJECTED').length
     };

     return (
        <Sheet open={open} onOpenChange={onOpenChange}>
           <SheetContent side="bottom" className="h-[60vh] flex flex-col p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <SheetHeader className="mb-8 text-center">
                <SheetTitle className="text-2xl font-black">Inspection Complete</SheetTitle>
                <p className="text-slate-500 font-medium">All items have been dispositioned.</p>
              </SheetHeader>
              
              <div className="flex-1 grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                   <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
                   <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{summary.accepted}</div>
                   <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/70">Accepted</div>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                   <XCircle className="text-rose-500 mb-2" size={32} />
                   <div className="text-3xl font-black text-rose-700 dark:text-rose-400">{summary.rejected}</div>
                   <div className="text-[10px] uppercase font-bold tracking-widest text-rose-600/70">Rejected</div>
                 </div>
              </div>

              <Button onClick={handleFinalSubmit} className="w-full h-16 rounded-2xl text-lg font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]">
                Commit Results to Ledger
              </Button>
           </SheetContent>
        </Sheet>
     );
  }

  const handleAccept = () => {
      if (!brand || !model || !storage || !color) {
        return toast.error("Missing Specs", { description: "Please provide all device details." });
      }

      const price = parseFloat(purchasePriceStr) || currentItem.purchasePrice;
      const phoneId = crypto.randomUUID();
      
      const phone: Phone = {
         id: phoneId,
         brand, 
         model, 
         storage, 
         color,
         ram: "N/A", // Default if not specified in basic catalog
         purchasePrice: price, 
         salePrice: Math.round(price * 1.15), // Auto markup
         status: 'IN_STOCK',
         issueTags: [], 
         imeis: imei ? [imei] : [],
         createdAt: new Date().toISOString(),
         purchaseOrderId: order.id
      };
      
      dispatch(addPhone(phone));
      setProcessed(prev => ({ ...prev, [currentItem.id]: { status: 'ACCEPTED', phoneId, price } }));
      advance();
  };

  const handleReject = () => {
      if (!showRejectionForm) {
        setShowRejectionForm(true);
        return;
      }
      
      setProcessed(prev => ({ 
        ...prev, 
        [currentItem.id]: { 
          status: 'REJECTED', 
          phoneId: null, 
          reason: rejectionReason, 
          price: 0 // No cost for rejected items
        } 
      }));
      advance();
  };

  const advance = () => {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetForm(nextIdx);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
         <SheetHeader className="p-6 pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center w-full">
             <div className="flex flex-col items-start gap-1">
               <SheetTitle className="text-xl font-black">Item {currentIndex + 1} of {pendingItems.length}</SheetTitle>
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Manifest Match Required</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-primary-500 dark:text-blue-400">PO QUOTE</span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 italic">₹{currentItem.purchasePrice.toLocaleString()}</p>
             </div>
           </div>
         </SheetHeader>

         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-32">
            {/* IMEI SCAN */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                 <Zap size={14} className="text-amber-500 fill-amber-500" />
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">Quick Scan IMEI</label>
               </div>
               <Input 
                 value={imei} 
                 onChange={e => setImei(e.target.value)} 
                 placeholder="Focus & Scan Barcode" 
                 className="h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xl font-mono tracking-widest rounded-xl text-center focus:border-primary-500 transition-all" 
                 autoFocus 
               />
            </div>

            {/* CATALOG SELECTORS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
               <div className="flex items-center gap-2 mb-1">
                 <Smartphone size={14} className="text-primary-500" />
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">Identity & Specs</label>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <CatalogAutocomplete
                    label="Brand"
                    value={brand}
                    onChange={v => { setBrand(v); setModel(''); setStorage(''); setColor(''); }}
                    options={getBrandOptions()}
                    icon={<Search size={16} />}
                  />
                  <CatalogAutocomplete
                    label="Model"
                    value={model}
                    onChange={v => { setModel(v); setStorage(''); setColor(''); }}
                    options={getModelOptions(brand)}
                    disabled={!brand}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <CatalogAutocomplete
                    label="Storage"
                    value={storage}
                    onChange={setStorage}
                    options={sortBySize(getStorageOptions(brand, model))}
                    disabled={!model}
                  />
                  <CatalogAutocomplete
                    label="Color"
                    value={color}
                    onChange={setColor}
                    options={getColorOptions(brand, model)}
                    disabled={!model}
                  />
               </div>
            </div>

            {/* PRICE OVERRIDE */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
               <div className="flex justify-between items-center mb-4">
                 <label className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 ml-2">Final Unit Cost (₹)</label>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mr-2">
                    <Info size={10} />
                    Adjust if variant price differs
                 </div>
               </div>
               <Input 
                 type="number" 
                 value={purchasePriceStr} 
                 onChange={e => setPurchasePriceStr(e.target.value)} 
                 className="h-16 font-black tracking-tight text-3xl bg-slate-50 dark:bg-slate-950 border-transparent border-b-slate-200 dark:border-b-slate-800 rounded-none ml-2 w-[calc(100%-1rem)] px-0 focus:ring-0 text-primary-500 dark:text-blue-400" 
               />
            </div>

            {/* REJECTION REASON (CONDITIONAL) */}
            {showRejectionForm && (
              <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border-2 border-rose-100 dark:border-rose-900/50 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <label className="text-xs font-black text-rose-800 dark:text-rose-400 uppercase tracking-tight">Select Rejection Reason</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['SCRATCHED', 'DEAD', 'WRONG_MODEL', 'OTHER'] as RejectionReason[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRejectionReason(r)}
                      className={clsx(
                        "py-3 rounded-xl text-[10px] font-black tracking-wider transition-all border",
                        rejectionReason === r 
                          ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20" 
                          : "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-600"
                      )}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
         </div>

         {/* FOOTER ACTIONS */}
         <div className="grid grid-cols-2 gap-4 p-6 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0">
            <Button 
              variant="outline" 
              onClick={handleReject} 
              className={clsx(
                "h-16 rounded-2xl text-lg font-black tracking-wide transition-all border-2",
                showRejectionForm 
                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:text-white" 
                  : "text-rose-600 border-rose-100 hover:bg-rose-50 text-rose-600"
              )}
            >
              {showRejectionForm ? "Confirm Return" : "Q.C. Reject"}
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={showRejectionForm}
              className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black tracking-wide shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
            >
              Accept & Add
            </Button>
         </div>
      </SheetContent>
    </Sheet>
  )
}

