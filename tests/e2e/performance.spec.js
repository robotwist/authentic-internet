import { test, expect } from '@playwright/test';

test.describe('Performance and Scalability E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache and storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    });
  });

  test.describe('Load Time Performance', () => {
    test('initial page load time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check for performance metrics
      const metrics = await page.evaluate(() => {
        return {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
        };
      });
      
      // DOM should be ready quickly
      expect(metrics.domContentLoaded).toBeLessThan(2000);
      
      // First paint should happen quickly
      expect(metrics.firstPaint).toBeLessThan(1500);
    });

    test('game world load time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Game should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
      
      // Check game-specific metrics
      const gameMetrics = await page.evaluate(() => {
        return {
          mapRendered: performance.now(),
          assetsLoaded: document.querySelectorAll('img, audio, video').length
        };
      });
      
      // Should have loaded all game assets
      expect(gameMetrics.assetsLoaded).toBeGreaterThan(0);
    });

    test('artifacts page load time with large dataset', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/artifacts**', async route => {
        const mockArtifacts = Array.from({ length: 1000 }, (_, i) => ({
          id: `artifact-${i}`,
          name: `Artifact ${i}`,
          description: `Description for artifact ${i}`,
          type: ['WEAPON', 'SCROLL', 'ART', 'MUSIC'][i % 4],
          content: `Content for artifact ${i}`,
          location: { x: i % 20, y: Math.floor(i / 20), mapName: 'overworld' },
          area: 'overworld',
          createdBy: `user-${i % 10}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            artifacts: mockArtifacts,
            pagination: { current: 1, pages: 50, total: 1000 }
          })
        });
      });
      
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173/artifacts');
      await page.waitForSelector('[data-testid="artifacts-list"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should load large dataset efficiently
      expect(loadTime).toBeLessThan(3000);
      
      // Should implement pagination or virtualization
      const visibleArtifacts = await page.locator('[data-testid="artifact-card"]').count();
      expect(visibleArtifacts).toBeLessThanOrEqual(50); // Reasonable initial load
    });
  });

  test.describe('Interaction Performance', () => {
    test('smooth character movement', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      const character = page.locator('[data-testid="character"]');
      
      // Test rapid movement
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('ArrowRight');
      }
      
      const endTime = Date.now();
      const movementTime = endTime - startTime;
      
      // Should handle rapid movement smoothly
      expect(movementTime).toBeLessThan(5000); // 50 movements in 5 seconds
      
      // Character should be at expected position
      await expect(character).toHaveCSS('left', '3264px'); // 64 + (64 * 50)
    });

    test('artifact interaction responsiveness', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Test rapid artifact interactions
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="artifact-test"]');
        await page.click('[data-testid="close-modal"]');
      }
      
      const endTime = Date.now();
      const interactionTime = endTime - startTime;
      
      // Should handle rapid interactions smoothly
      expect(interactionTime).toBeLessThan(3000);
    });

    test('form submission performance', async ({ page }) => {
      await page.goto('http://localhost:5173/create');
      
      // Fill out form
      await page.fill('[data-testid="artifact-name"]', 'Performance Test Artifact');
      await page.fill('[data-testid="artifact-description"]', 'Testing form performance');
      await page.selectOption('[data-testid="artifact-type"]', 'TREASURE');
      await page.fill('[data-testid="artifact-content"]', 'This is a test artifact for performance testing');
      
      const startTime = Date.now();
      
      await page.click('[data-testid="submit-artifact"]');
      await page.waitForSelector('[data-testid="artifact-created-success"]');
      
      const submissionTime = Date.now() - startTime;
      
      // Form submission should be fast
      expect(submissionTime).toBeLessThan(2000);
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('memory usage during extended gameplay', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Simulate extended gameplay
      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        
        if (i % 10 === 0) {
          await page.keyboard.press('i'); // Open inventory
          await page.keyboard.press('Escape'); // Close inventory
        }
      }
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Memory usage should not grow excessively
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('asset loading and caching', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Check if assets are cached
      const cachedAssets = await page.evaluate(() => {
        return caches.keys().then(names => names.length);
      });
      
      // Should have some cached assets
      expect(cachedAssets).toBeGreaterThan(0);
      
      // Reload page to test cache effectiveness
      const startTime = Date.now();
      await page.reload();
      await page.waitForSelector('[data-testid="game-container"]');
      const reloadTime = Date.now() - startTime;
      
      // Reload should be faster due to caching
      expect(reloadTime).toBeLessThan(1500);
    });
  });

  test.describe('Concurrent User Simulation', () => {
    test('handle multiple concurrent users', async ({ browser }) => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = [];
      const pages = [];
      
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // All users navigate to the game simultaneously
      const startTime = Date.now();
      
      await Promise.all(pages.map(page => 
        page.goto('http://localhost:5173/game')
      ));
      
      await Promise.all(pages.map(page => 
        page.waitForSelector('[data-testid="game-container"]')
      ));
      
      const loadTime = Date.now() - startTime;
      
      // Should handle concurrent users efficiently
      expect(loadTime).toBeLessThan(5000);
      
      // All users should be able to interact
      await Promise.all(pages.map(page => 
        page.keyboard.press('ArrowRight')
      ));
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });

    test('concurrent artifact creation', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // All users create artifacts simultaneously
      await Promise.all(pages.map(page => 
        page.goto('http://localhost:5173/create')
      ));
      
      const startTime = Date.now();
      
      await Promise.all(pages.map(async (page, i) => {
        await page.fill('[data-testid="artifact-name"]', `Concurrent Artifact ${i}`);
        await page.fill('[data-testid="artifact-description"]', `Description ${i}`);
        await page.selectOption('[data-testid="artifact-type"]', 'TREASURE');
        await page.fill('[data-testid="artifact-content"]', `Content ${i}`);
        await page.click('[data-testid="submit-artifact"]');
      }));
      
      await Promise.all(pages.map(page => 
        page.waitForSelector('[data-testid="artifact-created-success"]')
      ));
      
      const creationTime = Date.now() - startTime;
      
      // Should handle concurrent creation efficiently
      expect(creationTime).toBeLessThan(10000);
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });
  });

  test.describe('Database Query Performance', () => {
    test('artifact search performance', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/artifacts/search**', async route => {
        const mockResults = Array.from({ length: 500 }, (_, i) => ({
          id: `search-result-${i}`,
          name: `Search Result ${i}`,
          type: ['WEAPON', 'SCROLL', 'ART', 'MUSIC'][i % 4],
          rating: 4.5,
          createdBy: `user-${i % 20}`
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            results: mockResults,
            total: 500,
            searchTime: 150 // Mock search time in ms
          })
        });
      });
      
      await page.goto('http://localhost:5173/artifacts');
      
      const startTime = Date.now();
      
      await page.fill('[data-testid="search-input"]', 'test search');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="search-results"]');
      
      const searchTime = Date.now() - startTime;
      
      // Search should be fast even with large dataset
      expect(searchTime).toBeLessThan(2000);
    });

    test('filtering performance', async ({ page }) => {
      await page.goto('http://localhost:5173/artifacts');
      
      // Test multiple filter combinations
      const filters = [
        { type: 'WEAPON', area: 'overworld' },
        { type: 'ART', rating: '4' },
        { tags: 'legendary', creator: 'user-1' }
      ];
      
      for (const filter of filters) {
        const startTime = Date.now();
        
        if (filter.type) {
          await page.selectOption('[data-testid="filter-type"]', filter.type);
        }
        if (filter.area) {
          await page.selectOption('[data-testid="filter-area"]', filter.area);
        }
        if (filter.rating) {
          await page.selectOption('[data-testid="filter-rating"]', filter.rating);
        }
        if (filter.tags) {
          await page.fill('[data-testid="filter-tags"]', filter.tags);
        }
        if (filter.creator) {
          await page.fill('[data-testid="filter-creator"]', filter.creator);
        }
        
        await page.waitForSelector('[data-testid="artifacts-list"]');
        
        const filterTime = Date.now() - startTime;
        
        // Filtering should be fast
        expect(filterTime).toBeLessThan(1500);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('API response times', async ({ page }) => {
      // Mock API endpoints with controlled response times
      await page.route('**/api/artifacts**', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            artifacts: [],
            pagination: { current: 1, pages: 1, total: 0 }
          })
        });
      });
      
      await page.goto('http://localhost:5173/artifacts');
      
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="artifacts-list"]');
      const loadTime = Date.now() - startTime;
      
      // Should handle API delays gracefully
      expect(loadTime).toBeLessThan(2000);
    });

    test('offline functionality', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Go offline
      await page.context().setOffline(true);
      
      // Game should still be functional
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="character"]')).toBeVisible();
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
      
      // Should sync any offline changes
      await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    });
  });

  test.describe('Scalability Benchmarks', () => {
    test('handle large number of artifacts efficiently', async ({ page }) => {
      // Mock 10,000 artifacts
      await page.route('**/api/artifacts**', async route => {
        const mockArtifacts = Array.from({ length: 10000 }, (_, i) => ({
          id: `artifact-${i}`,
          name: `Artifact ${i}`,
          type: ['WEAPON', 'SCROLL', 'ART', 'MUSIC', 'GAME', 'PUZZLE'][i % 6],
          rating: 3.5 + (Math.random() * 1.5),
          createdBy: `user-${i % 100}`,
          createdAt: new Date().toISOString()
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            artifacts: mockArtifacts.slice(0, 20), // Pagination
            pagination: { current: 1, pages: 500, total: 10000 }
          })
        });
      });
      
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173/artifacts');
      await page.waitForSelector('[data-testid="artifacts-list"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should handle large datasets efficiently
      expect(loadTime).toBeLessThan(3000);
      
      // Should implement proper pagination
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    });

    test('memory efficient rendering', async ({ page }) => {
      await page.goto('http://localhost:5173/game');
      await page.waitForSelector('[data-testid="game-container"]');
      
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Simulate long gameplay session
      for (let i = 0; i < 1000; i++) {
        await page.keyboard.press('ArrowRight');
        
        if (i % 100 === 0) {
          // Check memory every 100 actions
          const currentMemory = await page.evaluate(() => {
            return performance.memory ? performance.memory.usedJSHeapSize : 0;
          });
          
          // Memory should not grow excessively
          const memoryIncrease = currentMemory - initialMemory;
          expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
        }
      }
    });
  });
}); 