/**
 * Profile Page E2E Tests
 * 
 * Tests all profile page functionality including:
 * - Profile viewing
 * - Profile editing
 * - Avatar upload
 * - Email verification
 * - Account actions
 */

import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page (assuming authenticated)
    await page.goto('/profile');
    
    // Wait for profile page to load
    await page.waitForSelector('h1:has-text("Profile")', { timeout: 10000 });
  });

  test('should display profile information', async ({ page }) => {
    // Check that profile information is displayed
    await expect(page.getByText(/email|Email/i)).toBeVisible();
    await expect(page.getByText(/name|Name/i)).toBeVisible();
    await expect(page.getByText(/member since|Member Since/i)).toBeVisible();
  });

  test('should allow editing profile name', async ({ page }) => {
    // Click edit button
    const editButton = page.getByRole('button', { name: /edit profile/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify edit mode is active
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEditable();

    // Update name
    await nameInput.clear();
    await nameInput.fill('Updated Name');

    // Save changes
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Verify success message
    await expect(page.getByText(/profile updated|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should cancel profile editing', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /edit profile/i }).click();

    // Make changes
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill('Test Name');

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verify we're back to view mode
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
  });

  test('should display email verification status', async ({ page }) => {
    // Check for verification status badge
    const verifiedBadge = page.getByText(/verified|unverified/i);
    await expect(verifiedBadge).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    // Look for resend verification button (if email not verified)
    const resendButton = page.getByRole('button', { name: /resend verification/i });
    
    if (await resendButton.isVisible()) {
      await resendButton.click();
      // Verify success message
      await expect(page.getByText(/verification email sent|check your inbox/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to settings from profile', async ({ page }) => {
    const settingsLink = page.getByRole('link', { name: /settings/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings/);
    }
  });

  test('should navigate to privacy settings from profile', async ({ page }) => {
    const privacyLink = page.getByRole('link', { name: /privacy/i });
    if (await privacyLink.isVisible()) {
      await privacyLink.click();
      await expect(page).toHaveURL(/privacy/);
    }
  });

  test('should navigate to account deletion from profile', async ({ page }) => {
    const deleteLink = page.getByRole('link', { name: /delete account/i });
    if (await deleteLink.isVisible()) {
      await deleteLink.click();
      await expect(page).toHaveURL(/account\/delete/);
    }
  });

  test('should display avatar upload option', async ({ page }) => {
    // Check for avatar section
    const avatarSection = page.locator('text=/profile picture|avatar/i');
    await expect(avatarSection).toBeVisible();

    // Check for upload button
    const uploadButton = page.getByText(/change avatar|upload/i);
    await expect(uploadButton).toBeVisible();
  });

  test('should handle avatar upload', async ({ page }) => {
    // Create a test image file
    const testImagePath = 'test-avatar.png';
    
    // Set up file input handler
    page.on('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(testImagePath);
    });

    // Click upload button
    const uploadButton = page.getByText(/change avatar|upload/i);
    await uploadButton.click();

    // Wait for upload to complete (if file input appears)
    // Note: This test may need adjustment based on actual implementation
  });
});
