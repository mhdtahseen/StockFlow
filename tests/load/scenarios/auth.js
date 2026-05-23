import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../config.js';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
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

  check(res, {
    'login 200': (r) => r.status === 200,
    'has access_token': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  sleep(1);
}
