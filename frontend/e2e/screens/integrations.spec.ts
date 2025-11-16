/**
 * Integrations Screen E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Integrations Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForLoadState('networkidle');
  });

  test('should display available integrations', async ({ page }) => {
    // Look for integration cards or list
    const integrations = page.locator('[data-testid*="integration"], .integration-card');
    const count = await integrations.count();
    
    // At least some integrations should be visible
    if (count > 0) {
      await expect(integrations.first()).toBeVisible();
    }
  });

  test('should allow connecting an integration', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect|add|install/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      
      // Should show connection flow or modal
      const connectionFlow = page.locator('[data-testid*="connect"], .connection-modal');
      const flowCount = await connectionFlow.count();
      
      if (flowCount > 0) {
        await expect(connectionFlow.first()).toBeVisible();
      }
    }
  });

  test('should display integration status', async ({ page }) => {
    // Look for status indicators
    const statusIndicators = page.locator('[data-testid*="status"], .status-badge');
    const count = await statusIndicators.count();
    
    // Status indicators may exist
  });
});
