import { createClient } from '@supabase/supabase-js'

/** Global fetch wrapper with 15s timeout — prevents indefinite hangs on native
 *  cold starts where the WebView networking stack may be slow to initialize.
 *  Composes our timeout signal with any caller-provided signal so whichever
 *  fires first aborts the request (fixes: Supabase JS v2 always passes its own
 *  signal which previously bypassed our timeout entirely). */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  // Compose: abort on whichever signal fires first (ours or the caller's)
  const signal = init?.signal
    ? AbortSignal.any([controller.signal, init.signal])
    : controller.signal;

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
    },
    global: {
      fetch: fetchWithTimeout,
    },
  }
)
