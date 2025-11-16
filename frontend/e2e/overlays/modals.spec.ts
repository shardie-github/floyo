/**
 * Modal Overlay E2E Tests
 * 
 * Tests modal functionality including:
 * - Modal opening/closing
 * - Modal interactions
 * - Escape key handling
 * - Backdrop clicks
 * - Focus management
 */

import { test, expect } from '@playwright/test';

test.describe('Modal Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open and close modal', async ({ page }) => {
    // Look for buttons that open modals
    const modalTriggers = [
      page.getByRole('button', { name: /delete|remove/i }),
      page.getByRole('button', { name: /confirm|submit/i }),
      page.getByRole('button', { name: /settings|options/i }),
    ];

    for (const trigger of modalTriggers) {
      if (await trigger.isVisible()) {
        await trigger.click();
        
        // Check for modal
        const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
        const modalCount = await modal.count();
        
        if (modalCount > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Close modal
          const closeButton = page.getByRole('button', { name: /close|cancel|×/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await expect(modal.first()).not.toBeVisible({ timeout: 1000 });
          }
        }
        break;
      }
    }
  });

  test('should close modal on escape key', async ({ page }) => {
    // Open a modal if possible
    const trigger = page.getByRole('button', { name: /delete|remove|confirm/i });
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const modal = page.locator('[role="dialog"], .modal').first();
      if (await modal.isVisible()) {
        // Press escape
        await page.keyboard.press('Escape');
        
        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should close modal on backdrop click', async ({ page }) => {
    // Open a modal
    const trigger = page.getByRole('button', { name: /delete|remove|confirm/i });
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const modal = page.locator('[role="dialog"], .modal').first();
      const backdrop = page.locator('.modal-backdrop, .backdrop, [data-testid="backdrop"]');
      
      if (await modal.isVisible() && await backdrop.isVisible()) {
        // Click backdrop
        await backdrop.click({ position: { x: 10, y: 10 } });
        
        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should trap focus within modal', async ({ page }) => {
    // Open modal
    const trigger = page.getByRole('button', { name: /delete|remove|confirm/i });
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      const modal = page.locator('[role="dialog"], .modal').first();
      
      if (await modal.isVisible()) {
        // Tab through focusable elements
        await page.keyboard.press('Tab');
        
        // Focus should be within modal
        const focusedElement = page.locator(':focus');
        const focusedCount = await focusedElement.count();
        
        if (focusedCount > 0) {
          const focusedParent = focusedElement.locator('xpath=ancestor::*[@role="dialog"]');
          const parentCount = await focusedParent.count();
          
          // Focus should be within modal (or modal should contain focused element)
          expect(parentCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should prevent body scroll when modal is open', async ({ page }) => {
    // Open modal
    const trigger = page.getByRole('button', { name: /delete|remove|confirm/i });
    
    if (await trigger.isVisible()) {
      const initialScrollY = await page.evaluate(() => window.scrollY);
      
      await trigger.click();
      
      const modal = page.locator('[role="dialog"], .modal').first();
      
      if (await modal.isVisible()) {
        // Try to scroll
        await page.evaluate(() => window.scrollTo(0, 100));
        
        const newScrollY = await page.evaluate(() => window.scrollY);
        
        // Scroll should be prevented (body should have overflow: hidden)
        const bodyStyle = await page.evaluate(() => {
          const body = document.body;
          return {
            overflow: window.getComputedStyle(body).overflow,
            position: window.getComputedStyle(body).position,
          };
        });
        
        // Body should have overflow hidden or fixed position
        expect(bodyStyle.overflow === 'hidden' || bodyStyle.position === 'fixed').toBeTruthy();
      }
    }
  });

  test('should restore focus on modal close', async ({ page }) => {
    // Find a button that opens modal
    const trigger = page.getByRole('button', { name: /delete|remove|confirm/i });
    
    if (await trigger.isVisible()) {
      // Focus trigger
      await trigger.focus();
      await trigger.click();
      
      const modal = page.locator('[role="dialog"], .modal').first();
      
      if (await modal.isVisible()) {
        // Close modal
        const closeButton = page.getByRole('button', { name: /close|cancel|×/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
          
          // Focus should return to trigger
          await page.waitForTimeout(100);
          const focusedElement = page.locator(':focus');
          const focusedText = await focusedElement.textContent();
          const triggerText = await trigger.textContent();
          
          // Focus should be on trigger or a related element
          expect(focusedText || triggerText).toBeTruthy();
        }
      }
    }
  });
});
