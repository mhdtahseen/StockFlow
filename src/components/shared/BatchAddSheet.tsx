import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/app/hooks';
import { addPurchaseOrder } from '@/features/purchasing/slice';
import { addEntry } from '@/features/ledger/slice';
import type { PurchaseOrder, AcquisitionChannel, PayMode } from '@/features/purchasing/types';
import { Customer } from '@/features/customers/types';
import { CustomerPicker } from '@/components/ui/CustomerPicker';
import { CatalogAutocomplete } from '@/components/ui/CatalogAutocomplete';
import { useDeviceCatalog, sortBySize } from '@/hooks/useDeviceCatalog';
import { usePlan } from '@/hooks/usePlan';
import { Search, Plus, Trash2, Smartphone, TrendingDown, Info, Calculator } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DeviceRow {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  purchasePrice: string;
}

export function BatchAddSheet({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();
  const { canUse } = usePlan();
  const { getBrandOptions, getModelOptions, getStorageOptions, getColorOptions } = useDeviceCatalog();

  const [supplier, setSupplier] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<AcquisitionChannel>('DIRECT');
  const [platformFeeStr, setPlatformFeeStr] = useState<string>('0');
  const [payMode, setPayMode] = useState<PayMode>('CASH');
  const [amountPaidStr, setAmountPaidStr] = useState<string>('');
  const [dueDateStr, setDueDateStr] = useState<string>('');
  
  // Multi-row State
  const [rows, setRows] = useState<DeviceRow[]>([
    { id: crypto.randomUUID(), brand: 'Apple', model: '', storage: '', color: '', purchasePrice: '' }
  ]);
  const [bulkPriceStr, setBulkPriceStr] = useState('');

  useEffect(() => {
    if (open) {
      setSupplier(null);
      setChannel('DIRECT');
      setPlatformFeeStr('0');
      setPayMode('CASH');
      setAmountPaidStr('');
      setDueDateStr('');
      setRows([{ id: crypto.randomUUID(), brand: 'Apple', model: '', storage: '', color: '', purchasePrice: '' }]);
      setBulkPriceStr('');
    }
  }, [open]);

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), brand: 'Apple', model: '', storage: '', color: '', purchasePrice: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, updates: Partial<DeviceRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const applyBulkPrice = () => {
    const price = parseFloat(bulkPriceStr);
    if (isNaN(price) || price <= 0) return toast.error("Invalid Bulk Price");
    const perUnit = (price / rows.length).toFixed(2);
    setRows(prev => prev.map(r => ({ ...r, purchasePrice: perUnit })));
    toast.success("Distributed Cost", { description: `₹${perUnit} assigned to ${rows.length} units.` });
  };

  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.purchasePrice) || 0), 0);
  }, [rows]);

  const platformFee = parseFloat(platformFeeStr) || 0;
  const totalAmount = totalCost + platformFee;
  const amountPaid = payMode === 'CREDIT' ? 0 : amountPaidStr === '' ? totalAmount : parseFloat(amountPaidStr) || 0;
  const isCredit = payMode === 'CREDIT' || amountPaid < totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return toast.error("Please select a supplier");
    if (isCredit && !dueDateStr) return toast.error("Please provide a due date");
    if (!canUse('purchase_orders')) return toast.error("Purchase Orders require Pro plan");

    const orderId = crypto.randomUUID();
    const orderItems = rows.map(r => ({
      id: r.id, // Keep the row ID for the items
      purchaseOrderId: orderId,
      phoneId: null, // Linked later during receipt
      status: 'PENDING_INSPECTION' as const,
      purchasePrice: parseFloat(r.purchasePrice) || 0,
      // Pass snapshots of metadata if defined
      meta: {
        brand: r.brand,
        model: r.model,
        storage: r.storage,
        color: r.color
      }
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
      phonesOrdered: rows.length,
      phonesReceived: 0,
      dueDate: isCredit ? new Date(dueDateStr).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      items: orderItems as any // Extend if needed in types
    };
    
    dispatch(addPurchaseOrder(order));
    
    if (amountPaid > 0) {
      dispatch(addEntry({
        id: crypto.randomUUID(),
        type: 'FUNDS_CONSUMED',
        referenceId: orderId,
        amount: -amountPaid, 
        note: `Payment for Stockup (PO-${orderId.slice(0,6)})`,
        createdAt: new Date().toISOString()
      }));
    }

    onOpenChange(false);
    toast.success("Purchase Order Committed");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 rounded-t-[2.5rem] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <SheetHeader className="p-6 pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center">
             <div>
               <SheetTitle className="text-2xl font-black">Stock Up Manifest</SheetTitle>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Batch Purchase Recorder</p>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-primary-500 dark:text-blue-400">MANIFEST VALUE</span>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100 italic">₹{totalAmount.toLocaleString()}</p>
             </div>
           </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-32">
          <form id="batch-po-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
             
             {/* SUPPLIER SECTION */}
             <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">1. Vendor Source</label>
                  <CustomerPicker selectedId={supplier?.id} onSelect={setSupplier} />
                </div>
                <div className="w-full sm:w-64">
                   <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">2. Channel</label>
                   <div className="grid grid-cols-2 gap-2">
                    {['DIRECT', 'PLATFORM'].map(c => (
                        <button
                          key={c} type="button" onClick={() => setChannel(c as AcquisitionChannel)}
                          className={clsx(
                            "py-2.5 rounded-xl text-[10px] font-black tracking-wide border transition-all",
                            channel === c 
                              ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-blue-900/20" 
                              : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800"
                          )}
                        >{c}</button>
                    ))}
                  </div>
                </div>
             </section>

             {/* BATCH ROWS SECTION */}
             <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Itemized Units</h3>
                     <p className="text-xs text-slate-400 font-medium">{rows.length} devices defined</p>
                   </div>
                   
                   <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="relative w-32">
                        <Input 
                          placeholder="Bulk Total ₹" 
                          value={bulkPriceStr} 
                          onChange={e => setBulkPriceStr(e.target.value)} 
                          className="h-9 text-xs font-bold bg-white dark:bg-slate-900 rounded-xl pl-8 border-transparent focus:border-primary-500" 
                        />
                        <Calculator size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <Button type="button" variant="secondary" onClick={applyBulkPrice} className="h-9 px-3 text-[10px] font-black uppercase tracking-tight rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        Distribute
                      </Button>
                   </div>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                   {rows.map((row, index) => (
                     <div key={row.id} className="p-6 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <span className="size-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black">
                                {index + 1}
                              </span>
                              <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Line Item Spec</span>
                           </div>
                           {rows.length > 1 && (
                             <button type="button" onClick={() => removeRow(row.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                               <Trash2 size={16} />
                             </button>
                           )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                           <div className="sm:col-span-1">
                              <CatalogAutocomplete
                                label="Brand"
                                value={row.brand}
                                onChange={v => updateRow(row.id, { brand: v, model: '', storage: '', color: '' })}
                                options={getBrandOptions()}
                                placeholder="Apple"
                              />
                           </div>
                           <div className="sm:col-span-1">
                              <CatalogAutocomplete
                                label="Model"
                                value={row.model}
                                onChange={v => updateRow(row.id, { model: v, storage: '', color: '' })}
                                options={getModelOptions(row.brand)}
                                placeholder="Model..."
                                disabled={!row.brand}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                              <CatalogAutocomplete
                                label="Storage"
                                value={row.storage}
                                onChange={v => updateRow(row.id, { storage: v })}
                                options={sortBySize(getStorageOptions(row.brand, row.model))}
                                disabled={!row.model}
                                placeholder="128GB"
                              />
                              <CatalogAutocomplete
                                label="Color"
                                value={row.color}
                                onChange={v => updateRow(row.id, { color: v })}
                                options={getColorOptions(row.brand, row.model)}
                                disabled={!row.model}
                                placeholder="Color"
                              />
                           </div>
                           <div className="sm:col-span-1">
                              <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">Cost (₹)</label>
                              <Input 
                                type="number" 
                                value={row.purchasePrice} 
                                onChange={e => updateRow(row.id, { purchasePrice: e.target.value })} 
                                className="h-12 font-black text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:border-primary-500 transition-all" 
                                placeholder="0.00"
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                   <Button type="button" variant="ghost" onClick={addRow} className="group text-primary-500 dark:text-blue-400 font-black text-xs uppercase tracking-widest gap-2 py-6 w-full rounded-2xl hover:bg-white dark:hover:bg-slate-900 transition-all">
                     <Plus size={18} className="group-hover:scale-125 transition-transform" />
                     Define Extra Model Item
                   </Button>
                </div>
             </section>

             {/* FEES & PAYMENT SECTION */}
             <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                   <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">3. Transaction Details</label>
                   <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Platform/Logistics Fee</span>
                           <span className="text-xs text-slate-400">Added to total capital</span>
                        </div>
                        <Input type="number" value={platformFeeStr} onChange={e => setPlatformFeeStr(e.target.value)} className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl font-bold" />
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
                   <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">4. Capital Layout</label>
                   
                   <div className="grid grid-cols-4 gap-2 mb-6">
                      {['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT'].map(mode => (
                        <button
                          key={mode} type="button" onClick={() => setPayMode(mode as PayMode)}
                          className={clsx(
                            "py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-tight transition-all border text-center",
                            payMode === mode 
                              ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20" 
                              : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                          )}
                        >{mode.replace('_','\n')}</button>
                      ))}
                   </div>

                   {payMode !== 'CREDIT' ? (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount Transacted Now</span>
                           {amountPaid < totalAmount && <span className="text-[10px] font-black text-rose-500">₹{(totalAmount - amountPaid).toLocaleString()} Debt</span>}
                        </div>
                        <Input 
                          type="number" 
                          value={amountPaidStr} 
                          onChange={e => setAmountPaidStr(e.target.value)} 
                          placeholder={`Full Total: ₹${totalAmount.toLocaleString()}`}
                          className="h-12 font-black text-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl" 
                        />
                      </div>
                   ) : (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-2 block">Dues Settlement Date</label>
                        <Input required type="date" value={dueDateStr} onChange={e => setDueDateStr(e.target.value)} className="h-12 font-black border-2 border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl" />
                      </div>
                   )}
                </div>
             </section>
          </form>
        </div>
        
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500">
                 <Smartphone size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-tight">Purchase Manifest</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100 italic">₹{totalAmount.toLocaleString()} <span className="text-sm font-medium text-slate-400 not-italic">({rows.length} Units)</span></span>
              </div>
           </div>
           
           <Button type="submit" form="batch-po-form" className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]">
             Drop Ledger Entry
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

