import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { CONFIG } from '../config.js';

export const options = {
  vus: 30,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2500'],
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
    p_supplier_id: null, // will use test supplier UUID
    p_items: JSON.stringify([
      { model: 'K6 Test Phone', cost_price: 8000, quantity: 1 },
    ]),
    p_notes: `k6 PO VU${__VU} iter${__ITER}`,
  };

  const res = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_purchase_order`,
    JSON.stringify(payload),
    { headers: authHeaders(token) }
  );

  check(res, {
    'PO created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}
