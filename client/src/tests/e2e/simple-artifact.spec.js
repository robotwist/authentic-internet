import { test, expect } from '@playwright/test';

test.describe('Simple Artifact Functionality', () => {
  // Setup: register and login before tests
  test.beforeEach(async ({ page }) => {
    // Use a unique username based on timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const testUser = {
      username: `testuser${timestamp}`,
      email: `testuser${timestamp}@test.com`,
      password: 'Password123!'
    };
    
    // Go to the register page and wait for it to load
    await page.goto('/register', { waitUntil: 'networkidle' });
    
    // Register a new user
    await page.fill('input[name="username"]', testUser.username);
    const emailField = page.locator('input[name="email"]');
    if (await emailField.count() > 0) {
      await emailField.fill(testUser.email);
    }
    await page.fill('input[name="password"]', testUser.password);
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    
    // Check if we need to log in (in case registration redirected to login)
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await page.goto('/login', { waitUntil: 'networkidle' });
      
      const usernameField = page.locator('input[name="username"]');
      const emailLoginField = page.locator('input[name="email"]');
      
      if (await usernameField.count() > 0) {
        await usernameField.fill(testUser.username);
      } else if (await emailLoginField.count() > 0) {
        await emailLoginField.fill(testUser.email);
      }
      
      await page.fill('input[name="password"]', testUser.password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]')
      ]);
    }
    
    // Verify we're now logged in by checking for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
  
  test('should navigate to artifacts page', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Click on Artifacts link to navigate to artifacts page
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('text=Artifacts')
    ]);
    
    // Verify we're on the artifacts page
    await expect(page).toHaveURL(/.*\/artifacts/);
    
    // Verify key elements are present
    await expect(page.locator('h1:has-text("Community Artifacts")')).toBeVisible();
    
    // Check that either artifacts are displayed or "No artifacts" message is shown
    const hasArtifacts = await page.isVisible('.artifacts-grid');
    const hasNoArtifactsMessage = await page.isVisible('.no-artifacts');
    
    expect(hasArtifacts || hasNoArtifactsMessage).toBeTruthy();
  });
  
  test('should show artifact creation form', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Navigate to artifacts page
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('text=Artifacts')
    ]);
    
    // Click create artifact button
    await page.click('button:has-text("Create Artifact")');
    
    // Verify the creation form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });
}); 