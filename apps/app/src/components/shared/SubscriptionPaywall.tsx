import React, { useState } from "react";
import { AlertCircle, MessageSquare, ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/**
 * Full-screen paywall shown when plan === 'expired' (fully suspended).
 * Handles three scenarios with context-aware copy:
 *   1. Trial ended  — no plan_halted_at
 *   2. Paid subscription expired — plan_halted_at set
 *   3. Enterprise license expired — plan_expires_at set but no plan_halted_at
 */
export default function SubscriptionPaywall() {
  const { signOut, tenant } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  // plan_halted_at being set means Razorpay halted the subscription (paid subscriber lapsed).
  const wasPayingSubscriber = !!tenant?.planHaltedAt;

  // Enterprise: plan_expires_at was set (via subscription cycle end) but no halted event.
  // Crude heuristic until a previous_plan column is added.
  const isEnterpriseSuspended =
    !wasPayingSubscriber && !!tenant?.planExpiresAt;

  const { title, body, ctaLabel } = (() => {
    if (isEnterpriseSuspended) {
      return {
        title:    "License Expired",
        body:     "Your Enterprise license for Finventree has expired. Please contact your account manager or support to renew your access.",
        ctaLabel: null, // uses WhatsApp CTA instead
      };
    }
    if (wasPayingSubscriber) {
      return {
        title:    "Subscription Expired",
        body:     "Your Finventree subscription has been suspended due to a payment issue. All your data is safe and will never be deleted. Renew anytime to restore full access.",
        ctaLabel: "Renew Subscription",
      };
    }
    return {
      title:    "Free Trial Ended",
      body:     "Your 6-month free trial of Finventree has ended. To continue adding inventory and processing sales, please choose a subscription plan.",
      ctaLabel: "View Pricing Plans",
    };
  })();

  return (
    <div className="fixed inset-0 z-100 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="size-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10 rotate-3">
        <AlertCircle size={40} strokeWidth={2.5} />
      </div>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
        {title}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
        {body}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isEnterpriseSuspended ? (
          <a
            href="https://wa.me/919028747249"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            Contact Support
          </a>
        ) : (
          <button
            onClick={() => {
              if (Capacitor.isNativePlatform()) {
                Browser.open({ url: "https://finventree.com/pricing" });
              } else {
                window.open("https://finventree.com/pricing", "_blank", "noopener,noreferrer");
              }
            }}
            className="bg-primary-500 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {ctaLabel}
            <ArrowUpRight size={18} />
          </button>
        )}

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-2 text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {isSigningOut && <Loader2 size={14} className="animate-spin" />}
          Sign Out of Account
        </button>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 w-full max-w-xs text-xs text-slate-400 dark:text-slate-600">
        <p className="mb-4">
          <span className="opacity-70 font-semibold italic">Need your data? </span>
          <Link to="/ledger" className="text-primary-500 dark:text-blue-400 hover:underline font-bold">
            View Read-Only Ledger
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4 opacity-50">
          <Link to="/about" className="hover:text-slate-900 dark:hover:text-slate-100">Terms</Link>
          <Link to="/about" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy</Link>
          <a href="mailto:support@finventree.com" className="hover:text-slate-900 dark:hover:text-slate-100">
            Email
          </a>
        </div>
      </div>
    </div>
  );
}
