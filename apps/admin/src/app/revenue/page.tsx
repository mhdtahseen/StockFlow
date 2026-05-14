"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

type PlanDist = { plan: string; count: number };
type SignupMonth = { month: string; count: number };
type ExpiringTenant = {
  id: string;
  name: string;
  plan: string;
  plan_expires_at: string;
};
type RevenueStats = {
  plan_distribution: PlanDist[];
  total_active_tenants: number;
  total_suspended_tenants: number;
  signups_by_month: SignupMonth[];
  expiring_soon: ExpiringTenant[] | null;
};

type SubscriptionPlan = {
  name: string;
  price_monthly: number;
};

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-purple-500",
  pro: "bg-blue-500",
  wholesaler: "bg-cyan-500",
  starter: "bg-green-500",
  trial: "bg-yellow-500",
  free: "bg-slate-400",
  expired: "bg-red-400",
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  wholesaler: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  starter: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  free: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function kpiClass(color: string) {
  return `h-10 w-10 rounded-lg flex items-center justify-center ${color}`;
}

function StatCard({
  title,
  value,
  sub,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={kpiClass(iconBg)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueContent() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: statsData }, { data: plansData }] = await Promise.all([
        supabase.rpc("get_platform_revenue_stats"),
        supabase.from("subscription_plans").select("name, price_monthly"),
      ]);
      if (statsData) setStats(statsData as RevenueStats);
      if (plansData) setPlans(plansData as SubscriptionPlan[]);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) return null;

  // Compute MRR from plan distribution × plan prices
  const priceMap: Record<string, number> = {};
  plans.forEach((p) => { priceMap[p.name.toLowerCase()] = p.price_monthly; });
  const mrr = (stats.plan_distribution ?? []).reduce((sum, pd) => {
    return sum + (priceMap[pd.plan] ?? 0) * pd.count;
  }, 0);

  const totalDist = (stats.plan_distribution ?? []).reduce((s, p) => s + p.count, 0);
  const maxMonthCount = Math.max(...(stats.signups_by_month ?? []).map((m) => m.count), 1);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revenue Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform subscription and growth metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estimated MRR"
          value={`₹${mrr.toLocaleString("en-IN")}`}
          sub="Based on active plan prices"
          icon={<DollarSign className="h-5 w-5 text-white" />}
          iconBg="bg-green-500"
        />
        <StatCard
          title="Active Tenants"
          value={stats.total_active_tenants}
          icon={<Users className="h-5 w-5 text-white" />}
          iconBg="bg-blue-500"
        />
        <StatCard
          title="Suspended"
          value={stats.total_suspended_tenants}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          iconBg="bg-orange-500"
        />
        <StatCard
          title="Expiring (14d)"
          value={(stats.expiring_soon ?? []).length}
          sub="Plans expiring within 2 weeks"
          icon={<Calendar className="h-5 w-5 text-white" />}
          iconBg="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
            <CardDescription>Active tenants by subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.plan_distribution ?? []).map((pd) => (
              <div key={pd.plan} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{pd.plan}</span>
                  <span className="text-slate-500">
                    {pd.count} tenant{pd.count !== 1 ? "s" : ""} ·{" "}
                    {totalDist > 0 ? Math.round((pd.count / totalDist) * 100) : 0}%
                    {priceMap[pd.plan] ? ` · ₹${(priceMap[pd.plan] * pd.count).toLocaleString("en-IN")}/mo` : ""}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className={clsx("h-2 rounded-full transition-all", PLAN_COLORS[pd.plan] ?? "bg-slate-400")}
                    style={{ width: `${totalDist > 0 ? (pd.count / totalDist) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Signups by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Signups (Last 12 Months)
            </CardTitle>
            <CardDescription>New tenant registrations per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-40">
              {(stats.signups_by_month ?? []).map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-medium">{m.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${Math.max((m.count / maxMonthCount) * 120, 4)}px` }}
                  />
                  <span
                    className="text-[9px] text-slate-400 writing-vertical"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "9px" }}
                  >
                    {m.month}
                  </span>
                </div>
              ))}
              {(stats.signups_by_month ?? []).length === 0 && (
                <p className="text-sm text-slate-400 w-full text-center">No signup data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Plans */}
      {(stats.expiring_soon ?? []).length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-base text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Plans Expiring Soon
            </CardTitle>
            <CardDescription>These tenants need renewal within 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(stats.expiring_soon ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-400">
                      Expires {new Date(t.plan_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium capitalize", PLAN_BADGE[t.plan] ?? PLAN_BADGE.free)}>
                    {t.plan}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RevenuePage() {
  return (
    <AdminShell>
      <RevenueContent />
    </AdminShell>
  );
}
