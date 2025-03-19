import { v4 as uuidv4 } from 'uuid';

export const TILE_SIZE = 64;
export const MAP_ROWS = 20;
export const MAP_COLS = 20;

// Tile Classes
export const TILE_TYPES = {
  0: "grass",
  1: "wall",
  2: "water",
  3: "sand",
  4: "dungeon",
  5: "portal",
};

export const isWalkable = (x, y, map, character = null) => {
  const row = Math.floor(y / TILE_SIZE);
  const col = Math.floor(x / TILE_SIZE);
  
  // Get tile type
  const tile = map?.[row]?.[col];
  
  // If this is for Jesus, allow walking on water
  if (character === 'jesus') {
    return tile === 0 || tile === 5 || tile === 3 || tile === 4 || tile === 2; // Jesus can walk on water (2)
  }
  
  // For everyone else: Only grass (0), portal (5), sand (3), and dungeon (4) are walkable
  // Water (2) and walls (1) are not walkable
  return tile === 0 || tile === 5 || tile === 3 || tile === 4;
};

export const ARTIFACT_TYPES = {
  WEAPON: 'weapon',
  SCROLL: 'scroll',
  RELIC: 'relic',
  KEY: 'key',
  CONTAINER: 'container',
  PORTAL: 'portal'
};

export const ARTIFACT_INTERACTIONS = {
  COMBINE: 'combine',
  UNLOCK: 'unlock',
  REVEAL: 'reveal',
  TRANSFORM: 'transform'
};


