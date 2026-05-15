"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  Crown,
  Shield,
  User,
  PauseCircle,
  PlayCircle,
  Search,
  X,
  Smartphone,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  CalendarClock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  PLAN_SEAT_LIMITS,
  PLAN_DEVICE_LIMITS,
  type PlanTier,
  type FeatureKey,
} from "@/lib/gateKeys";

type Tenant = {
  id: string;
  name: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  plan_expires_at?: string | null;
  suspended_until?: string | null;
  profiles?: Profile[];
  phoneCount?: number;
};

type PlatformStats = {
  totalTenants: number;
  totalProfiles: number;
  totalDevices: number;
  activeCount: number;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "super-admin" | "admin" | "manager" | "associate";
  tenant_id: string;
};

type FeatureFlag = {
  flag_key: string;
  enabled_globally: boolean;
  tenant_overrides: Record<string, boolean>;
};

const PLAN_OPTIONS = ["trial", "starter", "pro", "enterprise", "expired"] as const;
const ROLE_OPTIONS = ["admin", "manager", "associate"] as const;
const PAGE_SIZE = 20;

function planTier(plan: string): PlanTier | "trial" | "expired" {
  if (plan === "trial") return "trial";
  if (plan === "expired") return "expired";
  if (plan === "starter" || plan === "pro" || plan === "enterprise") return plan;
  return "expired";
}

