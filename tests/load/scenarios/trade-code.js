import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { CONFIG } from '../config.js';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'], // higher tolerance — may return 404 for non-existent codes
  },
};

export function setup() {
  const tokens = CONFIG.TEST_USERS.map((_, i) => getAuthToken(i));
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];
  const headers = authHeaders(token);

  // Generate a random 6-char code (most will not exist — tests lookup performance)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const lookupRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/lookup_tenant_by_trade_code`,
    JSON.stringify({ p_code: code }),
    { headers }
  );

  check(lookupRes, {
    'lookup responded': (r) => r.status === 200,
  });

  sleep(1);

  // Connect flow (will fail gracefully for non-existent codes)
  const connectRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/connect_by_trade_code`,
    JSON.stringify({ p_code: code }),
    { headers }
  );

  check(connectRes, {
    'connect responded': (r) => r.status === 200 || r.status === 404 || r.status === 400,
  });

  sleep(2);
}