export const NPC_TYPES = {
  GUIDE: 'guide',
  MERCHANT: 'merchant',
  SCHOLAR: 'scholar',
  WARRIOR: 'warrior',
  MYSTIC: 'mystic',
  POET: 'scholar',    // For Shakespeare
  PHILOSOPHER: 'mystic',  // For Socrates
  WEATHERMAN: 'guide',  // For Zeus
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

export const NPC_CONFIG = {
  [NPC_TYPES.SHAKESPEARE]: {
    role: 'The Bard',
    description: 'The greatest playwright in history, master of language and human nature.',
    context: 'You are William Shakespeare himself, speaking only through your authentic works.',
    basePrompt: 'Respond using only verified text from the Folger Shakespeare Library.',
    apiEndpoint: 'https://folger.api.shakespeare.edu/v1',
    type: NPC_TYPES.SHAKESPEARE,
    sourceValidation: true,
    patrolArea: {
      startX: 6,
      startY: 2,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.SOCRATES]: {
    role: 'The Philosopher',
    name: 'Socrates',
    description: 'The father of Western philosophy, engaging in dialectic inquiry.',
    context: 'You are Socrates, speaking only through Plato\'s dialogues.',
    basePrompt: 'Respond using only verified translations of Platonic dialogues.',
    apiEndpoint: '/api/socrates',
    type: NPC_TYPES.SOCRATES,
    sourceValidation: true,
    patrolArea: {
      startX: 10,
      startY: 2,
      width: 8,
      height: 8
    }
  },
  [NPC_TYPES.AUGUSTINE]: {
    role: 'The Theologian',
    name: 'Saint Augustine',
    description: 'The influential Christian theologian and philosopher.',
    context: 'You are Saint Augustine, speaking only through your authenticated works.',
    basePrompt: 'Respond using only verified translations of Augustine\'s works.',
    apiEndpoint: '/api/augustine',
    type: NPC_TYPES.AUGUSTINE,
    sourceValidation: true,
    patrolArea: {
      startX: 2,
      startY: 10,
      width: 8,
      height: 8
    }
  },
  [NPC_TYPES.MICHELANGELO]: {
    role: 'The Artist',
    name: 'Michelangelo',
    description: 'The Renaissance master of sculpture and painting.',
    context: 'You are Michelangelo, speaking only through your verified letters and documented conversations.',
    basePrompt: 'Respond using only authenticated Michelangelo sources.',
    apiEndpoint: '/api/michelangelo',
    type: NPC_TYPES.MICHELANGELO,
    sourceValidation: true,
    patrolArea: {
      startX: 10,
      startY: 10,
      width: 8,
      height: 8
    }
  },
  [NPC_TYPES.ZORK]: {
    role: 'The Game Master',
    name: 'Marc Blank',
    description: 'Co-creator of Zork and interactive fiction pioneer.',
    context: 'You are Marc Blank, creator of Zork, discussing game design and interactive storytelling.',
    basePrompt: 'Respond using authentic Zork-style descriptions and game design wisdom.',
    apiEndpoint: '/api/zork',
    patrolArea: {
      startX: 6,
      startY: 6,
      width: 8,
      height: 8
    }
  },
  [NPC_TYPES.ADA_LOVELACE]: {
    role: 'The First Programmer',
    name: 'Ada Lovelace',
    description: 'The visionary mathematician and first computer programmer, daughter of Lord Byron.',
    context: 'You are Ada Lovelace, speaking through your notes on Babbage\'s Analytical Engine and mathematical works.',
    basePrompt: 'Respond using verified historical writings and mathematical insights from Ada Lovelace.',
    apiEndpoint: '/api/ada_lovelace',
    type: NPC_TYPES.ADA_LOVELACE,
    sourceValidation: true,
    patrolArea: {
      startX: 12,
      startY: 8,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.LORD_BYRON]: {
    role: 'The Romantic Poet',
    name: 'Lord Byron',
    description: 'The legendary Romantic poet, Ada Lovelace\'s father, known for his passionate verse and dramatic life.',
    context: 'You are Lord Byron, speaking through your poetry and letters, with a mix of romantic passion and wit.',
    basePrompt: 'Respond using verified Byron poems and correspondence, emphasizing your dramatic personality.',
    apiEndpoint: '/api/byron',
    type: NPC_TYPES.LORD_BYRON,
    sourceValidation: true,
    patrolArea: {
      startX: 14,
      startY: 8,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.OSCAR_WILDE]: {
    role: 'The Wit',
    name: 'Oscar Wilde',
    description: 'The Irish poet, playwright, and master of wit and paradox, known for his flamboyant style and brilliant conversation.',
    context: 'You are Oscar Wilde, speaking through your plays, essays, and famous witticisms.',
    basePrompt: 'Respond using verified Wilde quotes, emphasizing your wit, paradoxes, and aesthetic sensibilities.',
    apiEndpoint: '/api/wilde',
    type: NPC_TYPES.OSCAR_WILDE,
    sourceValidation: true,
    patrolArea: {
      startX: 4,
      startY: 14,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.ALEXANDER_POPE]: {
    role: 'The Satirist',
    name: 'Alexander Pope',
    description: 'The 18th century English poet known for his satirical verse, translation of Homer, and mastery of the heroic couplet.',
    context: 'You are Alexander Pope, speaking through your poems, essays, and correspondence.',
    basePrompt: 'Respond using verified Pope quotes and poetry, emphasizing your wit, satire, and elegant verse.',
    apiEndpoint: '/api/pope',
    type: NPC_TYPES.ALEXANDER_POPE,
    sourceValidation: true,
    patrolArea: {
      startX: 8,
      startY: 14,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.ZEUS]: {
    role: 'The Weatherman',
    name: 'Zeus',
    description: 'The king of the Greek gods, ruler of Mount Olympus, and god of the sky, thunder, lightning, and weather.',
    context: 'You are Zeus, king of the gods, speaking through ancient texts and mythology, with a focus on weather and divine proclamations.',
    basePrompt: 'Respond using verified Zeus quotes from mythology, emphasizing your divine authority over weather and the heavens.',
    apiEndpoint: '/api/zeus',
    type: NPC_TYPES.ZEUS,
    sourceValidation: true,
    patrolArea: {
      startX: 3,
      startY: 3,
      width: 4,
      height: 4
    }
  },
  [NPC_TYPES.JOHN_MUIR]: {
    role: 'The Naturalist',
    name: 'John Muir',
    description: 'The pioneering naturalist, conservationist, and father of the American national parks.',
    context: 'You are John Muir, speaking only through your authentic writings and documented sayings.',
    basePrompt: 'Respond using only verified quotes from John Muir\'s writings and speeches.',
    apiEndpoint: '/api/john_muir',
    type: NPC_TYPES.JOHN_MUIR,
    sourceValidation: true,
    isRoaming: true,  // Special flag for NPCs that roam the entire map
    patrolArea: {
      startX: 5,
      startY: 5,
      width: 10,
      height: 10
    }
  },
  [NPC_TYPES.JESUS]: {
    role: 'The Christ',
    name: 'Jesus',
    description: 'The central figure of Christianity, who speaks only His authentic words from the Bible.',
    context: 'You are Jesus Christ, speaking only through your direct quotes from the Bible.',
    basePrompt: 'Respond using only verified quotes attributed to Jesus in the Bible.',
    apiEndpoint: '/api/jesus',
    type: NPC_TYPES.JESUS,
    sourceValidation: true,
    canWalkOnWater: true,
    patrolArea: {
      startX: 10,
      startY: 6,
      width: 10,
      height: 10
    }
  },
};

export const MAPS = [
  {
    name: "Overworld",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 0, 5, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Ancient Sword", 
        description: "A legendary blade that once belonged to a great warrior", 
        content: "The sword pulses with ancient power, its edge never dulling.", 
        location: { x: 14, y: 3 }, 
        exp: 15, 
        visible: true, 
        area: "Overworld",
        type: ARTIFACT_TYPES.WEAPON,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.COMBINE,
            targetArtifact: "Crystal Shard",
            result: "Crystal Sword",
            description: "The sword resonates with the crystal's energy..."
          }
        ],
        properties: {
          damage: 10,
          durability: 100,
          element: "physical"
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["damage", "element"]
        }
      },
      { 
        id: uuidv4(),
        name: "Mystic Orb",
        description: "A glowing orb filled with swirling energy.",
        content: "It hums with an ancient power, revealing secrets to those who are worthy.",
        riddle: "What has roots as nobody sees, is taller than trees?",
        unlockAnswer: "mountain",
        area: "Overworld",
        type: ARTIFACT_TYPES.RELIC,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The orb shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 15,
          visionRange: 3,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          unlockAnswer: true,
          properties: ["magic", "visionRange"]
        },
        exp: 20,
        visible: true,
        location: { x: 7, y: 13 }
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "World Guide",
        type: NPC_TYPES.GUIDE,
        apiType: 'quotes',
        position: { x: 2 * TILE_SIZE, y: 2 * TILE_SIZE },
        dialogue: [
          "Welcome to the Authentic Internet! I'm here to guide you through this world.",
          "You can find artifacts scattered throughout these lands. Press 'P' to pick them up when nearby.",
          "Use portals (glowing tiles) to travel between different regions.",
          "The desert holds ancient secrets, while the dungeons contain powerful artifacts.",
          "Press 'T' to talk to other NPCs you meet on your journey!"
        ]
      },
      {
        id: 'shakespeare1',
        type: NPC_TYPES.SHAKESPEARE,
        name: 'William Shakespeare',
        position: { x: 8 * TILE_SIZE, y: 2 * TILE_SIZE },
        patrolArea: {
          startX: 6,
          startY: 2,
          width: 4,
          height: 4
        },
        dialogue: [
          "To be, or not to be, that is the question. (Hamlet, Act III, Scene I)",
          "All the world's a stage, and all the men and women merely players. (As You Like It, Act II, Scene VII)",
          "The course of true love never did run smooth. (A Midsummer Night's Dream, Act I, Scene I)",
          "We are such stuff as dreams are made on, and our little life is rounded with a sleep. (The Tempest, Act IV, Scene I)",
          "Love looks not with the eyes, but with the mind, and therefore is winged Cupid painted blind. (A Midsummer Night's Dream, Act I, Scene I)"
        ]
      },
      {
        id: 'john_muir1',
        type: NPC_TYPES.JOHN_MUIR,
        name: 'John Muir',
        position: { x: 5 * TILE_SIZE, y: 14 * TILE_SIZE },
        patrolArea: {
          startX: 3,
          startY: 13,
          width: 10,
          height: 4
        },
        dialogue: [
          "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
          "In every walk with nature one receives far more than he seeks. (Unpublished journals, circa 1877)",
          "The clearest way into the Universe is through a forest wilderness. (John of the Mountains, 1938)",
          "When one tugs at a single thing in nature, he finds it attached to the rest of the world. (My First Summer in the Sierra, 1911)",
          "The world is big and I want to have a good look at it before it gets dark. (Letter to his sister, 1873)"
        ]
      },
      {
        id: 'merchant1',
        type: NPC_TYPES.MERCHANT,
        name: 'Thalia the Trader',
        position: { x: 7, y: 5 },
        ...NPC_CONFIG[NPC_TYPES.MERCHANT]
      },
      {
        id: 'scholar1',
        type: NPC_TYPES.SCHOLAR,
        name: 'Professor Ada',
        position: { x: 12, y: 8 },
        ...NPC_CONFIG[NPC_TYPES.SCHOLAR]
      }
    ]
  },
  {
    name: "Overworld 2",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 3, 3, 3, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Enchanted Mirror", 
        description: "A mysterious mirror that seems to reflect more than just light", 
        content: "Whispers of ancient wisdom echo from its surface, waiting to be discovered.", 
        location: { x: 3, y: 3 }, 
        exp: 18, 
        visible: true, 
        area: "Overworld",
        type: ARTIFACT_TYPES.CONTAINER,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The mirror shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Wandering Merchant",
        type: NPC_TYPES.MERCHANT,
        apiType: 'quotes',
        position: { x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },
        dialogue: [
          "Greetings, traveler! I've journeyed far and wide across these lands.",
          "The desert to the east holds many mysteries. Have you found the Golden Idol yet?",
          "Be careful in the dungeons below. Many adventurers have gone missing there.",
          "If you find any valuable artifacts, I'd be interested in trading..."
        ]
      },
      {
        id: uuidv4(),
        name: "Zeus the Weatherman",
        type: NPC_TYPES.ZEUS,
        apiType: 'zeus',
        position: { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE },
        dialogue: [
          "By my thunderbolts! Today's forecast calls for partly cloudy with a chance of divine intervention!",
          "Expect high-pressure systems over Mount Olympus, with occasional lightning strikes... those are mine, by the way.",
          "Warning: Areas of dense fog in the Underworld region. Cerberus visibility down to three heads.",
          "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus?",
          "Even the gods cannot alter the past, but the future is yet in my power."
        ]
      }
    ]
  },
  {
    name: "Overworld 3",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 2, 2, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 2, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Crystal Shard", 
        description: "A fragment of a powerful crystal, pulsing with energy", 
        content: "The shard resonates with the water nearby, suggesting it holds secrets of the elements.", 
        location: { x: 4, y: 4 }, 
        exp: 22, 
        visible: true, 
        area: "Overworld",
        type: ARTIFACT_TYPES.RELIC,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The shard shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Ada Lovelace",
        type: NPC_TYPES.ADA_LOVELACE,
        position: { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE },
        dialogue: [
          "The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves. (Notes on the Analytical Engine, 1843)",
          "I am more than ever the bride of science. (Letter to Charles Babbage, 1841)",
          "That brain of mine is something more than merely mortal; as time will show. (Letter to her mother, 1843)",
          "The science of operations is a science of itself, and has its own abstract truth and value. (Notes on the Analytical Engine, 1843)"
        ]
      },
      {
        id: uuidv4(),
        name: "Lord Byron",
        type: NPC_TYPES.LORD_BYRON,
        position: { x: 5 * TILE_SIZE, y: 3 * TILE_SIZE },
        dialogue: [
          "She walks in beauty, like the night of cloudless climes and starry skies. (She Walks in Beauty, 1814)",
          "There is a pleasure in the pathless woods, there is a rapture on the lonely shore. (Childe Harold's Pilgrimage, Canto IV, Stanza 178)",
          "The great object of life is sensation - to feel that we exist, even though in pain. (Letter to Annabella Milbanke, 1813)",
          "Roll on, thou deep and dark blue Ocean—roll! (Childe Harold's Pilgrimage, Canto IV, Stanza 179)"
        ]
      }
    ]
  },
  // Desert Maps
  {
    name: "Desert 1",
    data: [
      [1, 1, 3, 3, 3, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
      [3, 3, 3, 3, 3, 3, 3, 1, 3, 1],
      [1, 3, 3, 0, 0, 0, 3, 1, 3, 1],
      [1, 3, 3, 3, 3, 3, 3, 1, 3, 1],
      [1, 3, 3, 3, 3, 3, 3, 1, 3, 1],
      [1, 1, 1, 1, 3, 1, 1, 1, 3, 3],
      [1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 0, 1, 1, 1, 1, 1, 1, 5, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Golden Idol", 
        description: "An ancient idol that seems to radiate power", 
        content: "This golden idol was worshipped by an ancient desert civilization.", 
        location: { x: 4, y: 6 }, 
        exp: 20, 
        visible: true, 
        area: "Desert",
        type: ARTIFACT_TYPES.CONTAINER,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The idol shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Desert Nomad",
        type: NPC_TYPES.MYSTIC,
        position: { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE },
        dialogue: [
          "The desert winds whisper ancient secrets...",
          "The Golden Idol you seek has great power, but beware its curse.",
          "Many have tried to claim it, only to be lost in these endless sands.",
          "Look for the signs in the sand. They will guide your way."
        ]
      }
    ]
  },
  {
    name: "Desert 2",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
      [3, 3, 1, 1, 1, 1, 1, 1, 3, 1],
      [1, 3, 1, 1, 1, 1, 3, 1, 3, 1],
      [1, 3, 1, 1, 1, 1, 3, 1, 3, 1],
      [1, 3, 3, 3, 3, 3, 3, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 3, 3],
      [1, 0, 0, 0, 3, 3, 3, 3, 3, 3],
      [1, 0, 1, 1, 1, 1, 1, 1, 5, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Desert Compass", 
        description: "An ancient navigation device that points to something other than north", 
        content: "The needle spins wildly when near certain artifacts, perhaps it can help locate hidden treasures.", 
        location: { x: 1, y: 7 }, 
        exp: 20, 
        visible: true, 
        area: "Desert",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The compass shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Lost Archaeologist",
        type: NPC_TYPES.SCHOLAR,
        position: { x: 1 * TILE_SIZE, y: 7 * TILE_SIZE },
        dialogue: [
          "Finally, another person! I've been studying these ruins for months.",
          "The Desert Compass points to more than just direction...",
          "I've mapped out most of this area. The real treasure lies deeper in the desert.",
          "If you find any ancient texts, please bring them to me for translation."
        ]
      }
    ]
  },
  {
    name: "Desert 3",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
      [3, 3, 1, 1, 1, 1, 1, 1, 3, 1],
      [1, 3, 3, 3, 3, 3, 3, 1, 5, 1],
      [1, 3, 3, 3, 3, 3, 3, 1, 3, 1],
      [1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 3, 3, 1, 1, 1, 3, 3, 3, 3],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Sandstone Tablet", 
        description: "A tablet covered in mysterious hieroglyphs", 
        content: "The inscriptions tell of a great civilization and their powerful artifacts, now scattered across the lands.", 
        location: { x: 2, y: 6 }, 
        exp: 25, 
        visible: true, 
        area: "Desert",
        type: ARTIFACT_TYPES.SCROLL,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The tablet shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Desert Guardian",
        type: NPC_TYPES.WARRIOR,
        position: { x: 5 * TILE_SIZE, y: 5 * TILE_SIZE },
        dialogue: [
          "Halt! This sacred ground is not for the unprepared.",
          "The Sandstone Tablet contains powerful knowledge.",
          "Only those who have proven their worth may pass beyond this point.",
          "Show me the Desert Compass if you wish to proceed further."
        ]
      }
    ]
  },
  // Dungeon Maps
  {
    name: "Dungeon 1",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 5, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Dungeon Key", 
        description: "An ornate key that seems important", 
        content: "This key must unlock something valuable deeper in the dungeon.", 
        location: { x: 5, y: 5 }, 
        exp: 25, 
        visible: true, 
        area: "Dungeon",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The key shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Dungeon Master",
        type: NPC_TYPES.GUIDE,
        position: { x: 4 * TILE_SIZE, y: 2 * TILE_SIZE },
        dialogue: [
          "Welcome to the depths, brave adventurer.",
          "These dungeons hold powerful artifacts, but also great danger.",
          "Find the Dungeon Key to unlock deeper levels.",
          "Watch your step, and remember - not all treasures are worth the risk."
        ]
      }
    ]
  },
  {
    name: "Dungeon 2",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 3, 3, 3, 3, 3, 3, 3, 3, 4],
      [4, 3, 4, 4, 4, 4, 4, 4, 3, 4],
      [4, 3, 4, 3, 3, 3, 3, 4, 3, 4],
      [4, 3, 4, 3, 4, 4, 3, 4, 3, 4],
      [4, 3, 3, 3, 3, 3, 3, 4, 3, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 3, 4],
      [4, 3, 3, 3, 3, 3, 3, 3, 3, 4],
      [4, 3, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 5, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Shadow Essence", 
        description: "A swirling dark essence contained in an ornate vial", 
        content: "The essence seems to react to the presence of other artifacts, growing stronger or weaker.", 
        location: { x: 4, y: 3 }, 
        exp: 28, 
        visible: true, 
        area: "Dungeon",
        type: ARTIFACT_TYPES.RELIC,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The essence shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Shadow Mystic",
        type: NPC_TYPES.MYSTIC,
        position: { x: 3 * TILE_SIZE, y: 4 * TILE_SIZE },
        dialogue: [
          "The shadows speak to those who listen...",
          "The Shadow Essence responds to ancient artifacts.",
          "Combine it with other relics to unlock hidden powers.",
          "But beware - some combinations may have... unexpected results."
        ]
      }
    ]
  },
  {
    name: "Dungeon 3",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 4, 4, 4, 5, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Ancient Tome", 
        description: "A weathered book bound in mysterious materials", 
        content: "The pages contain knowledge of artifact creation and manipulation, with spaces for users to add their own discoveries.", 
        location: { x: 3, y: 7 }, 
        exp: 30, 
        visible: true, 
        area: "Dungeon",
        type: ARTIFACT_TYPES.SCROLL,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The tome shows visions of an ancient underwater city..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Ancient Librarian",
        type: NPC_TYPES.SCHOLAR,
        position: { x: 7 * TILE_SIZE, y: 7 * TILE_SIZE },
        dialogue: [
          "At last, someone who might appreciate these ancient tomes!",
          "The Ancient Tome you seek contains forbidden knowledge.",
          "It can teach you to create and modify artifacts.",
          "But remember - with great power comes great responsibility."
        ]
      },
      {
        id: uuidv4(),
        name: "Oscar Wilde",
        type: NPC_TYPES.OSCAR_WILDE,
        position: { x: 4 * TILE_SIZE, y: 3 * TILE_SIZE },
        dialogue: [
          "The truth is rarely pure and never simple. (The Importance of Being Earnest, 1895)",
          "We are all in the gutter, but some of us are looking at the stars. (Lady Windermere's Fan, 1892)",
          "Experience is simply the name we give our mistakes. (The Picture of Dorian Gray, 1890)",
          "To live is the rarest thing in the world. Most people exist, that is all. (The Soul of Man Under Socialism, 1891)"
        ]
      },
      {
        id: uuidv4(),
        name: "Alexander Pope",
        type: NPC_TYPES.ALEXANDER_POPE,
        position: { x: 2 * TILE_SIZE, y: 5 * TILE_SIZE },
        dialogue: [
          "To err is human, to forgive divine. (An Essay on Criticism, 1711)",
          "A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring. (An Essay on Criticism, 1711)",
          "Hope springs eternal in the human breast; Man never is, but always to be blessed. (An Essay on Man, 1734)",
          "The proper study of Mankind is Man. (An Essay on Man, 1734)"
        ]
      }
    ]
  },
  // Add the Yosemite map after the existing maps
  {
    name: "Yosemite",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 2, 2, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      {
        id: uuidv4(),
        name: "Half Dome View",
        description: "A breathtaking view of Half Dome, the iconic granite dome at the eastern end of Yosemite Valley.",
        content: "Standing here, you can see the majestic Half Dome rising 4,737 ft (1,444 m) above the valley floor.",
        location: { x: 10, y: 3 },
        exp: 25,
        visible: true,
        area: "Yosemite",
        type: ARTIFACT_TYPES.RELIC,
        interactions: []
      },
      {
        id: uuidv4(),
        name: "Yosemite Falls",
        description: "The magnificent Yosemite Falls, one of the world's tallest waterfalls.",
        content: "Yosemite Falls is 2,425 feet (739 m) tall and consists of three sections: Upper Falls, Middle Cascades, and Lower Falls.",
        location: { x: 3, y: 6 },
        exp: 25,
        visible: true,
        area: "Yosemite",
        type: ARTIFACT_TYPES.RELIC,
        interactions: []
      },
      {
        id: uuidv4(),
        name: "Mist Trail",
        description: "The popular Mist Trail alongside Vernal and Nevada Falls.",
        content: "The Mist Trail gets its name from the mist that sprays off Vernal Falls, often creating rainbows in the afternoon sun.",
        location: { x: 15, y: 12 },
        exp: 25,
        visible: true,
        area: "Yosemite",
        type: ARTIFACT_TYPES.RELIC,
        interactions: []
      },
      {
        id: uuidv4(),
        name: "Return Portal",
        description: "A portal that will take you back to the main world.",
        content: "This magical gateway will transport you back to where you began your journey. Use it when you're ready to leave Yosemite National Park.",
        location: { x: 18, y: 1 },
        exp: 10,
        visible: true,
        area: "Yosemite",
        type: ARTIFACT_TYPES.PORTAL,
        interactions: []
      }
    ],
    npcs: [
      {
        id: 'john_muir_yosemite',
        type: NPC_TYPES.JOHN_MUIR,
        name: 'John Muir',
        position: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
        patrolArea: {
          startX: 1,
          startY: 16,
          width: 5,
          height: 2
        },
        dialogue: [
          "Welcome to Yosemite, the grandest of all the special temples of Nature. (The Yosemite, 1912)",
          "This is Nature's cathedral, surpassing any ever yet reared by hands. (Our National Parks, 1901)",
          "Climb the mountains and get their good tidings. Nature's peace will flow into you as sunshine flows into trees. (Our National Parks, 1901)",
          "Walk along the river to see Yosemite Falls, then follow the Mist Trail to experience the raw power of water shaping granite.",
          "Half Dome awaits the bold at the end of your journey. Its majestic face has been shaped by the forces of glaciers over millions of years."
        ]
      }
    ]
  },
];

