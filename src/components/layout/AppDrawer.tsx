import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Smartphone, Users, FileText, Wallet, ReceiptText, X, ChevronRight, Crown } from 'lucide-react';
import clsx from 'clsx';
import { usePlan, FeatureKey } from '@/hooks/usePlan';

const SECTIONS = [
  { label: 'Inventory',    to: '/inventory',  icon: Smartphone,  feature: null },
  { label: 'Customers',    to: '/customers',  icon: Users,       feature: 'customers'    as const },
  { label: 'Trade Orders', to: '/orders',     icon: FileText,    feature: 'trade_orders' as const },
  { label: 'Financials',   to: '/financials', icon: Wallet,      feature: null },
  { label: 'Ledger',       to: '/ledger',     icon: ReceiptText, feature: 'full_ledger'  as const },
];

interface Props { isOpen: boolean; onClose: () => void; }

export default function AppDrawer({ isOpen, onClose }: Props) {
  const location = useLocation();
  const { canUse, plan } = usePlan();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      {/* Drawer panel */}
      <div className={clsx(
        'fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300',
        'bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800',
        'shadow-2xl flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-lg font-black text-[#064a98] tracking-tight">StockFlow</span>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SECTIONS.map(section => {
            const locked = section.feature ? !canUse(section.feature as FeatureKey) : false;
            const isActive = location.pathname.startsWith(section.to);
            return (
              <div key={section.to}>
                {locked ? (
                  <NavLink
                    to="/pricing"
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <section.icon size={20} />
                    <span className="text-sm font-medium flex-1 text-left">{section.label}</span>
                    <Crown size={14} className="text-amber-400" />
                  </NavLink>
                ) : (
                  <NavLink
                    to={section.to}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                      isActive
                        ? 'bg-[#064a98] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <section.icon size={20} />
                    <span className="text-sm font-medium flex-1">{section.label}</span>
                    {isActive && <ChevronRight size={16} />}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* Plan badge at bottom */}
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Crown size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{plan} plan</span>
          </div>
        </div>
      </div>
    </>
  );
}
