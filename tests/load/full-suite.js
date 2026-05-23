/**
 * Full Load Test Suite — 300 VUs across read-heavy, write-heavy, and auth scenarios.
 *
 * Run: k6 run tests/load/full-suite.js
 *      k6 run tests/load/full-suite.js -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... -e TEST_PASS=...
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthToken, authHeaders } from './helpers/auth.js';
import { CONFIG } from './config.js';

export const options = {
  scenarios: {
    // Auth flow — 50 VUs
    auth_flow: {
      executor: 'ramping-vus',
      exec: 'authScenario',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
    // Read-heavy — 150 VUs (inventory listing, profile reads)
    read_heavy: {
      executor: 'ramping-vus',
      exec: 'readScenario',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 150 },
        { duration: '5m', target: 150 },
        { duration: '1m', target: 0 },
      ],
    },
    // Write-heavy — 100 VUs (SO, PO, ledger, payments, customers)
    write_heavy: {
      executor: 'ramping-vus',
      exec: 'writeScenario',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

// ─── Setup: authenticate all test users ───
export function setup() {
  const tokens = CONFIG.TEST_USERS.map((_, i) => getAuthToken(i));
  return { tokens };
}

// ─── Auth scenario ───
export function authScenario() {
  const user = CONFIG.TEST_USERS[__VU % CONFIG.TEST_USERS.length];
  const res = http.post(
    `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
      },
    }
  );
  check(res, { 'auth 200': (r) => r.status === 200 });
  sleep(1);
}

// ─── Read scenario ───
export function readScenario(data) {
  const token = data.tokens[__VU % data.tokens.length];
  const headers = authHeaders(token);

  // Inventory listing
  const phonesRes = http.get(
    `${CONFIG.SUPABASE_URL}/rest/v1/phones?select=*&order=created_at.desc&limit=50`,
    { headers }
  );
  check(phonesRes, { 'phones 200': (r) => r.status === 200 });

  sleep(0.5);

  // Counterparties listing
  const customersRes = http.get(
    `${CONFIG.SUPABASE_URL}/rest/v1/counterparties?select=*&order=name.asc&limit=50`,
    { headers }
  );
  check(customersRes, { 'customers 200': (r) => r.status === 200 });

  sleep(1);
}

// ─── Write scenario ───
export function writeScenario(data) {
  const token = data.tokens[__VU % data.tokens.length];
  const headers = authHeaders(token);

  // Ledger entry
  const ledgerRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/ledger`,
    JSON.stringify({
      amount: 100 + Math.floor(Math.random() * 900),
      type: 'CREDIT',
      description: `k6 full-suite VU${__VU}`,
      payment_mode: 'CASH',
    }),
    { headers }
  );
  check(ledgerRes, { 'ledger created': (r) => r.status === 200 || r.status === 201 });

  sleep(1);

  // Customer creation
  const custRes = http.post(
    `${CONFIG.SUPABASE_URL}/rest/v1/counterparties`,
    JSON.stringify({
      name: `K6 Suite Customer VU${__VU} #${__ITER}`,
      phone: `+91${8000000000 + __VU * 100 + __ITER}`,
      type: 'customer',
    }),
    { headers }
  );
  check(custRes, { 'customer created': (r) => r.status === 200 || r.status === 201 });

  sleep(2);
}
