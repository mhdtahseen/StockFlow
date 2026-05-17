import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Calendar, ShieldCheck, Printer, ArrowLeft } from 'lucide-react';
import { fetchPublicOrder, PublicOrderData } from '@/services/shareService';
import { PrintableInvoice } from '@/components/shared/PrintableInvoice';
import { format, isAfter, parseISO } from 'date-fns';

// A4 width in px at 96dpi: 210mm = 793.7px
const A4_WIDTH_PX = 794;

export default function PublicView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicOrderData | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(Math.min(1, containerWidth / A4_WIDTH_PX));
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);
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

  const handleDownload = () => {
    if (!data) return;
    window.print();
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Print CSS: hide everything except the invoice when printing */}
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        @media print {
          body { background: none !important; margin: 0 !important; padding: 0 !important; }
          .no-print, nav, footer { display: none !important; }
          .print-wrapper { padding: 0 !important; margin: 0 !important; background: white !important; }
          .print-wrapper > div { box-shadow: none !important; max-width: 100% !important; width: 100% !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Top Bar */}
      <nav className="no-print sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            aria-label="Close document"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
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
          <Printer size={14} /> Save PDF
        </button>
      </nav>

      <main className="print-wrapper p-4 sm:p-8">
        {/* Outer container measures available width */}
        <div ref={containerRef} className="w-full max-w-[210mm] mx-auto">
          {/* Scale wrapper: shrinks the A4 to fit mobile, 1:1 on desktop */}
          <div
            style={{
              width: A4_WIDTH_PX,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              // Collapse the extra space created by scaling down
              marginBottom: scale < 1 ? `calc((${scale} - 1) * 297mm)` : undefined,
            }}
            className="shadow-2xl shadow-black/50 rounded-sm bg-white overflow-hidden"
          >
            <PrintableInvoice
              order={data.order as any}
              counterparty={data.counterparty as any}
              tenant={data.tenant as any}
              type={isPO ? 'PURCHASE' : 'SALE'}
            />
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="no-print p-8 text-center border-t border-white/5 bg-slate-900/30">
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
