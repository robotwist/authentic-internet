/**
 * AssetLoader - Optimized asset loading and caching for game performance
 *
 * Best Practices Implemented:
 * 1. Image preloading with progressive loading
 * 2. Asset caching to minimize network requests
 * 3. Lazy loading for non-critical assets
 * 4. Memory management with cleanup
 * 5. Loading priority system
 */

class AssetLoader {
  constructor() {
    // Image cache
    this.imageCache = new Map();
    this.imageCacheUrls = new Map();

    // Loading states
    this.loadingPromises = new Map();
    this.loadedAssets = new Set();
    this.failedAssets = new Set();

    // Performance tracking
    this.loadStats = {
      totalRequests: 0,
      cacheHits: 0,
      loadTime: 0,
    };

    // Intersection observer for lazy loading
    this.lazyObserver = null;
    this.setupLazyLoading();
  }

  /**
   * Setup lazy loading with Intersection Observer
   */
  setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      this.lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.dataset.src;
              if (src) {
                this.loadImage(src).then((imageUrl) => {
                  img.src = imageUrl;
                  img.removeAttribute("data-src");
                  this.lazyObserver.unobserve(img);
                });
              }
            }
          });
        },
        {
          rootMargin: "50px", // Start loading 50px before entering viewport
        },
      );
    }
  }

  /**
   * Preload critical assets with priority
   * @param {Array<{url: string, type: string, priority: number}>} assets
   * @returns {Promise<void>}
   */
  async preloadAssets(assets) {
    // Sort by priority (higher number = higher priority)
    const sortedAssets = assets.sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    // Load in batches to avoid overwhelming the browser
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < sortedAssets.length; i += batchSize) {
      batches.push(sortedAssets.slice(i, i + batchSize));
    }

    // Load batches sequentially
    for (const batch of batches) {
      const promises = batch.map((asset) => {
        if (asset.type === "image") {
          return this.loadImage(asset.url);
        }
        return Promise.resolve();
      });

      await Promise.allSettled(promises);
    }

    console.log(`✅ Preloaded ${assets.length} assets`);
    console.log(
      `📊 Cache stats: ${this.loadStats.cacheHits}/${this.loadStats.totalRequests} cache hits`,
    );
  }

  /**
   * Load an image with caching
   * @param {string} url - Image URL
   * @param {boolean} priority - Whether this is a high-priority load
   * @returns {Promise<string>} - Image object URL
   */
  async loadImage(url, priority = false) {
    this.loadStats.totalRequests++;

    // Check cache first
    if (this.imageCacheUrls.has(url)) {
      this.loadStats.cacheHits++;
      return this.imageCacheUrls.get(url);
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    // Check if previously failed
    if (this.failedAssets.has(url)) {
      throw new Error(`Previously failed to load: ${url}`);
    }

    const startTime = performance.now();

    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();

      // Set crossorigin if needed for CORS
      if (url.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }

      img.onload = () => {
        // Create object URL for better memory management
        fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.imageCache.set(url, blob);
            this.imageCacheUrls.set(url, objectUrl);
            this.loadedAssets.add(url);

            const loadTime = performance.now() - startTime;
            this.loadStats.loadTime += loadTime;

            this.loadingPromises.delete(url);
            resolve(objectUrl);
          })
          .catch((error) => {
            // Fallback to direct image if blob fails
            this.imageCacheUrls.set(url, url);
            this.loadedAssets.add(url);
            this.loadingPromises.delete(url);
            resolve(url);
          });
      };

      img.onerror = () => {
        this.failedAssets.add(url);
        this.loadingPromises.delete(url);
        console.warn(`⚠️ Failed to load image: ${url}`);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Start loading
      img.src = url;
    });

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Preload a sprite sheet
   * @param {string} url - Sprite sheet URL
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @returns {Promise<{image: HTMLImageElement, frames: Array}>}
   */
  async loadSpriteSheet(url, frameWidth, frameHeight) {
    const imageUrl = await this.loadImage(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cols = Math.floor(img.width / frameWidth);
        const rows = Math.floor(img.height / frameHeight);
        const frames = [];

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            frames.push({
              x: col * frameWidth,
              y: row * frameHeight,
              width: frameWidth,
              height: frameHeight,
            });
          }
        }

        resolve({ image: img, frames });
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  /**
   * Get a cached image or load it
   * @param {string} url - Image URL
   * @returns {string} - Image URL or object URL
   */
  getImage(url) {
    if (this.imageCacheUrls.has(url)) {
      return this.imageCacheUrls.get(url);
    }

    // Load asynchronously if not in cache
    this.loadImage(url).catch((error) => {
      console.error("Error loading image:", error);
    });

    // Return original URL as fallback
    return url;
  }

  /**
   * Check if an asset is loaded
   * @param {string} url - Asset URL
   * @returns {boolean}
   */
  isLoaded(url) {
    return this.loadedAssets.has(url);
  }

  /**
   * Clear cache for a specific asset
   * @param {string} url - Asset URL
   */
  clearAsset(url) {
    // Revoke object URL to free memory
    const objectUrl = this.imageCacheUrls.get(url);
    if (objectUrl && objectUrl.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl);
    }

    this.imageCache.delete(url);
    this.imageCacheUrls.delete(url);
    this.loadedAssets.delete(url);
  }

  /**
   * Clear all cached assets
   */
  clearAll() {
    // Revoke all object URLs
    for (const [url, objectUrl] of this.imageCacheUrls.entries()) {
      if (objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    }

    this.imageCache.clear();
    this.imageCacheUrls.clear();
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.loadingPromises.clear();

    console.log("🧹 Asset cache cleared");
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.loadStats,
      cacheSize: this.imageCache.size,
      loadedAssets: this.loadedAssets.size,
      failedAssets: this.failedAssets.size,
      cacheHitRate:
        this.loadStats.totalRequests > 0
          ? (
              (this.loadStats.cacheHits / this.loadStats.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
      avgLoadTime:
        this.loadStats.totalRequests > 0
          ? (this.loadStats.loadTime / this.loadStats.totalRequests).toFixed(
              2,
            ) + "ms"
          : "0ms",
    };
  }

  /**
   * Observe an element for lazy loading
   * @param {HTMLElement} element
   */
  observeElement(element) {
    if (this.lazyObserver) {
      this.lazyObserver.observe(element);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.clearAll();

    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
  }
}

export default AssetLoader;
