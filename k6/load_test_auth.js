/**
 * k6 load tests for authenticated endpoints.
 * Tests user workflows with authentication.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const authErrorRate = new Rate('auth_errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },    // Stay at 10 users
    { duration: '1m', target: 25 },    // Ramp up to 25 users
    { duration: '3m', target: 25 },    // Stay at 25 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'], // Allow 5% errors for auth endpoints
    errors: ['rate<0.05'],
    auth_errors: ['rate<0.1'], // Allow 10% auth errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';
let authToken = null;

function login() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'testpassword',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  if (loginSuccess) {
    const body = JSON.parse(loginRes.body);
    authToken = body.access_token;
    return true;
  } else {
    authErrorRate.add(1);
    return false;
  }
}

export default function () {
  // Login if not authenticated
  if (!authToken) {
    const loggedIn = login();
    if (!loggedIn) {
      sleep(1);
      return;
    }
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Test authenticated endpoints
  const endpoints = [
    { method: 'GET', path: '/api/stats' },
    { method: 'GET', path: '/api/events?skip=0&limit=10' },
    { method: 'GET', path: '/api/patterns?skip=0&limit=10' },
    { method: 'GET', path: '/api/suggestions?skip=0&limit=10' },
  ];

  for (const endpoint of endpoints) {
    const res = http.request(
      endpoint.method,
      `${BASE_URL}${endpoint.path}`,
      null,
      { headers }
    );

    const success = check(res, {
      [`${endpoint.method} ${endpoint.path} status is 200`]: (r) => r.status === 200,
      [`${endpoint.method} ${endpoint.path} response time < 500ms`]: (r) => r.timings.duration < 500,
    });

    if (!success) {
      errorRate.add(1);
      // If auth error, reset token
      if (res.status === 401) {
        authToken = null;
        authErrorRate.add(1);
      }
    }

    sleep(0.5);
  }

  sleep(1);
}

export function handleSummary(data) {
  const p95Latency = data.metrics.http_req_duration.values['p(95)'];
  const p99Latency = data.metrics.http_req_duration.values['p(99)'];
  const errorRateValue = data.metrics.http_req_failed.values.rate;
  const authErrorRateValue = data.metrics.auth_errors.values.rate;

  return {
    'stdout': `\nLoad Test Results:
  p95 latency: ${p95Latency}ms
  p99 latency: ${p99Latency}ms
  Error rate: ${(errorRateValue * 100).toFixed(2)}%
  Auth error rate: ${(authErrorRateValue * 100).toFixed(2)}%
`,
    'summary.json': JSON.stringify(data, null, 2),
  };
}
