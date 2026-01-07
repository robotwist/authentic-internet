import { test, expect } from '@playwright/test';

test.describe('Complete User Journey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('New User Onboarding Journey', () => {
    test('complete new user onboarding flow', async ({ page }) => {
      // Start at home page
      await page.goto('http://localhost:5173');
      
      // Should see welcome screen for new users
      await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();
      await expect(page.locator('[data-testid="welcome-title"]')).toContainText('Welcome to Authentic Internet');
      
      // Click "Get Started" button
      await page.click('[data-testid="get-started-button"]');
      
      // Should see onboarding tutorial
      await expect(page.locator('[data-testid="onboarding-tutorial"]')).toBeVisible();
      
      // Complete tutorial steps
      await page.click('[data-testid="tutorial-next"]');
      await expect(page.locator('[data-testid="tutorial-step-2"]')).toBeVisible();
      
      await page.click('[data-testid="tutorial-next"]');
      await expect(page.locator('[data-testid="tutorial-step-3"]')).toBeVisible();
      
      // Complete tutorial
      await page.click('[data-testid="tutorial-complete"]');
      
      // Should be prompted to create first artifact
      await expect(page.locator('[data-testid="create-first-artifact-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="prompt-title"]')).toContainText('Create Your First Artifact');
    });

    test('guided first artifact creation', async ({ page }) => {
      // Navigate to game world
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Should see first artifact creation prompt
      await expect(page.locator('[data-testid="first-artifact-prompt"]')).toBeVisible();
      
      // Click "Create Artifact" button
      await page.click('[data-testid="create-artifact-button"]');
      
      // Should open artifact creation form
      await expect(page.locator('[data-testid="artifact-form"]')).toBeVisible();
      
      // Fill out the form with guided suggestions
      await page.fill('[data-testid="artifact-name"]', 'My First Story');
      await page.fill('[data-testid="artifact-description"]', 'A tale of adventure and discovery');
      await page.selectOption('[data-testid="artifact-type"]', 'STORY');
      await page.fill('[data-testid="artifact-content"]', 'Once upon a time, in a digital realm...');
      await page.fill('[data-testid="artifact-tags"]', 'story, adventure, first');
      
      // Submit the artifact
      await page.click('[data-testid="submit-artifact"]');
      
      // Should see success message
      await expect(page.locator('[data-testid="artifact-created-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Artifact created successfully!');
      
      // Should be prompted to place artifact in world
      await expect(page.locator('[data-testid="place-artifact-prompt"]')).toBeVisible();
    });

    test('artifact placement and discovery', async ({ page }) => {
      // Create and place an artifact
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Create artifact (simplified for test)
      await page.click('[data-testid="create-artifact-button"]');
      await page.fill('[data-testid="artifact-name"]', 'Test Artifact');
      await page.fill('[data-testid="artifact-description"]', 'A test artifact');
      await page.selectOption('[data-testid="artifact-type"]', 'TREASURE');
      await page.fill('[data-testid="artifact-content"]', 'This is a test artifact');
      await page.click('[data-testid="submit-artifact"]');
      
      // Place artifact on map
      await page.click('[data-testid="place-artifact"]');
      await page.click('[data-testid="map-tile-5-5"]'); // Click on map position
      
      // Artifact should appear on map
      await expect(page.locator('[data-testid="artifact-Test Artifact"]')).toBeVisible();
      
      // Move character to artifact
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
      }
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowDown');
      }
      
      // Click on artifact to interact
      await page.click('[data-testid="artifact-Test Artifact"]');
      
      // Should see artifact details
      await expect(page.locator('[data-testid="artifact-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="artifact-title"]')).toContainText('Test Artifact');
      
      // Collect the artifact
      await page.click('[data-testid="collect-artifact"]');
      
      // Artifact should be added to inventory
      await page.keyboard.press('i'); // Open inventory
      await expect(page.locator('[data-testid="inventory"]')).toContainText('Test Artifact');
    });
  });

  test.describe('Artifact Discovery and Social Features', () => {
    test('browse and discover artifacts', async ({ page }) => {
      // Navigate to artifacts page
      await page.goto('http://localhost:5173/artifacts');
      
      // Should see artifacts list
      await expect(page.locator('[data-testid="artifacts-list"]')).toBeVisible();
      
      // Test filtering by type
      await page.selectOption('[data-testid="filter-type"]', 'WEAPON');
      await expect(page.locator('[data-testid="artifacts-list"]')).toContainText('Weapon');
      
      // Test filtering by area
      await page.selectOption('[data-testid="filter-area"]', 'overworld');
      
      // Test search functionality
      await page.fill('[data-testid="search-input"]', 'sword');
      await page.keyboard.press('Enter');
      
      // Should see search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });

    test('rate and review artifacts', async ({ page }) => {
      // Navigate to a specific artifact
      await page.goto('http://localhost:5173/artifacts');
      await page.click('[data-testid="artifact-card-1"]');
      
      // Should see artifact details
      await expect(page.locator('[data-testid="artifact-details"]')).toBeVisible();
      
      // Rate the artifact
      await page.click('[data-testid="rating-star-4"]');
      
      // Add a review
      await page.fill('[data-testid="review-comment"]', 'This is an amazing artifact!');
      await page.click('[data-testid="submit-review"]');
      
      // Should see review submitted
      await expect(page.locator('[data-testid="review-submitted"]')).toBeVisible();
      
      // Review should appear in reviews list
      await expect(page.locator('[data-testid="reviews-list"]')).toContainText('This is an amazing artifact!');
    });

    test('follow creators and get recommendations', async ({ page }) => {
      // Navigate to a creator's profile
      await page.goto('http://localhost:5173/profile/creator-123');
      
      // Should see creator profile
      await expect(page.locator('[data-testid="creator-profile"]')).toBeVisible();
      
      // Follow the creator
      await page.click('[data-testid="follow-creator"]');
      
      // Should see follow button change
      await expect(page.locator('[data-testid="follow-creator"]')).toContainText('Following');
      
      // Navigate to recommendations
      await page.goto('http://localhost:5173/recommendations');
      
      // Should see recommended artifacts from followed creators
      await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
    });
  });

  test.describe('Advanced Artifact Creation', () => {
    test('create complex artifact with media', async ({ page }) => {
      // Navigate to artifact creation
      await page.goto('http://localhost:5173/create');
      
      // Fill out basic information
      await page.fill('[data-testid="artifact-name"]', 'Epic Adventure Story');
      await page.fill('[data-testid="artifact-description"]', 'An epic tale of heroes and villains');
      await page.selectOption('[data-testid="artifact-type"]', 'STORY');
      await page.fill('[data-testid="artifact-content"]', 'In a world where magic and technology coexist...');
      
      // Add tags
      await page.fill('[data-testid="artifact-tags"]', 'epic, fantasy, adventure, magic');
      
      // Upload media files
      const fileInput = page.locator('[data-testid="media-upload"]');
      await fileInput.setInputFiles('tests/fixtures/test-image.png');
      
      // Should see uploaded file
      await expect(page.locator('[data-testid="uploaded-media"]')).toBeVisible();
      
      // Set experience points
      await page.fill('[data-testid="artifact-exp"]', '50');
      
      // Set visibility
      await page.selectOption('[data-testid="artifact-visibility"]', 'public');
      
      // Submit artifact
      await page.click('[data-testid="submit-artifact"]');
      
      // Should see success message
      await expect(page.locator('[data-testid="artifact-created-success"]')).toBeVisible();
    });

    test('create interactive puzzle artifact', async ({ page }) => {
      // Navigate to artifact creation
      await page.goto('http://localhost:5173/create');
      
      // Select puzzle type
      await page.selectOption('[data-testid="artifact-type"]', 'PUZZLE');
      
      // Fill puzzle-specific fields
      await page.fill('[data-testid="artifact-name"]', 'Logic Challenge');
      await page.fill('[data-testid="artifact-description"]', 'A challenging logic puzzle');
      await page.fill('[data-testid="artifact-content"]', 'Solve this puzzle to unlock the next level');
      
      // Set puzzle configuration
      await page.selectOption('[data-testid="puzzle-type"]', 'logicChallenge');
      await page.fill('[data-testid="puzzle-question"]', 'What comes next in the sequence: 2, 4, 8, 16?');
      await page.fill('[data-testid="puzzle-answer"]', '32');
      await page.fill('[data-testid="puzzle-hint"]', 'Each number is multiplied by 2');
      
      // Set difficulty
      await page.selectOption('[data-testid="puzzle-difficulty"]', 'expert');
      
      // Submit puzzle
      await page.click('[data-testid="submit-artifact"]');
      
      // Should see success message
      await expect(page.locator('[data-testid="artifact-created-success"]')).toBeVisible();
    });
  });

  test.describe('Collaboration and Social Features', () => {
    test('collaborate on artifact creation', async ({ page }) => {
      // Navigate to collaboration page
      await page.goto('http://localhost:5173/collaborate');
      
      // Create a collaborative project
      await page.click('[data-testid="create-collaboration"]');
      await page.fill('[data-testid="project-name"]', 'Collaborative Story');
      await page.fill('[data-testid="project-description"]', 'A story written by multiple authors');
      await page.selectOption('[data-testid="project-type"]', 'STORY');
      
      // Invite collaborators
      await page.fill('[data-testid="invite-email"]', 'collaborator@example.com');
      await page.click('[data-testid="send-invite"]');
      
      // Should see invitation sent
      await expect(page.locator('[data-testid="invitation-sent"]')).toBeVisible();
    });

    test('participate in community challenges', async ({ page }) => {
      // Navigate to challenges page
      await page.goto('http://localhost:5173/challenges');
      
      // Should see active challenges
      await expect(page.locator('[data-testid="challenges-list"]')).toBeVisible();
      
      // Join a challenge
      await page.click('[data-testid="join-challenge-1"]');
      
      // Should see challenge details
      await expect(page.locator('[data-testid="challenge-details"]')).toBeVisible();
      
      // Create artifact for challenge
      await page.click('[data-testid="create-for-challenge"]');
      
      // Should open artifact form with challenge context
      await expect(page.locator('[data-testid="artifact-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="challenge-context"]')).toBeVisible();
    });
  });

  test.describe('Performance and Scalability', () => {
    test('handle large number of artifacts efficiently', async ({ page }) => {
      // Navigate to artifacts page
      await page.goto('http://localhost:5173/artifacts');
      
      // Measure load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="artifacts-list"]');
      const loadTime = Date.now() - startTime;
      
      // Should load quickly even with many artifacts
      expect(loadTime).toBeLessThan(2000);
      
      // Test pagination
      await page.click('[data-testid="next-page"]');
      await expect(page.locator('[data-testid="artifacts-list"]')).toBeVisible();
      
      // Test infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // Should load more artifacts
      await expect(page.locator('[data-testid="artifacts-list"]')).toBeVisible();
    });

    test('smooth interactions with many concurrent users', async ({ page }) => {
      // Simulate multiple concurrent interactions
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Rapid interactions
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
      }
      
      // Game should remain responsive
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="character"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('handle network failures gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      // Navigate to game
      await page.goto('http://localhost:5173/game');
      
      // Should show offline mode or error message
      await expect(page.locator('[data-testid="offline-mode"]')).toBeVisible();
      
      // Game should still be functional
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });

    test('handle invalid user input', async ({ page }) => {
      // Navigate to artifact creation
      await page.goto('http://localhost:5173/create');
      
      // Try to submit with invalid data
      await page.click('[data-testid="submit-artifact"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-required"]')).toBeVisible();
    });

    test('handle concurrent artifact creation', async ({ page, context }) => {
      // Create multiple browser contexts to simulate concurrent users
      const context1 = await context.newPage();
      const context2 = await context.newPage();
      
      // Both users try to create artifacts simultaneously
      await Promise.all([
        context1.goto('http://localhost:5173/create'),
        context2.goto('http://localhost:5173/create')
      ]);
      
      // Both should be able to create artifacts
      await context1.fill('[data-testid="artifact-name"]', 'Artifact 1');
      await context2.fill('[data-testid="artifact-name"]', 'Artifact 2');
      
      await Promise.all([
        context1.click('[data-testid="submit-artifact"]'),
        context2.click('[data-testid="submit-artifact"]')
      ]);
      
      // Both should succeed
      await expect(context1.locator('[data-testid="artifact-created-success"]')).toBeVisible();
      await expect(context2.locator('[data-testid="artifact-created-success"]')).toBeVisible();
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('full keyboard navigation', async ({ page }) => {
      // Navigate to game
      await page.goto('http://localhost:5173/game');
      
      // Test all navigation keys
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'm', 'Escape'];
      
      for (const key of keys) {
        await page.keyboard.press(key);
        // Should not throw errors
        await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      }
    });

    test('screen reader compatibility', async ({ page }) => {
      // Navigate to artifacts page
      await page.goto('http://localhost:5173/artifacts');
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Check for proper button labels
      const buttons = page.locator('button');
      await expect(buttons.first()).toHaveAttribute('aria-label');
    });

    test('responsive design across devices', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:5173/game');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });
}); 