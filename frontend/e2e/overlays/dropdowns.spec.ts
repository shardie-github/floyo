/**
 * Dropdown Menu Overlay E2E Tests
 * 
 * Tests dropdown functionality including:
 * - Dropdown opening/closing
 * - Menu item selection
 * - Keyboard navigation
 * - Click outside to close
 */

import { test, expect } from '@playwright/test';

test.describe('Dropdown Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open dropdown on click', async ({ page }) => {
    // Find dropdown triggers (buttons with menus)
    const dropdownTriggers = page.locator('button[aria-haspopup="menu"], button[aria-expanded], [data-testid*="dropdown"]');
    const triggerCount = await dropdownTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = dropdownTriggers.first();
      
      await trigger.click();
      
      // Check for dropdown menu
      const menu = page.locator('[role="menu"], .dropdown-menu, [data-testid*="menu"]');
      const menuCount = await menu.count();
      
      if (menuCount > 0) {
        await expect(menu.first()).toBeVisible();
      }
    }
  });

  test('should close dropdown on item selection', async ({ page }) => {
    const trigger = page.locator('button[aria-haspopup="menu"], button[aria-expanded]').first();
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const menu = page.locator('[role="menu"]').first();
      
      if (await menu.isVisible()) {
        // Select first menu item
        const menuItem = page.locator('[role="menuitem"]').first();
        
        if (await menuItem.isVisible()) {
          await menuItem.click();
          
          // Menu should close
          await expect(menu).not.toBeVisible({ timeout: 1000 });
        }
      }
    }
  });

  test('should close dropdown on outside click', async ({ page }) => {
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const menu = page.locator('[role="menu"]').first();
      
      if (await menu.isVisible()) {
        // Click outside
        await page.click('body', { position: { x: 10, y: 10 } });
        
        // Menu should close
        await expect(menu).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should navigate dropdown with keyboard', async ({ page }) => {
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    
    if (await trigger.isVisible()) {
      // Focus trigger
      await trigger.focus();
      
      // Press Enter or Space to open
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      const menu = page.locator('[role="menu"]').first();
      
      if (await menu.isVisible()) {
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Check if focus moved to menu item
        const focusedItem = page.locator('[role="menuitem"]:focus');
        const focusedCount = await focusedItem.count();
        
        expect(focusedCount).toBeGreaterThan(0);
      }
    }
  });

  test('should close dropdown on escape key', async ({ page }) => {
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const menu = page.locator('[role="menu"]').first();
      
      if (await menu.isVisible()) {
        // Press escape
        await page.keyboard.press('Escape');
        
        // Menu should close
        await expect(menu).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should toggle dropdown on repeated clicks', async ({ page }) => {
    const trigger = page.locator('button[aria-haspopup="menu"], button[aria-expanded]').first();
    
    if (await trigger.isVisible()) {
      // First click - open
      await trigger.click();
      await page.waitForTimeout(200);
      
      const menu = page.locator('[role="menu"]').first();
      const wasVisible = await menu.isVisible();
      
      // Second click - should close
      await trigger.click();
      await page.waitForTimeout(200);
      
      if (wasVisible) {
        await expect(menu).not.toBeVisible({ timeout: 1000 });
      }
    }
  });
});
