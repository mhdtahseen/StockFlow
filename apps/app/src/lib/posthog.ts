import posthog, { type PostHog } from "posthog-js";

const key  = (import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN || import.meta.env.VITE_POSTHOG_KEY) as string | undefined;
const host = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST) as string | undefined;

let initialized = false;

export function initPostHog() {
  // Disable in development to save ingestion quota
  if (!key || import.meta.env.DEV) return;

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
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      // Only enable session recording in production to save on quotas and keep dev noise out
      enabled: !import.meta.env.DEV,
    },
    loaded: () => {
      initialized = true;
    },
  });

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
