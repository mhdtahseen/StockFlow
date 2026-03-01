import { Outlet, NavLink } from "react-router-dom";
import { Home, List, Plus, Wallet, BarChart2 } from "lucide-react";
import clsx from "clsx";
import { Toaster } from "@/components/ui/sonner";
import { useOfflineSyncManager } from "@/app/useOfflineSyncManager";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

export default function AppLayout() {
  const { isSyncing } = useOfflineSyncManager();
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const outboxCount = useSelector(
    (state: RootState) => state.sync.outbox.length,
  );

  // We no longer block the UI with isSyncing to achieve a true Offline-First UX.
  // The Redux store is hydrated instantly, and background sync happens silently.

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <Toaster />

      <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center h-16 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-50 transition-colors duration-300">
        <NavItem to="/" icon={<Home size={22} />} label="Home" />
        <NavItem to="/inventory" icon={<List size={22} />} label="Inventory" />

        <NavLink
          to="/add"
          className={({ isActive }) =>
            clsx(
              "flex items-center justify-center size-14 rounded-2xl -mt-8 shadow-xl shadow-blue-900/30 text-white transition-all active:scale-95 border border-white/10",
              isActive ? "bg-blue-800" : "bg-[#064a98] hover:bg-blue-800",
            )
          }
        >
          <Plus size={28} strokeWidth={2.5} />
        </NavLink>

        <NavItem to="/wallet" icon={<Wallet size={22} />} label="Wallet" />

        <NavItem to="/analytics" icon={<BarChart2 size={22} />} label="Stats" />
      </nav>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center justify-center w-16 pt-1 transition-colors",
          isActive
            ? "text-[#064a98] dark:text-blue-400"
            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
        )
      }
    >
      {icon}
      <span className="text-[10px] mt-1 font-semibold">{label}</span>
    </NavLink>
  );
}
