"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Boxes,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import clsx from "clsx";

type PaymentMode = { payment_mode: string; count: number; volume: number };
type TenantGMV   = { name: string; plan: string; gmv: number; order_count: number };
type MonthlyGMV  = { month: string; gmv: number; orders: number };

type FinancialStats = {
  gmv:                   number;
  total_ar:              number;
  total_ap:              number;
  total_sales:           number;
  total_purchases:       number;
  settled_sales:         number;
  total_inventory_value: number;
  payment_modes:         PaymentMode[];
  top_tenants_by_gmv:    TenantGMV[];
  monthly_gmv:           MonthlyGMV[];
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800",
  pro:        "bg-blue-100 text-blue-800",
  wholesaler: "bg-cyan-100 text-cyan-800",
  starter:    "bg-green-100 text-green-800",
  trial:      "bg-yellow-100 text-yellow-700",
  free:       "bg-slate-100 text-slate-600",
};

const MODE_COLOR: Record<string, string> = {
  CASH:          "bg-green-100 text-green-700",
  UPI:           "bg-blue-100 text-blue-700",
  BANK_TRANSFER: "bg-purple-100 text-purple-700",
  CREDIT:        "bg-orange-100 text-orange-700",
};

function formatCurrency(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)   return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialsContent() {
  const [stats, setStats]       = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function fetchStats() {
    setIsLoading(true);
    const { data } = await supabase.rpc("get_platform_financial_stats");
    if (data) setStats(data as FinancialStats);
    setLastRefresh(new Date());
    setIsLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  const maxGmv = Math.max(...(stats?.monthly_gmv ?? []).map((m) => m.gmv), 1);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" /> Platform Financials
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregate GMV, receivables, payables and inventory across all tenants ·{" "}
            {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {isLoading && !stats ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              label="Total GMV"
              value={formatCurrency(stats.gmv)}
              sub={`${stats.total_sales.toLocaleString()} orders`}
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
              iconBg="bg-orange-100 dark:bg-orange-900/30"
              label="Accounts Receivable"
              value={formatCurrency(stats.total_ar)}
              sub="Outstanding from customers"
            />
            <KpiCard
              icon={<Package className="h-5 w-5 text-red-500" />}
              iconBg="bg-red-100 dark:bg-red-900/30"
              label="Accounts Payable"
              value={formatCurrency(stats.total_ap)}
              sub="Outstanding to suppliers"
            />
            <KpiCard
              icon={<Boxes className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              label="Live Inventory Value"
              value={formatCurrency(stats.total_inventory_value)}
              sub="At purchase price (IN_STOCK)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KpiCard
              icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-100 dark:bg-green-900/30"
              label="Sales Settled"
              value={`${stats.settled_sales} / ${stats.total_sales}`}
              sub={`${stats.total_sales > 0 ? Math.round((stats.settled_sales / stats.total_sales) * 100) : 0}% settlement rate`}
            />
            <KpiCard
              icon={<Package className="h-5 w-5 text-purple-600" />}
              iconBg="bg-purple-100 dark:bg-purple-900/30"
              label="Purchase Orders"
              value={stats.total_purchases.toLocaleString()}
              sub="Total purchase orders created"
            />
          </div>

          {/* Monthly GMV Bar Chart */}
          {stats.monthly_gmv.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly GMV (Last 6 Months)</CardTitle>
                <CardDescription>Sale order value by month across all tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-40">
                  {stats.monthly_gmv.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-slate-500 font-medium">{formatCurrency(m.gmv)}</p>
                      <div
                        className="w-full rounded-t-md bg-emerald-500 dark:bg-emerald-600 min-h-[4px] transition-all"
                        style={{ height: `${Math.max((m.gmv / maxGmv) * 120, 4)}px` }}
                        title={`${m.orders} orders`}
                      />
                      <p className="text-xs text-slate-400">{m.month}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Modes + Top Tenants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Mode Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Mode Distribution</CardTitle>
                <CardDescription>How customers are paying across sale orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(stats.payment_modes ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No payment data</p>
                ) : (
                  stats.payment_modes.map((m, i) => {
                    const maxVol = Math.max(...stats.payment_modes.map((x) => x.volume), 1);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", MODE_COLOR[m.payment_mode] ?? "bg-slate-100 text-slate-600")}>
                            {m.payment_mode}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{formatCurrency(m.volume)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(m.volume / maxVol) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">{m.count} orders</p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Top Tenants by GMV */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Tenants by GMV</CardTitle>
                <CardDescription>Highest revenue-generating tenants</CardDescription>
              </CardHeader>
              <CardContent>
                {(stats.top_tenants_by_gmv ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
                ) : (
                  <ol className="space-y-2">
                    {stats.top_tenants_by_gmv.map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-slate-400 w-4 font-mono">{i + 1}.</span>
                        <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium truncate">{t.name}</span>
                        <span className={clsx("text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0", PLAN_BADGE[t.plan] ?? "bg-slate-100 text-slate-600")}>
                          {t.plan}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                          {formatCurrency(t.gmv)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function FinancialsPage() {
  return (
    <AdminShell>
      <FinancialsContent />
    </AdminShell>
  );
}
