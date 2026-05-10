import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen as NativeSplash } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

interface SplashScreenProps {
  onFinished: () => void;
  minDuration?: number;
}

// Animation phases:
//   "hidden"  → React overlay not yet shown (native splash is covering)
//   "enter"   → overlay mounted, logo/text animating in
//   "visible" → fully visible, holding
//   "exit"    → fading out to reveal app
type Phase = "hidden" | "enter" | "visible" | "exit";

export default function SplashScreen({
  onFinished,
  minDuration = 1800,
}: SplashScreenProps) {
  const isNative = Capacitor.isNativePlatform();
  const [phase, setPhase] = useState<Phase>(isNative ? "hidden" : "enter");

  useEffect(() => {
    if (isNative) {
      // 1. Hide status bar so splash is truly full-screen
      StatusBar.hide().catch(() => {});

      // 2. Instantly swap: hide native splash (no fade), show our React overlay.
      //    The React overlay matches exactly so the user sees no cut.
      NativeSplash.hide({ fadeOutDuration: 0 }).catch(() => {});

      // 3. Start animating the React overlay in
      setPhase("enter");

      // 4. Hold the "visible" phase briefly, then animate out
      const holdTimer = setTimeout(() => setPhase("exit"), minDuration);

      // 5. After exit animation, restore status bar and hand off to app
      const doneTimer = setTimeout(() => {
        StatusBar.show().catch(() => {});
        onFinished();
      }, minDuration + 600);

      return () => {
        clearTimeout(holdTimer);
        clearTimeout(doneTimer);
      };
    } else {
      // Web: animate in, hold, animate out
      const exitTimer = setTimeout(() => setPhase("exit"), minDuration);
      const doneTimer = setTimeout(() => onFinished(), minDuration + 600);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(doneTimer);
      };
    }
  }, [isNative, minDuration, onFinished]);

  // Don't render anything until we're ready to animate
  if (phase === "hidden") return null;

  const entering = phase === "enter";
  const exiting  = phase === "exit";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #064a98 0%, #0a3d7a 45%, #072e5c 100%)",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.04)" : "scale(1)",
        transition: exiting ? "opacity 600ms ease-in, transform 600ms ease-in" : "none",
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Logo — scales up from 0.6 */}
      <img
        src="/logo.svg"
        alt="Finventree"
        className="brightness-0 invert drop-shadow-2xl"
        style={{
          width: "6rem",
          height: "6rem",
          opacity: entering ? 0 : 1,
          transform: entering ? "scale(0.6)" : "scale(1)",
          transition: "opacity 500ms ease-out, transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      {/* App name — slides up */}
      <h1
        className="text-white text-3xl tracking-tight mt-4"
        style={{
          opacity: entering ? 0 : 1,
          transform: entering ? "translateY(16px)" : "translateY(0)",
          transition: "opacity 500ms ease-out 150ms, transform 500ms ease-out 150ms",
        }}
      >
        <span className="font-black">Stock</span>
        <span className="font-light">Flow</span>
      </h1>

      {/* Tagline — slides up with more delay */}
      <p
        className="text-white/50 text-xs font-semibold uppercase tracking-[0.25em] mt-2"
        style={{
          opacity: entering ? 0 : 1,
          transform: entering ? "translateY(12px)" : "translateY(0)",
          transition: "opacity 500ms ease-out 300ms, transform 500ms ease-out 300ms",
        }}
      >
        Smart Inventory Manager
      </p>

      {/* Pulsing dots — appear after logo settles */}
      <div
        className="flex gap-2 mt-10"
        style={{
          opacity: entering ? 0 : 1,
          transition: "opacity 400ms ease-out 500ms",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30"
            style={{
              animation: phase === "visible" ? `pulse 1.2s ease-in-out ${i * 220}ms infinite` : "none",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
