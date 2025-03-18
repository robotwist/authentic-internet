import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should allow a new user to register', async ({ page }) => {
    // Click on the Register link
    await page.click('text=Register');
    
    // Generate a unique username to avoid conflicts
    const username = `testuser_${Date.now()}`;
    
    // Fill in the registration form
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', `${username}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify we're redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we see the username in the UI
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should allow an existing user to log in', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    
    // Fill in login credentials (use a known test account)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Password123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify we're redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify welcome message or dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error message for invalid login', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    
    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'nonexistentuser');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid username or password')).toBeVisible();
  });

  test('should allow user to log out', async ({ page }) => {
    // First log in
    await page.click('text=Login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Click logout
    await page.click('button.logout-btn');
    
    // Verify we're redirected to login or home
    await expect(page.locator('text=Login')).toBeVisible();
  });
}); 