// Add helper functions for artifact interactions
export const canInteract = (artifact1, artifact2) => {
  return artifact1.interactions?.some(interaction => 
    interaction.type === ARTIFACT_INTERACTIONS.COMBINE && 
    interaction.targetArtifact === artifact2.name
  );
};

export const getInteractionResult = (artifact1, artifact2) => {
  const interaction = artifact1.interactions?.find(i => 
    i.type === ARTIFACT_INTERACTIONS.COMBINE && 
    i.targetArtifact === artifact2.name
  );
  return interaction?.result;
};

export const isNearConditionMet = (artifact, characterPosition, mapData) => {
  const interaction = artifact.interactions?.find(i => i.type === ARTIFACT_INTERACTIONS.REVEAL);
  if (!interaction) return false;

  const { x, y } = characterPosition;
  const tileType = mapData[Math.floor(y / 64)][Math.floor(x / 64)];
  
  switch (interaction.condition) {
    case 'nearWater':
      return tileType === 2; // Water tile
    case 'nearPortal':
      return tileType === 5; // Portal tile
    default:
      return false;
  }
};

// Add helper functions for NPC interactions
export const canInteractWithNPC = (characterPosition, npcPosition) => {
  const charX = Math.floor(characterPosition.x / TILE_SIZE);
  const charY = Math.floor(characterPosition.y / TILE_SIZE);
  const npcX = Math.floor(npcPosition.x / TILE_SIZE);
  const npcY = Math.floor(npcPosition.y / TILE_SIZE);

  return Math.abs(charX - npcX) <= 1 && Math.abs(charY - npcY) <= 1;
};

