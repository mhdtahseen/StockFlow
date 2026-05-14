import React from 'react';
import { Lock } from 'lucide-react';
import { usePlan, FeatureKey } from '@/hooks/usePlan';
import { useUpgradeGate } from '@/context/UpgradeGateContext';

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Render nothing when locked instead of a lock button. Use for actions starters shouldn't discover. */
  hidden?: boolean;
  /**
   * Render children with an amber "PRO" badge overlay when locked.
   * Tapping anywhere on the element opens the upgrade modal.
   * Use for buttons that should remain visible and entice upgrades.
   */
  badge?: boolean;
  /** Optional custom locked state — renders instead of the default lock button */
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, hidden, badge, fallback }: Props) {
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();

  if (canUse(feature)) return <>{children}</>;

  // hidden mode: render nothing
  if (hidden) return null;

  // badge mode: render children with a Pro badge overlay.
  // A transparent intercept layer captures all clicks → upgrade modal.
  // The inner button is visually present but cannot be activated.
  if (badge) {
    return (
      <span className="relative inline-flex" title="Upgrade to unlock">
        {/* Visual: children rendered at reduced opacity */}
        <span className="opacity-60 pointer-events-none select-none">
          {children}
        </span>
        {/* PRO badge */}
        <span className="absolute -top-1.5 -right-1.5 z-10 text-[8px] font-black uppercase tracking-wider leading-none bg-amber-400 text-amber-950 px-1 py-0.5 rounded-full pointer-events-none select-none">
          PRO
        </span>
        {/* Transparent intercept layer — blocks the inner button and triggers upgrade */}
        <span
          className="absolute inset-0 z-20 cursor-pointer rounded-[inherit]"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); showUpgrade(feature); }}
        />
      </span>
    );
  }

  if (fallback) return <>{fallback}</>;

  // Default: lock icon button (for wrapping inline action buttons)
  return (
    <button
      type="button"
      onClick={() => showUpgrade(feature)}
      className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      title="Upgrade to unlock"
    >
      <Lock size={16} />
    </button>
  );
}

