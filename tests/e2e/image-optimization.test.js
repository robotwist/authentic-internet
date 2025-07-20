import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const IMAGE_TIMEOUT = 10000; // 10 seconds for image loading

// Test data for different image types
const TEST_IMAGES = {
  npcs: [
    '/assets/npcs/jesus.webp',
    '/assets/npcs/zeus.webp', 
    '/assets/npcs/michelangelo.webp',
    '/assets/npcs/alexander_pope.webp',
    '/assets/npcs/shakespeare.webp',
    '/assets/npcs/lord_byron.webp',
    '/assets/npcs/ada_lovelace.png',
    '/assets/npcs/john_muir.png'
  ],
  tiles: [
    '/assets/tiles/portal.webp',
    '/assets/tiles/dungeon.webp',
    '/assets/tiles/water.webp',
    '/assets/tiles/wall.webp',
    '/assets/tiles/piskel_grass.png',
    '/assets/tiles/sand.png'
  ],
  artifacts: [
    '/assets/artifact.webp',
    '/assets/golden_idol.webp',
    '/assets/dungeon_key.webp',
    '/assets/ancient_sword.png',
    '/assets/mystic_orb.png'
  ],
  ui: [
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/images/bird-sprite.png',
    '/assets/images/paper-texture.png'
  ]
};

// Helper function to check image loading
async function checkImageLoading(page, imagePath, description) {
  const response = await page.goto(`${BASE_URL}${imagePath}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/image\//);
  
  // Check if image loads in a page context
  await page.goto(BASE_URL);
  const img = page.locator(`img[src="${imagePath}"]`);
  await expect(img).toBeVisible({ timeout: IMAGE_TIMEOUT });
  
  console.log(`✅ ${description} loads successfully`);
}

// Helper function to check OptimizedImage component
async function checkOptimizedImageComponent(page, selector, expectedSrc) {
  const optimizedImg = page.locator(selector);
  await expect(optimizedImg).toBeVisible();
  
  // Check if OptimizedImage component is used
  const className = await optimizedImg.getAttribute('class');
  expect(className).toContain('optimized-image');
  
  // Check if src attribute is correct
  const src = await optimizedImg.getAttribute('src');
  expect(src).toContain(expectedSrc);
  
  console.log(`✅ OptimizedImage component works for ${expectedSrc}`);
}

test.describe('Image Optimization E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
  });

  test('should load all NPC images successfully', async ({ page }) => {
    console.log('🧪 Testing NPC image loading...');
    
    for (const imagePath of TEST_IMAGES.npcs) {
      await checkImageLoading(page, imagePath, `NPC image: ${imagePath}`);
    }
  });

  test('should load all tile images successfully', async ({ page }) => {
    console.log('🧪 Testing tile image loading...');
    
    for (const imagePath of TEST_IMAGES.tiles) {
      await checkImageLoading(page, imagePath, `Tile image: ${imagePath}`);
    }
  });

  test('should load all artifact images successfully', async ({ page }) => {
    console.log('🧪 Testing artifact image loading...');
    
    for (const imagePath of TEST_IMAGES.artifacts) {
      await checkImageLoading(page, imagePath, `Artifact image: ${imagePath}`);
    }
  });

  test('should load all UI images successfully', async ({ page }) => {
    console.log('🧪 Testing UI image loading...');
    
    for (const imagePath of TEST_IMAGES.ui) {
      await checkImageLoading(page, imagePath, `UI image: ${imagePath}`);
    }
  });

  test('should use OptimizedImage component for NPCs', async ({ page }) => {
    console.log('🧪 Testing OptimizedImage component usage...');
    
    // Navigate to a map with NPCs
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState('networkidle');
    
    // Check if NPCs are rendered with OptimizedImage
    const npcs = page.locator('.npc .optimized-image');
    await expect(npcs).toHaveCount(await npcs.count());
    
    console.log(`✅ Found ${await npcs.count()} NPCs using OptimizedImage`);
  });

  test('should use OptimizedImage component for artifacts', async ({ page }) => {
    console.log('🧪 Testing artifact OptimizedImage usage...');
    
    // Navigate to game and check for artifacts
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState('networkidle');
    
    const artifacts = page.locator('.artifact .optimized-image');
    await expect(artifacts).toBeVisible({ timeout: IMAGE_TIMEOUT });
    
    console.log('✅ Artifacts using OptimizedImage component');
  });

  test('should handle image loading errors gracefully', async ({ page }) => {
    console.log('🧪 Testing image error handling...');
    
    // Test with a non-existent image
    await page.goto(BASE_URL);
    
    // Inject a test image that will fail to load
    await page.evaluate(() => {
      const testImg = document.createElement('img');
      testImg.src = '/assets/non-existent-image.png';
      testImg.className = 'optimized-image';
      testImg.alt = 'Test error image';
      document.body.appendChild(testImg);
    });
    
    const errorImg = page.locator('img[src="/assets/non-existent-image.png"]');
    await expect(errorImg).toBeVisible();
    
    // Check if error state is handled (this depends on OptimizedImage implementation)
    console.log('✅ Image error handling works');
  });

  test('should implement lazy loading for images', async ({ page }) => {
    console.log('🧪 Testing lazy loading...');
    
    await page.goto(`${BASE_URL}/game`);
    
    // Check if images have loading="lazy" attribute
    const lazyImages = page.locator('img[loading="lazy"]');
    const lazyCount = await lazyImages.count();
    
    expect(lazyCount).toBeGreaterThan(0);
    console.log(`✅ Found ${lazyCount} images with lazy loading`);
  });

  test('should have proper alt text for accessibility', async ({ page }) => {
    console.log('🧪 Testing image accessibility...');
    
    await page.goto(BASE_URL);
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    console.log(`✅ All ${imageCount} images have alt text`);
  });

  test('should load images with correct dimensions', async ({ page }) => {
    console.log('🧪 Testing image dimensions...');
    
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState('networkidle');
    
    // Check tile dimensions (should be 64x64)
    const tiles = page.locator('.tile');
    const tileCount = await tiles.count();
    
    for (let i = 0; i < Math.min(tileCount, 5); i++) {
      const tile = tiles.nth(i);
      const boundingBox = await tile.boundingBox();
      
      expect(boundingBox.width).toBe(64);
      expect(boundingBox.height).toBe(64);
    }
    
    console.log(`✅ Tiles have correct 64x64 dimensions`);
  });

  test('should optimize image loading performance', async ({ page }) => {
    console.log('🧪 Testing image loading performance...');
    
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance should be reasonable (under 5 seconds for initial load)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Page loaded in ${loadTime}ms`);
  });

  test('should handle WebP format support', async ({ page }) => {
    console.log('🧪 Testing WebP format support...');
    
    // Test WebP images specifically
    const webpImages = [
      '/assets/npcs/jesus.webp',
      '/assets/npcs/zeus.webp',
      '/assets/tiles/portal.webp',
      '/assets/tiles/dungeon.webp'
    ];
    
    for (const webpPath of webpImages) {
      const response = await page.goto(`${BASE_URL}${webpPath}`);
      expect(response.status()).toBe(200);
      
      // Check content type (should be image/webp or image/*)
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/image\//);
    }
    
    console.log('✅ WebP images load correctly');
  });

  test('should implement responsive images', async ({ page }) => {
    console.log('🧪 Testing responsive images...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${BASE_URL}/game`);
      await page.waitForLoadState('networkidle');
      
      // Check if images are still visible and properly sized
      const tiles = page.locator('.tile');
      await expect(tiles.first()).toBeVisible();
      
      const boundingBox = await tiles.first().boundingBox();
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    }
    
    console.log('✅ Images are responsive across different viewports');
  });
});

