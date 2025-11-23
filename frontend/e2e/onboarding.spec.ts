/**
 * Onboarding Flow E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('should display welcome step', async ({ page }) => {
    await expect(page.getByText(/welcome to floyo/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('should show progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });

  test('should advance to next step when continue is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /get started/i }).click();
    await expect(page.getByText(/privacy first/i)).toBeVisible();
  });

  test('should require consent before continuing from privacy step', async ({ page }) => {
    await page.getByRole('button', { name: /get started/i }).click();
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeDisabled();
    
    await page.getByLabel(/i understand and consent/i).check();
    await expect(continueButton).toBeEnabled();
  });

  test('should complete onboarding flow', async ({ page }) => {
    // Step 1: Welcome
    await page.getByRole('button', { name: /get started/i }).click();
    
    // Step 2: Privacy
    await page.getByLabel(/i understand and consent/i).check();
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Step 3: Setup
    await expect(page.getByText(/enable tracking/i)).toBeVisible();
    await page.getByRole('button', { name: /complete setup/i }).click();
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should show step indicators', async ({ page }) => {
    const indicators = page.locator('[aria-label*="Step"]');
    await expect(indicators).toHaveCount(3);
  });
});
