import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, FileText, Calendar, ShieldCheck, Download } from 'lucide-react';
import { fetchPublicOrder, PublicOrderData } from '@/services/shareService';
import { InvoicePrintable } from '@/components/shared/InvoicePrintable';
import { PurchaseOrderPrintable } from '@/components/shared/PurchaseOrderPrintable';
import { format, isAfter, parseISO } from 'date-fns';
import { generateInvoicePDF } from '@/utils/generateInvoice';
import { generatePurchaseOrderPDF } from '@/utils/generatePurchaseOrderPDF';
import { toast } from 'sonner';

export default function PublicView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const result = await fetchPublicOrder(token);
        console.log('Public fetch result:', result ? 'Success' : 'Not Found/Error');
        
        if (!result) {
          setError('Document not found or link has expired.');
        } else {
          // Double check expiry on client side too
          if (isAfter(new Date(), parseISO(result.expires_at))) {
            setError('This document link has expired (Valid for 30 days).');
          } else {
            setData(result);
          }
        }
      } catch (err) {
        console.error('CRITICAL: Failed to load public document:', err);
        setError('Failed to load document due to a connection or server error.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const handleDownload = async () => {
    if (!data) return;
    try {
      if (data.order.type === 'PURCHASE') {
        await generatePurchaseOrderPDF(data.order as any, data.counterparty as any, data.tenant as any);
      } else {
        await generateInvoicePDF(data.order as any, data.counterparty as any, data.tenant as any);
      }
      toast.success('Document downloaded');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-primary-500" size={32} />
        <p className="text-sm font-medium tracking-wide">Securing Document...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-rose-500" size={32} />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Access Denied</h1>
        <p className="text-slate-400 max-w-xs text-sm font-medium leading-relaxed">
          {error || 'This document is no longer available.'}
        </p>
        <Link to="/" className="mt-8 text-primary-400 font-bold text-sm hover:underline">
          Return to Finventree
        </Link>
      </div>
    );
  }

  const isPO = data.order.type === 'PURCHASE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 leading-none mb-1">
              {isPO ? 'Purchase Order' : 'Invoice'} #{data.order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs font-bold text-white leading-none">
              {data.tenant.name}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Download size={14} /> PDF
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-[210mm] shadow-2xl shadow-black/50 overflow-hidden rounded-sm bg-white">
          {/* We use the same printable components restricted to Light Mode */}
          <div className="text-slate-900">
            {isPO ? (
              <PurchaseOrderPrintable 
                order={data.order as any} 
                supplier={data.counterparty as any} 
                tenant={data.tenant as any} 
              />
            ) : (
              <InvoicePrintable 
                order={data.order as any} 
                customer={data.counterparty as any} 
                tenant={data.tenant as any} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="p-8 text-center border-t border-white/5 bg-slate-900/30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">
          Secure Document Sharing
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>Expires: {format(parseISO(data.expires_at), 'dd MMM yyyy')}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <p>Powered by Finventree</p>
        </div>
      </footer>
    </div>
  );
}
