// Game-related constants
export const GAME_TYPES = {
  RPG: 'rpg',
  PUZZLE: 'puzzle',
  ADVENTURE: 'adventure',
  PLATFORMER: 'platformer',
  SHOOTER: 'shooter',
  TEXT_ADVENTURE: 'text_adventure',
  TERMINAL: 'terminal',
  INTERACTIVE_FICTION: 'interactive_fiction'
};

// Enhanced artifact types for the Creative Metaverse Platform
export const ARTIFACT_TYPES = {
  // Original types
  WEAPON: 'weapon',
  ARMOR: 'armor',
  POTION: 'potion',
  KEY: 'key',
  SCROLL: 'scroll',
  RELIC: 'relic',
  CONTAINER: 'container',
  
  // Creative content types
  WRITING: 'writing',
  POETRY: 'poetry',
  ART: 'art',
  MUSIC: 'music',
  EXPERIENCE: 'experience',
  
  // Interactive game types - NEW
  GAME: 'game',
  MINI_GAME: 'mini_game',
  INTERACTIVE_STORY: 'interactive_story',
  PUZZLE_GAME: 'puzzle_game',
  TERMINAL_CHALLENGE: 'terminal_challenge',
  SHOOTER_EXPERIENCE: 'shooter_experience',
  TEXT_ADVENTURE_WORLD: 'text_adventure_world'
};

// Interactive artifact properties
export const INTERACTIVE_ARTIFACT_PROPERTIES = {
  DIFFICULTY: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate', 
    ADVANCED: 'advanced',
    EXPERT: 'expert'
  },
  DURATION: {
    SHORT: 'short', // 5-15 minutes
    MEDIUM: 'medium', // 15-30 minutes
    LONG: 'long', // 30+ minutes
    EPIC: 'epic' // 1+ hours
  },
  COMPLETION_REWARDS: {
    XP: 'experience_points',
    POWER: 'unlock_power',
    AREA: 'unlock_area', 
    ITEM: 'unlock_item',
    ACHIEVEMENT: 'unlock_achievement'
  }
};

// Power system for Creative Metaverse
export const PLAYER_POWERS = {
  SPEED_BOOST: 'speed_boost',
  DOUBLE_JUMP: 'double_jump',
  WALL_CLIMB: 'wall_climb',
  TELEPORT: 'teleport',
  INVISIBILITY: 'invisibility',
  FLIGHT: 'flight',
  TIME_SLOW: 'time_slow',
  SUPER_STRENGTH: 'super_strength',
  ENERGY_SHIELD: 'energy_shield',
  ENHANCED_VISION: 'enhanced_vision'
};

// Area unlock progression
export const UNLOCKABLE_AREAS = {
  HIDDEN_VALLEY: 'hidden_valley',
  SKY_REALM: 'sky_realm', 
  UNDERWATER_CITY: 'underwater_city',
  CRYSTAL_CAVES: 'crystal_caves',
  FLOATING_ISLANDS: 'floating_islands',
  TIME_NEXUS: 'time_nexus',
  CREATOR_SANCTUM: 'creator_sanctum'
};

// Game artifact completion data structure
export const GAME_ARTIFACT_SCHEMA = {
  id: 'string',
  name: 'string',
  description: 'string', 
  gameType: 'GAME_TYPES',
  difficulty: 'INTERACTIVE_ARTIFACT_PROPERTIES.DIFFICULTY',
  estimatedDuration: 'INTERACTIVE_ARTIFACT_PROPERTIES.DURATION',
  completionRewards: {
    xp: 'number',
    powers: 'array of PLAYER_POWERS',
    unlockedAreas: 'array of UNLOCKABLE_AREAS',
    achievements: 'array of strings'
  },
  gameData: {
    // Specific to each game type
    levels: 'array',
    config: 'object',
    assets: 'object'
  },
  creator: 'string', // User ID
  completionStats: {
    totalAttempts: 'number',
    totalCompletions: 'number', 
    averageScore: 'number',
    topScore: 'number'
  },
  socialData: {
    likes: 'number',
    comments: 'array',
    shares: 'number',
    featured: 'boolean'
  }
};

// Artifact Interactions
export const ARTIFACT_INTERACTIONS = {
  READ: 'read',
  EXAMINE: 'examine',
  COLLECT: 'collect',
  USE: 'use',
  SHARE: 'share'
};

// NPC Types and Config
export const NPC_TYPES = {
  // General Types
  WRITER: 'writer',
  PHILOSOPHER: 'philosopher',
  ARTIST: 'artist',
  SCIENTIST: 'scientist',
  EXPLORER: 'explorer',
  MENTOR: 'mentor',
  GUIDE: 'guide',
  SAGE: 'sage',
  POET: 'poet',
  NATURALIST: 'naturalist',
  
  // Specific Historical Characters
  SHAKESPEARE: 'shakespeare',
  JOHN_MUIR: 'john_muir',
  ADA_LOVELACE: 'ada_lovelace',
  LORD_BYRON: 'lord_byron',
  OSCAR_WILDE: 'oscar_wilde',
  ALEXANDER_POPE: 'alexander_pope',
  ZEUS: 'zeus',
  JESUS: 'jesus',
  MICHELANGELO: 'michelangelo'
};

// NPC Personality Traits
export const PERSONALITY_TRAITS = {
  WIT: 'wit',
  WISDOM: 'wisdom',
  CURIOSITY: 'curiosity',
  PASSION: 'passion',
  MELANCHOLY: 'melancholy',
  ENTHUSIASM: 'enthusiasm',
  ADVOCACY: 'advocacy',
  ADVENTURE: 'adventure',
  HUMOR: 'humor',
  PATIENCE: 'patience'
};

// Relationship States
export const RELATIONSHIP_STATES = {
  STRANGER: 'stranger',
  ACQUAINTANCE: 'acquaintance',
  FRIEND: 'friend',
  CONFIDANT: 'confidant',
  MENTOR_STUDENT: 'mentor_student'
}; 