import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Settings2,
  Moon,
  Sun,
  Monitor,
  User,
  Users,
  LogOut,
  Palette,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationsPopover from "@/components/shared/NotificationsPopover";
import clsx from "clsx";

interface Props {
  onMenuOpen: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/add": "Add Phone",
  "/customers": "Customers",
  "/orders": "Trade Orders",
  "/financials": "Financials",
  "/ledger": "Ledger",
  "/purchase-orders": "Purchase Orders",
  "/analytics": "Analytics",
  "/profile": "Profile Info",
  "/settings": "Settings",
  "/team": "Manage Team",
  "/about": "About App",
  "/pricing": "Upgrade Plan",
};

export default function AppHeader({ onMenuOpen }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const { mode, resolved, setMode } = useTheme();

  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "theme">("main");
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click — both mouse and touch events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
        setSettingsView("main");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside as EventListener);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as EventListener);
    };
  }, []);

  const getTitle = () => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Handle dynamic routes
    if (path.startsWith("/inventory/")) return "Device Detail";
    if (path.startsWith("/customers/")) return "Customer Record";
    if (path.startsWith("/orders/")) return "Order Detail";
    if (path.startsWith("/purchase-orders/")) return "PO Details";
    if (path.startsWith("/edit/")) return "Edit Phone";

    return "StockFlow";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 relative" ref={settingsRef}>
        <NotificationsPopover />

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
        >
          <Settings2 size={18} className="text-slate-600 dark:text-slate-400" />
          <div
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white/80 dark:border-slate-900/80 transition-colors z-10"
            title={`Theme: ${mode}`}
          >
            {resolved === "dark" ? (
              <Moon size={9} className="text-blue-400" />
            ) : (
              <Sun size={9} className="text-amber-500" />
            )}
          </div>
        </button>

        {showSettings && (
          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[180px] z-[60] transition-all">
            {settingsView === "main" ? (
              <>
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Main Menu
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      navigate("/profile");
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User size={14} />
                      Profile
                    </div>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        navigate("/team");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users size={14} />
                        Manage Team
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      navigate("/settings");
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 size={14} />
                      Settings
                    </div>
                  </button>
                  <button
                    onClick={() => setSettingsView("theme")}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Palette size={14} />
                      Appearance
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                  <button
                    onClick={() => {
                      signOut();
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => setSettingsView("main")}
                    className="p-1 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Select Theme
                  </p>
                </div>
                <div className="py-1">
                  {[
                    { id: "light", icon: Sun, label: "Light" },
                    { id: "dark", icon: Moon, label: "Dark" },
                    { id: "system", icon: Monitor, label: "System" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setMode(t.id as any);
                        setShowSettings(false);
                        setSettingsView("main");
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors",
                        mode === t.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-primary-500 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                    >
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
