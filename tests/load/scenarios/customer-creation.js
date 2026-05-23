import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { CONFIG } from '../config.js';

export const options = {
  vus: 30,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  const tokens = CONFIG.TEST_USERS.map((_, i) => getAuthToken(i));
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];

  const payload = {
    name: `K6 Customer VU${__VU} #${__ITER}`,
    phone: `+91${9000000000 + __VU * 1000 + __ITER}`,
    type: 'customer',
  };

  const res = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/counterparties`,
    JSON.stringify(payload),
    { headers: authHeaders(token) }
  );

  check(res, {
    'customer created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}
