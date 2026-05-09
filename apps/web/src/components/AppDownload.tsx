"use client";

import { motion } from "framer-motion";
import { Smartphone, Tablet, Monitor, CheckCircle2 } from "lucide-react";

const platforms = [
  {
    icon: Smartphone,
    label: "Android",
    sublabel: "Available now",
    badge: "Download on",
    store: "Google Play",
    color: "text-emerald-400",
    ring: "ring-emerald-500/30",
    glow: "shadow-emerald-500/20",
    available: true,
    href: "#",
  },
  {
    icon: Smartphone,
    label: "iOS",
    sublabel: "Coming soon",
    badge: "Download on the",
    store: "App Store",
    color: "text-amber-400",
    ring: "ring-amber-500/30",
    glow: "shadow-amber-500/20",
    available: false,
    href: undefined,
  },
];

const deviceSupport = [
  { icon: Smartphone, label: "Android Phones", note: "Native app" },
  { icon: Tablet, label: "Tablets", note: "Optimized layout" },
  { icon: Monitor, label: "Laptops & Desktops", note: "Full web app" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

// Google Play SVG icon
function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
      <path d="M3.18 23.76A2 2 0 0 1 2 22V2a2 2 0 0 1 1.18-1.76l11.46 11.76L3.18 23.76Z" fill="#4FC3F7" />
      <path d="M22 12l-4.36 2.52-3.1-3.18 3.1-3.18L22 10.52A1.5 1.5 0 0 1 22 12Z" fill="#FFCA28" />
      <path d="M3.18.24 14.64 12 17.74 8.82 5.38.18A1.98 1.98 0 0 0 3.18.24Z" fill="#F44336" />
      <path d="M3.18 23.76c.63.4 1.44.43 2.2-.06l12.36-7.12L14.64 12 3.18 23.76Z" fill="#4CAF50" />
    </svg>
  );
}

// Apple App Store SVG icon
function AppStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z" />
    </svg>
  );
}

export default function AppDownload() {
  return (
    <section
      aria-labelledby="app-download-heading"
      className="relative py-24 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 mb-6">
            <Smartphone className="w-4 h-4" aria-hidden="true" />
            Mobile-first · Works everywhere
          </span>
          <h2
            id="app-download-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Your business,{" "}
            <span className="text-gradient-gold">in your pocket</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Finventree is built mobile-first for on-the-go dealers. Use it on your
            Android phone today — iOS and tablet layouts ship soon. Need a bigger
            screen? Open it in any browser.
          </p>
        </motion.div>

        {/* App store cards */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          {platforms.map((p, i) => (
            <motion.div
              key={p.store}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {p.available ? (
                <a
                  href={p.href}
                  className={`glass-card group flex items-center gap-4 px-6 py-5 rounded-2xl ring-1 ${p.ring} shadow-xl ${p.glow} hover:scale-105 transition-transform duration-300 min-w-[220px]`}
                  aria-label={`${p.badge} ${p.store}`}
                >
                  <div className={`shrink-0 ${p.color}`}>
                    <PlayStoreIcon />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[var(--text-secondary)]">{p.badge}</p>
                    <p className="font-semibold text-base leading-tight">{p.store}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {p.sublabel}
                    </span>
                  </div>
                </a>
              ) : (
                <div
                  className={`glass-card flex items-center gap-4 px-6 py-5 rounded-2xl ring-1 ${p.ring} opacity-70 min-w-[220px] cursor-not-allowed select-none`}
                  aria-label={`${p.store} — ${p.sublabel}`}
                >
                  <div className={`shrink-0 ${p.color}`}>
                    <AppStoreIcon />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[var(--text-secondary)]">{p.badge}</p>
                    <p className="font-semibold text-base leading-tight">{p.store}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                      </span>
                      {p.sublabel}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Device compatibility strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-2xl p-8"
        >
          <p className="text-center text-sm font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-8">
            Works across every device
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {deviceSupport.map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div
                  key={d.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{d.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{d.note}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
