import { test, expect } from '@playwright/test';

test.describe('Debug Login', () => {
  test('should check login form elements', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login form exists
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Log what we find
    console.log('Email input visible:', await emailInput.isVisible());
    console.log('Password input visible:', await passwordInput.isVisible());
    console.log('Submit button visible:', await submitButton.isVisible());
    
    // Try to get any error messages
    const errorMessages = await page.locator('.text-red-500, .text-red-600, [role="alert"]').allTextContents();
    console.log('Error messages:', errorMessages);
    
    // Fill in credentials
    await emailInput.fill('admin@marcelgladbach.at');
    await passwordInput.fill('MGA-Portal2024!');
    
    // Click submit
    await submitButton.click();
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Check URL and any error messages
    console.log('Current URL:', page.url());
    const postLoginErrors = await page.locator('.text-red-500, .text-red-600, [role="alert"]').allTextContents();
    console.log('Post-login error messages:', postLoginErrors);
    
    // Take screenshot
    await page.screenshot({ path: 'post-login-state.png', fullPage: true });
  });
});