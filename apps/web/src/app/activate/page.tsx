"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

export default function ActivatePage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Supabase automatically exchanges the invite token in the URL hash for a session.
  // We just need to wait for it to resolve.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setIsDone(true);
  };

  // Loading — waiting for Supabase to process the invite token
  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // No session — invite link may be expired or invalid
  if (hasSession === false) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Expired</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            This activation link has expired or already been used.
            Contact support if you need a new invite.
          </p>
          <a
            href="mailto:support@finventree.com"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Contact Support
          </a>
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          {isDone ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Account Activated!</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Your password has been set. You can now log in to the app using your email and this password.
              </p>
              <a
                href="https://app.finventree.com"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
              >
                Go to App Login <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Almost there!</h1>
                <p className="text-slate-400 text-sm mt-2">
                  Set a secure password to activate your Finventree account.
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Activating...</>
                  ) : (
                    "Activate Account"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
