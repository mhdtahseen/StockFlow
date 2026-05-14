"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type ForgotValues = z.infer<typeof forgotSchema>;

function LoginForm() {
  const searchParams  = useSearchParams();
  const redirectTo    = searchParams.get("redirect") ?? "/pricing";
  const prefillEmail  = searchParams.get("email") ?? "";

  const [mode, setMode]           = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { email: prefillEmail },
    });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: prefillEmail },
  });

  const onLogin = async (data: FormValues) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setAuthError("Incorrect email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setAuthError("Please confirm your email first. Check your inbox.");
      } else {
        setAuthError(error.message);
      }
      return;
    }

    // Redirect with next.js router isn't available in pure client — use location
    window.location.href = redirectTo;
  };

  const onForgotPassword = async (data: ForgotValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/activate`,
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt="Finventree"
            className="h-14 w-14 rounded-2xl mx-auto mb-3 shadow-lg shadow-amber-500/20"
          />
          <p className="text-lg font-semibold tracking-widest text-amber-400 uppercase mb-1">
            Finventree
          </p>
          <h1 className="text-white text-2xl font-bold">
            {mode === "login" ? "Sign in to your account" : "Reset your password"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === "login"
              ? "Use the same credentials as your Finventree app"
              : "We'll send a reset link to your email"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

          {/* ── Auth error ── */}
          {authError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
              <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-300">{authError}</p>
            </div>
          )}

          {/* ── Login form ── */}
          {mode === "login" && (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setAuthError(null); }}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}

          {/* ── Forgot password form ── */}
          {mode === "forgot" && !resetSent && (
            <form onSubmit={handleForgotSubmit(onForgotPassword)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...registerForgot("email")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                  />
                </div>
                {forgotErrors.email && (
                  <p className="text-xs text-rose-400">{forgotErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isForgotSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors"
              >
                {isForgotSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => { setMode("login"); setAuthError(null); }}
                className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to sign in
              </button>
            </form>
          )}

          {/* ── Reset sent ── */}
          {mode === "forgot" && resetSent && (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="font-semibold text-white mb-2">Reset link sent!</p>
              <p className="text-sm text-slate-400 mb-6">
                Check your inbox — the link expires in 1 hour.
              </p>
              <button
                onClick={() => { setMode("login"); setResetSent(false); setAuthError(null); }}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-amber-400 hover:underline">
            Request access
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already have the app?{" "}
          <a
            href="https://app.finventree.com"
            className="text-amber-400 hover:underline"
          >
            Open Finventree
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
