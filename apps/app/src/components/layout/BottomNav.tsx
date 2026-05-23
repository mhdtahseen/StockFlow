import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface Props { onMenuOpen?: () => void; }

export default function BottomNav(_: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const showListener = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-40 transition-colors duration-300">
      <NavLink to="/"
        aria-label="Go to Dashboard"
        className={({ isActive }) => clsx(
          'flex flex-col items-center justify-center w-20 min-h-[48px] pt-1 transition-colors',
          isActive ? 'text-primary-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
        )}>
        <LayoutDashboard size={22} />
        <span className="text-xs mt-1 font-semibold">Dashboard</span>
      </NavLink>

      {location.pathname === '/add' ? (
        <button 
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center justify-center size-14 rounded-2xl -mt-8 shadow-2xl shadow-primary-500/40 text-white transition-all active:scale-90 border-2 border-white/20 group bg-slate-900 rotate-45"
        >
          <Plus size={32} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
        </button>
      ) : (
        <NavLink to="/add"
          data-tour="nav-add"
          aria-label="Launch Unified Ingestion Engine"
          className="flex items-center justify-center size-14 rounded-2xl -mt-8 shadow-2xl shadow-primary-500/40 text-white transition-all active:scale-90 border-2 border-white/20 group bg-primary-500 hover:bg-primary-600"
        >
          <Plus size={32} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
        </NavLink>
      )}

      <NavLink
        to="/inventory"
        data-tour="nav-inventory"
        aria-label="Go to Inventory"
        className={({ isActive }) => clsx(
          'flex flex-col items-center justify-center w-20 min-h-[48px] pt-1 transition-colors',
          isActive ? 'text-primary-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
        )}>
        <Smartphone size={22} />
        <span className="text-xs mt-1 font-semibold">Inventory</span>
      </NavLink>
    </nav>
  );
}
