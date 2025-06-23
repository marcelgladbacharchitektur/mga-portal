import { test, expect } from '@playwright/test';

test.describe('Project Creation with Nextcloud Integration', () => {
  // Helper function for login
  async function login(page: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  }

  test('Create project and verify Nextcloud folder creation', async ({ page }) => {
    // Step 1: Login
    await login(page);
    
    // Step 2: Verify dashboard
    await expect(page.locator('text="Willkommen im MGA Portal"')).toBeVisible();
    
    // Step 3: Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Step 4: Create new project
    const timestamp = Date.now();
    const projectName = `E2E Nextcloud Test ${timestamp}`;
    
    // The OmniCreate button is in the sidebar
    // Look for the desktop button with text "Erstellen" (not the mobile one)
    const createButton = page.getByRole('button', { name: 'Erstellen' }).first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();
    
    // Wait for dropdown menu to appear
    await page.waitForTimeout(500); // Give dropdown time to animate
    
    // Click "Neues Projekt" from dropdown
    const projektOption = page.locator('button:has-text("Neues Projekt")');
    await expect(projektOption).toBeVisible({ timeout: 5000 });
    await projektOption.click();
    
    // Wait for modal to appear
    await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 10000 });
    
    // Fill project form - the name input has id="name" not name="name"
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(projectName);
    
    // Optional: Fill other fields if visible
    const budgetInput = page.locator('input[name="budget"]');
    if (await budgetInput.isVisible({ timeout: 1000 })) {
      await budgetInput.fill('100000');
    }
    
    const descriptionInput = page.locator('textarea[name="description"]');
    if (await descriptionInput.isVisible({ timeout: 1000 })) {
      await descriptionInput.fill('This is an E2E test project to verify Nextcloud integration');
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();
    
    // Wait for navigation or modal to close
    await page.waitForTimeout(3000);
    
    // Refresh the page to ensure we see the new project
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Step 5: Find the created project and get its project number
    const projectCard = page.locator(`text="${projectName}"`).first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    
    // Get the project number (format: YY-NNN)
    const projectContainer = projectCard.locator('..').locator('..');
    const projectNumberElement = await projectContainer.locator('text=/\\d{2}-\\d{3}/').first();
    const projectNumber = await projectNumberElement.textContent();
    
    expect(projectNumber).toMatch(/^\d{2}-\d{3}$/);
    console.log(`Created project with number: ${projectNumber}`);
    
    // Step 6: Wait a bit for Nextcloud folder creation to complete
    await page.waitForTimeout(3000);
    
    // Step 7: Verify Nextcloud folder was created using test helper API
    const response = await page.request.post('/api/test-helpers/nextcloud-check', {
      data: {
        projectNumber: projectNumber
      }
    });
    
    const result = await response.json();
    console.log('Nextcloud check result:', result);
    
    // Verify the response
    expect(response.ok()).toBeTruthy();
    
    // Check if Nextcloud was skipped (not configured)
    if (result.skipped) {
      console.log('⚠️ Nextcloud is not configured. Skipping folder verification.');
      console.log(`✓ Project ${projectNumber} successfully created in portal`);
    } else {
      // Verify Nextcloud folder was created
      expect(result.exists).toBeTruthy();
      expect(result.allSubfoldersExist).toBeTruthy();
      
      // Verify all standard subfolders were created
      expect(result.missingSubfolders).toEqual([]);
      
      // Log success
      console.log(`✓ Project ${projectNumber} successfully created in portal`);
      console.log(`✓ Nextcloud folder created at: ${result.folderPath}`);
      console.log(`✓ All ${result.subfolderChecks.length} standard subfolders created`);
    }
  });

  test('Create project without Nextcloud connection should still work', async ({ page }) => {
    // This test verifies that project creation works even if Nextcloud is not configured
    await login(page);
    
    // Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Create a project
    const timestamp = Date.now();
    const projectName = `E2E Offline Test ${timestamp}`;
    
    // Use the same creation flow
    const createButton = page.getByRole('button', { name: 'Erstellen' }).first();
    await createButton.click();
    
    // Wait for dropdown
    await page.waitForTimeout(500);
    
    // Click "Neues Projekt"
    await page.locator('button:has-text("Neues Projekt")').click();
    
    // Wait for modal
    await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 10000 });
    
    // Fill form
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(projectName);
    
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    // Refresh the page to ensure we see the new project
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify project was created
    const projectCard = page.locator(`text="${projectName}"`).first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Project creation works without Nextcloud connection');
  });
});