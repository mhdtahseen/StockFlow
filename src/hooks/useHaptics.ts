import { useCallback } from "react";

/**
 * useHaptics
 * 
 * A simple hook to trigger low-level hardware vibration (Haptics)
 * on supported devices (Android TWA, iOS PWA).
 * 
 * Patterns:
 * - Success: Single short pulse
 * - Error: Short repetitive pulses
 * - Warning: Medium pulse
 */
export function useHaptics() {
  const triggerSuccess = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // 10ms light tap
    }
  }, []);

  const triggerError = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]); // Short-long-short pattern
    }
  }, []);

  const triggerWarning = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
  };
}
