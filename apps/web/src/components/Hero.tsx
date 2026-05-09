"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-[var(--color-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Paperless · Made in India
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="text-gradient-hero">Finance. Inventory.</span>
          <br />
          <span className="text-gradient-hero">Go Paperless with</span>{" "}
          <span className="text-gradient-accent">Finven</span><span className="text-emerald-500">tree</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          The 100% digital platform for India&apos;s smartphone trade. Inventory,
          GST billing, IMEI tracking — paperless from day one, built
          exclusively for resellers, retailers, wholesalers, and dealers.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <a
            href="#pricing"
            className="btn-primary text-base px-8 py-3.5 rounded-2xl inline-flex items-center gap-2 group"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#how-it-works"
            className="btn-secondary text-base px-8 py-3.5 rounded-2xl inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            See How It Works
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {[
            { value: "10,000+", label: "Devices tracked" },
            { value: "₹50Cr+", label: "GMV processed" },
            { value: "500+", label: "Active dealers" },
            { value: "0", label: "Trees cut 🌱" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                {stat.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-[var(--color-text-muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* App preview glass card */}
        <motion.div
          className="mt-16 relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="glass-card rounded-3xl p-1.5 glow-gold">
            <div className="rounded-2xl bg-[var(--color-bg-subtle)] overflow-hidden aspect-[16/9] flex items-center justify-center">
              {/* Dashboard mockup */}
              <div className="w-full h-full p-6 sm:p-8 flex flex-col gap-4">
                {/* Top bar */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 glass rounded-lg h-7 max-w-sm" />
                </div>
                {/* Sidebar + Content */}
                <div className="flex-1 flex gap-4">
                  <div className="hidden sm:flex flex-col gap-2 w-48">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded-lg ${
                          i === 1
                            ? "bg-amber-500/20 border border-amber-500/30"
                            : "glass"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    {/* Metric cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { color: "from-amber-500/20 to-amber-600/10", label: "Revenue" },
                        { color: "from-violet-500/20 to-violet-600/10", label: "Inventory" },
                        { color: "from-emerald-500/20 to-emerald-600/10", label: "Orders" },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className={`rounded-xl bg-gradient-to-br ${card.color} p-3 sm:p-4 border border-white/10`}
                        >
                          <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
                            {card.label}
                          </div>
                          <div className="mt-1 h-3 sm:h-4 w-16 sm:w-20 rounded bg-white/10" />
                        </div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="flex-1 glass rounded-xl p-4 flex items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-amber-500/40 to-amber-500/10"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Reflection effect */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-b from-amber-500/5 to-transparent blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
