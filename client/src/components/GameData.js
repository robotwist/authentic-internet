import { v4 as uuidv4 } from 'uuid';
import { TILE_SIZE } from './MapConstants';
import { ARTIFACT_TYPES, ARTIFACT_INTERACTIONS, NPC_TYPES } from './GameConstants';
import { isValidMapSize } from './MapConstants';

// Maps array
export const MAPS = [
  {
    name: "Overworld",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
        location: { x: 3, y: 2 },
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
        id: 'john_muir1',
        type: NPC_TYPES.JOHN_MUIR,
        name: 'John Muir',
        position: { x: 5 * TILE_SIZE, y: 14 * TILE_SIZE },
        isPatrolling: false, // Fixed position NPC to avoid conflicts
        dialogue: [
          "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
          "In every walk with nature one receives far more than he seeks. (Unpublished journals, circa 1877)",
          "The clearest way into the Universe is through a forest wilderness. (John of the Mountains, 1938)",
          "When one tugs at a single thing in nature, he finds it attached to the rest of the world. (My First Summer in the Sierra, 1911)",
          "The world is big and I want to have a good look at it before it gets dark. (Letter to his sister, 1873)"
        ]
      },
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
        name: "Zeus the Weatherman",
        type: NPC_TYPES.ZEUS,
        apiType: 'zeus',
        position: { x: 4 * TILE_SIZE, y: 3 * TILE_SIZE }, // Moved to walkable tile (x=4,y=3 is tile value 0)
        isPatrolling: false, // Fixed position to avoid movement conflicts
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
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
        name: "Ancient Tome", 
        description: "A weathered book bound in mysterious materials", 
        content: "The pages contain knowledge of artifact creation and manipulation, with spaces for users to add their own discoveries.", 
        location: { x: 3, y: 7 }, 
        exp: 30, 
        visible: true, 
        area: "Overworld",
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
    ]
  },
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
    ]
  },
  {
    name: "Yosemite",
    data: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 2, 2, 2, 2, 2, 2, 0, 2],
      [2, 0, 2, 0, 6, 0, 7, 2, 0, 2],
      [2, 0, 2, 0, 2, 2, 0, 2, 0, 2],
      [2, 0, 0, 0, 2, 2, 8, 2, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 2, 0, 2],
      [2, 0, 2, 2, 2, 2, 2, 2, 0, 2],
      [2, 0, 2, 2, 0, 0, 0, 0, 5, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ],
    specialPortals: [
      {
        position: { x: 4, y: 3 },
        type: "terminal",
        destination: "Terminal3",
        tileType: 6
      },
      {
        position: { x: 6, y: 3 },
        type: "shooter",
        destination: "Level4Shooter",
        tileType: 7
      },
      {
        position: { x: 6, y: 5 },
        type: "text",
        destination: "Text Adventure",
        tileType: 8
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "John Muir",
        type: NPC_TYPES.GUIDE,
        location: { x: 2, y: 2 },
        dialogue: [
          "Welcome to Yosemite Valley! The grandeur of these peaks never ceases to amaze me.",
          "Have you noticed how the valley seems to tell its own story through its formations?",
          "Every rock, every waterfall has a tale to share with those who listen carefully.",
          "I've discovered three mystical portals in this valley - one leads to a digital realm, another to Hemingway's battleground, and the third to a world of pure narrative.",
          "Each portal offers a unique challenge and wisdom to those who dare to enter."
        ],
        quest: {
          id: uuidv4(),
          title: "Valley's Secrets",
          description: "Help John Muir document the unique features of Yosemite Valley",
          objectives: [
            "Find Nature's Journal",
            "Document three unique valley features",
            "Return to John Muir"
          ],
          reward: {
            exp: 50,
            item: "Conservationist's Badge"
          }
        }
      }
    ]
  },
  {
    name: "Hemingway's Battleground",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 5, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "War Manuscript", 
        description: "A manuscript detailing the experiences of war", 
        content: "The pages contain powerful descriptions of conflict and its impact on the human spirit.", 
        location: { x: 4, y: 4 }, 
        exp: 40, 
        visible: true, 
        area: "Battleground",
        type: ARTIFACT_TYPES.SCROLL,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent: "The manuscript reveals deeper truths about the nature of conflict..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "wisdom"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ],
    npcs: [
      {
        id: 'hemingway1',
        type: NPC_TYPES.WRITER,
        name: 'Ernest Hemingway',
        position: { x: 128, y: 128 },
        sprite: '/assets/npcs/hemingway.png',
        dialogue: [
          "Write hard and clear about what hurts.",
          "All you have to do is write one true sentence.",
          "The world breaks everyone, and afterward, some are strong at the broken places."
        ]
      }
    ]
  },
  {
    name: "Text Adventure",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Story Compass", 
        description: "A mystical compass that points to narrative possibilities", 
        content: "This compass seems to react to the strength of nearby stories.", 
        location: { x: 4, y: 4 }, 
        exp: 30, 
        visible: true, 
        area: "TextAdventure",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearBook",
            revealedContent: "The compass needle spins wildly, pointing to untold stories..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "narrative"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ]
  },
  {
    name: "Terminal3",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Digital Codex", 
        description: "An ancient terminal that holds forgotten digital wisdom", 
        content: "The screen flickers with cryptic commands and mysterious data.", 
        location: { x: 4, y: 4 }, 
        exp: 35, 
        visible: true, 
        area: "Terminal",
        type: ARTIFACT_TYPES.CONTAINER,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearTerminal",
            revealedContent: "The terminal springs to life, revealing hidden programs..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "digital"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ]
  },
  {
    name: "Level4Shooter",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      { 
        id: uuidv4(), 
        name: "Hemingway's Typewriter", 
        description: "A battle-worn typewriter that has seen many stories", 
        content: "The keys still hold the echoes of countless adventures.", 
        location: { x: 4, y: 4 }, 
        exp: 40, 
        visible: true, 
        area: "Shooter",
        type: ARTIFACT_TYPES.WEAPON,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearBattle",
            revealedContent: "The typewriter resonates with the spirit of adventure..."
          }
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "combat"
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"]
        }
      }
    ]
  },
  {
    name: "Dungeon Level 1",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      {
        id: uuidv4(),
        name: "Dungeon Key",
        description: "A key that unlocks deeper dungeon levels",
        content: "This key seems to resonate with the deeper levels of the dungeon.",
        location: { x: 4, y: 4 },
        exp: 20,
        visible: true,
        area: "Dungeon",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.UNLOCK,
            targetArtifact: "Dungeon Door",
            result: "Access to Dungeon Level 2"
          }
        ]
      }
    ]
  },
  {
    name: "Dungeon Level 2",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 0, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      {
        id: uuidv4(),
        name: "Ancient Scroll",
        description: "A scroll containing knowledge of the dungeon's history",
        content: "The scroll tells of a powerful artifact hidden in the deepest level.",
        location: { x: 4, y: 4 },
        exp: 25,
        visible: true,
        area: "Dungeon",
        type: ARTIFACT_TYPES.SCROLL
      }
    ]
  },
  {
    name: "Dungeon Level 3",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 5, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
    ],
    artifacts: [
      {
        id: uuidv4(),
        name: "Terminal Key",
        description: "A key that unlocks access to the terminal realm",
        content: "This key seems to resonate with digital energy.",
        location: { x: 4, y: 4 },
        exp: 30,
        visible: true,
        area: "Dungeon",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.UNLOCK,
            targetArtifact: "Terminal Portal",
            result: "Access to Terminal3"
          }
        ]
      }
    ]
  }
];

