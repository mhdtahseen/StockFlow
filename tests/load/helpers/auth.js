import http from 'k6/http';
import { CONFIG } from '../config.js';

/**
 * Authenticate a test user and return a valid access token.
 * @param {number} userIndex — cycles through the TEST_USERS pool
 */
export function getAuthToken(userIndex = 0) {
  const user = CONFIG.TEST_USERS[userIndex % CONFIG.TEST_USERS.length];
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

  if (res.status !== 200) {
    console.error(`Auth failed for ${user.email}: ${res.status} ${res.body}`);
    return '';
  }

  return JSON.parse(res.body).access_token;
}

/**
 * Build headers for authenticated Supabase requests.
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'apikey': CONFIG.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Prefer': 'return=representation',
  };
}
