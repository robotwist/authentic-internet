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
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 5, 4, 2, 2, 2, 2, 2, 2, 2, 2],
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
        type: "WEAPON",
        content: "The sword pulses with ancient power, its edge never dulling.", 
        media: ["/assets/artifacts/ancient_sword.png"],
        location: { x: 3, y: 2, mapName: "Overworld" },
        exp: 15, 
        visible: true, 
        area: "Overworld",
        interactions: [
          {
            type: "COMBINE",
            targetArtifact: "Crystal Shard",
            result: "Crystal Sword",
            revealedContent: "The sword resonates with the crystal's energy..."
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
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["legendary", "weapon", "warrior"],
        rating: 4.7,
        reviews: [
          {
            userId: "user-002",
            rating: 5,
            comment: "Incredible artifact!",
            createdAt: "2024-06-02T10:00:00Z"
          }
        ],
        remixOf: null
      },
      { 
        id: uuidv4(),
        name: "Mystic Orb",
        description: "A glowing orb filled with swirling energy.",
        type: "MAGIC",
        content: "It hums with an ancient power, revealing secrets to those who are worthy.",
        media: ["/assets/artifacts/mystic_orb.png"],
        location: { x: 7, y: 13, mapName: "Overworld" },
        exp: 20,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["mystic", "orb", "magic"],
        rating: 0,
        reviews: [],
        remixOf: null
      },
    ],
    npcs: [
      {
        id: 'john_muir1',
        type: NPC_TYPES.JOHN_MUIR,
        name: 'John Muir',
        position: { x: 5, y: 14 },
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
        type: "ARTIFACT",
        content: "Whispers of ancient wisdom echo from its surface, waiting to be discovered.", 
        media: ["/assets/artifacts/enchanted_mirror.png"],
        location: { x: 3, y: 3, mapName: "Overworld 2" }, 
        exp: 18, 
        visible: true, 
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["mirror", "enchanted", "arcane"],
        rating: 0,
        reviews: [],
        remixOf: null
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Zeus the Weatherman",
        type: NPC_TYPES.ZEUS,
        apiType: 'zeus',
        position: { x: 3, y: 3 },
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
      [0, 0, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
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
        type: "SCROLL",
        content: "The pages contain knowledge of artifact creation and manipulation, with spaces for users to add their own discoveries.", 
        media: ["/assets/artifacts/ancient_tome.png"],
        location: { x: 3, y: 7, mapName: "Overworld 3" }, 
        exp: 30, 
        visible: true, 
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["tome", "ancient", "knowledge"],
        rating: 0,
        reviews: [],
        remixOf: null
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "William Shakespeare",
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 5, y: 7 },
        dialogue: [
          "All the world's a stage, and all the men and women merely players.",
          "To be, or not to be, that is the question.",
          "Cowards die many times before their deaths; the valiant never taste of death but once.",
          "We know what we are, but know not what we may be.",
          "Better three hours too soon than a minute too late."
        ]
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
        type: "TREASURE",
        content: "This golden idol was worshipped by an ancient desert civilization.", 
        media: ["/assets/artifacts/golden_idol.png"],
        location: { x: 4, y: 6, mapName: "Desert 1" }, 
        exp: 20, 
        visible: true, 
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["golden", "idol", "desert"],
        rating: 0,
        reviews: [],
        remixOf: null
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
        type: "TOOL",
        content: "The needle spins wildly when near certain artifacts, perhaps it can help locate hidden treasures.", 
        media: ["/assets/artifacts/desert_compass.png"],
        location: { x: 1, y: 7, mapName: "Desert 2" }, 
        exp: 20, 
        visible: true, 
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["compass", "desert", "navigation"],
        rating: 0,
        reviews: [],
        remixOf: null
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
        type: "SCROLL",
        content: "The inscriptions tell of a great civilization and their powerful artifacts, now scattered across the lands.", 
        media: ["/assets/artifacts/sandstone_tablet.png"],
        location: { x: 2, y: 6, mapName: "Desert 3" }, 
        exp: 25, 
        visible: true, 
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["tablet", "sandstone", "desert"],
        rating: 0,
        reviews: [],
        remixOf: null
      }
    ]
  },
  {
    name: "Yosemite",
    data: [
      // Row 0-9: Northern forest and mountains
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      // Row 10-19: Terminal Portal Shrine (NW) and open meadows
      [1, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 0, 0, 0, 0, 6, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      // Row 20-29: Central valley, Shooter Portal Shrine (NE), and John Muir's area
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 7, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      // Row 30-39: Text Adventure Portal Shrine (Center-South) and exit portal
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 8, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    specialPortals: [
      {
        position: { x: 9, y: 14 },
        type: "terminal",
        destination: "Terminal3",
        tileType: 6
      },
      {
        position: { x: 28, y: 24 },
        type: "shooter",
        destination: "Level4Shooter",
        tileType: 7
      },
      {
        position: { x: 11, y: 34 },
        type: "text",
        destination: "Text Adventure",
        tileType: 8
      }
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "John Muir",
        type: NPC_TYPES.JOHN_MUIR,
        position: { x: 320, y: 1344 },  // Center valley area for easy finding (pixel coordinates)
        sprite: '/assets/npcs/john_muir.png',
        patrolArea: {
          startX: 256,  // 4 tiles * 64px
          startY: 1024, // 16 tiles * 64px
          width: 768,   // 12 tiles * 64px - larger patrol area for bigger map
          height: 768   // 12 tiles * 64px
        },
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
        position: { x: 2, y: 2 },
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
        type: "WEAPON",
        content: "The keys still hold the echoes of countless adventures.", 
        media: ["/assets/artifacts/hemingway_typewriter.png"],
        location: { x: 4, y: 4, mapName: "Level4Shooter" }, 
        exp: 40, 
        visible: true, 
        area: "Shooter",
        interactions: [
          {
            type: "REVEAL",
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
          description: true,
          content: true,
          properties: ["magic", "visionRange"]
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["hemingway", "typewriter", "shooter"],
        rating: 0,
        reviews: [],
        remixOf: null
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
        type: "KEY",
        content: "This key seems to resonate with the deeper levels of the dungeon.",
        media: ["/assets/artifacts/dungeon_key.png"],
        location: { x: 4, y: 4, mapName: "Dungeon Level 1" },
        exp: 20,
        visible: true,
        area: "Dungeon",
        interactions: [
          {
            type: "UNLOCK",
            targetArtifact: "Dungeon Door",
            result: "Access to Dungeon Level 2"
          }
        ],
        properties: {},
        userModifiable: {
          description: true,
          content: true
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["dungeon", "key"],
        rating: 0,
        reviews: [],
        remixOf: null
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
        type: "SCROLL",
        content: "The scroll tells of a powerful artifact hidden in the deepest level.",
        media: ["/assets/artifacts/ancient_scroll.png"],
        location: { x: 4, y: 4, mapName: "Dungeon Level 2" },
        exp: 25,
        visible: true,
        area: "Dungeon",
        interactions: [],
        properties: {},
        userModifiable: {
          description: true,
          content: true
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["scroll", "ancient", "dungeon"],
        rating: 0,
        reviews: [],
        remixOf: null
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
        type: "KEY",
        content: "This key seems to resonate with digital energy.",
        media: ["/assets/artifacts/terminal_key.png"],
        location: { x: 4, y: 4, mapName: "Dungeon Level 3" },
        exp: 30,
        visible: true,
        area: "Dungeon",
        interactions: [
          {
            type: "UNLOCK",
            targetArtifact: "Terminal Portal",
            result: "Access to Terminal3"
          }
        ],
        properties: {},
        userModifiable: {
          description: true,
          content: true
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["terminal", "key", "dungeon"],
        rating: 0,
        reviews: [],
        remixOf: null
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