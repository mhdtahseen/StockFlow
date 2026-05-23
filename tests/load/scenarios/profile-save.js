import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { CONFIG } from '../config.js';

export const options = {
  vus: 30,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  const tokens = CONFIG.TEST_USERS.map((_, i) => getAuthToken(i));
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];
  const headers = authHeaders(token);

  // Update profile
  const profileRes = http.patch(
    `${CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.placeholder`,
    JSON.stringify({ full_name: `LoadTest User VU${__VU}` }),
    { headers }
  );

  check(profileRes, {
    'profile updated': (r) => r.status === 200 || r.status === 204,
  });

  // Update auth metadata
  const authRes = http.put(
    `${CONFIG.SUPABASE_URL}/auth/v1/user`,
    JSON.stringify({ data: { full_name: `LoadTest User VU${__VU}` } }),
    { headers }
  );

  check(authRes, {
    'auth metadata updated': (r) => r.status === 200,
  });

  sleep(2);
}
