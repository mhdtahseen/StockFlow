"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Package,
  Calendar,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import clsx from "clsx";

type OverdueOrder = {
  id: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  outstanding: number;
  due_date: string;
  created_at: string;
  days_overdue: number;
  tenant_name: string;
  tenant_plan: string;
  counterparty_name: string;
  counterparty_phone: string | null;
};

type OverdueSummary = {
  total_overdue_sales: number;
  total_overdue_purchases: number;
  total_ar_overdue: number;
  total_ap_overdue: number;
};

type OverdueData = {
  overdue_sales: OverdueOrder[];
  overdue_purchases: OverdueOrder[];
  summary: OverdueSummary;
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800",
  pro:        "bg-blue-100 text-blue-800",
  starter:    "bg-green-100 text-green-800",
  free:       "bg-slate-100 text-slate-600",
  trial:      "bg-yellow-100 text-yellow-700",
  expired:    "bg-red-100 text-red-700",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN:             "bg-orange-100 text-orange-700",
  PARTIAL:          "bg-yellow-100 text-yellow-700",
  AWAITING_RECEIPT: "bg-blue-100 text-blue-700",
  RECEIVED:         "bg-teal-100 text-teal-700",
};

function urgencyColor(days: number) {
  if (days >= 30) return "text-red-600 font-bold";
  if (days >= 14) return "text-orange-600 font-semibold";
  return "text-yellow-600";
}

function formatCurrency(v: number) {
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function OverdueTable({
  orders,
  emptyLabel,
}: {
  orders: OverdueOrder[];
  emptyLabel: string;
}) {
  if (orders.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">{emptyLabel}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Counterparty</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Overdue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td className="py-2.5 px-3">
                <p className="font-medium text-slate-800 dark:text-slate-200">{o.tenant_name}</p>
                <span className={clsx("text-xs font-medium px-1.5 py-0.5 rounded-full", PLAN_BADGE[o.tenant_plan] ?? "bg-slate-100 text-slate-600")}>
                  {o.tenant_plan}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <p className="text-slate-700 dark:text-slate-300">{o.counterparty_name}</p>
                {o.counterparty_phone && (
                  <p className="text-xs text-slate-400 flex items-center gap-0.5 mt-0.5">
                    <Phone className="h-3 w-3" /> {o.counterparty_phone}
                  </p>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(o.outstanding)}
                <p className="text-xs text-slate-400 font-normal">of {formatCurrency(o.total_amount)}</p>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[o.status] ?? "bg-slate-100 text-slate-600")}>
                  {o.status}
                </span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" /> {fmt(o.due_date)}
                </span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={clsx("text-sm", urgencyColor(o.days_overdue))}>
                  {o.days_overdue}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverdueContent() {
  const [data, setData]         = useState<OverdueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab]           = useState<"sales" | "purchases">("sales");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function fetchData() {
    setIsLoading(true);
    const { data: result } = await supabase.rpc("get_overdue_orders");
    if (result) setData(result as OverdueData);
    setLastRefresh(new Date());
    setIsLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const summary = data?.summary;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" /> Overdue Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sale and purchase orders past their due date across all tenants · {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Overdue Sales</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total_overdue_sales}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Overdue Purchases</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total_overdue_purchases}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">AR Overdue</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {summary.total_ar_overdue >= 100000
                        ? `₹${(summary.total_ar_overdue / 100000).toFixed(1)}L`
                        : `₹${summary.total_ar_overdue.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">AP Overdue</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {summary.total_ap_overdue >= 100000
                        ? `₹${(summary.total_ap_overdue / 100000).toFixed(1)}L`
                        : `₹${summary.total_ap_overdue.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab switcher */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800">
                {(["sales", "purchases"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={clsx(
                      "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                      tab === t
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {t === "sales" ? (
                      <span className="flex items-center gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5" /> Sales
                        {data && (
                          <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-1.5">
                            {data.overdue_sales.length}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Purchases
                        {data && (
                          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">
                            {data.overdue_purchases.length}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              {tab === "sales" ? (
                <OverdueTable
                  orders={data?.overdue_sales ?? []}
                  emptyLabel="No overdue sale orders — all caught up!"
                />
              ) : (
                <OverdueTable
                  orders={data?.overdue_purchases ?? []}
                  emptyLabel="No overdue purchase orders — all caught up!"
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function OverduePage() {
  return (
    <AdminShell>
      <OverdueContent />
    </AdminShell>
  );
}
