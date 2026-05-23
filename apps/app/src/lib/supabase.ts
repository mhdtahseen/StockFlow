import { createClient } from '@supabase/supabase-js'

/** Global fetch wrapper with 15s timeout — prevents indefinite hangs on native
 *  cold starts where the WebView networking stack may be slow to initialize. */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  // Merge with any existing signal from the caller
  const signal = init?.signal
    ? init.signal
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
