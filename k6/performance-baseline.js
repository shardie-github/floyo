/**
 * k6 performance baseline tests for Floyo API.
 * 
 * Establishes performance baselines and guards against regressions.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },    // Stay at 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },    // Stay at 100 users
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // Health check endpoint (should be fast)
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1);

  // API endpoints (with auth token in real tests)
  // For baseline, test public endpoints
  let apiRes = http.get(`${BASE_URL}/api/stats`);
  check(apiRes, {
    'API response status is 200 or 401': (r) => [200, 401].includes(r.status),
    'API response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  // Performance baseline checks
  const p95Latency = data.metrics.http_req_duration.values['p(95)'];
  const p99Latency = data.metrics.http_req_duration.values['p(99)'];
  const errorRateValue = data.metrics.http_req_failed.values.rate;

  const baseline = {
    p95Latency: 500,
    p99Latency: 1000,
    errorRate: 0.01,
  };

  const passed = 
    p95Latency <= baseline.p95Latency &&
    p99Latency <= baseline.p99Latency &&
    errorRateValue <= baseline.errorRate;

  return {
    'stdout': passed 
      ? '? Performance baseline passed'
      : `? Performance baseline failed: p95=${p95Latency}ms, p99=${p99Latency}ms, errors=${errorRateValue}`,
    'summary.json': JSON.stringify(data, null, 2),
  };
}
