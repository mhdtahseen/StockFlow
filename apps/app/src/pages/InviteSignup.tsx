import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
import { Mail, Lock, Loader2, User, Building } from "lucide-react";

const inviteSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get("tenant_id");
  const orgNameRaw = searchParams.get("org_name");

  // Try to decode safely in case they pasted the URL weirdly
  const orgName = orgNameRaw
    ? decodeURIComponent(orgNameRaw)
    : "the organization";

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    if (!tenantId) {
      toast.error("Invalid invite link. Missing organization ID.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verified`,
          data: {
            full_name: data.fullName,
            tenant_id: tenantId, // Passing the tenant ID to the Postgres trigger
            // Note: Trigger defaults the role to 'associate' if tenant_id is supplied
          },
        },
      });

      if (error) {
        toast.error("Join Failed", {
          description: error.message || "Could not join organization.",
        });
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required by Supabase settings
      if (authData.user && !authData.session) {
        setIsSuccess(true);
        toast.success("Account Created", {
          description:
            "Check your email for the confirmation link to activate your account.",
        });
      } else if (authData.session) {
        // Auto-logged in
        localStorage.setItem("finventree_auth", "true");
        toast.success(`Welcome matching to ${orgName}!`);
        navigate("/");
      }
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md text-center p-6 border-slate-200 dark:border-slate-800">
          <CardTitle className="text-xl text-rose-600 mb-2">
            Invalid Invite Link
          </CardTitle>
          <CardDescription>
            The link you've followed is missing necessary parameters. Please ask
            your administrator to provide a valid invite link.
          </CardDescription>
          <Button
            onClick={() => navigate("/login")}
            className="mt-6 w-full bg-primary-500"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-center">
            <CardHeader className="space-y-4 pb-6 pt-10">
              <div className="mx-auto size-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mb-2">
                <Mail size={32} />
              </div>
              <CardTitle className="text-2xl font-bold">
                Check your email
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                We've sent a verification link to your email address. Please
                click the link to verify and access {orgName}.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pb-10">
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-700"
              >
                Return to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="size-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
            <span className="text-white text-3xl font-bold tracking-tighter">
              S
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Join the team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-300/50 dark:border-slate-700/50 font-medium">
            <Building size={14} className="text-primary-500 dark:text-blue-400" />
            {orgName}
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-3.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 mb-6">
                You have been invited to join <strong>{orgName}</strong> as an
                Associate. Please create your account credentials below.
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.fullName ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    className={`pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold py-2.5 mt-4 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
                  </>
                ) : (
                  "Accept Invite & Join"
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 justify-center pb-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-500 dark:text-blue-500 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
