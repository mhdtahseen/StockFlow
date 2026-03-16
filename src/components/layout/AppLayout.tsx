import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
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
    <div className="flex flex-col h-[100dvh] overflow-hidden w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <Toaster />

      <BottomNav />
    </div>
  );
}

