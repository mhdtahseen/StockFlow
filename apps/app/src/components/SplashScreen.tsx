import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

interface SplashScreenProps {
  onFinished: () => void;
  minDuration?: number;
}

export default function SplashScreen({
  onFinished,
  minDuration = 1800,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Phase 1: Small delay to trigger enter animation
    const enterTimer = setTimeout(() => setPhase("visible"), 100);

    // Phase 2: Start exit after min duration
    const exitTimer = setTimeout(() => setPhase("exit"), minDuration);

    // Phase 3: Remove from DOM after exit animation
    const doneTimer = setTimeout(() => onFinished(), minDuration + 500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [minDuration, onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        phase === "exit" ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      style={{
        background: "linear-gradient(145deg, #064a98 0%, #0a3d7a 40%, #072e5c 100%)",
      }}
    >
      {/* Subtle radial glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Logo */}
      <img
        src="/logo.svg"
        alt="StockFlow"
        className={`w-24 h-24 brightness-0 invert drop-shadow-2xl transition-all duration-700 ease-out ${
          phase === "enter" ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}
      />

      {/* App name */}
      <h1
        className={`text-white text-3xl tracking-tight mt-3 transition-all duration-700 ease-out delay-150 ${
          phase === "enter"
            ? "opacity-0 translate-y-3"
            : "opacity-100 translate-y-0"
        }`}
      >
        <span className="font-bold">Stock</span>
        <span className="font-medium">Flow</span>
      </h1>

      {/* Tagline */}
      <p
        className={`text-white/50 text-xs font-semibold uppercase tracking-[0.25em] mt-2 transition-all duration-700 ease-out delay-300 ${
          phase === "enter"
            ? "opacity-0 translate-y-3"
            : "opacity-100 translate-y-0"
        }`}
      >
        Smart Inventory Manager
      </p>

      {/* Loading pulse dots */}
      <div className="flex gap-1.5 mt-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
