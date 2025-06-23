import { test, expect } from '@playwright/test';

test.describe('MGA Portal - Complete E2E Test Suite', () => {
  // Helper function for login
  async function login(page: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@marcelgladbach.com');
    await page.fill('input[name="password"]', 'MGA-Portal2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  }

  test('Complete project lifecycle', async ({ page }) => {
    // Login
    await login(page);
    
    // Verify dashboard
    await expect(page.locator('text="Willkommen im MGA Portal"')).toBeVisible();
    
    // Navigate to projects
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Create new project
    const timestamp = Date.now();
    const projectName = `E2E Projekt ${timestamp}`;
    
    // Debug: take screenshot before clicking
    await page.screenshot({ path: 'debug-before-click.png' });
    
    // Click the omni-create button (+ button)
    const createButton = page.locator('button:has(svg)').first();
    await createButton.click();
    
    // Wait for dropdown menu to appear
    await page.waitForSelector('[role="menu"], .menu-items, [data-headlessui-state]', { timeout: 5000 });
    
    // Debug: take screenshot after dropdown opens
    await page.screenshot({ path: 'debug-dropdown-open.png' });
    
    // Select "Neues Projekt" from dropdown
    await page.click('text="Neues Projekt"');
    
    // Wait for modal to appear with more specific selectors
    await page.waitForSelector('dialog, [role="dialog"], .fixed.inset-0, [data-headlessui-state="open"]', { timeout: 10000 });
    
    // Debug: take screenshot after modal should open
    await page.screenshot({ path: 'debug-modal-open.png' });
    
    // Fill project form - try multiple possible selectors
    const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="projekt" i]').first();
    await nameInput.fill(projectName);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close and navigation
    await page.waitForTimeout(2000);
    
    // Verify project appears in list
    await expect(page.locator(`text="${projectName}"`)).toBeVisible({ timeout: 10000 });
    
    // Verify project number format (YY-NNN)
    const projectCard = page.locator(`text="${projectName}"`).locator('..').locator('..');
    const projectNumber = await projectCard.locator('text=/\\d{2}-\\d{3}/').textContent();
    expect(projectNumber).toMatch(/^\d{2}-\d{3}$/);
  });

  test('Task management flow', async ({ page }) => {
    await login(page);
    
    // Navigate to tasks
    await page.click('a[href="/tasks"]');
    await page.waitForURL('/tasks');
    
    // Create new task
    const taskTitle = `E2E Aufgabe ${Date.now()}`;
    
    // Click create button
    const createButton = page.locator('button:has(svg)').first();
    await createButton.click();
    
    // Wait for dropdown menu
    await page.waitForSelector('[role="menu"], .menu-items, [data-headlessui-state]', { timeout: 5000 });
    
    // Select "Neue Aufgabe" from dropdown
    await page.click('text="Neue Aufgabe"');
    
    // Wait for modal
    await page.waitForSelector('dialog, [role="dialog"], .fixed.inset-0, [data-headlessui-state="open"]', { timeout: 10000 });
    
    // Fill task form
    await page.fill('input[name="title"]', taskTitle);
    
    // Set priority if available
    const prioritySelect = page.locator('select[name="priority"]');
    if (await prioritySelect.isVisible({ timeout: 1000 })) {
      await prioritySelect.selectOption('HIGH');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    // Verify task appears in list
    await expect(page.locator(`text="${taskTitle}"`)).toBeVisible({ timeout: 10000 });
  });

  test('Contact management flow', async ({ page }) => {
    await login(page);
    
    // Navigate to contacts
    await page.click('a[href="/contacts"]');
    await page.waitForURL('/contacts');
    
    // Create new contact
    const contactName = `Test${Date.now()}`;
    
    // Click create button
    const createButton = page.locator('button:has(svg)').first();
    await createButton.click();
    
    // Wait for dropdown menu
    await page.waitForSelector('[role="menu"], .menu-items, [data-headlessui-state]', { timeout: 5000 });
    
    // Select "Neue Person" from dropdown
    await page.click('text="Neue Person"');
    
    // Wait for modal
    await page.waitForSelector('dialog, [role="dialog"], .fixed.inset-0, [data-headlessui-state="open"]', { timeout: 10000 });
    
    // Fill contact form
    await page.fill('input[name="firstName"]', contactName);
    await page.fill('input[name="lastName"]', 'E2E');
    await page.fill('input[name="email"]', `${contactName.toLowerCase()}@test.com`);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    // Verify contact appears in list
    await expect(page.locator(`text="${contactName} E2E"`)).toBeVisible({ timeout: 10000 });
  });

  test('Navigation and user menu', async ({ page }) => {
    await login(page);
    
    // Test navigation to all main sections
    const sections = [
      { href: '/projects', title: 'Projekte' },
      { href: '/tasks', title: 'Aufgaben' },
      { href: '/contacts', title: 'Kontakte' }
    ];
    
    for (const section of sections) {
      await page.click(`a[href="${section.href}"]`);
      await page.waitForURL(section.href);
      
      // Verify we're on the right page
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(section.title);
      
      // Go back to dashboard
      await page.click('a[href="/"]');
      await page.waitForURL('/');
    }
    
    // Test user menu
    const userIndicators = ['admin@marcelgladbach.com', 'AM', 'Administrator'];
    let foundUserIndicator = false;
    
    for (const indicator of userIndicators) {
      if (await page.locator(`text="${indicator}"`).isVisible({ timeout: 1000 }).catch(() => false)) {
        foundUserIndicator = true;
        break;
      }
    }
    
    expect(foundUserIndicator).toBeTruthy();
  });

  test('Dashboard focus points', async ({ page }) => {
    await login(page);
    
    // Check if dashboard shows focus points
    const focusSection = page.locator('text="Heutige Termine"').locator('..');
    
    // The dashboard should show today's appointments or tasks
    await expect(focusSection).toBeVisible({ timeout: 5000 });
  });
});