/**
 * AssetLoader.js
 * Utility for preloading and managing game assets
 */

class AssetLoader {
  constructor() {
    this.assets = {
      backgrounds: {},
      platforms: {},
      items: {},
      enemies: {},
      players: {},
      bosses: {},
      ui: {}
    };
    this.loadPromises = [];
    this.loaded = false;
  }

  /**
   * Load an image and return a promise
   * @param {string} src - Image source path
   * @returns {Promise} - Promise that resolves with the loaded image
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Add a background image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addBackground(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.backgrounds[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add a platform image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addPlatform(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.platforms[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add an item image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addItem(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.items[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add an enemy image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addEnemy(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.enemies[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add a player image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addPlayer(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.players[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add a boss image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addBoss(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.bosses[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Add a UI image to the loader
   * @param {string} key - Key to reference the image
   * @param {string} src - Image source path
   */
  addUI(key, src) {
    const promise = this.loadImage(src).then(img => {
      this.assets.ui[key] = img;
      return img;
    });
    this.loadPromises.push(promise);
    return this;
  }

  /**
   * Load all registered assets
   * @returns {Promise} - Promise that resolves when all assets are loaded
   */
  loadAllAssets() {
    return Promise.all(this.loadPromises).then(() => {
      this.loaded = true;
      console.log('All assets loaded successfully');
      return this.assets;
    });
  }

  /**
   * Get an asset by type and key
   * @param {string} type - Asset type (backgrounds, platforms, items, etc.)
   * @param {string} key - Asset key
   * @returns {Image|null} - The loaded image or null if not found
   */
  getAsset(type, key) {
    if (!this.assets[type] || !this.assets[type][key]) {
      console.warn(`Asset not found: ${type}.${key}`);
      return null;
    }
    return this.assets[type][key];
  }

  /**
   * Check if all assets are loaded
   * @returns {boolean} - True if all assets are loaded
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Create and configure a loader for the Level4Shooter game
   * @returns {AssetLoader} - Configured asset loader
   */
  static createShooterGameLoader() {
    const loader = new AssetLoader();
    
    // Load backgrounds
    loader.addBackground('paris', '/assets/backgrounds/paris.jpg')
          .addBackground('spain', '/assets/backgrounds/spain.jpg')
          .addBackground('africa', '/assets/backgrounds/africa.jpg');
    
    // Load platforms
    loader.addPlatform('ground', '/assets/platforms/ground.png')
          .addPlatform('floating', '/assets/platforms/floating_platform.png');
    
    // Load items
    loader.addItem('health', '/assets/items/health_pickup.png')
          .addItem('ammo', '/assets/items/ammo_pickup.png')
          .addItem('experience', '/assets/items/xp_orb.png');
    
    // Load enemies
    loader.addEnemy('basic', '/assets/enemies/enemy_basic.png')
          .addEnemy('flying', '/assets/enemies/enemy_flying.png')
          .addEnemy('armored', '/assets/enemies/enemy_armored.png');
    
    // Load player
    loader.addPlayer('idle', '/assets/player/player_idle.png')
          .addPlayer('run', '/assets/player/player_run.png')
          .addPlayer('jump', '/assets/player/player_jump.png')
          .addPlayer('shoot', '/assets/player/player_shoot.png');
    
    // Load Hemingway companion
    loader.addPlayer('hemingway', '/assets/player/hemingway.png');
    
    // Load bosses
    loader.addBoss('paris_boss', '/assets/bosses/paris_boss.png')
          .addBoss('spain_boss', '/assets/bosses/spain_boss.png')
          .addBoss('africa_boss', '/assets/bosses/africa_boss.png');
    
    // Load UI elements
    loader.addUI('bullet', '/assets/ui/bullet.png')
          .addUI('heart', '/assets/ui/heart.png');
    
    return loader;
  }
}

export default AssetLoader; 