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

  // Future UI icons (when you create them)
  ui: {
    // level: '/assets/icons/level-star.png',  // For future
    // key: '/assets/icons/key.png',          // For future
    // rupees: '/assets/icons/rupee.png',      // For future
  }
};

export default ICONS;