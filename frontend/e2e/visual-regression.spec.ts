/**
 * Visual regression testing configuration.
 * Uses Playwright for visual comparisons.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard visual regression', async ({ page }) => {
    // Login if needed
    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.getByLabel(/password/i).fill('testpassword');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/dashboard|home|/);
    }

    // Wait for dashboard to load
    await page.waitForSelector('[data-tour="dashboard"]', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('Login form visual regression', async ({ page }) => {
    // Ensure we're on login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for login form
    await page.waitForSelector('form', { timeout: 5000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('login-form.png', {
      fullPage: false,
      maxDiffPixels: 50,
    });
  });

  test('Empty state visual regression', async ({ page }) => {
    // Login first
    await page.goto('/');
    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.getByLabel(/password/i).fill('testpassword');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/dashboard|home|/);
    }

    // Navigate to a section that shows empty state
    // This might need adjustment based on your actual UI
    await page.waitForLoadState('networkidle');

    // Take screenshot of empty state area
    const emptyState = page.locator('[data-testid="empty-state"]').first();
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Dark mode visual regression', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode
    const darkModeToggle = page.locator('[aria-label*="dark" i], [aria-label*="theme" i]').first();
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    }

    // Take screenshot
    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Mobile view visual regression', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
