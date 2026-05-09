import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export function useHaptics() {
  const triggerSuccess = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const triggerError = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Error });
    } else if ("vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }, []);

  const triggerWarning = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
  };
}
