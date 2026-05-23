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
    amount: 500 + Math.floor(Math.random() * 1000),
    type: 'CREDIT',
    description: `k6 ledger VU${__VU} iter${__ITER}`,
    payment_mode: 'CASH',
  };

  const res = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/ledger`,
    JSON.stringify(payload),
    { headers: authHeaders(token) }
  );

  check(res, {
    'ledger entry created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