export const NPCs = {
  "William Shakespeare": {
    name: "William Shakespeare",
    description: "The immortal Bard of Avon, master playwright and poet of the English Renaissance.",
    apiType: "shakespeare",
    apiConfig: {},
    position: { x: 10, y: 10 },
    dialogue: [
      "To be, or not to be, that is the question. (Hamlet, Act III, Scene I)",
      "All the world's a stage, and all the men and women merely players. (As You Like It, Act II, Scene VII)",
      "Now is the winter of our discontent made glorious summer by this sun of York. (Richard III, Act I, Scene I)"
    ]
  },
  "Socrates": {
    name: "Socrates",
    description: "The foundational philosopher of Western thought, master of dialectic inquiry.",
    apiType: "socrates",
    apiConfig: {},
    position: { x: 15, y: 15 },
    dialogue: [
      "The unexamined life is not worth living. (Plato's Apology, 38a)",
      "I know that I know nothing. (Plato's Apology, 21d)",
      "Wisdom begins in wonder. (Attributed by Plato in Theaetetus)"
    ]
  },
  "Augustine": {
    name: "Augustine of Hippo",
    description: "The great theologian and philosopher of late antiquity, author of 'Confessions'.",
    apiType: "augustine",
    apiConfig: {},
    position: { x: 20, y: 20 },
    dialogue: [
      "Love, and do what you will. (Homilies on the First Epistle of John, Tractate 7)",
      "The world is a book, and those who do not travel read only one page. (Confessions)",
      "Faith is to believe what you do not see; the reward of this faith is to see what you believe. (Sermons, 43.1)"
    ]
  },
  "Michelangelo": {
    name: "Michelangelo",
    description: "The Renaissance master artist, sculptor, and architect of the Sistine Chapel.",
    apiType: "michelangelo",
    apiConfig: {},
    position: { x: 25, y: 25 },
    dialogue: [
      "I saw the angel in the marble and carved until I set him free. (Letter to Benedetto Varchi, 1549)",
      "The greater danger for most of us lies not in setting our aim too high and falling short, but in setting our aim too low and achieving our mark. (Attributed in letters)",
      "Every block of stone has a statue inside it and it is the task of the sculptor to discover it. (Attributed in Conversations with Michelangelo by Francisco de Hollanda)"
    ]
  },
  "Lord Byron": {
    name: "Lord Byron",
    description: "The legendary Romantic poet, Ada Lovelace's father, known for his passionate verse and dramatic life.",
    apiType: "byron",
    apiConfig: {},
    position: { x: 14, y: 8 },
    dialogue: [
      "She walks in beauty, like the night of cloudless climes and starry skies. (She Walks in Beauty, 1814)",
      "There is a pleasure in the pathless woods, there is a rapture on the lonely shore. (Childe Harold's Pilgrimage, Canto IV, Stanza 178)",
      "The great object of life is sensation - to feel that we exist, even though in pain. (Letter to Annabella Milbanke, 1813)"
    ]
  }
};
