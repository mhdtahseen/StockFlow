import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Verified() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-center">
          <CardHeader className="space-y-4 pb-6 pt-10">
            <div className="mx-auto size-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <CardTitle className="text-2xl font-bold">
              Email Confirmed!
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-[260px] mx-auto">
              Your account is successfully active. You can now use your email
              and password to log in.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-10 gap-3">
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-[#064a98] hover:bg-blue-800 text-white font-semibold py-2.5"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
