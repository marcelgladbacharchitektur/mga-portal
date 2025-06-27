import { test, expect } from '@playwright/test';

test.describe('Debug OmniCreate Menu', () => {
  test('Debug omni-create dropdown and modal', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Debug: Log all buttons with SVG
    const buttonsWithSvg = await page.locator('button:has(svg)').all();
    console.log(`Found ${buttonsWithSvg.length} buttons with SVG`);
    
    // Find the create button
    const createButton = page.locator('button:has(svg)').first();
    const buttonText = await createButton.textContent();
    console.log('Create button text:', buttonText);
    
    // Take screenshot before click
    await page.screenshot({ path: 'debug-1-before-click.png', fullPage: true });
    
    // Click the create button
    await createButton.click();
    
    // Wait a bit for dropdown to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot after click
    await page.screenshot({ path: 'debug-2-after-click.png', fullPage: true });
    
    // Look for dropdown menu items
    const menuItems = await page.locator('[role="menu"]').count();
    console.log('Menu items with role="menu":', menuItems);
    
    // Try different selectors for the dropdown
    const dropdownSelectors = [
      '[role="menu"]',
      '[data-headlessui-state]',
      '.absolute.z-50.mt-2',
      'div:has-text("Neues Projekt")',
      'button:has-text("Neues Projekt")'
    ];
    
    for (const selector of dropdownSelectors) {
      const count = await page.locator(selector).count();
      console.log(`Elements matching "${selector}":`, count);
    }
    
    // Try to click on "Neues Projekt" if visible
    const projektButton = page.locator('text="Neues Projekt"');
    if (await projektButton.isVisible({ timeout: 2000 })) {
      console.log('Found "Neues Projekt" button, clicking...');
      await projektButton.click();
      
      // Wait a bit
      await page.waitForTimeout(1000);
      
      // Take screenshot after clicking menu item
      await page.screenshot({ path: 'debug-3-after-menu-click.png', fullPage: true });
      
      // Look for modal
      const modalSelectors = [
        '.fixed.inset-0.z-50',
        '[role="dialog"]',
        'div:has-text("Neues Projekt erstellen")',
        'input[name="name"]'
      ];
      
      for (const selector of modalSelectors) {
        const count = await page.locator(selector).count();
        console.log(`Elements matching "${selector}":`, count);
      }
    } else {
      console.log('Could not find "Neues Projekt" button');
    }
  });
});