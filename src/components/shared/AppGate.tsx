import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  MonitorSmartphone, 
  Download, 
  ExternalLink, 
  ShieldAlert,
  Smartphone,
  ChevronRight,
  Share,
  PlusSquare
} from "lucide-react";


interface AppGateProps {
  children: React.ReactNode;
}

export default function AppGate({ children }: AppGateProps) {
  const location = useLocation();
  const [isBlocked, setIsBlocked] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isAndroid: false,
    isIos: false,
    isStandalone: false,
    isMobile: false,
  });

  const getAppIntent = () => {
    const host = window.location.hostname;
    const path = window.location.pathname + window.location.search;
    
    // Choose package based on deployment
    // Vercel: app.vercel.stock_flow_dev.twa
    // Cloudflare: dev.pages.stockflow_48g.twa
    const packageName = host.includes('vercel.app') 
      ? 'app.vercel.stock_flow_dev.twa' 
      : 'dev.pages.stockflow_48g.twa';

    // Intent URL structure to force-open the app via its package name
    return `intent://${host}${path}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;
  };

  useEffect(() => {
    const checkDevice = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(ua);
      const isIos = /iphone|ipad|ipod/.test(ua);
      const isMobile = isAndroid || isIos || /mobile|webos|blackberry|iemobile|opera mini/.test(ua);
      
      const isStandalone = 
        ("standalone" in window.navigator && (window.navigator as any).standalone) ||
        window.matchMedia("(display-mode: standalone)").matches;

      // Detect if the device has a mouse/trackpad (fine pointer)
      // Laptop/Desktop will have this, true Mobile devices will not.
      const isDesktopPointer = window.matchMedia("(pointer: fine)").matches;

      setDeviceInfo({ isAndroid, isIos, isStandalone, isMobile });

      // Logic: 
      // 1. Never block public view links
      if (location.pathname.startsWith("/public/view")) {
        setIsBlocked(false);
        return;
      }

      // 2. Block Mobile Browsers (Mandatory App)
      // Only block if it's a mobile OS AND a touch-only device (no mouse/trackpad)
      if ((isAndroid || isIos) && isMobile && !isStandalone && !isDesktopPointer) {
        setIsBlocked(true);
        return;
      }


      setIsBlocked(false);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, [location.pathname]);

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 max-w-sm w-full">
          <div className="size-20 bg-gradient-to-br from-[#064a98] to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto mb-8 border border-white/10 ring-8 ring-blue-500/5">
            <MonitorSmartphone size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            Use the Mobile App
          </h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            Web access is restricted on mobile devices. Please use the official application for a secure and optimized experience.
          </p>

          <div className="space-y-3">
            {deviceInfo.isAndroid && (
              <a 
                href={getAppIntent()}
                className="w-full bg-white text-slate-950 h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-wider hover:bg-slate-100 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
              >
                <ExternalLink size={18} />
                Open In App
              </a>
            )}
            
            <div className="pt-8 text-left space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">
                Installation Guide {deviceInfo.isIos ? "(iOS)" : "(Android)"}
              </p>
              
              {deviceInfo.isIos ? (
                <>
                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                      <Share className="text-blue-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Step 1</p>
                      <p className="text-[10px] text-slate-500 font-medium">Tap the 'Share' icon in your Safari menu.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                      <PlusSquare className="text-blue-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Step 2</p>
                      <p className="text-[10px] text-slate-500 font-medium">Select 'Add to Home Screen' to install the app.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                      <Download className="text-blue-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Download APK</p>
                      <p className="text-[10px] text-slate-500 font-medium">Get the latest version from our portal or admin.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                      <Smartphone className="text-blue-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Instant Install</p>
                      <p className="text-[10px] text-slate-500 font-medium">Or tap 'Install App' in your Chrome menu options.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>


          <div className="mt-12 flex items-center justify-center gap-2 text-slate-600">
            <ShieldAlert size={14} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Secure Access Protocol</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
