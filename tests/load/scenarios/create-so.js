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
    p_customer_id: null, // will use test customer UUID
    p_items: JSON.stringify([
      { phone_id: null, model: 'K6 Test Phone', selling_price: 10000, quantity: 1 },
    ]),
    p_payment_mode: 'CASH',
    p_notes: `k6 SO VU${__VU} iter${__ITER}`,
  };

  const res = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_trade_order`,
    JSON.stringify(payload),
    { headers: authHeaders(token) }
  );

  check(res, {
    'SO created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}
