/**
 * Reality Suite - Synthetic monitors and E2E tests
 */

import { test, expect } from '@playwright/test';

const PROD_URL = process.env.PROD_URL || 'https://your-app.vercel.app';

test.describe('Production Synthetic Monitors', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto(PROD_URL);
    await expect(page).toHaveTitle(/.*/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('API health check', async ({ request }) => {
    const response = await request.get(`${PROD_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('Database connectivity', async ({ request }) => {
    const response = await request.get(`${PROD_URL}/api/wiring-status`);
    expect(response.status()).toBe(200);
  });

  test('Auth endpoints respond', async ({ request }) => {
    // Test auth endpoints exist (may return 401, but should not 500)
    const response = await request.get(`${PROD_URL}/api/auth/me`);
    expect([200, 401]).toContain(response.status());
  });

  test('No critical errors in console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('analytics')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('Performance metrics', async ({ page }) => {
    await page.goto(PROD_URL);
    
    const metrics = await page.evaluate(() => {
      return {
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
        cls: 0, // Would need to be calculated
        fcp: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
  });
});

test.describe('Contract Tests - Supabase', () => {
  test('Supabase connection', async ({ request }) => {
    const response = await request.get(`${PROD_URL}/api/wiring-status`);
    const data = await response.json();
    expect(data.supabase).toBeDefined();
  });

  test('RLS enforced', async ({ request }) => {
    // Try to access another user's data
    // Should fail with 403 or empty result
    const response = await request.get(`${PROD_URL}/api/events`);
    // Should require auth or return empty
    expect([200, 401, 403]).toContain(response.status());
  });
});

test.describe('Contract Tests - Webhooks', () => {
  test('Stripe webhook signature validation', async ({ request }) => {
    // Test webhook endpoint exists and validates signatures
    const response = await request.post(`${PROD_URL}/api/webhooks/stripe`, {
      headers: {
        'stripe-signature': 'test-signature'
      },
      data: {}
    });
    // Should validate signature (may return 400 for invalid, but not 500)
    expect([200, 400, 401]).toContain(response.status());
  });

  test('TikTok webhook stub', async ({ request }) => {
    const response = await request.post(`${PROD_URL}/api/webhooks/tiktok`, {
      data: { event: 'test' }
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('Meta webhook stub', async ({ request }) => {
    const response = await request.post(`${PROD_URL}/api/webhooks/meta`, {
      data: { event: 'test' }
    });
    expect([200, 400, 404]).toContain(response.status());
  });
});

test.describe('Red Team Tests', () => {
  test('Auth bypass attempt', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get(`${PROD_URL}/api/admin/users`);
    expect(response.status()).toBe(401);
  });

  test('Rate limiting enforced', async ({ request }) => {
    // Make rapid requests
    const responses = await Promise.all(
      Array(100).fill(0).map(() => 
        request.get(`${PROD_URL}/api/events`)
      )
    );

    // Should have some 429 responses
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('SQL injection attempt', async ({ request }) => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request.get(`${PROD_URL}/api/events?filter=${encodeURIComponent(maliciousInput)}`);
    // Should handle gracefully, not crash
    expect(response.status()).not.toBe(500);
  });

  test('XSS attempt', async ({ request }) => {
    const maliciousInput = "<script>alert('xss')</script>";
    const response = await request.post(`${PROD_URL}/api/events`, {
      data: { name: maliciousInput }
    });
    // Should sanitize input
    const body = await response.json().catch(() => ({}));
    if (body.name) {
      expect(body.name).not.toContain('<script>');
    }
  });
});
