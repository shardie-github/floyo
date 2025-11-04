/**
 * k6 stress test - push system to its limits.
 * Tests system behavior under extreme load.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up quickly
    { duration: '1m', target: 100 },     // Increase load
    { duration: '1m', target: 200 },     // Peak load
    { duration: '1m', target: 200 },    // Sustain peak
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // Relaxed thresholds for stress test
    http_req_failed: ['rate<0.1'], // Allow 10% errors under stress
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // Stress test public endpoints
  const endpoints = [
    '/health',
    '/api/stats',
  ];

  for (const path of endpoints) {
    const res = http.get(`${BASE_URL}${path}`);

    const success = check(res, {
      [`${path} status is 200 or 401`]: (r) => [200, 401].includes(r.status),
    });

    if (!success) {
      errorRate.add(1);
    }
  }

  sleep(0.1); // Minimal sleep for maximum load
}

export function handleSummary(data) {
  const p95Latency = data.metrics.http_req_duration.values['p(95)'];
  const p99Latency = data.metrics.http_req_duration.values['p(99)'];
  const errorRateValue = data.metrics.http_req_failed.values.rate;
  const totalRequests = data.metrics.http_reqs.values.count;
  const avgLatency = data.metrics.http_req_duration.values.avg;

  return {
    'stdout': `\nStress Test Results:
  Total requests: ${totalRequests}
  Average latency: ${avgLatency.toFixed(2)}ms
  p95 latency: ${p95Latency}ms
  p99 latency: ${p99Latency}ms
  Error rate: ${(errorRateValue * 100).toFixed(2)}%
  
  System handled ${totalRequests} requests with ${(errorRateValue * 100).toFixed(2)}% error rate.
`,
    'summary.json': JSON.stringify(data, null, 2),
  };
}
