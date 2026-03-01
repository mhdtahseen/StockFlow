import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Rocket,
  ShieldCheck,
  Target,
  HeartHandshake,
} from "lucide-react";

export default function AboutApp() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">About StockFlow</h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-8 pt-8">
        {/* App Hero Logo */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="size-24 bg-gradient-to-br from-[#064a98] to-blue-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/30">
            <span className="text-white text-5xl font-black tracking-tighter">
              S
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
            StockFlow Manager
          </h2>
          <p className="text-sm font-medium text-[#064a98] dark:text-blue-400 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            Built for Mobile Merchants
          </p>
        </div>

        {/* Vision Statement */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
            <Rocket className="text-amber-500" size={20} />
            Our Vision
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
            We believe that managing a physical tech inventory shouldn't feel
            like you are stuck in the 1990s. The mobile phone wholesale and
            retail industry moves at lightning speed, yet the tools used to
            manage it have remained painfully slow, complex, and frustrating.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            StockFlow was built to change that. We are empowering independent
            shop owners and teams with an enterprise-grade, shockingly fast, and
            beautifully designed mobile application that simply gets out of your
            way and lets you do what you do best: make sales and scale your
            business.
          </p>
        </div>

        {/* Core Values */}
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-blue-100 text-[#064a98] dark:bg-blue-900/30 dark:text-blue-400 rounded-xl mt-1">
              <Target size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Uncompromising Speed
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                With an offline-first architecture, your inventory is always
                instantly available, regardless of your internet connection. We
                don't believe in loading spinners.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl mt-1">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Absolute Security
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your ledgers and stock details are strictly protected with
                enterprise-level Row Level Security. You decide exactly what
                your associates can see and access.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl mt-1">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Human-Centric Design
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Software should be a joy to use. We prioritize gorgeous
                aesthetics, bold fluid animations, and highly intuitive
                interfaces over cluttered menus.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 StockFlow Technologies
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Designed with precision for physical commerce.
          </p>
        </div>
      </main>
    </div>
  );
}
