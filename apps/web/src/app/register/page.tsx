"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, User, Store, Loader2, CheckCircle2, ArrowRight, Phone } from "lucide-react";

const schema = z.object({
  shopName: z.string().min(2, "Shop / organization name is required"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    import("@fingerprintjs/fingerprintjs")
      .then((FingerprintJS) => FingerprintJS.default.load())
      .then((fp) => fp.get())
      .then((result) => { fingerprintRef.current = result.visitorId; })
      .catch(() => { /* non-critical */ });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    const { error } = await supabase.functions.invoke("submit-tenant-request", {
      body: {
        org_name:           data.shopName,
        full_name:          data.fullName,
        email:              data.email,
        phone:              data.phone,
        device_fingerprint: fingerprintRef.current,
        user_agent:         typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });

    if (error) {
      const message = (error as any)?.context?.error || error.message;
      setSubmitError(message || "Could not submit your request. Please try again.");
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Request Sent</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your request has been recorded. Our team will review it shortly.
              You'll receive an invite link at your email address once approved.
            </p>
            <a
              href="https://app.finventree.com"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              Go to App Login <ArrowRight size={16} />
            </a>
            <p className="mt-6 text-xs text-slate-500">
              Already approved?{" "}
              <Link href="/status" className="text-amber-400 hover:underline">
                Check your status
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition";

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Finventree" className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow-lg shadow-amber-500/20" />
          <p className="text-lg font-semibold tracking-widest text-amber-400 uppercase mb-4">Finventree</p>
          <h1 className="text-white text-2xl font-bold">Request Access</h1>
          <p className="text-slate-400 text-sm mt-1">Start managing your smartphone inventory</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {submitError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 rounded-lg px-3 py-2">{submitError}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Shop / Organization Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input placeholder="e.g. MobiHub" {...register("shopName")} className={inputClass} />
              </div>
              {errors.shopName && <p className="text-xs text-rose-400">{errors.shopName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input placeholder="John Doe" {...register("fullName")} className={inputClass} />
              </div>
              {errors.fullName && <p className="text-xs text-rose-400">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input type="email" placeholder="admin@shop.com" {...register("email")} className={inputClass} />
              </div>
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  {...register("phone")}
                  className={inputClass}
                />
              </div>
              {errors.phone && <p className="text-xs text-rose-400">{errors.phone.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="https://app.finventree.com" className="text-amber-400 hover:underline font-medium">Sign in to the app</a>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Submitted already?{" "}
          <Link href="/status" className="text-amber-400 hover:underline font-medium">Check your status</Link>
        </p>
      </div>
    </div>
  );
}


export default function RegisterPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    const { error } = await supabase.from("tenant_requests").insert({
      org_name: data.shopName,
      full_name: data.fullName,
      email: data.email,
      status: "pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Request Sent</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your request has been recorded. Our team will review it shortly.
              You'll receive an invite link at your email address once approved.
            </p>
            <a
              href="https://app.finventree.com"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              Go to App Login <ArrowRight size={16} />
            </a>
            <p className="mt-6 text-xs text-slate-500">
              Already approved?{" "}
              <Link href="/status" className="text-amber-400 hover:underline">
                Check your status
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Finventree" className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow-lg shadow-amber-500/20" />
          <p className="text-lg font-semibold tracking-widest text-amber-400 uppercase mb-4">Finventree</p>
          <h1 className="text-white text-2xl font-bold">Request Access</h1>
          <p className="text-slate-400 text-sm mt-1">
            Start managing your smartphone inventory
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Shop Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Shop / Organization Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  placeholder="e.g. MobiHub"
                  {...register("shopName")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
              {errors.shopName && (
                <p className="text-xs text-rose-400">{errors.shopName.message}</p>
              )}
            </div>

            {/* Full Name */}
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
              {errors.fullName && (
                <p className="text-xs text-rose-400">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@shop.com"
                  {...register("email")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a
            href="https://app.finventree.com"
            className="text-amber-400 hover:underline font-medium"
          >
            Sign in to the app
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Submitted already?{" "}
          <Link href="/status" className="text-amber-400 hover:underline font-medium">
            Check your status
          </Link>
        </p>
      </div>
    </div>
  );
}
