import { test, expect } from '@playwright/test';

test.describe('Project Creation Flow', () => {
  test('should create a new project successfully', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login');
    
    // Step 2: Log in as admin
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    
    // Step 3: Verify dashboard loads
    await expect(page).toHaveURL('/');
    // Look for either "Dashboard" or "Willkommen" text
    const dashboardHeading = page.locator('h1:has-text("Willkommen"), h1:has-text("Dashboard")').first();
    await expect(dashboardHeading).toBeVisible();
    
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
    
    // Step 4: Navigate to projects page
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL('/projects');
    
    // Step 5: Click on "New Project" button
    // First check if there's an Omni-Create button (+ button)
    const omniCreateButton = page.locator('button[aria-label*="Create"], button:has-text("+")').first();
    if (await omniCreateButton.isVisible({ timeout: 2000 })) {
      await omniCreateButton.click();
      // Then click on "Projekt" option
      await page.click('text="Projekt"');
    } else {
      // Otherwise look for direct "Neues Projekt" button
      const newProjectButton = page.locator('button:has-text("Neues Projekt"), button:has-text("Projekt erstellen")').first();
      await newProjectButton.click();
    }
    
    // Step 6: Fill out the project form
    const timestamp = new Date().getTime();
    const projectName = `E2E Test Projekt ${timestamp}`;
    
    // Wait for the modal/form to appear
    await page.waitForSelector('input[name="name"], input[placeholder*="Projektname"]', { state: 'visible' });
    
    // Fill in project details
    await page.fill('input[name="name"], input[placeholder*="Projektname"]', projectName);
    
    // Select project status if available
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('ACTIVE');
    }
    
    // Add budget if field exists
    const budgetInput = page.locator('input[name="budget"], input[placeholder*="Budget"]');
    if (await budgetInput.isVisible()) {
      await budgetInput.fill('150000');
    }
    
    // Step 7: Submit the form
    await page.click('button[type="submit"], button:has-text("Speichern"), button:has-text("Erstellen")');
    
    // Wait for navigation or modal to close
    await page.waitForLoadState('networkidle');
    
    // Step 8: Verify the project appears in the list
    // Wait for the projects list to update
    await page.waitForTimeout(1000); // Give the UI time to update
    
    // Check if the project card/item exists
    const projectCard = page.locator(`text="${projectName}"`).first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    
    // Verify project details if visible
    const projectNumberPattern = /\d{2}-\d{3}/; // Pattern for project numbers like 24-001
    const projectNumbers = await page.locator('text=/\\d{2}-\\d{3}/').allTextContents();
    expect(projectNumbers.length).toBeGreaterThan(0);
  });

  test('should handle form validation', async ({ page }) => {
    // Assume we're already logged in from previous test
    // In a real scenario, you might want to handle login in a beforeEach hook
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/projects"]');
    
    // Try to create a project without a name
    // First check if there's an Omni-Create button (+ button)
    const omniCreateButton = page.locator('button[aria-label*="Create"], button:has-text("+")').first();
    if (await omniCreateButton.isVisible({ timeout: 2000 })) {
      await omniCreateButton.click();
      // Then click on "Projekt" option
      await page.click('text="Projekt"');
    } else {
      // Otherwise look for direct "Neues Projekt" button
      const newProjectButton = page.locator('button:has-text("Neues Projekt"), button:has-text("Projekt erstellen")').first();
      await newProjectButton.click();
    }
    
    // Wait for form
    await page.waitForSelector('input[name="name"], input[placeholder*="Projektname"]', { state: 'visible' });
    
    // Leave name empty and try to submit
    await page.click('button[type="submit"], button:has-text("Speichern"), button:has-text("Erstellen")');
    
    // Should see validation error or form should not close
    const nameInput = page.locator('input[name="name"], input[placeholder*="Projektname"]');
    await expect(nameInput).toBeVisible(); // Form should still be open
  });
});

test.describe('Navigation and Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate through main sections', async ({ page }) => {
    // Test navigation to different sections
    const sections = [
      { link: 'a[href="/projects"]', url: '/projects', title: 'Projekte' },
      { link: 'a[href="/tasks"]', url: '/tasks', title: 'Aufgaben' },
      { link: 'a[href="/contacts"]', url: '/contacts', title: 'Kontakte' },
    ];

    for (const section of sections) {
      await page.click(section.link);
      await expect(page).toHaveURL(section.url);
      // The page title might be in different h1 elements
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(section.title);
      
      // Go back to dashboard
      await page.click('a[href="/"]');
    }
  });

  test('should display user menu with correct email', async ({ page }) => {
    // Look for user menu button (usually shows email, initials, or avatar)
    // Different UI implementations might show this differently
    const userIndicators = [
      'admin@marcelgladbach.com',
      'AM', // Initials
      'Admin' // Name
    ];
    
    let userMenuFound = false;
    for (const indicator of userIndicators) {
      const element = page.locator(`text="${indicator}"`).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        userMenuFound = true;
        break;
      }
    }
    
    expect(userMenuFound).toBeTruthy();
  });
});