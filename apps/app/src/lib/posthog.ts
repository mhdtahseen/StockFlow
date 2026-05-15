import posthog from "posthog-js";

const key  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
const host = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

export function initPostHog() {
  if (!key) return; // No-op in envs without the key (CI, local without .env.local)
  posthog.init(key, {
    api_host: host ?? "https://us.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,   // We fire $pageview manually on route change
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,     // Mask text inputs by default (PII safety)
    },
    loaded(ph) {
      // Disable session recording in dev so replays don't pollute production data
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
}

export default posthog;
