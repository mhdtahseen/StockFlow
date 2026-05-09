"use client";

import { motion } from "framer-motion";
import { ScanLine, FileText, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ScanLine,
    title: "Add & Scan",
    description:
      "Add devices to your inventory with a single IMEI scan. Our smart catalog auto-detects brand, model, color and storage.",
    accent: "amber",
  },
  {
    number: "02",
    icon: FileText,
    title: "Sell & Bill",
    description:
      "Create GST invoices in seconds. Auto-calculate margins, apply customer credits, and track every payment mode.",
    accent: "violet",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Grow & Scale",
    description:
      "Get real-time insights on what's selling, what's stuck, and where your money is. Make decisions backed by data.",
    accent: "emerald",
  },
];

const accentColors: Record<string, { line: string; icon: string; glow: string }> = {
  amber: {
    line: "bg-amber-500",
    icon: "text-amber-500 bg-amber-500/10",
    glow: "shadow-amber-500/20",
  },
  violet: {
    line: "bg-violet-500",
    icon: "text-violet-500 bg-violet-500/10",
    glow: "shadow-violet-500/20",
  },
  emerald: {
    line: "bg-emerald-500",
    icon: "text-emerald-500 bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-500">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Three steps to{" "}
            <span className="text-gradient-gold">total control</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg">
            Get set up in minutes, not months. No training needed.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-violet-500/50 to-emerald-500/50 hidden md:block" />

          <div className="space-y-16">
            {steps.map((step, i) => {
              const colors = accentColors[step.accent];
              return (
                <motion.div
                  key={step.number}
                  className="flex flex-col md:flex-row items-start gap-6 md:gap-10"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  {/* Number + Icon */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`relative z-10 w-16 h-16 rounded-2xl ${colors.icon} flex items-center justify-center shadow-lg ${colors.glow}`}
                    >
                      <step.icon className="w-7 h-7" />
                    </div>
                    {/* Dot on line */}
                    <div
                      className={`hidden md:block absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${colors.line} ring-4 ring-[var(--color-bg)]`}
                      style={{ left: "0" }}
                    />
                  </div>

                  {/* Content card */}
                  <div className="glass-card rounded-2xl p-6 sm:p-8 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                        Step {step.number}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
