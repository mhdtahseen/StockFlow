import React from 'react';
import { Lock } from 'lucide-react';
import { usePlan, FeatureKey } from '@/hooks/usePlan';
import { useUpgradeGate } from '@/context/UpgradeGateContext';

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Optional custom locked state — renders instead of the default lock button */
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: Props) {
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();

  if (canUse(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  // Default: render a lock icon button that matches the size of the wrapped child
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

