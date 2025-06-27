import { test, expect } from '@playwright/test';

test.describe('Simple Project Test', () => {
  test('Create a project step by step', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    console.log('✓ Login successful');

    // Step 2: Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    console.log('✓ Navigated to projects');

    // Step 3: Take screenshot before creating
    await page.screenshot({ path: 'before-create.png', fullPage: true });

    // Step 4: Click Erstellen button
    const createButton = page.getByRole('button', { name: 'Erstellen' }).first();
    await createButton.click();
    console.log('✓ Clicked Erstellen button');

    // Step 5: Wait a bit and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'after-erstellen-click.png', fullPage: true });

    // Step 6: Click "Neues Projekt"
    const projektOption = page.locator('button:has-text("Neues Projekt")');
    await projektOption.click();
    console.log('✓ Clicked Neues Projekt');

    // Step 7: Wait for modal and screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'modal-open.png', fullPage: true });

    // Step 8: Try to find the name input
    const possibleSelectors = [
      'input#name',
      'input[placeholder*="Projektname"]',
      'input[type="text"]',
      'input',
    ];

    let nameInput = null;
    for (const selector of possibleSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          console.log(`Found input with selector: ${selector}`);
          nameInput = input;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!nameInput) {
      throw new Error('Could not find name input');
    }

    // Step 9: Fill the form
    const projectName = `Test Project ${Date.now()}`;
    await nameInput.fill(projectName);
    console.log(`✓ Filled project name: ${projectName}`);

    // Step 10: Submit
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();
    console.log('✓ Clicked submit');

    // Step 11: Wait and check result
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'after-submit.png', fullPage: true });

    // Check if we're still on projects page
    console.log('Current URL:', page.url());

    // Try to refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Look for the project
    const projectVisible = await page.locator(`text="${projectName}"`).isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Project visible after reload: ${projectVisible}`);

    if (!projectVisible) {
      // Check for any error messages
      const errorMessages = await page.locator('.text-red-500, .text-red-600, .error').allTextContents();
      if (errorMessages.length > 0) {
        console.log('Error messages found:', errorMessages);
      }
    }

    expect(projectVisible).toBeTruthy();
  });
});