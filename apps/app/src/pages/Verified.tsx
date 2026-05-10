import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Verified() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Check if they are actually logged in (Supabase logs them in via the invite link)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If not logged in and no session, and not "done", they shouldn't be here
        // But we'll let them see the screen; the password update would fail anyway
      }
    };
    checkAuth();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success("Account activated!", {
        description: "Your password has been set successfully."
      });
      setIsDone(true);
    } catch (err: any) {
      toast.error("Failed to set password", {
        description: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.svg"
            alt="Finventree"
            className="h-12 w-12 mb-2 dark:brightness-0 dark:invert"
          />
          <h1 className="text-2xl tracking-tight">
            <span className="font-bold">Fin</span><span className="font-medium">ventree</span>
          </h1>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 pb-6 pt-10">
            <div className="mx-auto size-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isDone ? "Account Finalized!" : "Almost there!"}
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-[280px] mx-auto">
              {isDone 
                ? "Your account is now fully active. You can log in to the app anytime."
                : "Your email is confirmed. Now, set a secure password to activate your account."}
            </CardDescription>
          </CardHeader>
          
          {!isDone && (
            <CardContent className="text-left pb-6">
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold py-2.5 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    "Activate Account"
                  )}
                </Button>
              </form>
            </CardContent>
          )}

          <CardFooter className="flex justify-center pb-10">
            {isDone && (
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold py-2.5 flex items-center justify-center gap-2"
              >
                Go to Login <ArrowRight size={16} />
              </Button>
            )}
            {!isDone && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setting a password allows you to log in to the mobile app or PWA.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
