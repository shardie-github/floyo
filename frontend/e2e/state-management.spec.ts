/**
 * State Management E2E Tests
 * 
 * Tests Zustand store functionality in browser.
 */

import { test, expect } from '@playwright/test';

test.describe('State Management', () => {
  test('should persist theme preference', async ({ page, context }) => {
    await page.goto('/');
    
    // Change theme
    await page.getByLabel(/switch to/i).click();
    
    // Reload page
    await page.reload();
    
    // Theme should be persisted
    const html = await page.locator('html');
    const classes = await html.getAttribute('class');
    expect(classes).toContain('dark');
  });

  test('should manage notifications', async ({ page }) => {
    await page.goto('/');
    
    // Add notification via store (if exposed in dev mode)
    await page.evaluate(() => {
      if ((window as any).useNotificationStore) {
        (window as any).useNotificationStore.getState().addNotification({
          type: 'success',
          message: 'Test notification',
        });
      }
    });
    
    // Notification should appear
    await expect(page.getByText('Test notification')).toBeVisible();
  });
});
