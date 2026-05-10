import React from "react";
import { AlertTriangle, Clock, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function SuspendedScreen() {
  const { tenant, signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <div className="relative mb-8">
        <div className="size-24 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle size={48} />
        </div>
        <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center text-amber-500">
          <Clock size={20} />
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
        Organization Suspended
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-8 leading-relaxed">
        Access to <span className="font-bold text-slate-900 dark:text-slate-100">{tenant?.name}</span> has been temporarily revoked by the platform administrator.
      </p>

      {tenant?.suspendedUntil && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-8 w-full max-w-xs shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estimated Reactivation</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {new Date(tenant.suspendedUntil).toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid gap-3 w-full max-w-xs">
        <Button variant="outline" className="rounded-xl h-12 font-bold gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <HelpCircle size={18} /> Support Desk
        </Button>
        <Button onClick={signOut} variant="ghost" className="rounded-xl h-12 font-bold gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50">
          <LogOut size={18} /> Exit Organization
        </Button>
      </div>

      <p className="mt-12 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
        Finventree Platform Protocol 403
      </p>
    </div>
  );
}
