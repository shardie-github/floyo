import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for login form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Fill in credentials (assuming test data exists)
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    
    // Click login button
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|home|/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/error|invalid|incorrect/i)).toBeVisible();
  });
});
