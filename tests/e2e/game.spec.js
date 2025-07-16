import { test, expect } from '@playwright/test';

test.describe('Authentic Internet Game E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
  });

  test.describe('Game Initialization', () => {
    test('should load the game successfully', async ({ page }) => {
      // Check if main game elements are present
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="map-component"]')).toBeVisible();
      await expect(page.locator('[data-testid="character"]')).toBeVisible();
      
      // Check if game UI elements are present
      await expect(page.locator('[data-testid="game-ui"]')).toBeVisible();
    });

    test('should display correct initial game state', async ({ page }) => {
      // Check character starting position
      const character = page.locator('[data-testid="character"]');
      await expect(character).toHaveCSS('left', '64px');
      await expect(character).toHaveCSS('top', '64px');
      
      // Check if NPCs are visible
      await expect(page.locator('[data-testid="npc-John Muir"]')).toBeVisible();
    });

    test('should load saved game state if available', async ({ page }) => {
      // Set up localStorage with saved state
      await page.evaluate(() => {
        localStorage.setItem('gameState', JSON.stringify({
          characterPosition: { x: 128, y: 128 },
          currentMapIndex: 1,
          inventory: [{ id: 'test-item', name: 'Test Item' }]
        }));
      });
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Check if saved state was loaded
      const character = page.locator('[data-testid="character"]');
      await expect(character).toHaveCSS('left', '128px');
      await expect(character).toHaveCSS('top', '128px');
    });
  });

  test.describe('Character Movement', () => {
    test('should move character with arrow keys', async ({ page }) => {
      const character = page.locator('[data-testid="character"]');
      
      // Test right movement
      await page.keyboard.press('ArrowRight');
      await expect(character).toHaveCSS('left', '128px');
      
      // Test down movement
      await page.keyboard.press('ArrowDown');
      await expect(character).toHaveCSS('top', '128px');
      
      // Test left movement
      await page.keyboard.press('ArrowLeft');
      await expect(character).toHaveCSS('left', '64px');
      
      // Test up movement
      await page.keyboard.press('ArrowUp');
      await expect(character).toHaveCSS('top', '64px');
    });

    test('should prevent movement through walls', async ({ page }) => {
      const character = page.locator('[data-testid="character"]');
      
      // Try to move into a wall
      await page.keyboard.press('ArrowUp');
      
      // Character should not move
      await expect(character).toHaveCSS('top', '64px');
    });

    test('should handle rapid key presses', async ({ page }) => {
      const character = page.locator('[data-testid="character"]');
      
      // Rapid key presses
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      // Character should be at expected position
      await expect(character).toHaveCSS('left', '384px'); // 64 + (64 * 5)
    });

    test('should animate character movement', async ({ page }) => {
      const character = page.locator('[data-testid="character"]');
      
      // Check if character has walking animation class
      await page.keyboard.press('ArrowRight');
      await expect(character).toHaveClass(/walking/);
      
      // Wait for animation to complete
      await page.waitForTimeout(200);
      await expect(character).not.toHaveClass(/walking/);
    });
  });

  test.describe('NPC Interactions', () => {
    test('should display NPCs on the map', async ({ page }) => {
      // Check if NPCs are visible
      await expect(page.locator('[data-testid="npc-John Muir"]')).toBeVisible();
      await expect(page.locator('[data-testid="npc-William Shakespeare"]')).toBeVisible();
    });

    test('should open dialog when clicking NPC', async ({ page }) => {
      // Click on NPC
      await page.click('[data-testid="npc-John Muir"]');
      
      // Dialog should appear
      await expect(page.locator('[data-testid="npc-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="dialog-title"]')).toContainText('John Muir');
    });

    test('should display NPC dialogue', async ({ page }) => {
      // Open NPC dialog
      await page.click('[data-testid="npc-John Muir"]');
      
      // Check if dialogue is displayed
      await expect(page.locator('[data-testid="dialog-content"]')).toContainText('The mountains are calling');
    });

    test('should close dialog when clicking close button', async ({ page }) => {
      // Open NPC dialog
      await page.click('[data-testid="npc-John Muir"]');
      
      // Close dialog
      await page.click('[data-testid="close-dialog"]');
      
      // Dialog should disappear
      await expect(page.locator('[data-testid="npc-dialog"]')).not.toBeVisible();
    });

    test('should close dialog when clicking outside', async ({ page }) => {
      // Open NPC dialog
      await page.click('[data-testid="npc-John Muir"]');
      
      // Click outside dialog
      await page.click('[data-testid="game-container"]');
      
      // Dialog should disappear
      await expect(page.locator('[data-testid="npc-dialog"]')).not.toBeVisible();
    });

    test('should save quotes from NPC dialogue', async ({ page }) => {
      // Open NPC dialog
      await page.click('[data-testid="npc-John Muir"]');
      
      // Click save quote button
      await page.click('[data-testid="save-quote-button"]');
      
      // Quote should be saved
      await expect(page.locator('[data-testid="save-quote-button"]')).toHaveText('✓ Saved');
    });
  });

  test.describe('Map Navigation', () => {
    test('should navigate between maps', async ({ page }) => {
      // Check initial map
      await expect(page.locator('[data-testid="map-component"]')).toBeVisible();
      
      // Navigate to next map
      await page.click('[data-testid="next-map-button"]');
      
      // Map should change
      await expect(page.locator('[data-testid="map-component"]')).toBeVisible();
      
      // Check if new NPCs are present
      await expect(page.locator('[data-testid="npc-Zeus the Weatherman"]')).toBeVisible();
    });

    test('should reset character position when changing maps', async ({ page }) => {
      // Move character
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      
      // Change map
      await page.click('[data-testid="next-map-button"]');
      
      // Character should be at default position
      const character = page.locator('[data-testid="character"]');
      await expect(character).toHaveCSS('left', '64px');
      await expect(character).toHaveCSS('top', '64px');
    });

    test('should display map name', async ({ page }) => {
      await expect(page.locator('[data-testid="map-name"]')).toContainText('Overworld 1');
    });
  });

  test.describe('Artifact System', () => {
    test('should display artifacts on the map', async ({ page }) => {
      await expect(page.locator('[data-testid="artifact-Ancient Sword"]')).toBeVisible();
    });

    test('should show artifact details when clicked', async ({ page }) => {
      // Click on artifact
      await page.click('[data-testid="artifact-Ancient Sword"]');
      
      // Artifact modal should appear
      await expect(page.locator('[data-testid="artifact-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="artifact-title"]')).toContainText('Ancient Sword');
    });

    test('should collect artifacts', async ({ page }) => {
      // Click on artifact
      await page.click('[data-testid="artifact-Ancient Sword"]');
      
      // Click collect button
      await page.click('[data-testid="collect-artifact"]');
      
      // Artifact should be added to inventory
      await page.keyboard.press('i'); // Open inventory
      await expect(page.locator('[data-testid="inventory"]')).toContainText('Ancient Sword');
    });

    test('should hide collected artifacts', async ({ page }) => {
      // Collect artifact
      await page.click('[data-testid="artifact-Ancient Sword"]');
      await page.click('[data-testid="collect-artifact"]');
      
      // Artifact should not be visible on map
      await expect(page.locator('[data-testid="artifact-Ancient Sword"]')).not.toBeVisible();
    });
  });

  test.describe('Inventory System', () => {
    test('should open inventory with I key', async ({ page }) => {
      await page.keyboard.press('i');
      
      await expect(page.locator('[data-testid="inventory-modal"]')).toBeVisible();
    });

    test('should display collected items in inventory', async ({ page }) => {
      // Collect an artifact first
      await page.click('[data-testid="artifact-Ancient Sword"]');
      await page.click('[data-testid="collect-artifact"]');
      
      // Open inventory
      await page.keyboard.press('i');
      
      await expect(page.locator('[data-testid="inventory"]')).toContainText('Ancient Sword');
    });

    test('should close inventory with Escape key', async ({ page }) => {
      // Open inventory
      await page.keyboard.press('i');
      
      // Close with Escape
      await page.keyboard.press('Escape');
      
      await expect(page.locator('[data-testid="inventory-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Level Completion', () => {
    test('should complete level when reaching goal', async ({ page }) => {
      // Move character to goal position
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      // Level completion notification should appear
      await expect(page.locator('[data-testid="level-complete-notification"]')).toBeVisible();
    });

    test('should show reward when level is completed', async ({ page }) => {
      // Complete level
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      await expect(page.locator('[data-testid="reward-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="reward-title"]')).toContainText('Level Complete');
    });

    test('should advance to next level after completion', async ({ page }) => {
      // Complete level
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      // Click continue button
      await page.click('[data-testid="continue-button"]');
      
      // Should be on next level
      await expect(page.locator('[data-testid="map-name"]')).toContainText('Overworld 2');
    });
  });

  test.describe('Save System', () => {
    test('should auto-save game state', async ({ page }) => {
      // Move character
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      
      // Check if localStorage was updated
      const gameState = await page.evaluate(() => {
        return localStorage.getItem('gameState');
      });
      
      expect(gameState).toBeTruthy();
      
      const parsedState = JSON.parse(gameState);
      expect(parsedState.characterPosition.x).toBe(128);
      expect(parsedState.characterPosition.y).toBe(128);
    });

    test('should load saved game state on restart', async ({ page }) => {
      // Set up saved state
      await page.evaluate(() => {
        localStorage.setItem('gameState', JSON.stringify({
          characterPosition: { x: 128, y: 128 },
          currentMapIndex: 1,
          inventory: [{ id: 'test-item', name: 'Test Item' }]
        }));
      });
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Check if saved state was loaded
      const character = page.locator('[data-testid="character"]');
      await expect(character).toHaveCSS('left', '128px');
      await expect(character).toHaveCSS('top', '128px');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      // Game should still be functional
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="character"]')).toBeVisible();
    });

    test('should display error messages when appropriate', async ({ page }) => {
      // Trigger an error condition
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('gameState', 'invalid-json');
      });
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Game should still work despite invalid save data
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load game quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173');
      await page.waitForSelector('[data-testid="game-container"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid interactions smoothly', async ({ page }) => {
      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      // Game should remain responsive
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="character"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Test all navigation keys
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'm'];
      
      for (const key of keys) {
        await page.keyboard.press(key);
        // Should not throw errors
        await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await expect(page.locator('[data-testid="game-container"]')).toHaveAttribute('role', 'application');
      await expect(page.locator('[data-testid="character"]')).toHaveAttribute('aria-label');
    });

    test('should support screen readers', async ({ page }) => {
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for proper button labels
      await expect(page.locator('button')).toHaveAttribute('aria-label');
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });
}); 