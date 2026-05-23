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

  // Test customer settlement (FIFO)
  const fifoRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/record_customer_settlement_fifo`,
    JSON.stringify({
      p_customer_id: null, // replace with test customer UUID
      p_amount: 500 + Math.floor(Math.random() * 500),
      p_mode: 'CASH',
      p_note: `k6 payment VU${__VU}`,
    }),
    { headers }
  );

  check(fifoRes, {
    'FIFO settlement': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);

  // Test supplier payment
  const supplierRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/rpc/record_supplier_settlement_fifo`,
    JSON.stringify({
      p_supplier_id: null, // replace with test supplier UUID
      p_amount: 300 + Math.floor(Math.random() * 300),
      p_mode: 'UPI',
      p_note: `k6 supplier payment VU${__VU}`,
    }),
    { headers }
  );

  check(supplierRes, {
    'supplier settlement': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}
