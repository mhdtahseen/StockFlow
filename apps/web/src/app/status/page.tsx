"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Loader2, Clock, CheckCircle2, XCircle, ArrowRight, Search } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

interface Result {
  status: Status;
  org_name: string;
  created_at: string;
}

const STATUS_CONFIG: Record<Status, { icon: React.ReactNode; color: string; title: string; message: string }> = {
  pending: {
    icon: <Clock size={32} />,
    color: "text-amber-400 bg-amber-500/10",
    title: "Under Review",
    message: "Your request is being reviewed by our team. We'll send an invite link to your email once approved.",
  },
  approved: {
    icon: <CheckCircle2 size={32} />,
    color: "text-emerald-400 bg-emerald-500/10",
    title: "You're Approved!",
    message: "Your account has been approved. Check your email for the activation link. If you can't find it, check your spam folder.",
  },
  rejected: {
    icon: <XCircle size={32} />,
    color: "text-rose-400 bg-rose-500/10",
    title: "Request Not Approved",
    message: "Your request was not approved at this time. Contact our support team for more information.",
  },
};

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setResult(null);
    setNotFound(false);

    const { data, error } = await supabase
      .rpc("check_request_status", { input_email: email.trim().toLowerCase() });

    setIsLoading(false);

    if (error || !data || data.length === 0) {
      setNotFound(true);
      return;
    }

    setResult(data[0] as Result);
  };

  const config = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Finventree" className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow-lg shadow-amber-500/20" />
          <p className="text-lg font-semibold tracking-widest text-amber-400 uppercase mb-4">Finventree</p>
          <h1 className="text-white text-2xl font-bold">Check Request Status</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter the email you registered with
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Checking...</>
              ) : (
                <><Search size={16} /> Check Status</>
              )}
            </button>
          </form>

          {/* Not found */}
          {notFound && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-slate-400 text-sm">
                No request found for <strong className="text-white">{email}</strong>.
              </p>
              <Link
                href="/register"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-400 hover:underline"
              >
                Submit a request <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Result card */}
          {result && config && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${config.color}`}>
                  {config.icon}
                </div>
                <h2 className="text-lg font-bold text-white mb-2">{config.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-1">{config.message}</p>
                <p className="text-xs text-slate-600 mt-3">
                  Request submitted for <strong className="text-slate-400">{result.org_name}</strong>
                  {" · "}
                  {new Date(result.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>

              {result.status === "approved" && (
                <Link
                  href="/activate"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
                >
                  Activate Account <ArrowRight size={16} />
                </Link>
              )}

              {result.status === "rejected" && (
                <a
                  href="mailto:support@finventree.com"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                >
                  Contact Support
                </a>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="https://app.finventree.com" className="text-amber-400 hover:underline font-medium">
            Sign in to the app
          </a>
        </p>
      </div>
    </div>
  );
}
