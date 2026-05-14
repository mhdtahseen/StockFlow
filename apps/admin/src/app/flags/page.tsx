"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Flag, Globe, Building2, Plus, Save, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import clsx from "clsx";

type FeatureFlag = {
  id: string;
  flag_key: string;
  display_name: string;
  description: string | null;
  enabled_globally: boolean;
  tenant_overrides: Record<string, boolean>;
  updated_at: string;
};

type Tenant = { id: string; name: string };

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function FlagsContent() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [overrideTenantId, setOverrideTenantId] = useState("");
  const [overrideValue, setOverrideValue] = useState(false);

  async function fetchFlags() {
    const [{ data: flagData }, { data: tenantData }] = await Promise.all([
      supabase.from("feature_flags").select("*").order("flag_key"),
      supabase.from("tenants").select("id, name").eq("is_active", true).order("name"),
    ]);
    if (flagData) setFlags(flagData as FeatureFlag[]);
    if (tenantData) setTenants(tenantData as Tenant[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchFlags(); }, []);

  async function toggleGlobal(flag: FeatureFlag) {
    setSaving(flag.id);
    const newVal = !flag.enabled_globally;
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled_globally: newVal, updated_at: new Date().toISOString() })
      .eq("id", flag.id);

    if (error) {
      toast.error("Failed to update flag");
    } else {
      setFlags((prev) =>
        prev.map((f) => f.id === flag.id ? { ...f, enabled_globally: newVal } : f)
      );
      // Write audit log
      await supabase.from("audit_logs").insert({
        action: "flag.toggled",
        target_type: "feature_flag",
        target_id: flag.flag_key,
        target_name: flag.display_name,
        metadata: { enabled_globally: newVal },
      });
      toast.success(`${flag.display_name} ${newVal ? "enabled" : "disabled"} globally`);
    }
    setSaving(null);
  }

  async function addTenantOverride() {
    if (!selectedFlag || !overrideTenantId) return;
    setSaving(selectedFlag.id);
    const newOverrides = { ...selectedFlag.tenant_overrides, [overrideTenantId]: overrideValue };
    const { error } = await supabase
      .from("feature_flags")
      .update({ tenant_overrides: newOverrides, updated_at: new Date().toISOString() })
      .eq("id", selectedFlag.id);

    if (error) {
      toast.error("Failed to save override");
    } else {
      const updated = { ...selectedFlag, tenant_overrides: newOverrides };
      setFlags((prev) => prev.map((f) => f.id === selectedFlag.id ? updated : f));
      setSelectedFlag(updated);
      setOverrideTenantId("");
      const tenantName = tenants.find((t) => t.id === overrideTenantId)?.name ?? overrideTenantId;
      await supabase.from("audit_logs").insert({
        action: "flag.toggled",
        target_type: "feature_flag",
        target_id: selectedFlag.flag_key,
        target_name: selectedFlag.display_name,
        metadata: { tenant_override: { tenant: tenantName, enabled: overrideValue } },
      });
      toast.success("Tenant override saved");
    }
    setSaving(null);
  }

  async function removeTenantOverride(flag: FeatureFlag, tenantId: string) {
    const newOverrides = { ...flag.tenant_overrides };
    delete newOverrides[tenantId];
    const { error } = await supabase
      .from("feature_flags")
      .update({ tenant_overrides: newOverrides })
      .eq("id", flag.id);

    if (!error) {
      const updated = { ...flag, tenant_overrides: newOverrides };
      setFlags((prev) => prev.map((f) => f.id === flag.id ? updated : f));
      if (selectedFlag?.id === flag.id) setSelectedFlag(updated);
      toast.success("Override removed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Flag className="h-6 w-6 text-blue-500" /> Feature Flags
        </h1>
        <p className="text-sm text-slate-500 mt-1">Control which features are available globally or per tenant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Flags List */}
        <div className="lg:col-span-3 space-y-3">
          {flags.map((flag) => {
            const overrideCount = Object.keys(flag.tenant_overrides ?? {}).length;
            return (
              <Card
                key={flag.id}
                className={clsx(
                  "cursor-pointer transition-all",
                  selectedFlag?.id === flag.id
                    ? "ring-2 ring-blue-500"
                    : "hover:shadow-sm"
                )}
                onClick={() => setSelectedFlag(selectedFlag?.id === flag.id ? null : flag)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{flag.display_name}</p>
                        {overrideCount > 0 && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                            {overrideCount} override{overrideCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{flag.flag_key}</p>
                      {flag.description && (
                        <p className="text-sm text-slate-500 mt-1">{flag.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <Toggle
                        enabled={flag.enabled_globally}
                        onChange={() => toggleGlobal(flag)}
                        disabled={saving === flag.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Override Panel */}
        <div className="lg:col-span-2">
          {selectedFlag ? (
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Tenant Overrides
                </CardTitle>
                <CardDescription>{selectedFlag.display_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing overrides */}
                {Object.entries(selectedFlag.tenant_overrides ?? {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedFlag.tenant_overrides).map(([tid, val]) => {
                      const tenant = tenants.find((t) => t.id === tid);
                      return (
                        <div key={tid} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{tenant?.name ?? tid.slice(0, 8)}</p>
                            <p className={clsx("text-xs font-medium", val ? "text-green-600" : "text-red-500")}>
                              {val ? "Enabled" : "Disabled"} (overrides global)
                            </p>
                          </div>
                          <button
                            onClick={() => removeTenantOverride(selectedFlag, tid)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No tenant overrides set</p>
                )}

                {/* Add override */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add Override</p>
                  <select
                    value={overrideTenantId}
                    onChange={(e) => setOverrideTenantId(e.target.value)}
                    className="w-full py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Select tenant…</option>
                    {tenants
                      .filter((t) => !(t.id in (selectedFlag.tenant_overrides ?? {})))
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Value</span>
                    <Toggle enabled={overrideValue} onChange={setOverrideValue} />
                  </div>
                  <button
                    onClick={addTenantOverride}
                    disabled={!overrideTenantId || saving === selectedFlag.id}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {saving === selectedFlag.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Save Override
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Flag className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Select a flag to manage overrides</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlagsPage() {
  return (
    <AdminShell>
      <FlagsContent />
    </AdminShell>
  );
}
