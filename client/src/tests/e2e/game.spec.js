import { test, expect } from '@playwright/test';

test.describe('Game functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Navigate to game world
    await page.waitForURL(/.*\/dashboard/);
    await page.click('text=Enter World');
    
    // Wait for game to load
    await page.waitForSelector('.game-container');
  });

  test('character should move with arrow keys', async ({ page }) => {
    // Get initial character position
    const initialPosition = await page.evaluate(() => {
      const character = document.querySelector('.character');
      return {
        left: character.style.left,
        top: character.style.top,
      };
    });
    
    // Press arrow key down
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300); // Wait for movement animation
    
    // Check that position changed
    const newPosition = await page.evaluate(() => {
      const character = document.querySelector('.character');
      return {
        left: character.style.left,
        top: character.style.top,
      };
    });
    
    expect(newPosition.top).not.toEqual(initialPosition.top);
  });

  test('should allow interaction with NPC', async ({ page }) => {
    // Find NPC and click on it (first locate any NPC)
    const npcSelector = '.npc';
    await page.waitForSelector(npcSelector);
    
    // Move close to NPC first (since we need to be within interaction distance)
    // This requires us to know where an NPC is, let's assume one is nearby
    await page.click(npcSelector);
    
    // Verify dialog appears
    await expect(page.locator('.dialog-overlay')).toBeVisible();
    
    // Type a message to the NPC
    await page.fill('.prompt-form input', 'Hello, who are you?');
    await page.click('.prompt-form button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('.message.npc:nth-child(2)');
    
    // Verify we got a response
    const responseText = await page.textContent('.message.npc:nth-child(2) p');
    expect(responseText.length).toBeGreaterThan(0);
    
    // Close dialog
    await page.click('.close-button');
    await expect(page.locator('.dialog-overlay')).not.toBeVisible();
  });

  test('should be able to pick up artifact', async ({ page }) => {
    // We need to position the character near an artifact
    // Let's use the nav keys to move around until we find one
    
    // Function to check if we're standing on an artifact
    const isOnArtifact = async () => {
      return await page.evaluate(() => {
        // Check for visible artifact tooltip or pickup notification
        return document.querySelector('.artifact-tooltip') !== null;
      });
    };
    
    // Move around to find an artifact (limited attempts)
    for (let i = 0; i < 20; i++) {
      if (await isOnArtifact()) break;
      
      // Try moving in different directions
      await page.keyboard.press(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][i % 4]);
      await page.waitForTimeout(300);
    }
    
    // Press 'P' to pick up the artifact if we found one
    if (await isOnArtifact()) {
      // Get count of inventory items before pickup
      const inventoryBefore = await page.evaluate(() => {
        // Access inventory somehow, if we need to check it first
        return document.querySelectorAll('.inventory-item').length;
      });
      
      // Pick up artifact with 'P' key
      await page.keyboard.press('p');
      await page.waitForTimeout(500);
      
      // Press 'I' to open inventory
      await page.keyboard.press('i');
      await page.waitForSelector('.inventory');
      
      // Verify artifact is in inventory
      const inventoryAfter = await page.evaluate(() => {
        return document.querySelectorAll('.inventory-item').length;
      });
      
      expect(inventoryAfter).toBeGreaterThan(inventoryBefore);
      
      // Close inventory
      await page.keyboard.press('Escape');
    }
  });

  test('creating artifact should work', async ({ page }) => {
    // Press 'C' to create an artifact
    await page.keyboard.press('c');
    
    // Wait for artifact creation form
    await page.waitForSelector('form.artifact-creation-form');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Test Artifact');
    await page.fill('textarea[name="description"]', 'This is a test artifact created by Playwright');
    await page.fill('textarea[name="messageText"]', 'Hello from Playwright testing!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify success message or artifact appears
    await expect(page.locator('text=Artifact Created')).toBeVisible();
  });

  test('mobile touch controls should work', async ({ page }) => {
    // Resize page to mobile dimensions to show touch controls
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify touch controls are visible
    await expect(page.locator('.touch-controls')).toBeVisible();
    
    // Get initial character position
    const initialPosition = await page.evaluate(() => {
      const character = document.querySelector('.character');
      return {
        left: parseFloat(character.style.left),
        top: parseFloat(character.style.top),
      };
    });
    
    // Tap the down direction on the D-pad
    await page.tap('.d-pad-btn.down');
    await page.waitForTimeout(300);
    
    // Get new position
    const newPosition = await page.evaluate(() => {
      const character = document.querySelector('.character');
      return {
        left: parseFloat(character.style.left),
        top: parseFloat(character.style.top),
      };
    });
    
    // Check that position changed
    expect(newPosition.top).toBeGreaterThan(initialPosition.top);
  });

  test('menu buttons in navbar should open game menus', async ({ page }) => {
    // Check for inventory button in navbar
    await expect(page.locator('.inventory-btn')).toBeVisible();
    
    // Click the inventory button
    await page.click('.inventory-btn');
    
    // Verify inventory opens
    await expect(page.locator('.inventory')).toBeVisible();
    
    // Close inventory
    await page.keyboard.press('Escape');
    
    // Click create artifact button
    await page.click('.create-btn');
    
    // Verify artifact creation form opens
    await expect(page.locator('form.artifact-creation-form')).toBeVisible();
    
    // Close form
    await page.keyboard.press('Escape');
    
    // Click quotes button
    await page.click('.quotes-btn');
    
    // Verify quotes display opens
    await expect(page.locator('.saved-quotes')).toBeVisible();
  });
}); 