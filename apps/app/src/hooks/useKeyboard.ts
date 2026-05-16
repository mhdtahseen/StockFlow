import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardStyle } from "@capacitor/keyboard";

/**
 * useKeyboard
 *
 * On native Capacitor (iOS + Android):
 * - Scrolls the focused input into view when the keyboard opens,
 *   so the keyboard never obstructs what the user is typing into.
 * - No-ops on desktop/web (keyboard events don't fire there).
 */
export function useKeyboard() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const scrollFocusedIntoView = () => {
      // Small delay so the keyboard resize has settled
      setTimeout(() => {
        const el = document.activeElement as HTMLElement | null;
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    };

    let handle: { remove: () => Promise<void> } | undefined;
    Keyboard.addListener("keyboardWillShow", scrollFocusedIntoView).then(
      (h) => { handle = h; },
    );

    return () => {
      handle?.remove();
    };
  }, []);
}

/**
 * syncKeyboardStyle
 *
 * Keeps the keyboard appearance (light/dark) in sync with the app theme.
 * Call this from ThemeContext whenever `resolved` changes.
 */
export function syncKeyboardStyle(resolved: "light" | "dark") {
  if (!Capacitor.isNativePlatform()) return;
  Keyboard.setStyle({
    style: resolved === "dark" ? KeyboardStyle.Dark : KeyboardStyle.Light,
  }).catch(() => {});
}
