import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should login successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-page.png' });
    
    // Fill in credentials
    await page.fill('input[name="email"]', 'admin@marcelgladbach.at');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to dashboard
    await expect(page).toHaveURL('/');
  });
});