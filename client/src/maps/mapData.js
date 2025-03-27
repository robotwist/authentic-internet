/**
 * Map data for the game
 * Contains definitions for the various map areas, including tiles, artifacts, and NPCs
 */

import { TILE_SIZE } from '../components/Constants';

// Define basic map structure
export const mapData = {
  // The main overworld map
  overworld: {
    name: 'Overworld',
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    startPosition: { x: 10, y: 8 },
    music: 'overworld',
    tiles: [
      // This would be a 2D array of tile IDs
      // 0 = empty/walkable, 1 = wall/obstacle, etc.
      // For brevity, we'll just define a simple pattern here
    ],
    npcs: [
      {
        id: 'shakespeare',
        name: 'Shakespeare',
        type: 'guide',
        position: { x: 5, y: 5 },
        sprite: '/assets/npcs/shakespeare.webp',
        dialog: [
          "Welcome to the land of authentic texts!",
          "I am Shakespeare, your guide through this literary world.",
          "What would you like to discover today?"
        ]
      },
      {
        id: 'lord_byron',
        name: 'Lord Byron',
        type: 'poet',
        position: { x: 12, y: 8 },
        sprite: '/assets/npcs/lord_byron.webp',
        dialog: [
          "Ah, a traveler in this realm of words and imagination!",
          "I am Lord Byron, a poet of some renown.",
          "Perhaps you'd like to hear a verse or two?"
        ]
      }
    ],
    artifacts: [
      {
        id: 'quill',
        name: 'Ancient Quill',
        description: 'A quill that once belonged to a famous writer',
        position: { x: 7, y: 7 },
        image: '/assets/items/quill.png',
        exp: 5
      },
      {
        id: 'book',
        name: 'Mysterious Tome',
        description: 'A book filled with cryptic writings',
        position: { x: 15, y: 10 },
        image: '/assets/items/book.png',
        exp: 10
      }
    ],
    portals: [
      {
        position: { x: 19, y: 7 },
        destination: 'desert',
        destinationPosition: { x: 1, y: 7 }
      }
    ]
  },
  
  // The desert area
  desert: {
    name: 'Desert',
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: 'desert',
    tiles: [
      // Desert tiles
    ],
    npcs: [
      {
        id: 'oscar_wilde',
        name: 'Oscar Wilde',
        type: 'wit',
        position: { x: 10, y: 7 },
        sprite: '/assets/npcs/oscar_wilde.svg',
        dialog: [
          "The desert is quite a change from London society.",
          "I always travel with my wit. It's the only thing I can't afford to lose.",
          "Would you care for some biting social commentary?"
        ]
      }
    ],
    artifacts: [
      {
        id: 'scroll',
        name: 'Ancient Scroll',
        description: 'A scroll containing poetic wisdom',
        position: { x: 5, y: 12 },
        image: '/assets/items/scroll.png',
        exp: 8
      }
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: 'overworld',
        destinationPosition: { x: 18, y: 7 }
      },
      {
        position: { x: 19, y: 7 },
        destination: 'dungeon',
        destinationPosition: { x: 1, y: 7 }
      }
    ]
  },
  
  // The dungeon area
  dungeon: {
    name: 'Dungeon',
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: 'dungeon',
    tiles: [
      // Dungeon tiles
    ],
    npcs: [
      {
        id: 'edgar_allan_poe',
        name: 'Edgar Allan Poe',
        type: 'dark_poet',
        position: { x: 8, y: 9 },
        sprite: '/assets/npcs/poe.webp',
        dialog: [
          "Welcome to the chambers of dread and wonder.",
          "In these dark halls, imagination takes flight.",
          "Would you like to hear a tale of mystery and woe?"
        ]
      }
    ],
    artifacts: [
      {
        id: 'raven',
        name: 'Obsidian Raven',
        description: 'A small statue of a raven, emanating mysterious energy',
        position: { x: 12, y: 5 },
        image: '/assets/items/raven.png',
        exp: 15
      }
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: 'desert',
        destinationPosition: { x: 18, y: 7 }
      },
      {
        position: { x: 19, y: 7 },
        destination: 'yosemite',
        destinationPosition: { x: 1, y: 7 }
      }
    ]
  },
  
  // The Yosemite area (reward area for level 1)
  yosemite: {
    name: 'Yosemite',
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: 'yosemiteTheme',
    tiles: [
      // Yosemite tiles - natural beauty
    ],
    npcs: [
      {
        id: 'john_muir',
        name: 'John Muir',
        type: 'naturalist',
        position: { x: 10, y: 10 },
        sprite: '/assets/npcs/muir.webp',
        dialog: [
          "Welcome to Yosemite, a temple of nature's wonder!",
          "The mountains are calling, and you have come.",
          "Would you like to hear about the beauty of this wilderness?"
        ]
      }
    ],
    artifacts: [
      {
        id: 'golden_acorn',
        name: 'Golden Acorn',
        description: 'A rare golden acorn that glows with natural energy',
        position: { x: 15, y: 8 },
        image: '/assets/items/acorn.png',
        exp: 20
      }
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: 'dungeon',
        destinationPosition: { x: 18, y: 7 }
      },
      {
        position: { x: 10, y: 2 },
        destination: 'overworld',
        destinationPosition: { x: 10, y: 13 }
      }
    ],
    specialPortals: [
      {
        position: { x: 5, y: 5 },
        type: 'terminal'
      },
      {
        position: { x: 15, y: 5 },
        type: 'hemingway'
      }
    ]
  }
};

// Helper function to get map by name
export const getMapByName = (name) => {
  return Object.values(mapData).find(map => map.name.toLowerCase() === name.toLowerCase());
};

// Helper function to find NPC by ID across all maps
export const findNPCById = (id) => {
  for (const map of Object.values(mapData)) {
    const npc = map.npcs.find(npc => npc.id === id);
    if (npc) return npc;
  }
  return null;
};

// Helper function to find artifact by ID across all maps
export const findArtifactById = (id) => {
  for (const map of Object.values(mapData)) {
    const artifact = map.artifacts.find(artifact => artifact.id === id);
    if (artifact) return artifact;
  }
  return null;
}; 