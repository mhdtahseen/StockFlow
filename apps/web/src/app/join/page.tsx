"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Mail, Lock, User, Building, Loader2, CheckCircle2, AlertCircle, ArrowRight,
} from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function JoinForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");
  const orgName = searchParams.get("org_name")
    ? decodeURIComponent(searchParams.get("org_name")!)
    : "your organization";

  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invalid Invite Link</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            This invite link is missing required parameters. Please ask your administrator for a valid link.
          </p>
          <a
            href="https://app.finventree.com"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: "https://finventree.com/activate",
        data: {
          full_name: data.fullName,
          tenant_id: tenantId,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Email confirmation required
    if (authData.user && !authData.session) {
      setIsSuccess(true);
    } else if (authData.session) {
      // Auto confirmed — redirect to app
      window.location.href = "https://app.finventree.com";
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            We've sent a verification link to your email. Click it to activate your account and join{" "}
            <strong className="text-white">{orgName}</strong>.
          </p>
          <a
            href="https://app.finventree.com"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Go to App Login <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + org banner */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="size-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <span className="text-black font-black text-lg">F</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Finventree</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Join the team</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
            <Building size={13} className="text-amber-400" />
            {orgName}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm text-slate-300">
            You've been invited to join <strong className="text-white">{orgName}</strong> as an Associate. Create your credentials below.
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  placeholder="John Doe"
                  {...register("fullName")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
              {errors.fullName && <p className="text-xs text-rose-400">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  {...register("email")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Joining...</>
              ) : (
                "Accept Invite & Join"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="https://app.finventree.com" className="text-amber-400 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030712] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