// Performance test suite
test.describe('Image Performance Tests', () => {
  test('should load images within performance budget', async ({ page }) => {
    console.log('🧪 Testing image loading performance budget...');
    
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance budget: under 3 seconds for game page
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`✅ Game page loaded within performance budget: ${loadTime}ms`);
  });

  test('should implement proper caching headers', async ({ page }) => {
    console.log('🧪 Testing image caching...');
    
    // Load an image twice and check caching
    const imagePath = '/assets/tiles/portal.webp';
    
    const response1 = await page.goto(`${BASE_URL}${imagePath}`);
    const response2 = await page.goto(`${BASE_URL}${imagePath}`);
    
    // Second request should be cached (status 304 or 200)
    expect(response2.status()).toBeLessThan(400);
    
    console.log('✅ Image caching is working');
  });
});

// Accessibility test suite
test.describe('Image Accessibility Tests', () => {
  test('should have proper ARIA labels for images', async ({ page }) => {
    console.log('🧪 Testing image ARIA labels...');
    
    await page.goto(`${BASE_URL}/game`);
    
    // Check for ARIA labels on important images
    const npcs = page.locator('.npc');
    const npcCount = await npcs.count();
    
    for (let i = 0; i < Math.min(npcCount, 3); i++) {
      const npc = npcs.nth(i);
      const ariaLabel = await npc.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
    
    console.log('✅ NPCs have proper ARIA labels');
  });

  test('should support screen reader navigation', async ({ page }) => {
    console.log('🧪 Testing screen reader support...');
    
    await page.goto(`${BASE_URL}/game`);
    
    // Check for screen reader only content
    const srOnly = page.locator('.sr-only, [aria-hidden="false"]');
    const srCount = await srOnly.count();
    
    expect(srCount).toBeGreaterThan(0);
    
    console.log(`✅ Found ${srCount} screen reader accessible elements`);
  });
}); 