// Validate all maps on load
MAPS.forEach((map, index) => {
  if (!isValidMapSize(map.data)) {
    console.error(`Invalid map size in map ${index}: ${map.name}`);
  }
});

// NPCs and World Map
export const NPCs = {
  "Ernest Hemingway": {
    name: "Ernest Hemingway",
    sprite: "/assets/npcs/hemingway.png",
    apiType: "quotes",
    dialogueStyle: "direct",
    themes: ["writing", "courage", "life"]
  },
  // ... rest of NPCs ...
};

export const WORLD_MAP = {
  structure: [
    { id: 'overworld', name: 'Overworld', x: 200, y: 100, connections: ['overworld2', 'dungeon1'] },
    { id: 'overworld2', name: 'Overworld 2', x: 350, y: 200, connections: ['overworld', 'overworld3'] },
    { id: 'overworld3', name: 'Overworld 3', x: 500, y: 100, connections: ['overworld2', 'desert1'] },
    { id: 'desert1', name: 'Desert 1', x: 650, y: 200, connections: ['overworld3', 'desert2', 'yosemite', 'hemingway'] },
    { id: 'desert2', name: 'Desert 2', x: 800, y: 100, connections: ['desert1', 'desert3'] },
    { id: 'desert3', name: 'Desert 3', x: 950, y: 200, connections: ['desert2'] },
    { id: 'yosemite', name: 'Yosemite', x: 650, y: 350, connections: ['desert1'] },
    
    // New dungeon levels
    { id: 'dungeon1', name: 'Dungeon Level 1', x: 200, y: 250, connections: ['overworld', 'dungeon2'], type: 'dungeon' },
    { id: 'dungeon2', name: 'Dungeon Level 2', x: 150, y: 350, connections: ['dungeon1', 'dungeon3'], type: 'dungeon' },
    { id: 'dungeon3', name: 'Dungeon Level 3', x: 250, y: 450, connections: ['dungeon2', 'yosemite'], type: 'dungeon' },
    
    // Hemingway's adventure
    { id: 'hemingway', name: 'Hemingway\'s Adventure', x: 800, y: 300, connections: ['desert1'], type: 'special' },
    
    // Text-based adventure
    { id: 'text_adventure', name: 'Text Adventure', x: 400, y: 450, connections: ['yosemite'], type: 'text' }
  ],
  mapToId: {
    'Overworld': 'overworld',
    'Overworld 2': 'overworld2',
    'Overworld 3': 'overworld3',
    'Desert 1': 'desert1',
    'Desert 2': 'desert2',
    'Desert 3': 'desert3',
    'Yosemite': 'yosemite',
    'Dungeon Level 1': 'dungeon1',
    'Dungeon Level 2': 'dungeon2',
    'Dungeon Level 3': 'dungeon3',
    'Hemingway\'s Adventure': 'hemingway',
    'Text Adventure': 'text_adventure'
  }
}; 