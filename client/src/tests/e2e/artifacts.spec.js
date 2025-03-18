import { test, expect } from '@playwright/test';

test.describe('Artifact functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL(/.*\/dashboard/);
  });

  test('should list artifacts on artifacts page', async ({ page }) => {
    // Navigate to artifacts page
    await page.click('text=Artifacts');
    
    // Wait for the page to load
    await page.waitForSelector('.artifacts-container');
    
    // Check if we can see artifacts or "No artifacts found" message
    const hasArtifacts = await page.isVisible('.artifact-card');
    const hasNoArtifactsMessage = await page.isVisible('text=No artifacts found');
    
    // Either we should see artifacts or a message saying there are none
    expect(hasArtifacts || hasNoArtifactsMessage).toBeTruthy();
    
    // Check for error messages
    const hasError = await page.isVisible('.error-message');
    expect(hasError).toBeFalsy();
  });

  test('should create artifact from artifacts page', async ({ page }) => {
    // Go to artifacts page
    await page.click('text=Artifacts');
    
    // Wait for page to load
    await page.waitForSelector('.artifacts-container');
    
    // Click create artifact button
    await page.click('button:has-text("Create Artifact")');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Test Artifact from Page');
    await page.fill('textarea[name="description"]', 'Created from artifacts page test');
    await page.fill('textarea[name="messageText"]', 'Test message for the artifact');
    
    // Select a type if there's a dropdown
    await page.selectOption('select[name="type"]', 'scroll');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify success message or new artifact appears
    await expect(page.locator('text=Artifact created successfully')).toBeVisible();
    
    // Check if the new artifact appears in the list
    await expect(page.locator('text=Test Artifact from Page')).toBeVisible();
  });

  test('should handle errors when creating artifacts gracefully', async ({ page }) => {
    // Go to game world
    await page.click('text=Enter World');
    await page.waitForSelector('.game-container');
    
    // Wait for a moment to make sure the game is loaded
    await page.waitForTimeout(1000);
    
    // Debug: Check if there's any visible error
    const errorText = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('.error-message, .alert-error'));
      return errors.map(e => e.textContent).join(', ');
    });
    console.log('Initial errors:', errorText);
    
    // Try to create an artifact
    await page.keyboard.press('c');
    
    // Wait for artifact creation form
    await page.waitForSelector('form.artifact-creation-form');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Expect validation errors instead of app crash
    await expect(page.locator('.form-error, .validation-error')).toBeVisible();
    
    // Now fill the form correctly
    await page.fill('input[name="name"]', 'Test Artifact');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('textarea[name="messageText"]', 'Test message');
    
    // Intercept the API call
    await page.route('**/api/artifacts', async (route) => {
      // Simulate server error
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test server error' })
      });
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect proper error handling
    await expect(page.locator('text=Failed to create artifact')).toBeVisible();
    
    // Make sure the app didn't crash
    await expect(page.locator('.game-container')).toBeVisible();
  });

  test('should load artifacts without errors in game world', async ({ page }) => {
    // Navigate to game world
    await page.click('text=Enter World');
    
    // Wait for game to load
    await page.waitForSelector('.game-container');
    
    // Console log tracking for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to make sure artifacts load
    await page.waitForTimeout(2000);
    
    // Open inventory to check if artifacts loaded
    await page.keyboard.press('i');
    await page.waitForSelector('.inventory');
    
    // Expect no errors related to artifacts loading
    const artifactErrors = errors.filter(e => e.includes('artifact') || e.includes('Artifact'));
    expect(artifactErrors).toHaveLength(0);
    
    // Close inventory
    await page.keyboard.press('Escape');
  });

  test('should delete artifacts successfully', async ({ page }) => {
    // Navigate to artifacts page
    await page.click('text=Artifacts');
    
    // Wait for page to load
    await page.waitForSelector('.artifacts-container');
    
    // Check if there are artifacts
    const hasArtifacts = await page.isVisible('.artifact-card');
    
    if (hasArtifacts) {
      // Get count before deletion
      const countBefore = await page.evaluate(() => {
        return document.querySelectorAll('.artifact-card').length;
      });
      
      // Click delete button on first artifact
      await page.click('.artifact-card:first-child .delete-btn');
      
      // Confirm deletion if prompt appears
      await page.waitForTimeout(500);
      
      // There might be a confirmation dialog
      const hasConfirmDialog = await page.isVisible('.confirm-dialog');
      if (hasConfirmDialog) {
        await page.click('.confirm-dialog .confirm-btn');
      }
      
      // Wait for deletion to complete
      await page.waitForTimeout(1000);
      
      // Get count after deletion
      const countAfter = await page.evaluate(() => {
        return document.querySelectorAll('.artifact-card').length;
      });
      
      // Verify count is less
      expect(countAfter).toBeLessThan(countBefore);
    } else {
      // Skip test if no artifacts to delete
      test.skip();
    }
  });
}); 