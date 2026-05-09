"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Wholesale Dealer, Delhi",
    quote:
      "Finventree transformed my business. I used to track 500+ phones in a diary — now everything is digital, real-time. My margins improved by 12% in the first month and I haven't printed a single invoice.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Retailer, Mumbai",
    quote:
      "The IMEI tracking alone is worth it. When a customer came back with a warranty claim, I pulled up the entire history in 5 seconds. No more paper hunts.",
    rating: 5,
  },
  {
    name: "Mohammed Ismail",
    role: "Multi-Store Owner, Hyderabad",
    quote:
      "Managing 3 stores was a nightmare before Finventree. Now I see all inventory, all sales, all payments — one dashboard. Fully paperless GST billing is a dream.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-28 px-6" aria-labelledby="testimonials-heading">
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
            Testimonials
          </span>
          <h2 id="testimonials-heading" className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Trusted by dealers{" "}
            <span className="text-gradient-gold">across India</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg">
            From single-counter shops to multi-city wholesalers — hear how
            Finventree changed their game.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list" aria-label="Customer testimonials">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              role="listitem"
              itemScope
              itemType="https://schema.org/Review"
              className="glass-card rounded-2xl p-8 flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <Quote className="w-8 h-8 text-amber-500/30 mb-4" aria-hidden="true" />
              <blockquote
                itemProp="reviewBody"
                className="text-[var(--color-text-secondary)] leading-relaxed flex-1"
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-1 mb-2" aria-label={`${t.rating} out of 5 stars`}>
                  {[...Array(t.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="font-semibold text-sm" itemProp="author">{t.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]" itemProp="reviewAspect">
                  {t.role}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
