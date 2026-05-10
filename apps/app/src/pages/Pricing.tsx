import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Crown,
  Store,
  Sparkles,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan = tenant?.plan || "trial";

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .order("price_monthly", { ascending: true });

        if (error) throw error;
        
        // Map database plans to UI requirements (icons, colors)
        const mappedPlans = (data || []).map(p => {
          let icon = Store;
          let color = "slate";
          let popular = false;

          if (p.id === "pro") {
            icon = Sparkles;
            color = "blue";
            popular = true;
          } else if (p.id === "enterprise") {
            icon = Crown;
            color = "amber";
          }

          return {
            ...p,
            icon,
            color,
            popular,
            price: `₹${p.price_monthly.toLocaleString()}`,
            period: "/mo",
            buttonText: currentPlan === p.id ? "Current Plan" : `Upgrade to ${p.name}`,
            disabled: currentPlan === p.id
          };
        });

        setPlans(mappedPlans);
      } catch (err) {
        toast.error("Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [currentPlan]);

  const handleSubscribe = (planCode: string) => {
    if (planCode === currentPlan) return;
    toast.info("Checkout Integration", {
      description: "Razorpay integration is scheduled for Phase 6.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Loader2 className="animate-spin h-8 w-8" />
        <p className="font-black text-[10px] uppercase tracking-widest">Pricing Liquidity...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto font-sans antialiased">
      <main className="p-4 space-y-6 pb-24">
        {currentPlan === "trial" && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-start gap-3">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">
                Trial Active
              </h4>
              <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-500/80 mt-1">
                You currently have full access to Enterprise features for a
                limited time.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                "relative bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all",
                plan.popular
                  ? "border-primary-500 dark:border-blue-500 shadow-xl shadow-blue-900/10 dark:shadow-black/50"
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "p-3 rounded-2xl",
                      plan.color === "slate"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        : plan.color === "blue"
                          ? "bg-blue-50 dark:bg-blue-900/40 text-primary-500 dark:text-blue-400"
                          : "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    <plan.icon size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">
                      {plan.name}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold mt-0.5">
                      {plan.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">
                  {plan.price}
                </span>
                <span className="text-slate-500 font-bold text-sm tracking-wide">
                  {plan.period}
                </span>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2
                      size={18}
                      className={clsx(
                        "shrink-0 mt-0.5",
                        plan.popular
                          ? "text-primary-500 dark:text-blue-500"
                          : "text-emerald-500",
                      )}
                    />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.disabled}
                onClick={() => handleSubscribe(plan.id)}
                className={clsx(
                  "w-full py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98]",
                  plan.disabled
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : plan.popular
                      ? "bg-primary-500 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md",
                )}
              >
                {plan.disabled ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> {plan.buttonText}
                  </span>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center pt-8 pb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Enterprise Support
          </p>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            Need a custom plan for a large retail chain? <br />
            <a
              href="mailto:support@finventree.com"
              className="text-primary-500 dark:text-blue-400"
            >
              Contact Sales
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
