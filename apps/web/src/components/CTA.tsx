"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="relative glass-card rounded-3xl p-10 sm:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Background orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Ready to modernize{" "}
              <br className="hidden sm:block" />
              <span className="text-gradient-gold">your business?</span>
            </h2>
            <p className="mt-5 text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
              Join hundreds of smart dealers who went fully paperless with
              Finventree. Start your 14-day free trial — no credit card needed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#pricing"
                className="btn-primary text-base px-8 py-3.5 rounded-2xl inline-flex items-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="mailto:sales@finventree.in"
                className="btn-secondary text-base px-8 py-3.5 rounded-2xl"
              >
                Talk to Sales
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              No credit card required &middot; Setup in under 5 minutes
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