function QuotaBar({
  used,
  limit,
  label,
  icon,
}: {
  used: number;
  limit: number | undefined;
  label: string;
  icon: React.ReactNode;
}) {
  if (limit === 0) {
    return (
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-400">{label}: —</span>
      </div>
    );
  }

  const pct = limit === undefined ? 0 : Math.min((used / limit) * 100, 100);
  const color =
    limit === undefined
      ? "bg-blue-500"
      : pct >= 90
      ? "bg-rose-500"
      : pct >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";
  const textColor =
    limit === undefined
      ? "text-slate-600 dark:text-slate-400"
      : pct >= 90
      ? "text-rose-600 dark:text-rose-400"
      : pct >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {label}
          </span>
          <span className={clsx("text-[10px] font-black tabular-nums", textColor)}>
            {used}
            {limit !== undefined ? ` / ${limit}` : " / ∞"}
          </span>
        </div>
        {limit !== undefined && (
          <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
            <div
              className={clsx("h-full rounded-full transition-all", color)}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureAccessPanel({
  tenant,
  featureFlags,
}: {
  tenant: Tenant;
  featureFlags: FeatureFlag[];
}) {
  const tier = planTier(tenant.plan);
  const planKeys: FeatureKey[] =
    tier === "starter" || tier === "pro" || tier === "enterprise"
      ? DEFAULT_PLAN_KEYS[tier]
      : [];

  return (
    <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {GATE_KEYS.map((gate) => {
        const isPlanGranted = planKeys.includes(gate.key);
        const flag = featureFlags.find((f) => f.flag_key === gate.key);
        const isGloballyKilled = flag ? !flag.enabled_globally : false;
        const tenantOverride =
          flag?.tenant_overrides?.[tenant.id];
        const isOverrideEnabled = tenantOverride === true;
        const isOverrideDisabled = tenantOverride === false;

        let status: "on" | "off" | "override-on" | "override-off" | "killed";
        if (isGloballyKilled) status = "killed";
        else if (isOverrideEnabled) status = "override-on";
        else if (isOverrideDisabled) status = "override-off";
        else if (isPlanGranted) status = "on";
        else status = "off";

        const iconMap = {
          on: <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />,
          "override-on": <CheckCircle2 size={12} className="text-blue-500 shrink-0" />,
          off: <MinusCircle size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />,
          "override-off": <XCircle size={12} className="text-amber-500 shrink-0" />,
          killed: <XCircle size={12} className="text-rose-500 shrink-0" />,
        };

        const labelMap = {
          on: "text-slate-700 dark:text-slate-300",
          "override-on": "text-blue-700 dark:text-blue-300",
          off: "text-slate-400 dark:text-slate-600",
          "override-off": "text-amber-700 dark:text-amber-400",
          killed: "text-rose-500 line-through",
        };

        return (
          <Tooltip key={gate.key}>
            <TooltipTrigger asChild>
              <div
                className={clsx(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-default",
                  status === "on" || status === "override-on"
                    ? "bg-slate-50 dark:bg-slate-800/60"
                    : "bg-transparent"
                )}
              >
                {iconMap[status]}
                <span className={clsx("truncate", labelMap[status])}>
                  {gate.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-56">
              <p className="font-bold mb-0.5">{gate.key}</p>
              <p className="text-slate-400">
                {status === "on" && "Plan-granted"}
                {status === "override-on" && "Enabled via tenant override"}
                {status === "override-off" && "Disabled via tenant override"}
                {status === "off" && "Not included in plan"}
                {status === "killed" && "Killed globally via Feature Flags"}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <div className="col-span-full text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-3 pt-2 flex-wrap">
        <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Plan granted</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-blue-500" /> Override: on</span>
        <span className="flex items-center gap-1"><XCircle size={10} className="text-amber-500" /> Override: off</span>
        <span className="flex items-center gap-1"><XCircle size={10} className="text-rose-500" /> Killed globally</span>
      </div>
    </div>
  );
}

function SupervisionContent() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"tenant" | "user">("tenant");
  const [targetName, setTargetName] = useState("");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [suspensionId, setSuspensionId] = useState<string | null>(null);
  const [extendTrialId, setExtendTrialId] = useState<string | null>(null);

  // Search / filter
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: tenantsData, error: tenantsError },
        { data: profilesData, error: profilesError },
        { data: phoneRows },
        { data: flagsData },
      ] = await Promise.all([
        supabase.from("tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("phones").select("tenant_id"),
        supabase.from("feature_flags").select("flag_key, enabled_globally, tenant_overrides"),
      ]);

      if (tenantsError) throw tenantsError;
      if (profilesError) throw profilesError;

      // Build phone count map per tenant
      const phoneCountMap: Record<string, number> = {};
      (phoneRows ?? []).forEach((row: { tenant_id: string }) => {
        phoneCountMap[row.tenant_id] = (phoneCountMap[row.tenant_id] ?? 0) + 1;
      });

      const grouped = (tenantsData as Tenant[]).map((t) => ({
        ...t,
        profiles: (profilesData as Profile[]).filter((p) => p.tenant_id === t.id),
        phoneCount: phoneCountMap[t.id] ?? 0,
      }));

      const totalDevices = Object.values(phoneCountMap).reduce((a, b) => a + b, 0);

      setStats({
        totalTenants: tenantsData.length,
        totalProfiles: profilesData.length,
        totalDevices,
        activeCount: tenantsData.filter((t) => t.is_active).length,
      });

      setTenants(grouped);
      setFeatureFlags((flagsData ?? []) as FeatureFlag[]);
    } catch (err: unknown) {
      toast.error("Failed to fetch data", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered + searched tenants
  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === "all" || t.plan === filterPlan;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && t.is_active) ||
        (filterStatus === "paused" && !t.is_active && !t.suspended_until) ||
        (filterStatus === "suspended" && !t.is_active && !!t.suspended_until);
      return matchSearch && matchPlan && matchStatus;
    });
  }, [tenants, search, filterPlan, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 whenever filters change
  useEffect(() => {
    setPage(0);
  }, [search, filterPlan, filterStatus]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTenants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTenants(next);
  };

  const toggleFeatures = (id: string) => {
    const next = new Set(expandedFeatures);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFeatures(next);
  };

  const handleUpdatePlan = async (tenantId: string, plan: string) => {
    setIsProcessing(`plan-${tenantId}`);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ plan })
        .eq("id", tenantId);
      if (error) throw error;
      toast.success("Plan updated");
      fetchData();
    } catch (err: unknown) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    setIsProcessing(`status-${tenantId}`);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: !currentStatus })
        .eq("id", tenantId);
      if (error) throw error;
      toast.success(currentStatus ? "Tenant paused" : "Tenant resumed");
      fetchData();
    } catch (err: unknown) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setIsProcessing(`role-${userId}`);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Role updated");
      fetchData();
    } catch (err: unknown) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const confirmDelete = (id: string, name: string, type: "tenant" | "user") => {
    setDeleteId(id);
    setTargetName(name);
    setDeleteType(type);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const isTenant = deleteType === "tenant";
    setIsProcessing(`delete-${deleteId}`);
    try {
      const { error } = await supabase
        .from(isTenant ? "tenants" : "profiles")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success(`${isTenant ? "Tenant" : "User"} removed`);
      fetchData();
    } catch (err: unknown) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsProcessing(null);
      setDeleteId(null);
    }
  };

  const handleExtendTrial = async (months: number) => {
    if (!extendTrialId) return;
    setIsProcessing(`extend-${extendTrialId}`);
    try {
      // Extend from current expiry (if future) or from now
      const tenant = tenants.find((t) => t.id === extendTrialId);
      const base =
        tenant?.plan_expires_at && new Date(tenant.plan_expires_at) > new Date()
          ? new Date(tenant.plan_expires_at)
          : new Date();
      const newExpiry = new Date(base);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      const { error } = await supabase
        .from("tenants")
        .update({ plan: "trial", plan_expires_at: newExpiry.toISOString() })
        .eq("id", extendTrialId);
      if (error) throw error;
      toast.success("Trial extended", {
        description: `Expires ${newExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
      });
      setExtendTrialId(null);
      fetchData();
    } catch (err: unknown) {
      toast.error("Failed to extend trial", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSuspend = async (duration: string) => {
    if (!suspensionId) return;
    setIsProcessing(`suspend-${suspensionId}`);
    const resumeAt = new Date();
    if (duration === "1h") resumeAt.setHours(resumeAt.getHours() + 1);
    else if (duration === "8h") resumeAt.setHours(resumeAt.getHours() + 8);
    else if (duration === "24h") resumeAt.setHours(resumeAt.getHours() + 24);
    else if (duration === "1w") resumeAt.setDate(resumeAt.getDate() + 7);
    else if (duration === "forever") resumeAt.setFullYear(resumeAt.getFullYear() + 100);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: false, suspended_until: resumeAt.toISOString() })
        .eq("id", suspensionId);
      if (error) throw error;
      toast.success("Tenant suspended", {
        description: `Locked until ${resumeAt.toLocaleString()}`,
      });
      setSuspensionId(null);
      fetchData();
    } catch {
      toast.error("Suspension failed");
    } finally {
      setIsProcessing(null);
    }
  };

  const planCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    tenants.forEach((t) => {
      map[t.plan] = (map[t.plan] ?? 0) + 1;
    });
    return map;
  }, [tenants]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="p-4 sm:p-5 w-full space-y-5 pb-32">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tenant Supervision
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">
              Platform control and lifecycle orchestration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/pricing")}
              className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs h-9"
            >
              Rate Plans
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="rounded-xl border-slate-200 dark:border-slate-800 gap-2 h-9"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Sync
            </Button>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Tenants",
                value: stats.totalTenants,
                sub: `${stats.activeCount} active`,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-50 dark:bg-blue-950/30",
                border: "border-blue-100 dark:border-blue-900/50",
                icon: <Building2 size={16} className="text-blue-500" />,
              },
              {
                label: "Team Members",
                value: stats.totalProfiles,
                sub: "across all tenants",
                color: "text-slate-800 dark:text-slate-100",
                bg: "bg-white dark:bg-slate-900",
                border: "border-slate-100 dark:border-slate-800",
                icon: <Users size={16} className="text-slate-400" />,
              },
              {
                label: "Devices Tracked",
                value: stats.totalDevices,
                sub: "total inventory",
                color: "text-slate-800 dark:text-slate-100",
                bg: "bg-white dark:bg-slate-900",
                border: "border-slate-100 dark:border-slate-800",
                icon: <Smartphone size={16} className="text-slate-400" />,
              },
              {
                label: "System Pulse",
                value: "99.8%",
                sub: "uptime",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
                border: "border-emerald-100 dark:border-emerald-800/30",
                icon: <CheckCircle2 size={16} className="text-emerald-500" />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className={clsx(
                  "p-4 rounded-xl border shadow-sm flex items-start gap-3",
                  s.bg,
                  s.border
                )}
              >
                <div className="mt-0.5">{s.icon}</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {s.label}
                  </p>
                  <p className={clsx("text-xl font-bold mt-0.5 tracking-tight", s.color)}>
                    {s.value}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + Filter bar ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 py-2 -mx-5 px-5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-xl text-sm border-slate-200 dark:border-slate-800"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearch("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Plan filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 min-w-[110px]"
              >
                {filterPlan === "all" ? "All Plans" : filterPlan.charAt(0).toUpperCase() + filterPlan.slice(1)}
                {filterPlan !== "all" && (
                  <Badge className="ml-auto text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full px-1.5">
                    {planCountMap[filterPlan] ?? 0}
                  </Badge>
                )}
                <ChevronDown size={12} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
              <DropdownMenuItem
                onClick={() => setFilterPlan("all")}
                className="rounded-lg font-bold text-xs"
              >
                All Plans
              </DropdownMenuItem>
              {PLAN_OPTIONS.map((p) => {
                const tc = TIER_COLORS[planTier(p)];
                return (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => setFilterPlan(p)}
                    className="rounded-lg font-bold text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={clsx("size-2 rounded-full", tc.dot)} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </div>
                    <span className="text-slate-400 font-medium">
                      {planCountMap[p] ?? 0}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 min-w-[110px]"
              >
                {filterStatus === "all"
                  ? "All Status"
                  : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                <ChevronDown size={12} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
              {["all", "active", "paused", "suspended"].map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="rounded-lg font-bold text-xs capitalize"
                >
                  {s === "all" ? "All Status" : s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count */}
        {(search || filterPlan !== "all" || filterStatus !== "all") && (
          <p className="text-xs font-medium text-slate-500">
            {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} match
            {filtered.length === 1 ? "es" : ""} filter
          </p>
        )}

        {/* ── Tenant list ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Hydrating Registry...
            </p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Search size={32} className="opacity-30" />
            <p className="font-bold text-sm">No tenants match your filters</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterPlan("all");
                setFilterStatus("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {paginated.map((tenant) => {
              const tier = planTier(tenant.plan);
              const colors =
                tier === "starter" || tier === "pro" || tier === "enterprise"
                  ? TIER_COLORS[tier]
                  : tier === "trial"
                  ? TIER_COLORS.trial
                  : TIER_COLORS.expired;

              const seatLimit = PLAN_SEAT_LIMITS[tenant.plan];
              const deviceLimit = PLAN_DEVICE_LIMITS[tenant.plan];
              const seatCount = tenant.profiles?.length ?? 0;
              const deviceCount = tenant.phoneCount ?? 0;

              return (
                <Card
                  key={tenant.id}
                  className={clsx(
                    "border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all",
                    !tenant.is_active && "opacity-70"
                  )}
                >
                  {/* Plan accent bar */}
                  <div
                    className={clsx("h-1 w-full", colors.dot.replace("bg-", "bg-"))}
                  />

                  <CardHeader className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: identity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <CardTitle className="text-base sm:text-lg font-bold tracking-tight truncate">
                            {tenant.name}
                          </CardTitle>

                          {/* Plan badge */}
                          <Badge
                            className={clsx(
                              "uppercase text-[9px] font-black tracking-widest rounded-full px-2 py-0.5 border shrink-0",
                              colors.bg,
                              colors.text,
                              colors.border
                            )}
                            variant="outline"
                          >
                            {tenant.plan}
                          </Badge>

                          {/* Status badge */}
                          {!tenant.is_active && (
                            <Badge
                              variant="destructive"
                              className="uppercase font-black text-[9px] tracking-tight shrink-0"
                            >
                              {tenant.suspended_until ? "Suspended" : "Paused"}
                            </Badge>
                          )}
                        </div>

                        <CardDescription className="font-mono text-[10px] break-all">
                          {tenant.id}
                        </CardDescription>

                        {tenant.suspended_until && !tenant.is_active && (
                          <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">
                            Locked until{" "}
                            {new Date(tenant.suspended_until).toLocaleString()}
                          </p>
                        )}

                        {tenant.plan === "trial" && tenant.plan_expires_at && (
                          <p className={clsx(
                            "mt-1 text-[10px] font-bold uppercase flex items-center gap-1",
                            new Date(tenant.plan_expires_at) < new Date()
                              ? "text-rose-500"
                              : "text-amber-500"
                          )}>
                            <CalendarClock size={10} />
                            Trial {new Date(tenant.plan_expires_at) < new Date() ? "expired" : "expires"}{" "}
                            {new Date(tenant.plan_expires_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        )}

                        {/* Quota bars */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <QuotaBar
                            used={seatCount}
                            limit={seatLimit}
                            label="Seats"
                            icon={<Users size={12} className="text-slate-400 shrink-0" />}
                          />
                          <QuotaBar
                            used={deviceCount}
                            limit={deviceLimit}
                            label="Devices"
                            icon={<Smartphone size={12} className="text-slate-400 shrink-0" />}
                          />
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                        {/* Plan dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 px-3 rounded-lg font-black uppercase text-[10px] tracking-wide bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                              disabled={isProcessing === `plan-${tenant.id}`}
                            >
                              {tenant.plan}
                              <ChevronDown size={12} className="ml-1.5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
                            {PLAN_OPTIONS.map((p) => {
                              const tc = TIER_COLORS[planTier(p)];
                              return (
                                <DropdownMenuItem
                                  key={p}
                                  onClick={() => handleUpdatePlan(tenant.id, p)}
                                  className="rounded-lg font-bold uppercase text-xs flex items-center gap-2"
                                >
                                  <span className={clsx("size-2 rounded-full", tc.dot)} />
                                  {p}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Icon actions */}
                        <div className="flex items-center gap-1">
                          {/* Extend trial */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExtendTrialId(tenant.id)}
                                className="size-8 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                              >
                                <CalendarPlus size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Extend trial
                            </TooltipContent>
                          </Tooltip>

                          {/* Feature access toggle */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFeatures(tenant.id)}
                                className="size-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <CheckCircle2 size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Feature access
                            </TooltipContent>
                          </Tooltip>

                          {/* Pause / resume */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (tenant.is_active) setSuspensionId(tenant.id);
                                  else handleToggleStatus(tenant.id, tenant.is_active);
                                }}
                                disabled={isProcessing === `status-${tenant.id}`}
                                className={clsx(
                                  "size-8 rounded-lg",
                                  tenant.is_active
                                    ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                    : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                )}
                              >
                                {isProcessing === `status-${tenant.id}` ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : tenant.is_active ? (
                                  <PauseCircle size={16} />
                                ) : (
                                  <PlayCircle size={16} />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {tenant.is_active ? "Suspend" : "Resume"}
                            </TooltipContent>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(tenant.id, tenant.name, "tenant")}
                                className="size-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Delete tenant
                            </TooltipContent>
                          </Tooltip>

                          {/* Expand members */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(tenant.id)}
                            className="size-8 rounded-lg text-slate-400"
                          >
                            {expandedTenants.has(tenant.id) ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Feature access panel */}
                  {expandedFeatures.has(tenant.id) && (
                    <CardContent className="border-t border-slate-100 dark:border-slate-800 p-0 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <CheckCircle2 size={12} /> Feature Access
                        <button
                          onClick={() => toggleFeatures(tenant.id)}
                          className="ml-auto text-slate-400 hover:text-slate-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <FeatureAccessPanel
                        tenant={tenant}
                        featureFlags={featureFlags}
                      />
                    </CardContent>
                  )}

                  {/* Members panel */}
                  {expandedTenants.has(tenant.id) && (
                    <CardContent className="border-t border-slate-100 dark:border-slate-800 p-0 bg-slate-50/30 dark:bg-slate-900/30">
                      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <Users size={12} /> Team Members
                        <span className="ml-1 text-slate-400">
                          ({tenant.profiles?.length ?? 0})
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {tenant.profiles && tenant.profiles.length > 0 ? (
                          tenant.profiles.map((user) => {
                            const initials = user.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase();

                            return (
                              <div
                                key={user.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {initials || (
                                      <User size={14} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                        {user.full_name}
                                      </p>
                                      {user.role === "admin" && (
                                        <Crown size={12} className="text-amber-500 shrink-0" />
                                      )}
                                      {user.role === "manager" && (
                                        <Shield size={12} className="text-blue-500 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight"
                                        disabled={isProcessing === `role-${user.id}`}
                                      >
                                        {user.role}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-36 rounded-xl p-1.5"
                                    >
                                      {ROLE_OPTIONS.map((r) => (
                                        <DropdownMenuItem
                                          key={r}
                                          onClick={() => handleUpdateRole(user.id, r)}
                                          className="rounded-lg font-bold uppercase text-[10px]"
                                        >
                                          {r}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      confirmDelete(user.id, user.full_name, "user")
                                    }
                                    className="size-7 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                            No team members registered.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-medium text-slate-500">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-slate-800"
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-slate-800"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Delete Dialog ───────────────────────────────────────── */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="rounded-2xl max-w-[95vw] sm:max-w-md w-full">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-black">
                Destructive Action
              </DialogTitle>
              <DialogDescription className="text-slate-600 font-medium leading-relaxed">
                Remove{" "}
                {deleteType === "tenant" ? "tenant" : "user"}{" "}
                <span className="font-black text-rose-600">"{targetName}"</span>?
                {deleteType === "tenant" && (
                  <span className="block text-orange-600 mt-2 text-xs">
                    ⚠️ All data, inventory, and users will be permanently purged.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-5 gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                className="rounded-xl font-bold h-10 sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!!isProcessing?.startsWith("delete-")}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 sm:flex-1"
              >
                {isProcessing?.startsWith("delete-") ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Suspension Dialog ────────────────────────────────────── */}
        <Dialog open={!!suspensionId} onOpenChange={() => setSuspensionId(null)}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-black">Suspend Tenant</DialogTitle>
              <DialogDescription>
                Select how long to revoke access.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {["1h", "8h", "24h", "1w", "forever"].map((duration) => (
                <Button
                  key={duration}
                  variant="outline"
                  className="uppercase font-black text-xs h-11 rounded-xl"
                  onClick={() => handleSuspend(duration)}
                  disabled={isProcessing === `suspend-${suspensionId}`}
                >
                  {duration}
                </Button>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="ghost"
                className="w-full font-bold"
                onClick={() => setSuspensionId(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Extend Trial Dialog ──────────────────────────────────── */}
        <Dialog open={!!extendTrialId} onOpenChange={() => setExtendTrialId(null)}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-black flex items-center gap-2">
                <CalendarPlus size={18} className="text-amber-500" />
                Extend Trial
              </DialogTitle>
              <DialogDescription>
                {(() => {
                  const t = tenants.find((x) => x.id === extendTrialId);
                  if (!t) return "Choose how long to extend the trial.";
                  if (t.plan_expires_at && new Date(t.plan_expires_at) > new Date()) {
                    return `Current trial expires ${new Date(t.plan_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Extension adds from that date.`;
                  }
                  return "Trial has expired. Extension starts from today.";
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "1 month",  months: 1 },
                { label: "3 months", months: 3 },
                { label: "6 months", months: 6 },
                { label: "1 year",   months: 12 },
                { label: "2 years",  months: 24 },
              ].map(({ label, months }) => (
                <Button
                  key={months}
                  variant="outline"
                  className="font-black text-xs h-11 rounded-xl"
                  onClick={() => handleExtendTrial(months)}
                  disabled={!!isProcessing?.startsWith(`extend-`)}
                >
                  {isProcessing === `extend-${extendTrialId}` ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    label
                  )}
                </Button>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="ghost"
                className="w-full font-bold"
                onClick={() => setExtendTrialId(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default function SupervisionPage() {
  return (
    <AdminShell>
      <SupervisionContent />
    </AdminShell>
  );
}

