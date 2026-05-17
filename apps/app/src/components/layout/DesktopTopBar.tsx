import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NotificationsPopover from "@/components/shared/NotificationsPopover";
import { getPageTitle } from "./navConfig";

/**
 * Slim top bar shown only on desktop (md+).
 * Rendered conditionally by AppLayout (via useIsMobile) so only ONE header
 * mounts at a time — preventing duplicate Supabase realtime subscriptions.
 */
export default function DesktopTopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Any path with more than one segment (e.g. /orders/abc-123) is a detail/sub-page
  const isSubPage = location.pathname.split('/').filter(Boolean).length > 1;

  return (
    <header className="shrink-0 h-14 flex items-center justify-between bg-white dark:bg-slate-900 px-6 border-b border-slate-100 dark:border-slate-800 z-20">
      <div className="flex items-center gap-2">
        {isSubPage && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Portal target — HeaderActions injects page-level actions here on desktop */}
        <div className="header-actions-target flex items-center gap-2" />
        <NotificationsPopover />
      </div>
    </header>
  );
}
