import { NavLink } from "react-router-dom";
import { LayoutDashboard, Smartphone, Plus, ReceiptText, BarChart2 } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-50 transition-colors duration-300">
      <NavItem to="/" icon={<LayoutDashboard size={22} />} label="Dashboard" />
      <NavItem to="/inventory" icon={<Smartphone size={22} />} label="Inventory" />

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

      <NavItem to="/wallet" icon={<ReceiptText size={22} />} label="Ledger" />

      <NavItem to="/analytics" icon={<BarChart2 size={22} />} label="Stats" />
    </nav>
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
