import { RefreshCw } from "lucide-react";
import clsx from "clsx";

interface PtrIndicatorProps {
  pullDistance: number;
  isTriggered: boolean;
  threshold: number;
  isSyncing: boolean;
}

/**
 * Zero-height indicator bar — sits at the top of the scrollable container
 * without taking up layout space. The indicator floats up as the user pulls.
 */
export function PtrIndicator({
  pullDistance,
  isTriggered,
  threshold,
  isSyncing,
}: PtrIndicatorProps) {
  // Show spinner for the full isTriggered window regardless of sync latency
  const showSpinner = isTriggered;
  const showPull = !isTriggered && pullDistance > 4;

  if (!showPull && !showSpinner) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const translateY = showSpinner ? 12 : pullDistance - 44;
  const rotateDeg = progress * 360;

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{ height: 0, overflow: "visible", position: "relative", zIndex: 20 }}
    >
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ top: 0, transform: `translateY(${translateY}px)` }}
      >
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-md p-2 flex items-center justify-center">
          <RefreshCw
            size={18}
            className={clsx(
              "text-primary-500 dark:text-blue-400",
              showSpinner ? "animate-spin" : "transition-transform",
            )}
            style={!showSpinner ? { transform: `rotate(${rotateDeg}deg)` } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
