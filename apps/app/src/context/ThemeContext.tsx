import React, { createContext, useContext, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { syncKeyboardStyle } from "@/hooks/useKeyboard";

type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: "light" | "dark"; // The actual applied theme
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  resolved: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("sf-theme");
    return (saved as ThemeMode) || "system";
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme,
  );

  const resolved: "light" | "dark" = mode === "system" ? systemTheme : mode;

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("sf-theme", newMode);
  };

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply the .dark class to <html> and sync native StatusBar icon style
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Keep status bar + keyboard in sync with the app theme (both iOS + Android)
    if (Capacitor.isNativePlatform()) {
      const isDark = resolved === "dark";
      StatusBar.setBackgroundColor({
        color: isDark ? '#0f172a' : '#ffffff',
      }).catch(() => {});
      StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      }).catch(() => {});
      syncKeyboardStyle(resolved);
    }
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
