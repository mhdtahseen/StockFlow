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
import { Mail, Lock, Loader2, Store, User } from "lucide-react";

const signupSchema = z.object({
  shopName: z.string().min(2, "Shop/Organization name is required"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      shopName: "",
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verified`,
          data: {
            // These map perfectly to the Postgres trigger `handle_new_user()`
            full_name: data.fullName,
            org_name: data.shopName,
          },
        },
      });

      if (error) {
        toast.error("Registration Failed", {
          description:
            error.message || "Could not create organization. Please try again.",
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
        localStorage.setItem("stockflow_auth", "true");
        toast.success("Welcome to StockFlow!", {
          description: `Your organization ${data.shopName} has been created.`,
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

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
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
                click the link to verify and activate your organization.
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="size-16 bg-[#064a98] rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
            <span className="text-white text-3xl font-bold tracking-tighter">
              S
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create your Organization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Start managing your inventory across your team
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Shop Level Fields */}
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop / Organization Name</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="shopName"
                    placeholder="e.g. MobiHub"
                    autoComplete="off"
                    className={`pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${errors.shopName ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    {...register("shopName")}
                  />
                </div>
                {errors.shopName && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {errors.shopName.message}
                  </p>
                )}
              </div>

              {/* User Level Fields */}
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
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@shop.com"
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
                <Label htmlFor="password">Password</Label>
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
                className="w-full bg-[#064a98] hover:bg-blue-800 text-white font-semibold py-2.5 mt-4 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 justify-center pb-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#064a98] dark:text-blue-500 hover:underline font-medium"
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
