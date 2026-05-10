import { useLocation } from "react-router-dom";
import NotificationsPopover from "@/components/shared/NotificationsPopover";
import { getPageTitle } from "./navConfig";

/**
 * Slim top bar shown only on desktop (md+).
 * Rendered conditionally by AppLayout (via useIsMobile) so only ONE header
 * mounts at a time — preventing duplicate Supabase realtime subscriptions.
 */
export default function DesktopTopBar() {
  const location = useLocation();

  return (
    <header className="shrink-0 h-14 flex items-center justify-between bg-white dark:bg-slate-900 px-6 border-b border-slate-100 dark:border-slate-800 z-20">
      <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
        {getPageTitle(location.pathname)}
      </h1>
      <div className="flex items-center gap-3">
        {/* Portal target — HeaderActions injects page-level actions here on desktop */}
        <div className="header-actions-target flex items-center gap-2" />
        <NotificationsPopover />
      </div>
    </header>
  );
}
