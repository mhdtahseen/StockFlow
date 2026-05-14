"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Store, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type FieldErrors = { email?: string; password?: string };

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return undefined;
}

function LoginForm() {
  const { session, isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    if (!isLoading && session && isSuperAdmin) {
      router.replace("/approvals");
    }
    if (searchParams.get("error") === "unauthorized") {
      toast.error("Access denied", {
        description: "This panel is restricted to super admins.",
      });
    }
  }, [isLoading, session, isSuperAdmin, router, searchParams]);

  function validateAll(): boolean {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });
    return !emailErr && !passwordErr;
  }

  function handleBlur(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    else setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setServerError(null);
    if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setServerError(null);
    if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validateAll()) return;
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        setServerError("Invalid email or password. Please check your credentials and try again.");
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        setServerError("Email not verified. Please check your inbox for a confirmation link.");
      } else {
        setServerError(error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary-500 text-white">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Finventree Admin
              </h1>
              <p className="text-xs text-slate-500">Super Admin Panel</p>
            </div>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-600 dark:text-rose-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-950 text-sm font-medium outline-none transition-colors ${
                  touched.email && errors.email
                    ? "border-rose-400 dark:border-rose-600 focus:border-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-blue-500"
                }`}
                placeholder="admin@finventree.app"
              />
              {touched.email && errors.email && (
                <p className="text-xs font-medium text-rose-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-950 text-sm font-medium outline-none transition-colors ${
                  touched.password && errors.password
                    ? "border-rose-400 dark:border-rose-600 focus:border-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-blue-500"
                }`}
                placeholder="••••••••"
              />
              {touched.password && errors.password && (
                <p className="text-xs font-medium text-rose-500 mt-1">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
