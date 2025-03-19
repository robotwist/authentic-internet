/**
 * Constants for the server application
 * Contains shared configuration values and data structures
 */

// Map definitions for world generation and navigation
export const MAPS = {
  // Main world map (default)
  MAIN: 'main',
  
  // Specialized areas
  YOSEMITE: 'yosemite',
  DARK_FOREST: 'dark_forest',
  MOUNTAIN_PASS: 'mountain_pass',
  COASTAL_VILLAGE: 'coastal_village',
  CAVE_SYSTEM: 'cave_system',
  ANCIENT_RUINS: 'ancient_ruins',
  DESERT_OASIS: 'desert_oasis',
  
  // Level-specific worlds
  LEVEL_1: 'level_1',
  LEVEL_2: 'level_2',
  LEVEL_3: 'level_3'
};

// NPC types matching client-side definitions
export const NPC_TYPES = {
  GUIDE: 'guide',
  MERCHANT: 'merchant',
  SCHOLAR: 'scholar',
  WARRIOR: 'warrior',
  MYSTIC: 'mystic',
  POET: 'scholar',
  PHILOSOPHER: 'mystic',
  WEATHERMAN: 'guide',
  ARTIST: 'artist',
  CODER: 'coder',
  SHAKESPEARE: 'shakespeare',
  SOCRATES: 'socrates',
  AUGUSTINE: 'augustine',
  MICHELANGELO: 'artist',
  ZORK: 'zork',
  ADA_LOVELACE: 'ada_lovelace',
  LORD_BYRON: 'lord_byron',
  OSCAR_WILDE: 'oscar_wilde',
  ALEXANDER_POPE: 'alexander_pope',
  ZEUS: 'zeus',
  JOHN_MUIR: 'john_muir',
  JESUS: 'jesus'
};

// Artifact types
export const ARTIFACT_TYPES = {
  WEAPON: 'weapon',
  SCROLL: 'scroll',
  RELIC: 'relic',
  KEY: 'key',
  CONTAINER: 'container',
  PORTAL: 'portal'
};

// User experience levels and thresholds
export const EXPERIENCE_LEVELS = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 4000,
  8: 8000,
  9: 16000,
  10: 32000
};

// Experience points for various actions
export const EXPERIENCE_POINTS = {
  CREATE_ARTIFACT: 50,
  PLACE_ARTIFACT: 25,
  COMPLETE_QUEST: 100,
  INTERACT_WITH_NPC: 10,
  ARTIFACT_VIEWED: 5,
  ARTIFACT_UPVOTED: 15,
  ARTIFACT_COMMENTED: 20,
  ARTIFACT_SHARED: 25
}; 