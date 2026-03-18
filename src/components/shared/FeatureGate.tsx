import React from 'react';
import { usePlan, FeatureKey } from '@/hooks/usePlan';
import { UpgradePrompt } from './UpgradePrompt';

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: Props) {
  const { canUse, plan } = usePlan();
  
  if (canUse(feature)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : <UpgradePrompt feature={feature} currentPlan={plan} />;
}
