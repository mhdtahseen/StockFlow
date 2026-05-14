"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, RefreshCw, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import clsx from "clsx";

type AuditLog = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  "tenant.approved":    "bg-green-100 text-green-700",
  "tenant.rejected":    "bg-red-100 text-red-700",
  "tenant.suspended":   "bg-orange-100 text-orange-700",
  "tenant.unsuspended": "bg-blue-100 text-blue-700",
  "tenant.deleted":     "bg-red-200 text-red-800",
  "user.deleted":       "bg-red-100 text-red-700",
  "user.role_changed":  "bg-purple-100 text-purple-700",
  "plan.changed":       "bg-indigo-100 text-indigo-700",
  "flag.toggled":       "bg-cyan-100 text-cyan-700",
  "announcement.sent":  "bg-blue-100 text-blue-700",
};

function actionLabel(action: string) {
  return action.replace(/\./g, " › ").replace(/_/g, " ");
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PAGE_SIZE = 50;

function AuditContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = useCallback(async (pageNum = 0, reset = false) => {
    setIsLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("id, actor_email, action, target_type, target_name, metadata, created_at")
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (actionFilter) query = query.ilike("action", `%${actionFilter}%`);
    if (search) query = query.or(`actor_email.ilike.%${search}%,target_name.ilike.%${search}%`);

    const { data } = await query;
    const rows = (data ?? []) as AuditLog[];

    if (reset) setLogs(rows);
    else setLogs((prev) => [...prev, ...rows]);

    setHasMore(rows.length === PAGE_SIZE);
    setPage(pageNum);
    setIsLoading(false);
  }, [search, actionFilter]);

  useEffect(() => {
    fetchLogs(0, true);
  }, [fetchLogs]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action.split(".")[0]))).sort();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" /> Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">All super-admin actions across the platform</p>
        </div>
        <button
          onClick={() => fetchLogs(0, true)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && logs.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No audit logs yet</p>
              <p className="text-sm mt-1">Actions performed in the admin panel will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="shrink-0 pt-0.5">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                        ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"
                      )}
                    >
                      {actionLabel(log.action)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {log.target_name && (
                        <span className="font-medium text-slate-900 dark:text-white">{log.target_name}</span>
                      )}
                      {log.target_type && log.target_name && " · "}
                      {log.target_type && (
                        <span className="text-slate-400 text-xs">{log.target_type}</span>
                      )}
                    </p>
                    {Object.keys(log.metadata ?? {}).length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      by <span className="text-slate-500">{log.actor_email ?? "system"}</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {relativeTime(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <AdminShell>
      <AuditContent />
    </AdminShell>
  );
}
