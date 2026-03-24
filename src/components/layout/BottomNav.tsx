import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, Menu } from 'lucide-react';
import clsx from 'clsx';

interface Props { onMenuOpen: () => void; }

export default function BottomNav({ onMenuOpen }: Props) {
  return (
    <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-50 transition-colors duration-300">
      <NavLink to="/"
        aria-label="Go to Dashboard"
        className={({ isActive }) => clsx(
          'flex flex-col items-center justify-center w-16 pt-1 transition-colors',
          isActive ? 'text-primary-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
        )}>
        <LayoutDashboard size={22} />
        <span className="text-[10px] mt-1 font-semibold">Dashboard</span>
      </NavLink>

      <NavLink to="/add"
        aria-label="Add new phone to inventory"
        className={({ isActive }) => clsx(
          'flex items-center justify-center size-14 rounded-2xl -mt-8 shadow-xl shadow-blue-900/30 text-white transition-all active:scale-95 border border-white/10',
          isActive ? 'bg-blue-800' : 'bg-primary-500 hover:bg-blue-800'
        )}>
        <Plus size={28} strokeWidth={2.5} />
      </NavLink>

      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className="flex flex-col items-center justify-center w-16 pt-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        <Menu size={22} />
        <span className="text-[10px] mt-1 font-semibold">Menu</span>
      </button>
    </nav>
  );
}
