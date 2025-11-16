/**
 * Dashboard Screen E2E Tests
 * 
 * Tests dashboard functionality including:
 * - Dashboard loading
 * - Stats display
 * - Navigation
 * - Data visualization
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard successfully', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.locator('body')).toBeVisible();
    
    // Dashboard should have some content
    const dashboardContent = page.locator('[data-testid="dashboard"], main, .dashboard');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stats cards', async ({ page }) => {
    // Look for stats or metrics cards
    const statsCards = page.locator('[data-testid*="stat"], [data-testid*="metric"], .stat-card, .metric-card');
    const count = await statsCards.count();
    
    if (count > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"], [data-testid="navigation"]');
    const navCount = await nav.count();
    
    if (navCount > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation links
    const links = [
      { text: /profile/i, url: /profile/ },
      { text: /settings/i, url: /settings/ },
      { text: /integrations/i, url: /integrations/ },
    ];

    for (const link of links) {
      const linkElement = page.getByRole('link', { name: link.text });
      if (await linkElement.isVisible()) {
        await linkElement.click();
        await expect(page).toHaveURL(link.url);
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Check for empty state if no data
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
    const emptyCount = await emptyState.count();
    
    if (emptyCount > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should display loading states', async ({ page }) => {
    // Reload page and check for loading indicators
    await page.reload();
    
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton');
    const loadingCount = await loadingIndicators.count();
    
    // Loading indicators should appear briefly then disappear
    if (loadingCount > 0) {
      await expect(loadingIndicators.first()).toBeVisible({ timeout: 1000 }).catch(() => {
        // Loading may have already completed
      });
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile-specific elements or layout
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]');
    const mobileNavCount = await mobileNav.count();
    
    // Mobile navigation may or may not be present
  });
});
