"use client";

import { motion } from "framer-motion";
import {
  Smartphone,
  BarChart3,
  FileText,
  ScanLine,
  Wallet,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Smart Inventory",
    description:
      "Real-time stock tracking across multiple locations with automatic low-stock alerts and device catalog with 10,000+ models.",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-500",
    span: "col-span-1 sm:col-span-2 lg:col-span-2",
  },
  {
    icon: ScanLine,
    title: "IMEI Tracking",
    description:
      "Scan, log, and trace every device by IMEI. Full chain-of-custody from purchase to sale.",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-500",
    span: "col-span-1 sm:col-span-1 lg:col-span-1",
  },
  {
    icon: FileText,
    title: "Paperless GST Billing",
    description:
      "Generate GST-compliant invoices digitally — no paper, no printer. Auto-calculate taxes, e-way bill support, and share invoices via WhatsApp instantly.",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-500",
    span: "col-span-1 sm:col-span-1 lg:col-span-1",
  },
  {
    icon: Wallet,
    title: "Financial Ledger",
    description:
      "Customer wallets, payment tracking, credit management, and complete financial overview in one place.",
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-500",
    span: "col-span-1 sm:col-span-1 lg:col-span-1",
  },
  {
    icon: BarChart3,
    title: "Business Intelligence",
    description:
      "Margins, fast-movers, dead stock analysis, and demand forecasting — all at a glance.",
    gradient: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-500",
    span: "col-span-1 sm:col-span-2 lg:col-span-2",
  },
  {
    icon: Shield,
    title: "Multi-Tenant & Secure",
    description:
      "Each business gets its own isolated environment. Bank-grade encryption with role-based access control.",
    gradient: "from-cyan-500/20 to-sky-500/10",
    iconColor: "text-cyan-500",
    span: "col-span-1 sm:col-span-1 lg:col-span-1",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-28 px-6" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-500">
            Features
          </span>
          <h2 id="features-heading" className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything you need,{" "}
            <span className="text-gradient-gold">nothing you don&apos;t</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg">
            Purpose-built for the Indian smartphone trade — 100% digital, zero
            paper, from a single counter shop to a multi-city wholesale operation.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.ul
          role="list"
          aria-label="Finventree features"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature) => (
            <motion.li
              key={feature.title}
              className={`glass-card rounded-2xl p-6 sm:p-8 ${feature.span}`}
              variants={cardVariants}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5`}
                aria-hidden="true"
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
