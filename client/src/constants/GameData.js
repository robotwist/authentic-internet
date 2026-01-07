/**
 * Game data constants file
 * This file contains various constants and data structures used throughout the game.
 * Keeping them here makes it easier to adjust gameplay values in one place.
 */

// Artifacts that can be found in the inventory
export const INVENTORY_ARTIFACTS = [
  {
    id: "ancient-sword",
    name: "Ancient Sword",
    description: "A weathered sword that has seen many battles",
    type: "WEAPON",
    content:
      "This ancient blade bears the marks of countless battles. Its steel has been tempered by time and its edge sharpened by history.",
    media: ["/assets/items/sword.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 5,
    visible: true,
    area: "Inventory",
    interactions: [
      {
        type: "COLLECT",
        condition: "Found in world",
        revealedContent: "You have acquired an ancient weapon of great power.",
        action: "Add to inventory",
      },
    ],
    properties: {
      damage: 5,
      durability: 80,
      value: 100,
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["ancient", "weapon", "sword"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
  {
    id: "mystic-orb",
    name: "Mystic Orb",
    description: "A glowing orb that seems to contain ancient knowledge",
    type: "MAGIC",
    content:
      "This mystic orb pulses with arcane energy, containing fragments of ancient wisdom and magical power.",
    media: ["/assets/items/orb.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 10,
    visible: true,
    area: "Inventory",
    interactions: [
      {
        type: "COLLECT",
        condition: "Found in world",
        revealedContent:
          "The orb's energy resonates with your own magical potential.",
        action: "Add to inventory",
      },
    ],
    properties: {
      magic: 10,
      wisdom: 8,
      value: 250,
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["mystic", "orb", "magic"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
  {
    id: "golden-idol",
    name: "Golden Idol",
    description: "A small golden statue of an unknown deity",
    type: "TREASURE",
    content:
      "This golden idol radiates with divine energy, representing an ancient deity whose name has been lost to time.",
    media: ["/assets/items/idol.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 15,
    visible: true,
    area: "Inventory",
    interactions: [
      {
        type: "COLLECT",
        condition: "Found in world",
        revealedContent:
          "The idol's divine presence fills you with awe and reverence.",
        action: "Add to inventory",
      },
    ],
    properties: {
      value: 500,
      luck: 3,
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["golden", "idol", "treasure"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
  {
    id: "dungeon-key",
    name: "Dungeon Key",
    description: "An ornate key that unlocks mysterious doors",
    type: "KEY",
    content:
      "This ornate key is crafted with intricate designs and seems to pulse with ancient power.",
    media: ["/assets/items/key.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 5,
    visible: true,
    area: "Inventory",
    interactions: [
      {
        type: "UNLOCK",
        condition: "Use at locked door",
        revealedContent: "The key fits perfectly into the lock mechanism.",
        action: "Unlock dungeon access",
      },
    ],
    properties: {
      value: 50,
      access: "dungeon",
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["dungeon", "key", "access"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
  {
    id: "hemingway-manuscript",
    name: "Hemingway's Lost Manuscript",
    description:
      "A weathered manuscript containing an unpublished Hemingway story.",
    type: "LITERARY",
    content:
      "This manuscript contains an unpublished story by Ernest Hemingway, its pages yellowed with age but the words still vibrant with the author's distinctive style.",
    media: ["/assets/items/manuscript.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 25,
    visible: true,
    area: "Library",
    interactions: [
      {
        type: "REVEAL",
        condition: "Read manuscript",
        revealedContent:
          "The story unfolds with Hemingway's characteristic clarity and courage.",
        action: "Gain literary insight",
      },
    ],
    properties: {
      value: 1000,
      wisdom: 15,
      inspiration: 20,
      rarity: "legendary",
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["hemingway", "manuscript", "literary", "legendary"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
  {
    id: "quill-pen",
    name: "Quill Pen of Inspiration",
    description: "A quill pen that once belonged to a famous author",
    type: "TOOL",
    content:
      "This quill pen seems to carry the creative spirit of its previous owner, ready to channel inspiration into written words.",
    media: ["/assets/items/quill.png"],
    location: { x: 0, y: 0, mapName: "Inventory" },
    exp: 8,
    visible: true,
    area: "Inventory",
    interactions: [
      {
        type: "USE",
        condition: "Write with pen",
        revealedContent: "Words flow effortlessly as the pen guides your hand.",
        action: "Enhance writing ability",
      },
    ],
    properties: {
      creativity: 10,
      communication: 8,
      value: 120,
    },
    userModifiable: {
      description: true,
      content: true,
    },
    createdBy: "system",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tags: ["quill", "pen", "tool", "inspiration"],
    rating: 0,
    reviews: [],
    remixOf: null,
  },
];

// Experience-related messages for different actions
export const EXPERIENCE_MESSAGES = {
  artifactCollect: [
    "You found a fascinating artifact!",
    "This item radiates with mysterious energy.",
    "Knowledge flows through you as you examine the artifact.",
    "You sense the history of this object as you pick it up.",
    "This item seems to have a story to tell.",
  ],
  dialogComplete: [
    "You've learned something valuable from this conversation.",
    "That was an enlightening discussion!",
    "Your understanding has deepened after this exchange.",
    "The conversation has expanded your perspective.",
    "You feel wiser after that discussion.",
  ],
  puzzleSolve: [
    "Puzzle solved! Your mind grows sharper.",
    "The puzzle's solution reveals itself to you!",
    "Your problem-solving skills are improving.",
    "That was a challenging puzzle, but you prevailed!",
    "Another mystery unraveled by your growing intellect.",
  ],
  explorationReward: [
    "Exploring this area has broadened your horizons.",
    "Your curiosity is rewarded with new knowledge.",
    "The journey itself has made you wiser.",
    "New pathways of understanding open before you.",
    "This discovery will be valuable in your journey.",
  ],
  levelUp: [
    "You've reached a new level of understanding!",
    "Your knowledge and skills have visibly improved!",
    "You feel your mind expanding with new capabilities!",
    "A new chapter in your journey begins!",
    "You stand taller, wiser, and more capable than before!",
  ],
};

// NPC types and their characteristics
export const NPC_TYPES = {
  GUIDE: "guide",
  SCHOLAR: "scholar",
  MERCHANT: "merchant",
  QUEST_GIVER: "quest_giver",
  HISTORICAL_FIGURE: "historical_figure",
};

// Game difficulty settings
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: "Easy",
    expMultiplier: 1.5,
    damageReceived: 0.5,
  },
  NORMAL: {
    name: "Normal",
    expMultiplier: 1.0,
    damageReceived: 1.0,
  },
  HARD: {
    name: "Hard",
    expMultiplier: 0.8,
    damageReceived: 1.5,
  },
};

// Game achievements
export const ACHIEVEMENTS = [
  {
    id: "first_conversation",
    name: "First Conversation",
    description: "Complete your first conversation with an NPC",
    reward: {
      exp: 5,
      item: null,
    },
  },
  {
    id: "artifact_collector",
    name: "Artifact Collector",
    description: "Collect 5 different artifacts",
    reward: {
      exp: 15,
      item: "collectors_bag",
    },
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Save 10 different quotes",
    reward: {
      exp: 20,
      item: "book_of_wisdom",
    },
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Visit all map areas",
    reward: {
      exp: 30,
      item: "map_of_worlds",
    },
  },
];
