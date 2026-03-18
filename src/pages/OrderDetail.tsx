import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { ChevronLeft, FileText, Share, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { returnOrder } from '@/features/billing/slice';
import { addEntry } from '@/features/ledger/slice';
import { updatePhone, markAsInStock } from '@/features/inventory/slice';
import { toast } from 'sonner';
import { RecordPaymentSheet } from '@/components/shared/RecordPaymentSheet';
import { usePlan } from '@/hooks/usePlan';
import { FeatureGate } from '@/components/shared/FeatureGate';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canUse } = usePlan();

  const order = useAppSelector((state) => state.billing.orders.find((o) => o.id === id));
  const customer = useAppSelector((state) => state.customers.customers.find((c) => c.id === order?.counterpartyId));
  const payments = useAppSelector((state) => state.customers.payments);

  const [showPayment, setShowPayment] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 justify-center items-center font-bold text-red-500">
        Order not found
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">Go Back</button>
      </div>
    );
  }

  const outstanding = order.totalAmount - order.amountPaid;

  const orderAllocations = payments.flatMap(p => 
    (p.allocations || [])
      .filter(a => a.saleOrderId === order.id)
      .map(a => ({
        ...a,
        paymentId: p.id,
        receivedAt: p.receivedAt,
        mode: p.mode
      }))
  ).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  const handleReturn = () => {
    if (window.confirm('Are you sure you want to process a full return for this order? This will restock all devices and record a negative sale entry.')) {
      dispatch(returnOrder(order.id));
      dispatch(addEntry({
        id: crypto.randomUUID(),
        type: 'PHONE_SALE',
        referenceId: order.id,
        amount: -order.totalAmount, // Negative amount
        note: `Refund for returned item(s) for Trade Order ${order.id.slice(0,8)}`,
        createdAt: new Date().toISOString()
      }));
      // Restock phones
      order.items.forEach(item => {
        if (item.phoneId) {
          dispatch(markAsInStock({ id: item.phoneId, finalPrice: item.effectivePrice }));
        }
      });
      toast.success('Order Returned', { description: 'Devices restocked successfully.' });
    }
  };

  const generateInvoice = () => {
    toast.info('Invoice Generation coming soon!', { description: 'Scheduled for Phase 5 implementation.' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl font-black truncate">Order {order.id.slice(0,8).toUpperCase()}</h1>
          </div>
          <FeatureGate feature="pdf_invoice">
            <button onClick={generateInvoice} className="text-[#064a98] dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <Share size={20} />
            </button>
          </FeatureGate>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <div className="font-bold text-lg leading-tight mb-1">{customer?.name || 'Unknown Customer'}</div>
            <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <span>{order.orderType}</span> • <span>{format(parseISO(order.createdAt), "MMM d, h:mm a")}</span>
            </div>
          </div>
          <span className={clsx(
            "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border",
            order.status === "SETTLED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
            order.status === "PARTIAL" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
            order.status === "RETURNED" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
          )}>
            {order.status}
          </span>
        </div>
      </header>

      <main className="p-4 space-y-6">
        
        {/* Payment Summary */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1 flex items-center gap-2">
            <FileText size={16} className="text-[#064a98]" /> Financials
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 grid grid-cols-3 gap-4 shadow-sm relative overflow-hidden">
             {outstanding > 0 && order.status !== 'RETURNED' && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />}
             <div>
               <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total</p>
               <p className="font-black text-slate-900 dark:text-slate-100 text-lg">₹{order.totalAmount.toLocaleString()}</p>
             </div>
             <div>
               <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Paid</p>
               <p className="font-black text-emerald-600 dark:text-emerald-500 text-lg">₹{order.amountPaid.toLocaleString()}</p>
             </div>
             <div>
               <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Outstanding</p>
               <p className={clsx("font-black text-lg", outstanding > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-400")}>
                 ₹{(outstanding > 0 ? outstanding : 0).toLocaleString()}
               </p>
             </div>
          </div>
          
          {outstanding > 0 && order.status !== 'RETURNED' && (
            <button
               onClick={() => setShowPayment(true)}
               className="w-full mt-3 bg-[#064a98] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
               Record Payment
            </button>
          )}

          {order.status === 'SETTLED' && (
            <button
               onClick={handleReturn}
               className="w-full mt-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
               <AlertTriangle size={18} /> Process Return
            </button>
          )}
        </section>

        {/* Line Items */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1">
            Line Items ({order.items.length})
          </h2>
          <div className="space-y-3">
             {order.items.map((item) => (
               <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                 <div className="flex justify-between items-start mb-2 border-b border-slate-50 dark:border-slate-800/50 pb-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.brandSnapshot} {item.modelSnapshot}</div>
                      <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">{item.storageSnapshot} • {item.colorSnapshot}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-black text-slate-800 dark:text-slate-100">₹{item.effectivePrice.toLocaleString()}</span>
                      {item.discountAmount > 0 && (
                        <span className="text-[10px] font-bold text-rose-500 line-through bg-rose-50 dark:bg-rose-900/20 px-1 rounded inline-block mt-0.5">
                          ₹{item.salePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                 </div>
                 {item.imeiSnapshot && item.imeiSnapshot.length > 0 && (
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded inline-block mt-1">
                       IMEI: •••• {item.imeiSnapshot[0].slice(-4)}
                    </div>
                 )}
               </div>
             ))}
          </div>
        </section>

        {/* Allocations (Provenance) */}
        {orderAllocations.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 ml-1">Payment History</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-3 shadow-sm">
               {orderAllocations.map(a => (
                 <div key={a.paymentId} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">₹{a.amountAllocated.toLocaleString()} <span className="text-xs font-semibold text-slate-400 ml-1">from CP-{a.paymentId.slice(0,6)}</span></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{a.mode} • {format(parseISO(a.receivedAt), 'MMM d, h:mm a')}</div>
                    </div>
                 </div>
               ))}
            </div>
          </section>
        )}

      </main>

      <RecordPaymentSheet
         open={showPayment}
         onOpenChange={setShowPayment}
         orderId={order.id}
         counterpartyId={order.counterpartyId}
         currentAmountPaid={order.amountPaid}
         totalAmount={order.totalAmount}
         type="AR"
      />
    </div>
  );
}
