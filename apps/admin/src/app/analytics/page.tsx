"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  Smartphone,
  ShoppingCart,
  BookOpen,
  Users,
  AlertCircle,
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

type TenantActivity = {
  id: string;
  name: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  total_phones: number;
  phones_in_stock: number;
  phones_sold: number;
  ledger_entries: number;
  last_phone_added: string | null;
  last_ledger_entry: string | null;
};

type PlatformTotals = {
  tenants: number;
  users: number;
  phones: number;
  sold: number;
  ledger: number;
};

type UsageStats = {
  tenant_activity: TenantActivity[];
  platform_totals: PlatformTotals;
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800",
  pro: "bg-blue-100 text-blue-800",
  wholesaler: "bg-cyan-100 text-cyan-800",
  starter: "bg-green-100 text-green-800",
  trial: "bg-yellow-100 text-yellow-800",
  free: "bg-slate-100 text-slate-700",
  expired: "bg-red-100 text-red-700",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function isDormant(activity: TenantActivity): boolean {
  const last = activity.last_phone_added ?? activity.last_ledger_entry;
  if (!last) return true;
  const diffDays = (Date.now() - new Date(last).getTime()) / 86400000;
  return diffDays > 30;
}

type SortKey = "name" | "total_phones" | "phones_sold" | "user_count" | "ledger_entries";

function AnalyticsContent() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total_phones");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "dormant">("all");

  useEffect(() => {
    supabase.rpc("get_platform_usage_stats").then(({ data }) => {
      if (data) setStats(data as UsageStats);
      setIsLoading(false);
    });
  }, []);

  const rows = useMemo(() => {
    if (!stats) return [];
    return stats.tenant_activity
      .filter((t) => {
        if (filter === "active" && isDormant(t)) return false;
        if (filter === "dormant" && !isDormant(t)) return false;
        return t.name.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "string" && typeof bVal === "string")
          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortAsc
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
  }, [stats, search, sortKey, sortAsc, filter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortAsc
      ? <ChevronUp className="h-3 w-3 text-blue-500" />
      : <ChevronDown className="h-3 w-3 text-blue-500" />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const totals = stats?.platform_totals;
  const dormantCount = stats?.tenant_activity.filter(isDormant).length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usage Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Per-tenant activity and platform-wide metrics</p>
      </div>

      {/* Platform Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tenants", value: totals?.tenants, icon: <Users className="h-4 w-4 text-blue-500" /> },
          { label: "Users", value: totals?.users, icon: <Users className="h-4 w-4 text-indigo-500" /> },
          { label: "Phones Tracked", value: totals?.phones, icon: <Smartphone className="h-4 w-4 text-green-500" /> },
          { label: "Phones Sold", value: totals?.sold, icon: <ShoppingCart className="h-4 w-4 text-emerald-500" /> },
          { label: "Ledger Entries", value: totals?.ledger, icon: <BookOpen className="h-4 w-4 text-purple-500" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value?.toLocaleString("en-IN") ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dormant alert */}
      {dormantCount > 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span><strong>{dormantCount}</strong> tenant{dormantCount !== 1 ? "s" : ""} have had no activity in the last 30 days.</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "dormant"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-2 text-sm rounded-lg border capitalize font-medium transition-colors",
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Tenant <SortIcon k="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Plan</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("user_count")}>
                    Users <SortIcon k="user_count" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("total_phones")}>
                    Phones <SortIcon k="total_phones" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("phones_sold")}>
                    Sold <SortIcon k="phones_sold" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("ledger_entries")}>
                    Ledger <SortIcon k="ledger_entries" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Last Active</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full capitalize font-medium", PLAN_BADGE[t.plan] ?? PLAN_BADGE.free)}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{t.user_count}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{t.total_phones}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{t.phones_sold}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{t.ledger_entries}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {relativeTime(t.last_phone_added ?? t.last_ledger_entry)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!t.is_active ? (
                      <Badge variant="destructive" className="text-xs">Suspended</Badge>
                    ) : isDormant(t) ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Dormant</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">No tenants match your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AdminShell>
      <AnalyticsContent />
    </AdminShell>
  );
}
