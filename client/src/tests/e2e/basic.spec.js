import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Make sure the page loads
    await expect(page).toHaveTitle(/Authentic Internet/);
    
    // Check for basic elements using more specific selectors
    await expect(page.locator('header')).toBeVisible();
    // Just check for #root element which should be unique
    await expect(page.locator('#root')).toBeVisible();
  });
  
  test('should navigate to login page', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Click on a login link
    await page.click('text=Login');
    
    // Verify we reached the login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Check for login form elements (could be username or email)
    const usernameField = page.locator('input[name="username"]');
    const emailField = page.locator('input[name="email"]');
    
    // Make sure we have either username or email field
    const hasUsernameField = await usernameField.count() > 0;
    const hasEmailField = await emailField.count() > 0;
    expect(hasUsernameField || hasEmailField).toBeTruthy();
    
    // Check for password field and submit button
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('should navigate to register page', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Click on a register link
    await page.click('text=Register');
    
    // Verify we reached the register page
    await expect(page).toHaveURL(/.*\/register/);
    
    // Check for register form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    
    // Check for email field if it exists
    const emailField = page.locator('input[name="email"]');
    if (await emailField.count() > 0) {
      await expect(emailField).toBeVisible();
    }
    
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
}); 