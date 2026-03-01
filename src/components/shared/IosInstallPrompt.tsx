import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IosInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Detect if already installed as PWA or in Standalone mode
    const isStandalone = () => {
      return (
        ("standalone" in window.navigator &&
          (window.navigator as any).standalone) ||
        window.matchMedia("(display-mode: standalone)").matches
      );
    };

    // Show prompt if iOS and not standalone, and not dismissed recently
    const dismissed = localStorage.getItem("ios_install_dismissed");

    if (isIos() && !isStandalone() && dismissed !== "true") {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Optional: Only hide it for a week or so, but let's hide it permanently for now
    localStorage.setItem("ios_install_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-5 duration-500 ease-out">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl dark:shadow-black/50 max-w-sm mx-auto relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={16} className="text-slate-500 dark:text-slate-400" />
        </button>

        <div className="flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <div className="size-12 bg-gradient-to-br from-[#064a98] to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 text-white">
              <MonitorSmartphone size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-slate-900 dark:text-white mb-1">
              Install StockFlow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Install this application on your home screen for quick and easy
              access when you're offline.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                1. Tap <Share size={14} className="text-blue-500" /> in Safari
                menu
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                2. Select <PlusSquare size={14} className="text-blue-500" /> Add
                to Home Screen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
