import React from "react";
import { AlertCircle, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function TrialExpiredPaywall() {
  const { signOut, tenant } = useAuth();
  const isEnterprise = tenant?.plan === "enterprise";
  
  return (
    <div className="fixed inset-0 z-100 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="size-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10 rotate-3">
        <AlertCircle size={40} strokeWidth={2.5} />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
        {isEnterprise ? "License Expired" : "14-Day Trial Ended"}
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
        {isEnterprise 
          ? "Your Enterprise license for Finventree has expired. Please contact your account manager or support to renew your access."
          : "Your free trial of Finventree has expired. To continue adding inventory and processing sales, please select a subscription plan."}
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isEnterprise ? (
          <a 
            href="https://wa.me/919028747249" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            Contact Support
          </a>
        ) : (
          <Link 
            to="/pricing" 
            className="bg-primary-500 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-900/20"
          >
            View Pricing Plans
          </Link>
        )}
        
        <button 
          onClick={signOut}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-2 text-sm transition-colors"
        >
          Sign Out of Account
        </button>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 w-full max-w-xs text-xs text-slate-400 dark:text-slate-600">
        <p className="mb-4">
          <span className="opacity-70 font-semibold italic">Need your data? </span>
          <Link to="/ledger" className="text-primary-500 dark:text-blue-400 hover:underline font-bold">
            View Read-Only Ledger
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4 opacity-50">
          <Link to="/about" className="hover:text-slate-900 dark:hover:text-slate-100">Terms</Link>
          <Link to="/about" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy</Link>
          <a href="mailto:support@finventree.com" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
            <Mail size={10} /> Email
          </a>
        </div>
      </div>
    </div>
  );
}
