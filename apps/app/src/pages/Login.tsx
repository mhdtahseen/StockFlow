import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Authentication Failed", {
          description:
            error.message || "Invalid email or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      if (authData.session) {
        localStorage.setItem("finventree_auth", "true");
        toast.success("Login Successful", {
          description: "Welcome back to Finventree.",
        });
        navigate("/");
      }
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.svg"
            alt="Finventree"
            className="h-16 w-16 mb-2 dark:brightness-0 dark:invert"
          />
          <h1 className="text-3xl tracking-tight text-slate-900 dark:text-slate-100">
            <span className="font-bold">Fin</span><span className="font-medium">ventree</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Smart Inventory Manager
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@test.com"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className={`pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm font-medium text-rose-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="text"
                    style={{ WebkitTextSecurity: "disc" } as any}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className={`pl-10 tracking-widest bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm font-medium text-rose-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold py-2.5 mt-2 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 justify-center pb-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <a
                href="https://finventree.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-blue-500 hover:underline font-medium"
              >
                Request access
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
