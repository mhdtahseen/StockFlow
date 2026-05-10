import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Bell,
  HardDriveDownload,
  Download,
  Activity,
  Smartphone,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ExportModal from "@/components/shared/ExportModal";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function Settings() {
  const { mode, setMode } = useTheme();
  const [showExportModal, setShowExportModal] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  const { togglePushNotifications } = usePushNotifications();

  const handleTogglePush = async (checked: boolean) => {
    setNotifsEnabled(checked);
    const success = await togglePushNotifications(checked);
    if (!success && checked) {
      toast.error('Failed to enable push notifications');
      setNotifsEnabled(false);
    } else if (success && checked) {
      toast.success('Push notifications enabled');
    }
  };


  const themeOptions: {
    value: "system" | "light" | "dark";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "system", label: "System Sync", icon: <Monitor size={18} /> },
    { value: "light", label: "Light Mode", icon: <Sun size={18} /> },
    { value: "dark", label: "Dark Mode", icon: <Moon size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 pt-6">
        {/* Theme Settings */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
            Appearance
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "p-2 rounded-lg",
                      mode === opt.value
                        ? "bg-primary-500 text-white dark:bg-blue-600"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {opt.icon}
                  </div>
                  <span className="font-medium text-sm">{opt.label}</span>
                </div>
                <div
                  className={clsx(
                    "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    mode === opt.value
                      ? "border-primary-500 dark:border-blue-500"
                      : "border-slate-300 dark:border-slate-700",
                  )}
                >
                  {mode === opt.value && (
                    <div className="size-2.5 rounded-full bg-primary-500 dark:bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Device & Notifications */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
            Device Preferences
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">Push Notifications</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Alerts for inventory sold by team
                  </p>
                </div>
              </div>
              <Switch
                checked={notifsEnabled}
                onCheckedChange={handleTogglePush}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">Background Sync</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Upload changes silently when online
                  </p>
                </div>
              </div>
              <Switch
                checked={offlineSyncEnabled}
                onCheckedChange={setOfflineSyncEnabled}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">Haptic Feedback</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Vibrations on success/error actions
                  </p>
                </div>
              </div>
              <Switch
                checked={hapticFeedback}
                onCheckedChange={setHapticFeedback}
              />
            </div>
          </div>
        </section>

        {/* Data & Export */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
            Data Management
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Download size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Export Financial ledgers
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Download CSV for your accountant
                  </p>
                </div>
              </div>
            </button>
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <HardDriveDownload size={18} />
                </div>
                <div>
                  <p className="font-medium text-sm">Local Storage</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Using 12.4 MB of PWA cache
                  </p>
                </div>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-md bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
                Clear Cache
              </button>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400 mt-8 mb-4">
          StockFlow System Settings v1.0
        </p>
      </main>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
