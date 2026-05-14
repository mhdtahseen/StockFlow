"use client";

import AdminShell from "@/components/AdminShell";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Smartphone, MapPin, Clock, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

type LifecycleEvent = {
  event_type: "PURCHASED" | "SOLD" | "REPAIR" | "TRANSFER";
  event_date: string;
  label: string | null;
  tenant_name: string | null;
};

type UnitInfo = {
  id: string;
  brand: string;
  model: string;
  storage: string | null;
  color: string | null;
  ram: string | null;
  imei1: string | null;
  imei2: string | null;
  created_at: string;
  current_tenant_name: string | null;
  current_tenant_plan: string | null;
  current_status: string | null;
};

type SearchResult = {
  unit: UnitInfo | null;
  lifecycle: LifecycleEvent[] | null;
};

const EVENT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PURCHASED: { color: "text-blue-700",  bg: "bg-blue-100",  label: "Purchased" },
  SOLD:      { color: "text-green-700", bg: "bg-green-100", label: "Sold" },
  REPAIR:    { color: "text-orange-700",bg: "bg-orange-100",label: "Repair" },
  TRANSFER:  { color: "text-purple-700",bg: "bg-purple-100",label: "Transfer" },
};

const STATUS_BADGE: Record<string, string> = {
  IN_STOCK: "bg-green-100 text-green-700",
  SOLD:     "bg-slate-100 text-slate-600",
  PENDING:  "bg-yellow-100 text-yellow-700",
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800",
  pro:        "bg-blue-100 text-blue-800",
  starter:    "bg-green-100 text-green-800",
  free:       "bg-slate-100 text-slate-600",
  trial:      "bg-yellow-100 text-yellow-700",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function ImeiLookupContent() {
  const [query, setQuery]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult]     = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 6) return;
    setIsLoading(true);
    setSearched(true);
    const { data } = await supabase.rpc("search_imei", { p_query: q });
    setResult((data as SearchResult) ?? { unit: null, lifecycle: null });
    setIsLoading(false);
  }

  const unit = result?.unit ?? null;
  const lifecycle = result?.lifecycle ?? [];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-blue-500" /> IMEI Lookup
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search any IMEI to find its current location, owner, and full lifecycle history across all tenants.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter IMEI (min 6 digits)…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || query.trim().length < 6}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {/* No result */}
      {searched && !isLoading && !unit && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <AlertCircle className="h-8 w-8 text-slate-300" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No device found</p>
            <p className="text-sm text-slate-400">
              IMEI <span className="font-mono">{query}</span> is not registered in the unit registry.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unit card */}
      {unit && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  {unit.brand} {unit.model}
                </CardTitle>
                <CardDescription>
                  {[unit.ram, unit.storage, unit.color].filter(Boolean).join(" · ")}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {unit.current_status && (
                  <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[unit.current_status] ?? "bg-slate-100 text-slate-600")}>
                    {unit.current_status}
                  </span>
                )}
                {unit.current_tenant_plan && (
                  <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", PLAN_BADGE[unit.current_tenant_plan] ?? "bg-slate-100 text-slate-600")}>
                    {unit.current_tenant_plan}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">IMEI 1</p>
                <p className="font-mono text-slate-800 dark:text-slate-200">{unit.imei1 ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">IMEI 2</p>
                <p className="font-mono text-slate-800 dark:text-slate-200">{unit.imei2 ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">First Seen</p>
                <p className="text-slate-800 dark:text-slate-200">{fmt(unit.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Current Tenant
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {unit.current_tenant_name ?? "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifecycle timeline */}
      {unit && lifecycle.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" /> Lifecycle History
            </CardTitle>
            <CardDescription>{lifecycle.length} event{lifecycle.length !== 1 ? "s" : ""} recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              {lifecycle.map((ev, i) => {
                const cfg = EVENT_CONFIG[ev.event_type] ?? { color: "text-slate-600", bg: "bg-slate-100", label: ev.event_type };
                return (
                  <li key={i} className="ml-4">
                    <span className={clsx("absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900", cfg.bg)} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                      {ev.tenant_name && (
                        <span className="text-sm text-slate-700 dark:text-slate-300">{ev.tenant_name}</span>
                      )}
                      {ev.label && ev.label !== "Authorized Partner" && (
                        <span className="text-xs text-slate-400">{ev.label}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{fmt(ev.event_date)}</p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {unit && lifecycle.length === 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-8 text-center text-sm text-slate-400">
            No lifecycle events recorded for this device yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ImeiLookupPage() {
  return (
    <AdminShell>
      <ImeiLookupContent />
    </AdminShell>
  );
}
