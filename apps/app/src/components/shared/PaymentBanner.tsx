import React from "react";
import { AlertTriangle, CreditCard, Lock, ArrowUpRight } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const PRICING_URL = "https://finventree.com/pricing";

function openPricing() {
  if (Capacitor.isNativePlatform()) {
    Browser.open({ url: PRICING_URL });
  } else {
    window.open(PRICING_URL, "_blank", "noopener,noreferrer");
  }
}

/**
 * Non-dismissible persistent banner shown during payment failure, grace, and restricted states.
 * Displayed above main content but below the full paywall (which only shows for plan='expired').
 */
export default function PaymentBanner() {
  const { isPaymentFailed, isGrace, isRestricted, daysUntilRestricted, daysUntilSuspended } = usePlan();

  if (!isPaymentFailed && !isGrace && !isRestricted) return null;

  const config = isRestricted
    ? {
        bg:       "bg-rose-700",
        text:     "text-white",
        icon:     <Lock size={15} />,
        message:  "Your account is read-only. All your data is safe.",
        cta:      "Renew to restore access",
        detail:   daysUntilSuspended !== null ? `Account suspends in ${daysUntilSuspended}d` : null,
      }
    : isGrace
    ? {
        bg:       "bg-rose-600",
        text:     "text-white",
        icon:     <AlertTriangle size={15} />,
        message:  "Subscription payment failed.",
        cta:      "Renew now",
        detail:   daysUntilRestricted !== null
          ? `Full access for ${daysUntilRestricted} more day${daysUntilRestricted === 1 ? "" : "s"}`
          : null,
      }
    : {
        bg:       "bg-amber-500",
        text:     "text-slate-900",
        icon:     <CreditCard size={15} />,
        message:  "Payment failed. Please update your payment method.",
        cta:      "Update payment",
        detail:   null,
      };

  return (
    <div className={`relative flex items-center gap-3 px-4 py-2 ${config.bg} ${config.text}`}>
      <span className="shrink-0">{config.icon}</span>
      <div className="flex flex-1 items-center gap-2 text-sm font-medium min-w-0">
        <span className="truncate">{config.message}</span>
        {config.detail && (
          <span className="hidden sm:inline text-xs opacity-75 shrink-0">— {config.detail}</span>
        )}
      </div>
      <button
        onClick={openPricing}
        className="shrink-0 flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:no-underline transition-all"
      >
        {config.cta}
        <ArrowUpRight size={13} />
      </button>
    </div>
  );
}
