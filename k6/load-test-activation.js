/**
 * K6 Load Test for Activation Flow
 * 
 * Tests the activation flow endpoints with 100+ concurrent users.
 * Usage: k6 run k6/load-test-activation.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const activationRate = new Rate('activation_events_tracked');
const funnelRate = new Rate('funnel_queries_successful');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.02'],   // Error rate should be less than 2%
    activation_events_tracked: ['rate>0.95'], // 95% of activation events should succeed
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // Test 1: Track activation event
  const activationEvent = {
    events: [
      {
        event_type: 'signup',
        user_id: `test-user-${__VU}-${__ITER}`,
        timestamp: new Date().toISOString(),
        properties: {
          source: 'load_test',
        },
      },
    ],
  };

  const trackResponse = http.post(
    `${BASE_URL}/api/analytics/track`,
    JSON.stringify(activationEvent),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const trackSuccess = check(trackResponse, {
    'activation event tracked': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  activationRate.add(trackSuccess);

  sleep(1);

  // Test 2: Get activation funnel
  const funnelResponse = http.get(`${BASE_URL}/api/analytics/activation-funnel?days=30`);

  const funnelSuccess = check(funnelResponse, {
    'funnel data retrieved': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has funnel data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('funnel') && data.hasOwnProperty('activation_rate');
      } catch {
        return false;
      }
    },
  });

  funnelRate.add(funnelSuccess);

  sleep(1);

  // Test 3: Get insights (if authenticated)
  // Note: In real test, you'd need to authenticate first
  // const insightsResponse = http.get(`${BASE_URL}/api/insights?days_back=30`, {
  //   headers: { 'Authorization': `Bearer ${token}` },
  // });
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
