/**
 * Game data constants file
 * This file contains various constants and data structures used throughout the game.
 * Keeping them here makes it easier to adjust gameplay values in one place.
 */

// Artifacts that can be found in the inventory
export const INVENTORY_ARTIFACTS = [
  {
    id: 'ancient-sword',
    name: 'Ancient Sword',
    description: 'A weathered sword that has seen many battles',
    image: '/assets/items/sword.png',
    type: 'weapon',
    properties: {
      damage: 5,
      durability: 80,
      value: 100
    },
    exp: 5
  },
  {
    id: 'mystic-orb',
    name: 'Mystic Orb',
    description: 'A glowing orb that seems to contain ancient knowledge',
    image: '/assets/items/orb.png',
    type: 'magic',
    properties: {
      magic: 10,
      wisdom: 8,
      value: 250
    },
    exp: 10
  },
  {
    id: 'golden-idol',
    name: 'Golden Idol',
    description: 'A small golden statue of an unknown deity',
    image: '/assets/items/idol.png',
    type: 'treasure',
    properties: {
      value: 500,
      luck: 3
    },
    exp: 15
  },
  {
    id: 'dungeon-key',
    name: 'Dungeon Key',
    description: 'An ornate key that unlocks mysterious doors',
    image: '/assets/items/key.png',
    type: 'key',
    properties: {
      value: 50,
      access: 'dungeon'
    },
    exp: 5
  },
  {
    id: 'hemingway-manuscript',
    name: 'Hemingway\'s Lost Manuscript',
    description: 'A weathered manuscript containing an unpublished Hemingway story.',
    image: '/assets/items/manuscript.png',
    type: 'literary',
    rarity: 'legendary',
    area: 'library',
    properties: {
      value: 1000,
      wisdom: 15,
      inspiration: 20
    },
    exp: 25
  },
  {
    id: 'quill-pen',
    name: 'Quill Pen of Inspiration',
    description: 'A quill pen that once belonged to a famous author',
    image: '/assets/items/quill.png',
    type: 'tool',
    properties: {
      creativity: 10,
      communication: 8,
      value: 120
    },
    exp: 8
  }
];

// Experience-related messages for different actions
export const EXPERIENCE_MESSAGES = {
  artifactCollect: [
    'You found a fascinating artifact!',
    'This item radiates with mysterious energy.',
    'Knowledge flows through you as you examine the artifact.',
    'You sense the history of this object as you pick it up.',
    'This item seems to have a story to tell.'
  ],
  dialogComplete: [
    'You\'ve learned something valuable from this conversation.',
    'That was an enlightening discussion!',
    'Your understanding has deepened after this exchange.',
    'The conversation has expanded your perspective.',
    'You feel wiser after that discussion.'
  ],
  puzzleSolve: [
    'Puzzle solved! Your mind grows sharper.',
    'The puzzle\'s solution reveals itself to you!',
    'Your problem-solving skills are improving.',
    'That was a challenging puzzle, but you prevailed!',
    'Another mystery unraveled by your growing intellect.'
  ],
  explorationReward: [
    'Exploring this area has broadened your horizons.',
    'Your curiosity is rewarded with new knowledge.',
    'The journey itself has made you wiser.',
    'New pathways of understanding open before you.',
    'This discovery will be valuable in your journey.'
  ],
  levelUp: [
    'You\'ve reached a new level of understanding!',
    'Your knowledge and skills have visibly improved!',
    'You feel your mind expanding with new capabilities!',
    'A new chapter in your journey begins!',
    'You stand taller, wiser, and more capable than before!'
  ]
};

// NPC types and their characteristics
export const NPC_TYPES = {
  GUIDE: 'guide',
  SCHOLAR: 'scholar',
  MERCHANT: 'merchant',
  QUEST_GIVER: 'quest_giver',
  HISTORICAL_FIGURE: 'historical_figure'
};

// Game difficulty settings
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: 'Easy',
    expMultiplier: 1.5,
    damageReceived: 0.5
  },
  NORMAL: {
    name: 'Normal',
    expMultiplier: 1.0,
    damageReceived: 1.0
  },
  HARD: {
    name: 'Hard',
    expMultiplier: 0.8,
    damageReceived: 1.5
  }
};

// Game achievements
export const ACHIEVEMENTS = [
  {
    id: 'first_conversation',
    name: 'First Conversation',
    description: 'Complete your first conversation with an NPC',
    reward: {
      exp: 5,
      item: null
    }
  },
  {
    id: 'artifact_collector',
    name: 'Artifact Collector',
    description: 'Collect 5 different artifacts',
    reward: {
      exp: 15,
      item: 'collectors_bag'
    }
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Save 10 different quotes',
    reward: {
      exp: 20,
      item: 'book_of_wisdom'
    }
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit all map areas',
    reward: {
      exp: 30,
      item: 'map_of_worlds'
    }
  }
]; 