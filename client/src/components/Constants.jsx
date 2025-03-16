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

export const isWalkable = (x, y, map) => {
  const row = Math.floor(y / TILE_SIZE);
  const col = Math.floor(x / TILE_SIZE);
  return map?.[row]?.[col] === 0 || map?.[row]?.[col] === 5 || map?.[row]?.[col] === 3; 
};

export const ARTIFACT_TYPES = {
  WEAPON: 'weapon',
  SCROLL: 'scroll',
  RELIC: 'relic',
  KEY: 'key',
  CONTAINER: 'container'
};

export const ARTIFACT_INTERACTIONS = {
  COMBINE: 'combine',
  UNLOCK: 'unlock',
  REVEAL: 'reveal',
  TRANSFORM: 'transform'
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
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
