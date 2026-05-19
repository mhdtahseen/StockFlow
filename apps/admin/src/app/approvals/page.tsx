"use client";

import AdminShell from "@/components/AdminShell";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, Clock, Loader2, XCircle, RefreshCw } from "lucide-react";

type TenantRequest = {
  id: string;
  org_name: string;
  full_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function ApprovalsContent() {
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tenant_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        toast.error("Database table missing", {
          description: "Please run the tenant_requests SQL migration.",
        });
      } else {
        toast.error("Failed to fetch requests");
      }
      setRequests([]);
    } else {
      setRequests(data as TenantRequest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, email: string) => {
    setIsProcessing(id);
    try {
      let redirectTo = "https://finventree.com/activate";
      if (typeof window !== "undefined") {
        const { hostname, protocol } = window.location;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          redirectTo = "http://localhost:5175/activate";
        } else if (hostname.includes("admin.finventree.com")) {
          redirectTo = "https://finventree.com/activate";
        } else if (hostname.includes("finventree-admin")) {
          const webHost = hostname.replace("finventree-admin", "finventree-web");
          redirectTo = `${protocol}//${webHost}/activate`;
        }
      }

      const { error } = await supabase.functions.invoke("approve-tenant", {
        body: { requestId: id, redirectTo },
      });

      if (error) {
        toast.error("Approval failed", { description: error.message });
        return;
      }

      toast.success("Approved & Invited!", {
        description: `Organization created and invitation sent to ${email}.`,
      });
      fetchRequests();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(id);
    const { error } = await supabase
      .from("tenant_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    setIsProcessing(null);

    if (error) {
      toast.error("Failed to reject");
      return;
    }
    toast.success("Rejected request");
    fetchRequests();
  };

  const handleReset = async (id: string) => {
    setIsProcessing(id);
    const { error } = await supabase
      .from("tenant_requests")
      .update({ status: "pending" })
      .eq("id", id);
    setIsProcessing(null);

    if (error) {
      toast.error("Failed to reset");
      return;
    }
    toast.success("Reset to pending");
    fetchRequests();
  };

  return (
    <div className="p-4 sm:p-5 w-full">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Tenant Approvals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review organizations requesting access to Finventree.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8 sm:p-12">
          <Loader2 className="animate-spin text-blue-600 h-6 w-6 sm:h-8 sm:w-8" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 sm:py-12 p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            No pending requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
                    {req.org_name}
                  </h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                    {req.full_name} •{" "}
                    <span className="text-blue-600 dark:text-blue-400 break-all">
                      {req.email}
                    </span>
                  </div>
                  <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-400">
                    <Clock size={12} />
                    <span className="truncate">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {req.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={isProcessing === req.id}
                        className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 hover:dark:bg-rose-900/40 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                      >
                        {isProcessing === req.id ? (
                          <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                        ) : (
                          "Reject"
                        )}
                      </button>
                      <button
                        onClick={() => handleApprove(req.id, req.email)}
                        disabled={isProcessing === req.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                      >
                        {isProcessing === req.id ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : req.status === "approved" ? (
                    <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto gap-2">
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle size={12} /> Approved
                      </span>
                      <button
                        onClick={() => handleReset(req.id)}
                        disabled={isProcessing === req.id}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors disabled:opacity-50"
                        title="Reset to Pending"
                      >
                        {isProcessing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto gap-2">
                      <span className="px-3 py-1.5 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold ring-1 ring-inset ring-rose-600/20">
                        <XCircle size={12} /> Rejected
                      </span>
                      <button
                        onClick={() => handleReset(req.id)}
                        disabled={isProcessing === req.id}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors disabled:opacity-50"
                        title="Reset to Pending"
                      >
                        {isProcessing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <AdminShell>
      <ApprovalsContent />
    </AdminShell>
  );
}
