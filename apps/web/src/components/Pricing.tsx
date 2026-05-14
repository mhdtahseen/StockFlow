"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    description: "Perfect for solo shop owners getting started.",
    features: [
      "1 team member",
      "Up to 100 devices",
      "Sales & purchase orders",
      "Customer directory",
      "PDF invoice generation",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    href: "/pricing?plan=starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹799",
    period: "/month",
    description: "For growing businesses with serious ambitions.",
    features: [
      "Up to 10 team members",
      "Unlimited devices",
      "IMEI scanner & catalog autofill",
      "Advanced P&L ledger",
      "Analytics & reporting",
      "Credit & receivables tracking",
      "Public share links",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    href: "/pricing?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "₹1,099",
    period: "/month",
    description: "For large-scale wholesale and distribution operations.",
    features: [
      "Unlimited team members",
      "Everything in Pro",
      "Bulk PDF invoices",
      "Dealer trade network",
      "SLA guarantee",
      "Dedicated support",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    href: "/pricing?plan=enterprise",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6" aria-labelledby="pricing-heading">
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
            Pricing
          </span>
          <h2 id="pricing-heading" className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Transparent pricing,{" "}
            <span className="text-gradient-gold">no surprises</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg">
            Start free for 14 days. No credit card required. Scale as you grow.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlighted
                  ? "glass-card glow-gold border-amber-500/30"
                  : "glass-card"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-[var(--color-text-muted)] text-sm">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                  >
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 text-center block ${
                  plan.highlighted
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
