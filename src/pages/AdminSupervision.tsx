import React, { useEffect, useState } from "react";
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
  Settings2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import clsx from "clsx";

type Tenant = {
  id: string;
  name: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  profiles?: Profile[];
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "super-admin" | "admin" | "manager" | "associate";
  tenant_id: string;
};

const PLAN_OPTIONS = ["trial", "starter", "pro", "enterprise", "free"];
const ROLE_OPTIONS = ["admin", "manager", "associate"];

export default function AdminSupervision() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(
    new Set(),
  );
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Alert Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"tenant" | "user">("tenant");
  const [targetName, setTargetName] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Group profiles by tenant
      const groupedTenants = (tenantsData as Tenant[]).map((t) => ({
        ...t,
        profiles: (profilesData as Profile[]).filter(
          (p) => p.tenant_id === t.id,
        ),
      }));

      setTenants(groupedTenants);
    } catch (err: any) {
      toast.error("Failed to fetch data", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTenants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTenants(next);
  };

  const handleUpdatePlan = async (tenantId: string, plan: string) => {
    setIsProcessing(`plan-${tenantId}`);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ plan })
        .eq("id", tenantId);

      if (error) throw error;
      toast.success("Plan updated!");
      fetchData();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleStatus = async (
    tenantId: string,
    currentStatus: boolean,
  ) => {
    setIsProcessing(`status-${tenantId}`);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: !currentStatus })
        .eq("id", tenantId);

      if (error) throw error;
      toast.success(currentStatus ? "Tenant Paused" : "Tenant Resumed");
      fetchData();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
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
      toast.success("Role updated!");
      fetchData();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
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
      toast.success(`${isTenant ? "Tenant" : "User"} removed successfully`);
      fetchData();
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setIsProcessing(null);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Tenant Supervision
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
            Global lifecycle & supervision orchestration
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={isLoading}
          className="rounded-xl border-slate-200 dark:border-slate-800 w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Sync Registry"
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Hydrating Registry...
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className={clsx(
                "border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all",
                !tenant.is_active && "opacity-75 grayscale-[0.5]",
              )}
            >
              <div
                className={clsx(
                  "h-1.5 w-full",
                  tenant.plan === "enterprise"
                    ? "bg-emerald-500"
                    : tenant.plan === "pro"
                      ? "bg-blue-500"
                      : "bg-slate-300 dark:bg-slate-700",
                )}
              />

              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 p-4 sm:p-5">
                <div className="flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
                      {tenant.name}
                    </CardTitle>
                    {!tenant.is_active && (
                      <Badge
                        variant="destructive"
                        className="uppercase font-black text-[10px] tracking-tighter w-fit"
                      >
                        Paused
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-mono text-[10px] mt-1 uppercase tracking-wider break-all">
                    ID: {tenant.id}
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:items-end w-full sm:w-auto">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5">
                      Assigned Plan
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 px-4 rounded-lg font-black uppercase text-[11px] tracking-wide bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 w-full sm:w-auto"
                          disabled={isProcessing === `plan-${tenant.id}`}
                        >
                          {tenant.plan}
                          <ChevronDown
                            size={14}
                            className="ml-2 text-slate-400"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl p-1.5"
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <DropdownMenuItem
                            key={p}
                            onClick={() => handleUpdatePlan(tenant.id, p)}
                            className="rounded-lg font-bold uppercase text-xs"
                          >
                            {p}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-slate-800" />

                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleToggleStatus(tenant.id, tenant.is_active)
                      }
                      disabled={isProcessing === `status-${tenant.id}`}
                      className={clsx(
                        "rounded-xl",
                        tenant.is_active
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
                      )}
                    >
                      {tenant.is_active ? (
                        <PauseCircle size={22} />
                      ) : (
                        <PlayCircle size={22} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        confirmDelete(tenant.id, tenant.name, "tenant")
                      }
                      className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(tenant.id)}
                      className="rounded-xl"
                    >
                      {expandedTenants.has(tenant.id) ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedTenants.has(tenant.id) && (
                <CardContent className="border-t border-slate-100 dark:border-slate-800 p-0 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                      <Users size={14} /> Registered Members
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tenant.profiles && tenant.profiles.length > 0 ? (
                      tenant.profiles.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="size-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              {user.role === "admin" ? (
                                <Crown size={18} className="text-amber-500" />
                              ) : user.role === "manager" ? (
                                <Shield size={18} className="text-blue-500" />
                              ) : (
                                <User size={18} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {user.full_name}
                              </div>
                              <div className="text-xs text-slate-500 font-medium truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight gap-1.5 min-w-[80px]"
                                  disabled={isProcessing === `role-${user.id}`}
                                >
                                  {user.role}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-40 rounded-xl p-1.5"
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
                              className="size-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 sm:p-10 text-center text-slate-400 text-sm font-medium italic">
                        No team members registered for this tenant.
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl max-w-[95vw] sm:max-w-md w-full max-h-[85vh] overflow-y-auto border shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-black text-center sm:text-left">
              Destructive Action
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium leading-relaxed text-sm sm:text-base">
              <div className="space-y-2">
                <span>
                  Are you sure you want to{" "}
                  {deleteType === "tenant"
                    ? "remove the complete tenant"
                    : "remove this user"}{" "}
                </span>
                <span className="font-black text-rose-600 break-all block">
                  "{targetName}"
                </span>
                {deleteType === "tenant" && (
                  <span className="block text-orange-600 mt-3 text-xs sm:text-sm">
                    ⚠️ All data, inventory, and users belonging to this tenant
                    will be purged permanently.
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="rounded-xl font-bold h-11 text-sm sm:text-base w-full sm:flex-1"
            >
              Abort Change
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isProcessing?.startsWith("delete-")}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 text-sm sm:text-base w-full sm:flex-1"
            >
              {isProcessing?.startsWith("delete-") ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
