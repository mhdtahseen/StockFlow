"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  CheckCircle2,
  DollarSign,
  Save,
  X,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";
import {
  GATE_KEYS,
  DEFAULT_PLAN_KEYS,
  TIER_COLORS,
  type FeatureKey,
  type PlanTier,
} from "@/lib/gateKeys";

type SubscriptionPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  description: string;
  features: FeatureKey[];
  is_active: boolean;
};

type FeatureFlag = {
  flag_key: string;
  enabled_globally: boolean;
};

const PLAN_TIER_MAP: Record<string, PlanTier> = {
  Starter: "starter",
  Pro: "pro",
  Enterprise: "enterprise",
};

const PLAN_ICON_COLORS: Record<string, string> = {
  starter: "bg-slate-100 dark:bg-slate-800 text-slate-500",
  pro: "bg-blue-50 dark:bg-blue-950 text-blue-500",
  enterprise: "bg-emerald-50 dark:bg-emerald-950 text-emerald-500",
};

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function PricingContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [globalFlags, setGlobalFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SubscriptionPlan | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: plansData, error: plansError }, { data: flagsData }] =
        await Promise.all([
          supabase
            .from("subscription_plans")
            .select("*")
            .order("price_monthly", { ascending: true }),
          supabase.from("feature_flags").select("flag_key, enabled_globally"),
        ]);

      if (plansError) throw plansError;

      const normalised = (plansData ?? []).map((p) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      }));

      setPlans(normalised);

      const flagMap: Record<string, boolean> = {};
      (flagsData ?? []).forEach((f: FeatureFlag) => {
        flagMap[f.flag_key] = f.enabled_globally;
      });
      setGlobalFlags(flagMap);
    } catch {
      toast.error("Failed to fetch plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditForm({ ...plan, features: [...plan.features] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    setSavingId(editForm.id);
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name: editForm.name,
          price_monthly: editForm.price_monthly,
          price_yearly: editForm.price_yearly,
          description: editForm.description,
          features: editForm.features,
          is_active: editForm.is_active,
        })
        .eq("id", editForm.id);

      if (error) throw error;
      toast.success("Plan updated");
      setEditingId(null);
      setEditForm(null);
      fetchData();
    } catch {
      toast.error("Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const toggleFeatureKey = (key: FeatureKey) => {
    if (!editForm) return;
    const has = editForm.features.includes(key);
    setEditForm({
      ...editForm,
      features: has
        ? editForm.features.filter((f) => f !== key)
        : [...editForm.features, key],
    });
  };

  const handleResetToDefaults = async (plan: SubscriptionPlan) => {
    const tier = PLAN_TIER_MAP[plan.name] as PlanTier | undefined;
    if (!tier) return;
    setResettingId(plan.id);
    try {
      const defaults = DEFAULT_PLAN_KEYS[tier];
      const { error } = await supabase
        .from("subscription_plans")
        .update({ features: defaults })
        .eq("id", plan.id);
      if (error) throw error;
      toast.success("Reset to default gate keys");
      fetchData();
    } catch {
      toast.error("Reset failed");
    } finally {
      setResettingId(null);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 sm:p-5 w-full space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Subscription Plans
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">
              Manage pricing and feature gate assignments per tier
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl border-slate-200 dark:border-slate-800 gap-2 font-bold"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Loader2 className="animate-spin h-8 w-8" />
            <p className="font-bold text-xs uppercase tracking-widest">
              Hydrating Plans...
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => {
              const tier = PLAN_TIER_MAP[plan.name];
              const colors = tier ? TIER_COLORS[tier] : TIER_COLORS.expired;
              const defaults = tier ? DEFAULT_PLAN_KEYS[tier] : [];
              const currentFeatures =
                editingId === plan.id
                  ? (editForm?.features ?? [])
                  : plan.features;

              const isOutOfSync = (() => {
                if (!tier) return false;
                return (
                  [...defaults].sort().join(",") !==
                  [...currentFeatures].sort().join(",")
                );
              })();

              return (
                <Card
                  key={plan.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                >
                  {/* Tier accent bar */}
                  <div
                    className={clsx(
                      "h-1.5 w-full",
                      tier === "enterprise"
                        ? "bg-emerald-500"
                        : tier === "pro"
                        ? "bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    )}
                  />

                  <CardHeader className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "size-10 rounded-xl flex items-center justify-center",
                            tier
                              ? PLAN_ICON_COLORS[tier]
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="font-bold text-lg">
                              {plan.name}
                            </CardTitle>
                            {tier && (
                              <Badge
                                className={clsx(
                                  "uppercase text-[9px] font-black tracking-widest rounded-full px-2 py-0.5 border",
                                  colors.bg,
                                  colors.text,
                                  colors.border
                                )}
                                variant="outline"
                              >
                                {tier}
                              </Badge>
                            )}
                            {isOutOfSync && editingId !== plan.id && (
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-black tracking-wide border-amber-300 text-amber-600 dark:text-amber-400 rounded-full px-2 gap-1"
                              >
                                <AlertTriangle size={9} />
                                Out of Sync
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="font-mono text-[10px] mt-0.5">
                            id: {plan.id}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOutOfSync && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetToDefaults(plan)}
                            disabled={resettingId === plan.id}
                            className="h-8 px-3 rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50 gap-1.5 text-xs font-bold"
                          >
                            <RefreshCw
                              size={12}
                              className={
                                resettingId === plan.id ? "animate-spin" : ""
                              }
                            />
                            Reset
                          </Button>
                        )}
                        {editingId === plan.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="rounded-lg h-8 w-8 p-0"
                            >
                              <X size={16} />
                            </Button>
                            <Button
                              onClick={handleUpdate}
                              size="sm"
                              disabled={savingId === plan.id}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 gap-1.5 font-bold"
                            >
                              {savingId === plan.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                              Save
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            className="rounded-lg border-slate-200 dark:border-slate-800 h-8 px-3 gap-1.5 font-bold"
                          >
                            <Edit2 size={14} /> Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div className="grid sm:grid-cols-2 gap-8">
                      {/* Left: Pricing & Description */}
                      <div className="space-y-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <DollarSign size={12} /> Pricing Structure
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">
                              Monthly (INR)
                            </Label>
                            {editingId === plan.id ? (
                              <Input
                                type="number"
                                value={editForm?.price_monthly}
                                onChange={(e) =>
                                  setEditForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          price_monthly: Number(e.target.value),
                                        }
                                      : null
                                  )
                                }
                                className="rounded-lg font-bold h-10"
                              />
                            ) : (
                              <p className="text-2xl font-bold tabular-nums">
                                ₹{plan.price_monthly.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">
                              Yearly (INR)
                            </Label>
                            {editingId === plan.id ? (
                              <Input
                                type="number"
                                value={editForm?.price_yearly}
                                onChange={(e) =>
                                  setEditForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          price_yearly: Number(e.target.value),
                                        }
                                      : null
                                  )
                                }
                                className="rounded-lg font-bold h-10"
                              />
                            ) : (
                              <p className="text-2xl font-bold tabular-nums">
                                ₹{plan.price_yearly.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">
                            Description
                          </Label>
                          {editingId === plan.id ? (
                            <textarea
                              value={editForm?.description}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, description: e.target.value }
                                    : null
                                )
                              }
                              className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              {plan.description || (
                                <span className="italic text-slate-400">
                                  No description
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {isOutOfSync && editingId !== plan.id && (
                          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <AlertTriangle
                              size={14}
                              className="text-amber-500 mt-0.5 shrink-0"
                            />
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                              Feature keys differ from the default tier mapping.
                              Click "Reset" to restore defaults.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Feature Gate Keys */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <CheckCircle2 size={12} /> Feature Gate Keys
                          <span className="ml-auto text-[9px] font-bold normal-case tracking-normal text-slate-400">
                            {currentFeatures.length} / {GATE_KEYS.length}
                          </span>
                        </h3>

                        <div className="space-y-1">
                          {GATE_KEYS.map((gate) => {
                            const isEnabled = currentFeatures.includes(
                              gate.key
                            );
                            const isDefaultForTier = tier
                              ? DEFAULT_PLAN_KEYS[tier].includes(gate.key)
                              : false;
                            const isKilled =
                              globalFlags[gate.key] === false;
                            const tierColor = TIER_COLORS[gate.minTier];

                            return (
                              <div
                                key={gate.key}
                                className={clsx(
                                  "flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors",
                                  isEnabled && !isKilled
                                    ? "bg-slate-50 dark:bg-slate-800/60"
                                    : "bg-transparent",
                                  isKilled && "opacity-50"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span
                                    className={clsx(
                                      "size-2 rounded-full shrink-0",
                                      tierColor.dot
                                    )}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={clsx(
                                          "text-xs font-bold",
                                          isEnabled && !isKilled
                                            ? "text-slate-800 dark:text-slate-200"
                                            : "text-slate-400 dark:text-slate-600",
                                          isKilled && "line-through"
                                        )}
                                      >
                                        {gate.name}
                                      </span>
                                      {isKilled && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Lock
                                              size={10}
                                              className="text-rose-400"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="text-xs max-w-48"
                                          >
                                            Killed globally via Feature Flags
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {isDefaultForTier &&
                                        !isKilled &&
                                        editingId === plan.id && (
                                          <span className="text-[9px] font-black uppercase tracking-wide text-slate-300 dark:text-slate-600">
                                            default
                                          </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
                                      {gate.key}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info
                                        size={12}
                                        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="left"
                                      className="text-xs max-w-56"
                                    >
                                      {gate.description}
                                    </TooltipContent>
                                  </Tooltip>
                                  {editingId === plan.id ? (
                                    <Toggle
                                      enabled={isEnabled}
                                      onChange={() => toggleFeatureKey(gate.key)}
                                      disabled={isKilled}
                                    />
                                  ) : (
                                    <span
                                      className={clsx(
                                        "text-[10px] font-black uppercase w-6 text-right",
                                        isEnabled && !isKilled
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-slate-300 dark:text-slate-600"
                                      )}
                                    >
                                      {isEnabled && !isKilled ? "On" : "—"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default function PricingPage() {
  return (
    <AdminShell>
      <PricingContent />
    </AdminShell>
  );
}


