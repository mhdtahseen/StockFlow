"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Database, Activity, RefreshCw, HardDrive } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import clsx from "clsx";

type TableStat = {
  table_name: string;
  live_rows: number;
  dead_rows: number;
  total_size: string;
};

type HealthData = {
  table_stats: TableStat[];
  db_size: string;
};

const TABLE_ICONS: Record<string, string> = {
  tenants: "🏢",
  profiles: "👤",
  phones: "📱",
  ledger: "📒",
  sale_orders: "🧾",
  purchase_orders: "📦",
  sale_order_items: "🔖",
  purchase_order_items: "🔖",
  wallets: "💰",
  wallet_transactions: "💳",
  audit_logs: "🛡️",
  feature_flags: "🚩",
  catalog_models_v2: "🗂️",
  tenant_requests: "📋",
};

function deadRatioColor(live: number, dead: number) {
  const ratio = live > 0 ? dead / live : 0;
  if (ratio > 0.5) return "text-red-500";
  if (ratio > 0.1) return "text-yellow-500";
  return "text-green-500";
}

function HealthContent() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchHealth() {
    setIsLoading(true);
    const { data } = await supabase.rpc("get_system_health");
    if (data) setHealth(data as HealthData);
    setLastRefresh(new Date());
    setIsLoading(false);
  }

  useEffect(() => { fetchHealth(); }, []);

  const totalLiveRows = (health?.table_stats ?? []).reduce((s, t) => s + t.live_rows, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-500" /> System Health
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database table sizes and row counts · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* DB Size KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Database Size</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{health?.db_size ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Live Rows</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalLiveRows.toLocaleString("en-IN")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Tables Monitored</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{(health?.table_stats ?? []).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Table Statistics</CardTitle>
          <CardDescription>Live rows, dead rows (vacuumable), and disk usage per table</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && !health ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Table</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Live Rows</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Dead Rows</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Size</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Fill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {(health?.table_stats ?? []).map((t) => {
                    const fillPct = totalLiveRows > 0 ? (t.live_rows / totalLiveRows) * 100 : 0;
                    return (
                      <tr key={t.table_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          <span className="mr-2">{TABLE_ICONS[t.table_name] ?? "📄"}</span>
                          {t.table_name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {t.live_rows.toLocaleString("en-IN")}
                        </td>
                        <td className={clsx("px-4 py-3 text-right font-mono", deadRatioColor(t.live_rows, t.dead_rows))}>
                          {t.dead_rows.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 text-xs">{t.total_size}</td>
                        <td className="px-4 py-3 w-36">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${Math.max(fillPct, 1)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{fillPct.toFixed(1)}% of total</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dead rows note */}
      <p className="text-xs text-slate-400 px-1">
        Dead rows are old row versions not yet reclaimed by PostgreSQL VACUUM. High dead row counts indicate heavy UPDATE/DELETE activity. Supabase runs auto-vacuum automatically.
      </p>
    </div>
  );
}

export default function HealthPage() {
  return (
    <AdminShell>
      <HealthContent />
    </AdminShell>
  );
}
