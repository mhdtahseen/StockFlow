import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { CONFIG } from '../config.js';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const tokens = CONFIG.TEST_USERS.map((_, i) => getAuthToken(i));
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];

  const res = http.get(
    `${CONFIG.SUPABASE_URL}/rest/v1/phones?select=*&order=created_at.desc&limit=100`,
    { headers: authHeaders(token) }
  );

  check(res, {
    'status 200': (r) => r.status === 200,
    'returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(1);
}
