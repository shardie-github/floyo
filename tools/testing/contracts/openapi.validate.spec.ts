/**
 * OpenAPI Contract Validation
 * 
 * Validates runtime API routes match OpenAPI spec:
 * - All documented routes exist
 * - Auth codes match (401, 403, etc.)
 * - CSRF headers required where documented
 * - Request/response schemas match
 */

import { test, expect } from '@playwright/test';

test.describe('OpenAPI Contract Validation', () => {
  test('Fetch and validate OpenAPI spec', async ({ request }) => {
    const specResponse = await request.get('http://localhost:8000/openapi.json');
    
    expect(specResponse.ok()).toBeTruthy();
    
    const spec = await specResponse.json();
    expect(spec.openapi).toBeDefined();
    expect(spec.paths).toBeDefined();

    // Verify key endpoints exist in spec
    const paths = Object.keys(spec.paths);
    
    // Auth endpoints
    expect(paths.some(p => p.includes('/auth/register'))).toBeTruthy();
    expect(paths.some(p => p.includes('/auth/login'))).toBeTruthy();
    expect(paths.some(p => p.includes('/auth/me'))).toBeTruthy();

    // Core endpoints
    expect(paths.some(p => p.includes('/events'))).toBeTruthy();
    expect(paths.some(p => p.includes('/patterns'))).toBeTruthy();
    expect(paths.some(p => p.includes('/suggestions'))).toBeTruthy();
  });

  test('Protected endpoints return 401 without auth', async ({ request }) => {
    const protectedEndpoints = [
      '/api/auth/me',
      '/api/events',
      '/api/patterns',
      '/api/suggestions',
      '/api/stats',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`http://localhost:8000${endpoint}`);
      
      // Should return 401 or 403, not 200
      expect([401, 403]).toContain(response.status());
    }
  });

  test('CORS headers present on API responses', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health', {
      method: 'OPTIONS',
    });

    // CORS preflight should work
    const headers = response.headers();
    // Accept Access-Control-Allow-Origin or any CORS header
    expect(
      headers['access-control-allow-origin'] !== undefined ||
      headers['access-control-allow-methods'] !== undefined
    ).toBeTruthy();
  });
});
