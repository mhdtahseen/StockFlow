"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Link2,
  RefreshCw,
  Trash2,
  Search,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import clsx from "clsx";

type ShareRow = {
  token: string;
  order_id: string;
  order_type: "SALE" | "PURCHASE";
  tenant_id: string;
  expires_at: string;
  created_at: string;
  tenants: { name: string; plan: string } | null;
};

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

function relTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  return `${days}d left`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-800",
  pro:        "bg-blue-100 text-blue-800",
  starter:    "bg-green-100 text-green-800",
  free:       "bg-slate-100 text-slate-600",
  trial:      "bg-yellow-100 text-yellow-700",
};

function ShareLinksContent() {
  const [shares, setShares]     = useState<ShareRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "active" | "expired">("all");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function fetchShares() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("public_shares")
      .select("*, tenants(name, plan)")
      .order("created_at", { ascending: false });
    if (!error && data) setShares(data as ShareRow[]);
    setLastRefresh(new Date());
    setIsLoading(false);
  }

  useEffect(() => { fetchShares(); }, []);

  async function revokeShare(token: string) {
    setRevoking(token);
    const { error } = await supabase.from("public_shares").delete().eq("token", token);
    if (error) {
      toast.error("Failed to revoke share link");
    } else {
      toast.success("Share link revoked");
      setShares((prev) => prev.filter((s) => s.token !== token));
    }
    setRevoking(null);
    setConfirmToken(null);
  }

  const filtered = useMemo(() => {
    return shares
      .filter((s) => {
        if (filter === "active"  && isExpired(s.expires_at)) return false;
        if (filter === "expired" && !isExpired(s.expires_at)) return false;
        const tenant = s.tenants?.name ?? "";
        return tenant.toLowerCase().includes(search.toLowerCase());
      });
  }, [shares, filter, search]);

  const active  = shares.filter((s) => !isExpired(s.expires_at)).length;
  const expired = shares.filter((s) =>  isExpired(s.expires_at)).length;

  const confirmShare = confirmToken ? shares.find((s) => s.token === confirmToken) : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Link2 className="h-6 w-6 text-sky-500" /> Share Links
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All public invoice and PO share links across all tenants · {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchShares}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Links</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{shares.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Expired</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{expired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by tenant…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(["all", "active", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-2 text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && shares.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No share links found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Order ID</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                    <th className="py-2.5 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filtered.map((s) => {
                    const expired = isExpired(s.expires_at);
                    return (
                      <tr key={s.token} className={clsx("hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors", expired && "opacity-60")}>
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {s.tenants?.name ?? "Unknown"}
                          </p>
                          {s.tenants?.plan && (
                            <span className={clsx("text-xs font-medium px-1.5 py-0.5 rounded-full", PLAN_BADGE[s.tenants.plan] ?? "bg-slate-100 text-slate-600")}>
                              {s.tenants.plan}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {s.order_type === "SALE" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <ShoppingCart className="h-3 w-3" /> Sale
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <Package className="h-3 w-3" /> Purchase
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 hidden md:table-cell">
                          <span className="font-mono text-xs text-slate-400 truncate block max-w-[120px]" title={s.order_id}>
                            {s.order_id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={clsx("text-xs flex items-center justify-center gap-0.5", expired ? "text-slate-400" : "text-emerald-600 font-medium")}>
                            <Clock className="h-3 w-3" />
                            {relTime(s.expires_at)}
                          </span>
                          <p className="text-xs text-slate-400">{fmtDate(s.expires_at)}</p>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {expired ? (
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">Expired</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center text-xs text-slate-400">
                          {fmtDate(s.created_at)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setConfirmToken(s.token)}
                            disabled={revoking === s.token}
                            className="text-red-500 hover:text-red-700 disabled:opacity-40 p-1 rounded transition-colors"
                            title="Revoke link"
                          >
                            {revoking === s.token
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
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

      {/* Revoke confirm dialog */}
      <Dialog open={!!confirmToken} onOpenChange={() => setConfirmToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Share Link?</DialogTitle>
            <DialogDescription>
              This will immediately invalidate the public link for the{" "}
              <strong>{confirmShare?.order_type}</strong> order from{" "}
              <strong>{confirmShare?.tenants?.name ?? "this tenant"}</strong>.
              Anyone with the link will get an error. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmToken(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!!revoking}
              onClick={() => confirmToken && revokeShare(confirmToken)}
            >
              {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Revoke Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ShareLinksPage() {
  return (
    <AdminShell>
      <ShareLinksContent />
    </AdminShell>
  );
}
