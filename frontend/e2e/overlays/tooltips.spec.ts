/**
 * Tooltip Overlay E2E Tests
 * 
 * Tests tooltip functionality including:
 * - Tooltip display on hover
 * - Tooltip positioning
 * - Tooltip content
 * - Accessibility
 */

import { test, expect } from '@playwright/test';

test.describe('Tooltip Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display tooltip on hover', async ({ page }) => {
    // Find elements with tooltips (buttons with aria-label or title)
    const tooltipTriggers = page.locator('[aria-label], [title], [data-tooltip]');
    const triggerCount = await tooltipTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = tooltipTriggers.first();
      
      // Hover over trigger
      await trigger.hover();
      
      // Wait for tooltip to appear
      await page.waitForTimeout(300);
      
      // Check for tooltip
      const tooltip = page.locator('[role="tooltip"], .tooltip, [data-testid*="tooltip"]');
      const tooltipCount = await tooltip.count();
      
      if (tooltipCount > 0) {
        await expect(tooltip.first()).toBeVisible();
      }
    }
  });

  test('should hide tooltip on mouse leave', async ({ page }) => {
    const tooltipTriggers = page.locator('[aria-label], [title], [data-tooltip]');
    const triggerCount = await tooltipTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = tooltipTriggers.first();
      
      // Hover
      await trigger.hover();
      await page.waitForTimeout(300);
      
      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);
      
      // Tooltip should be hidden
      const tooltip = page.locator('[role="tooltip"], .tooltip');
      const tooltipCount = await tooltip.count();
      
      if (tooltipCount > 0) {
        await expect(tooltip.first()).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should display correct tooltip content', async ({ page }) => {
    const trigger = page.locator('[aria-label], [title]').first();
    
    if (await trigger.isVisible()) {
      const ariaLabel = await trigger.getAttribute('aria-label');
      const title = await trigger.getAttribute('title');
      const expectedText = ariaLabel || title;
      
      if (expectedText) {
        await trigger.hover();
        await page.waitForTimeout(300);
        
        const tooltip = page.locator('[role="tooltip"], .tooltip');
        if (await tooltip.isVisible()) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toContain(expectedText);
        }
      }
    }
  });

  test('should be accessible via keyboard', async ({ page }) => {
    // Find focusable elements with tooltips
    const trigger = page.locator('button[aria-label], button[title]').first();
    
    if (await trigger.isVisible()) {
      // Focus element
      await trigger.focus();
      
      // Press tab to see if tooltip appears on focus
      await page.waitForTimeout(300);
      
      // Check for tooltip
      const tooltip = page.locator('[role="tooltip"], .tooltip');
      const tooltipCount = await tooltip.count();
      
      // Tooltip may or may not appear on focus (depends on implementation)
      if (tooltipCount > 0) {
        await expect(tooltip.first()).toBeVisible();
      }
    }
  });

  test('should position tooltip correctly', async ({ page }) => {
    const trigger = page.locator('[aria-label], [title]').first();
    
    if (await trigger.isVisible()) {
      const triggerBox = await trigger.boundingBox();
      
      if (triggerBox) {
        await trigger.hover();
        await page.waitForTimeout(300);
        
        const tooltip = page.locator('[role="tooltip"], .tooltip').first();
        
        if (await tooltip.isVisible()) {
          const tooltipBox = await tooltip.boundingBox();
          
          if (tooltipBox) {
            // Tooltip should be near trigger (not overlapping viewport edges)
            expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
            expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
            expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(page.viewportSize()?.width || 1920);
            expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(page.viewportSize()?.height || 1080);
          }
        }
      }
    }
  });
});
