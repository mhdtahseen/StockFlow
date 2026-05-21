import React, { useState, useEffect } from "react";
import { Joyride, type EventData, type Step, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import posthog from "@/lib/posthog";
import { FEATURE_TOUR_KEY } from "@/components/onboarding/FeatureTour";

const TOUR_KEY = "finventree_tour_shown";

const MOBILE_STEPS: Step[] = [
  {
    target: '[data-tour="dashboard-metrics"]',
    title: "Your Business at a Glance",
    content: "Track revenue, stock value, and profit margin — updated in real time as you log sales and purchases.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="nav-add"]',
    title: "Add Devices Fast",
    content: "Tap the + button from anywhere in the app to quickly add a new phone to your inventory.",
    placement: "top",
  },
  {
    target: '[data-tour="nav-menu"]',
    title: "Navigate the App",
    content: "Tap Menu to reach Inventory, Orders, Ledger, and Customers — everything you need to run your shop.",
    placement: "top",
  },
];

const DESKTOP_STEPS: Step[] = [
  {
    target: '[data-tour="dashboard-metrics"]',
    title: "Your Business at a Glance",
    content: "Track revenue, stock value, and profit margin — updated in real time as you log sales and purchases.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="sidebar-inventory"]',
    title: "Inventory",
    content: "Browse, search, and manage all your devices in one place. Filter by status, brand, or model.",
    placement: "right",
  },
  {
    target: '[data-tour="sidebar-orders"]',
    title: "Orders",
    content: "Create sale and purchase orders, track payment status, and process returns.",
    placement: "right",
  },
  {
    target: '[data-tour="sidebar-ledger"]',
    title: "Ledger",
    content: "See every rupee — income, expenses, credits, and debits — in real time with a full P&L view.",
    placement: "right",
  },
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface TooltipProps {
  backProps: React.HTMLAttributes<HTMLButtonElement>;
  closeProps: React.HTMLAttributes<HTMLButtonElement>;
  continuous: boolean;
  index: number;
  isLastStep: boolean;
  primaryProps: React.HTMLAttributes<HTMLButtonElement>;
  skipProps: React.HTMLAttributes<HTMLButtonElement>;
  step: Step;
  tooltipProps: React.HTMLAttributes<HTMLDivElement>;
  size: number;
}

function CoachTip({
  backProps, closeProps, continuous, index, isLastStep,
  primaryProps, skipProps, step, tooltipProps, size,
}: TooltipProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 border border-slate-200 dark:border-slate-700 w-72 overflow-hidden"
    >
      {/* Header accent */}
      <div className="h-1 bg-primary-500" />

      <div className="p-4">
        {/* Title + close */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
            {step.title as React.ReactNode}
          </p>
          <button
            {...closeProps}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          {step.content as React.ReactNode}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Step counter + skip */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
              {index + 1} / {size}
            </span>
            <button
              {...skipProps}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Back + Next/Done */}
          <div className="flex gap-2">
            {index > 0 && (
              <button
                {...backProps}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              {...primaryProps}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
            >
              {isLastStep ? "Done!" : <>Next <ArrowRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CoachMarks() {
  const { onboardingCompletedAt } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [run, setRun] = useState(false);

  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;

  // Start the tour on the Dashboard only, once per device, after FeatureTour has been seen
  useEffect(() => {
    if (
      onboardingCompletedAt !== undefined && // profile loaded
      location.pathname === "/" &&
      localStorage.getItem(TOUR_KEY) !== "true" &&
      localStorage.getItem(FEATURE_TOUR_KEY) === "true" // don't overlap with FeatureTour
    ) {
      // Brief delay so the page elements are mounted and visible
      const t = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(t);
    }
  }, [onboardingCompletedAt, location.pathname]);

  const handleCallback = (data: EventData) => {
    const { status, action, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, "true");
      posthog.capture("onboarding.tour_completed", {
        skipped: status === STATUS.SKIPPED,
      });
    }

    // Track step advances
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      posthog.capture("onboarding.tour_step", { step: data.index });
    }
  };

  // Don't mount joyride at all if tour already shown, profile loading, or FeatureTour not yet seen
  if (
    localStorage.getItem(TOUR_KEY) === "true" ||
    localStorage.getItem(FEATURE_TOUR_KEY) !== "true" ||
    onboardingCompletedAt === undefined
  ) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      tooltipComponent={CoachTip as any}
      onEvent={handleCallback}
      options={{
        buttons: ["back", "close", "primary", "skip"],
        overlayClickAction: false,
        skipBeacon: true,
        zIndex: 9999,
        overlayColor: "rgba(0, 0, 0, 0.45)",
        arrowColor: "transparent",
      }}
    />
  );
}
