"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2, AlertCircle, Zap, Building2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import CheckoutModal from "./CheckoutModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BillingPeriod = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

const PLAN_META: Record<string, {
  tagline: string;
  highlighted: boolean;
  icon: React.ReactNode;
  features: string[];
  cta: string;
}> = {
  starter: {
    tagline: "For solo shop owners getting started with digital inventory.",
    highlighted: false,
    icon: <Zap className="w-5 h-5" />,
    features: [
      "1 team member",
      "Up to 100 devices",
      "Sales & purchase orders",
      "Customer directory",
      "PDF invoice generation",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
  pro: {
    tagline: "Everything a serious single-shop needs to run efficiently.",
    highlighted: true,
    icon: <Star className="w-5 h-5" />,
    features: [
      "Up to 10 team members",
      "Unlimited devices",
      "IMEI barcode scanner",
      "Advanced P&L ledger",
      "Analytics & reports",
      "Credit & receivables tracking",
      "Public share links",
      "Global device catalog autofill",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
  enterprise: {
    tagline: "Custom limits and dealer collaboration for high-volume operations.",
    highlighted: false,
    icon: <Building2 className="w-5 h-5" />,
    features: [
      "Unlimited team members",
      "Bulk PDF invoices",
      "Dealer trade network",
      "SLA guarantee",
      "Dedicated support",
      "Everything in Pro",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
};

const PLAN_ORDER = ["starter", "pro", "enterprise"];

interface CheckoutState {
  subscriptionId: string;
  shortUrl?: string;
  baseAmountPaise: number;
  feePaise: number;
  planId: string;
  planName: string;
  billingPeriod: BillingPeriod;
}

function PricingContent() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingPeriod>(
    (searchParams.get("period") as BillingPeriod) ?? "monthly"
  );
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [handoffState, setHandoffState] = useState<"idle" | "exchanging" | "done" | "failed">("idle");

  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [checkout, setCheckout]       = useState<CheckoutState | null>(null);

  // ── Token handoff: exchange ?token_hash= for a session ──────────────────
  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type      = searchParams.get("type") ?? "magiclink";
    if (!tokenHash) return;

    setHandoffState("exchanging");
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as "magiclink" })
      .then(({ error }) => {
        if (error) {
          console.warn("[pricing] handoff token exchange failed:", error.message);
          setHandoffState("failed");
        } else {
          setHandoffState("done");
        }
        // Remove token from URL so it can't be replayed
        const url = new URL(window.location.href);
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch plans ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, price_monthly, price_yearly, features")
        .eq("is_active", true)
        .in("id", PLAN_ORDER);

      if (error) {
        setFetchError("Failed to load plans. Please refresh.");
      } else {
        const sorted = (data ?? []).sort(
          (a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)
        );
        setPlans(sorted);
      }
      setLoading(false);
    }
    fetchPlans();
  }, []);

  async function handleSubscribe(plan: Plan) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Not logged in — send to /login, come back after auth
      window.location.href = `/login?redirect=/pricing&plan=${plan.id}&period=${billing}`;
      return;
    }

    setSubscribing(plan.id);
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/razorpay-create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planId: plan.id, billingPeriod: billing }),
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create subscription");

      setCheckout({
        subscriptionId:  body.subscriptionId,
        shortUrl:        body.shortUrl,
        baseAmountPaise: body.baseAmountPaise,
        feePaise:        body.feePaise,
        planId:          plan.id,
        planName:        plan.name,
        billingPeriod:   billing,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubscribing(null);
    }
  }

  function getPrice(plan: Plan) {
    const amount = billing === "monthly" ? plan.price_monthly : plan.price_yearly;
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }

  return (
    <main className="min-h-screen py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="text-xs font-semibold tracking-widest uppercase text-amber-500 hover:text-amber-400 transition-colors">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Simple, transparent{" "}
            <span className="text-gradient-gold">pricing</span>
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg">
            14-day free trial on every plan. No credit card required to start.
          </p>
        </motion.div>

        {/* Monthly / Yearly toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                billing === "monthly"
                  ? "bg-amber-500 text-slate-900"
                  : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                billing === "yearly"
                  ? "bg-amber-500 text-slate-900"
                  : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              Yearly
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                billing === "yearly" ? "bg-slate-900/30" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                Save ~17%
              </span>
            </button>
          </div>
        </div>

        {/* Handoff banner */}
        {handoffState === "exchanging" && (
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Signing you in…</span>
          </div>
        )}
        {handoffState === "done" && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-8">
            <span className="text-sm">✓ Signed in — select a plan to continue</span>
          </div>
        )}
        {handoffState === "failed" && (
          <div className="flex items-center justify-center gap-2 text-rose-400 mb-8">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Session link expired.{" "}
              <Link href="/login?redirect=/pricing" className="underline hover:text-rose-300">
                Sign in
              </Link>
              {" "}to continue.
            </span>
          </div>
        )}

        {/* Error */}}
        {fetchError && (
          <div className="flex items-center justify-center gap-2 text-red-400 mb-8">
            <AlertCircle className="h-5 w-5" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {/* Plan cards */}
        {!loading && !fetchError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const meta = PLAN_META[plan.id];
              if (!meta) return null;
              return (
                <motion.div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col relative ${
                    meta.highlighted
                      ? "glass-card glow-gold border-amber-500/30"
                      : "glass-card"
                  }`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  {meta.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan name + icon */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${meta.highlighted ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white"}`}>
                      {meta.icon}
                    </div>
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-6">{meta.tagline}</p>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{getPrice(plan)}</span>
                    <span className="text-[var(--color-text-muted)] text-sm ml-1">
                      /{billing === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  {billing === "yearly" && (
                    <p className="text-xs text-emerald-400 mb-6">
                      ₹{Math.round(plan.price_yearly / 12).toLocaleString("en-IN")}/mo billed annually
                    </p>
                  )}
                  {billing === "monthly" && <div className="mb-6" />}

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {meta.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${
                      meta.highlighted ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {subscribing === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {meta.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Fee note */}
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">
          A 2.36% payment processing fee (Razorpay 2% + 18% GST) is added at checkout. Prices shown exclude this fee.
          Cancel any time before the trial ends — you won't be charged.
        </p>
      </div>

      {/* Checkout modal */}
      {checkout && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setCheckout(null)}
          subscriptionId={checkout.subscriptionId}
          shortUrl={checkout.shortUrl}
          planName={checkout.planName}
          billingPeriod={checkout.billingPeriod}
          baseAmountPaise={checkout.baseAmountPaise}
          feePaise={checkout.feePaise}
          onSuccess={(_paymentId, _subId) => {
            toast.success("Subscription active! Redirecting to app…");
            setTimeout(() => {
              window.location.href = "https://app.finventree.com";
            }, 2000);
          }}
          onFailure={(error) => {
            toast.error(error);
          }}
        />
      )}
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
