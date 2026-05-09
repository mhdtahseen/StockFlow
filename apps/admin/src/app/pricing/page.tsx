"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  CheckCircle2,
  DollarSign,
  Plus,
  Save,
  X,
  Edit2,
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

type SubscriptionPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  description: string;
  features: string[];
  is_active: boolean;
};

function PricingContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch {
      toast.error("Failed to fetch rates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditForm({ ...plan });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleUpdate = async () => {
    if (!editForm) return;
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
      toast.success("Rate updated successfully");
      setEditingId(null);
      fetchPlans();
    } catch {
      toast.error("Update failed");
    }
  };

  const toggleFeature = (feature: string) => {
    if (!editForm) return;
    const newFeatures = editForm.features.includes(feature)
      ? editForm.features.filter((f) => f !== feature)
      : [...editForm.features, feature];
    setEditForm({ ...editForm, features: newFeatures });
  };

  const addFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && editForm) {
      const val = e.currentTarget.value.trim();
      if (val && !editForm.features.includes(val)) {
        setEditForm({ ...editForm, features: [...editForm.features, val] });
        e.currentTarget.value = "";
      }
    }
  };

  return (
    <div className="p-4 sm:p-5 w-full space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Rate Catalog
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">
            Platform subscription tiers and feature flags
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 dark:border-slate-800 font-bold gap-2"
        >
          <Plus size={18} /> New Tier
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <Loader2 className="animate-spin h-8 w-8" />
          <p className="font-bold text-xs uppercase tracking-widest">
            Hydrating Catalog...
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
            >
              <CardHeader className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                      <Package size={20} />
                    </div>
                    <div>
                      <CardTitle className="font-bold text-lg">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="uppercase text-[10px] font-bold tracking-wider text-slate-400">
                        {plan.id} slug
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 gap-1.5 font-bold"
                        >
                          <Save size={16} /> Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                        className="rounded-lg border-slate-200 dark:border-slate-800 h-8 px-3 gap-1.5 font-bold"
                      >
                        <Edit2 size={14} /> Adjust
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
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
                          <p className="text-xl sm:text-2xl font-bold tabular-nums">
                            ₹{plan.price_monthly}
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
                          <p className="text-xl sm:text-2xl font-bold tabular-nums">
                            ₹{plan.price_yearly}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">
                        Tier Description
                      </Label>
                      {editingId === plan.id ? (
                        <textarea
                          value={editForm?.description}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, description: e.target.value } : null
                            )
                          }
                          className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm font-medium"
                        />
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={12} /> Feature Availability
                    </h3>
                    <div className="space-y-2">
                      {editingId === plan.id ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Add new feature... (Press Enter)"
                            onKeyDown={addFeature}
                            className="rounded-lg h-9 text-xs mb-3"
                          />
                          <div className="flex flex-wrap gap-2">
                            {editForm?.features.map((f, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="rounded-md py-1 pr-1 gap-1.5 font-bold uppercase text-[9px]"
                              >
                                {f}
                                <button
                                  onClick={() => toggleFeature(f)}
                                  className="hover:text-rose-500"
                                >
                                  <X size={10} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {plan.features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                              <CheckCircle2
                                size={14}
                                className="text-blue-500 shrink-0"
                              />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <AdminShell>
      <PricingContent />
    </AdminShell>
  );
}
