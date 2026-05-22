import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export const HAPTICS_KEY = "finventree_haptics_enabled";

function isHapticsEnabled(): boolean {
  try {
    const val = localStorage.getItem(HAPTICS_KEY);
    return val === null ? true : val === "true"; // default on
  } catch {
    return true;
  }
}

export function useHaptics() {
  const triggerSuccess = useCallback(async () => {
    if (!isHapticsEnabled()) return;
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const triggerError = useCallback(async () => {
    if (!isHapticsEnabled()) return;
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Error });
    } else if ("vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }, []);

  const triggerWarning = useCallback(async () => {
    if (!isHapticsEnabled()) return;
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  /** Light impact — used for selection gestures (long-press) */
  const triggerImpact = useCallback(async () => {
    if (!isHapticsEnabled()) return;
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerImpact,
  };
}
