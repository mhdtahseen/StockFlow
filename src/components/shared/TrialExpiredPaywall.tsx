import React from "react";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function TrialExpiredPaywall() {
  const { signOut } = useAuth();
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="size-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
        14-Day Trial Ended
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        Your free trial of StockFlow has expired. To continue adding inventory and processing sales, please select a subscription plan.
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link 
          to="/pricing" 
          className="bg-primary-500 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          Choose a Plan
        </Link>
        <button 
          onClick={signOut}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-2 text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-12 text-xs text-slate-400 dark:text-slate-600">
        <span className="opacity-70">Need your data? </span>
        <Link to="/financials" className="text-primary-500 dark:text-blue-400 hover:underline">
          View in Read-Only Mode
        </Link>
      </div>
    </div>
  );
}
