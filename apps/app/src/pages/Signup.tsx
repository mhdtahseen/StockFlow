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
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from("tenant_requests").insert({
        org_name: data.shopName,
        full_name: data.fullName,
        email: data.email,
        status: "pending",
      });

      if (error) {
        toast.error("Request Failed", {
          description:
            error.message || "Could not submit your request. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Request Submitted", {
        description:
          "Your request to join has been recorded. The admin will review it.",
      });
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

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
                Access Request Sent
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                Your request to join StockFlow has been recorded. Please get in touch with the admin to grant you access. An invite link will be emailed to your address upon approval.
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
          <img
            src="/logo.svg"
            alt="StockFlow"
            className="h-16 w-16 mb-2 dark:brightness-0 dark:invert"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Request Access
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



              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold py-2.5 mt-4 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Submit Request"
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
