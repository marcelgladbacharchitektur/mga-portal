import { test, expect } from '@playwright/test';

test.describe('Simple E2E Flow', () => {
  test('Login and navigate to projects', async ({ page }) => {
    // Step 1: Go to login page
    await page.goto('/login');
    
    // Step 2: Login
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    
    // Step 3: Wait for dashboard
    await page.waitForURL('/');
    
    // Step 4: Verify we're on dashboard
    await expect(page.locator('text="Willkommen im MGA Portal"')).toBeVisible({ timeout: 10000 });
    
    // Step 5: Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Step 6: Look for any project creation option
    // This could be a button with +, "Neu", "Erstellen", etc.
    const createOptions = [
      'button:has-text("+")',
      'button:has-text("Neu")',
      'button:has-text("Erstellen")',
      'button:has(svg)',  // Button with an icon
      '[aria-label*="create" i]',
      '[aria-label*="add" i]',
      '[aria-label*="neu" i]'
    ];
    
    let createButton = null;
    for (const selector of createOptions) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        createButton = element;
        break;
      }
    }
    
    if (createButton) {
      await createButton.click();
      
      // If it's a dropdown, look for "Projekt" option
      const projektOption = page.locator('text="Projekt"');
      if (await projektOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await projektOption.click();
      }
      
      // Now we should see a form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="projekt" i]').first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      
      // Fill the form
      await nameInput.fill(`Test Projekt ${Date.now()}`);
      
      // Find and click save button
      const saveButton = page.locator('button[type="submit"], button:has-text("Speichern"), button:has-text("Erstellen")').first();
      await saveButton.click();
      
      // Wait for form to close or page to update
      await page.waitForTimeout(2000);
      
      // Verify we're back on projects page
      expect(page.url()).toContain('/projects');
    } else {
      console.log('No create button found - projects page might be empty');
    }
  });
});