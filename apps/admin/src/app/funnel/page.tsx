"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type FunnelData = {
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  pending_requests: number;
  total_tenants: number;
  tenants_with_phones: number;
  tenants_with_sales: number;
  avg_hours_to_first_phone: number | null;
  recent_activations: RecentActivation[] | null;
};

type RecentActivation = {
  name: string;
  plan: string;
  created_at: string;
  first_phone_at: string | null;
};

function pct(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function FunnelStep({
  step,
  label,
  value,
  total,
  color,
  isLast,
}: {
  step: number;
  label: string;
  value: number;
  total: number;
  color: string;
  isLast?: boolean;
}) {
  const width = pct(value, total);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-full rounded-xl px-6 py-5 text-center ${color}`} style={{ maxWidth: `${Math.max(width, 20)}%`, minWidth: "160px", margin: "0 auto" }}>
        <p className="text-3xl font-bold text-white">{value.toLocaleString("en-IN")}</p>
        <p className="text-sm text-white/80 mt-0.5">{label}</p>
        {total > 0 && (
          <p className="text-xs text-white/60 mt-1">{width}% of total</p>
        )}
      </div>
      {!isLast && (
        <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-600">
          <ArrowRight className="h-5 w-5 rotate-90" />
          <span className="text-xs text-slate-400">{pct(value, total)}% conversion</span>
        </div>
      )}
    </div>
  );
}

function FunnelContent() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_onboarding_funnel").then(({ data }) => {
      if (data) setData(data as FunnelData);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const steps = [
    { label: "Signup Requests", value: data.total_requests, color: "bg-slate-600" },
    { label: "Approved", value: data.approved_requests, color: "bg-blue-600" },
    { label: "Added First Phone", value: data.tenants_with_phones, color: "bg-indigo-600" },
    { label: "Made First Sale", value: data.tenants_with_sales, color: "bg-green-600" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding Funnel</h1>
        <p className="text-sm text-slate-500 mt-1">Signup → Approval → Activation → First Sale</p>
      </div>

      {/* Request Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: data.total_requests, color: "text-slate-700 dark:text-slate-200" },
          { label: "Approved", value: data.approved_requests, color: "text-green-600" },
          { label: "Rejected", value: data.rejected_requests, color: "text-red-500" },
          { label: "Pending", value: data.pending_requests, color: "text-yellow-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
          <CardDescription>Width represents proportion of total signups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            {steps.map((step, i) => (
              <FunnelStep
                key={step.label}
                step={i + 1}
                label={step.label}
                value={step.value}
                total={data.total_requests}
                color={step.color}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activation Speed */}
      {data.avg_hours_to_first_phone !== null && (
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.avg_hours_to_first_phone < 24
                  ? `${data.avg_hours_to_first_phone}h`
                  : `${(data.avg_hours_to_first_phone / 24).toFixed(1)}d`}
              </p>
              <p className="text-sm text-slate-500">Average time from approval to adding first phone</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activations */}
      {(data.recent_activations ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activations</CardTitle>
            <CardDescription>Tenants who recently added their first phone</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">Tenant</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">Plan</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">Joined</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">First Phone</th>
                  <th className="text-right px-4 py-2.5 font-medium text-slate-500">Time to Activate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {(data.recent_activations ?? []).map((a, i) => {
                  const hoursToActivate = a.first_phone_at
                    ? Math.round((new Date(a.first_phone_at).getTime() - new Date(a.created_at).getTime()) / 3600000)
                    : null;
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.name}</td>
                      <td className="px-4 py-3 capitalize text-slate-500">{a.plan}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {a.first_phone_at
                          ? new Date(a.first_phone_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        {hoursToActivate !== null
                          ? hoursToActivate < 24
                            ? `${hoursToActivate}h`
                            : `${(hoursToActivate / 24).toFixed(1)}d`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function FunnelPage() {
  return (
    <AdminShell>
      <FunnelContent />
    </AdminShell>
  );
}
