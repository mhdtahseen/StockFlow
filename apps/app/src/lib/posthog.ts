import posthog, { type PostHog } from "posthog-js";

const key  = (import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN || import.meta.env.VITE_POSTHOG_KEY) as string | undefined;
const host = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST) as string | undefined;

// "native" when built with .env.capacitor (iOS/Android), "web" otherwise
const platform = import.meta.env.VITE_CAPACITOR === "true" ? "native" : "web";

let initialized = false;

export function initPostHog() {
  // Disable in development / local environment to save ingestion quota
  if (!key || import.meta.env.DEV) return;

  // Belt-and-suspenders: block any preview / non-Vite-DEV localhost run
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return;

  // Clear any stale opt-out flag that may have been set by a previous version of this code
  // which called ph.opt_out_capturing() in dev mode. Without this, PostHog silently drops
  // all events even after that line was removed.
  const optOutKey = `__ph_opt_in_out_${key}`;
  if (localStorage.getItem(optOutKey) === "0") {
    localStorage.removeItem(optOutKey);
  }

  posthog.init(key, {
    api_host: host ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    // Autocapture fires ~40-60 events/session — too expensive for 1M quota.
    // We use deliberate manual captures instead for full control.
    autocapture: false,
    session_recording: {
      maskAllInputs: true,
      // Sample 10% of sessions — enough for UX review without burning quota.
      // At 100 beta users × 30 days that's ~300 recordings/month.
      sampleRate: 0.1,
    },
    loaded: () => {
      initialized = true;
    },
  });

  // Tag every event with the platform so native vs web can be split in PostHog dashboards
  posthog.register({ platform });

  // Mark initialized synchronously so proxy starts forwarding immediately
  initialized = true;
}

// Safe proxy: silently drops all calls when PostHog has not been initialized
// (i.e. VITE_POSTHOG_KEY is not set). This prevents runtime errors in local dev
// and CI where the env var is absent but posthog.capture/identify/reset are called.
const safePosthog = new Proxy({} as PostHog, {
  get(_target, prop) {
    if (initialized) {
      return (posthog as any)[prop];
    }
    // Return a no-op function for any method call
    return typeof (posthog as any)[prop] === "function" ? () => {} : undefined;
  },
});

export default safePosthog;
