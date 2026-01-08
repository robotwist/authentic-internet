/**
 * Custom Pixel Art Icons
 * Centralized icon management for replacing emojis with custom pixel art
 */

// Main icon paths using your existing Piskel-made assets
const ICONS = {
  // Weapons - using your existing pixel art assets
  weapons: {
    wooden: '/assets/ancient_sword.png',  // Your existing sword asset
    white: '/assets/weapon.png',          // Your weapon asset
    magical: '/assets/artifact.webp',     // Artifact repurposed as magical sword
  },

  // Artifacts - for future artifact icons
  artifacts: {
    container: '/assets/artifacts/container.svg',
    key: '/assets/artifacts/key.svg',
    relic: '/assets/artifacts/relic.svg',
    scroll: '/assets/artifacts/scroll.svg',
    weapon: '/assets/artifacts/weapon.svg',
  },

  // Character assets
  character: '/assets/character.png',  // Your Piskel-made character

  // UI icons - custom pixel art for game interface
  ui: {
    // Hearts for health display
    heart: {
      full: '/assets/ui/heart-full.svg',      // Full heart ❤️
      half: '/assets/ui/heart-half.svg',      // Half heart 💔
      empty: '/assets/ui/heart-empty.svg',    // Empty heart 🖤
    },

    // HUD elements
    level: '/assets/ui/level-star.png',       // Level star ⭐
    key: '/assets/ui/key.png',                // Dungeon key 🔑
    rupee: '/assets/ui/rupee.png',            // Currency 💎

    // Item slot icons (for GameHUD)
    sword: '/assets/ui/sword-icon.png',       // Sword in item slot 🗡️
  },

  // Combat drops
  drops: {
    heart: '/assets/ui/heart-drop.png',       // Heart pickup ❤️
    rupee: '/assets/ui/rupee-drop.png',       // Rupee pickup 💎
  },

  // Inventory items
  items: {
    bomb: '/assets/ui/bomb.png',              // 💣
    bow: '/assets/ui/bow.png',                // 🏹
    boomerang: '/assets/ui/boomerang.png',    // 🪃
    candle: '/assets/ui/candle.png',          // 🕯️
    rod: '/assets/ui/rod.png',                // 🪄
    key: '/assets/ui/key.png',                // 🔑 (reuse)
    potion: '/assets/ui/potion.png',          // 🧪
    map: '/assets/ui/map.png',                // 🗺️
    compass: '/assets/ui/compass.png',        // 🧭
  }
};

export default ICONS;