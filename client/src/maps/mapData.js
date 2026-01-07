/**
 * Map data for the game
 * Contains definitions for the various map areas, including tiles, artifacts, and NPCs
 */

import { TILE_SIZE } from "../components/Constants";

// Define basic map structure
export const mapData = {
  // The main overworld map
  overworld: {
    name: "Overworld",
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    startPosition: { x: 10, y: 8 },
    music: "overworld",
    tiles: [
      // This would be a 2D array of tile IDs
      // 0 = empty/walkable, 1 = wall/obstacle, etc.
      // For brevity, we'll just define a simple pattern here
    ],
    npcs: [
      {
        id: "shakespeare",
        name: "Shakespeare",
        type: "guide",
        position: { x: 5, y: 5 },
        sprite: "/assets/npcs/shakespeare.webp",
        dialog: [
          "Welcome to the land of authentic texts!",
          "I am Shakespeare, your guide through this literary world.",
          "What would you like to discover today?",
        ],
      },
      {
        id: "lord_byron",
        name: "Lord Byron",
        type: "poet",
        position: { x: 12, y: 8 },
        sprite: "/assets/npcs/lord_byron.webp",
        dialog: [
          "Ah, a traveler in this realm of words and imagination!",
          "I am Lord Byron, a poet of some renown.",
          "Perhaps you'd like to hear a verse or two?",
        ],
      },
    ],
    artifacts: [
      {
        id: "quill",
        name: "Ancient Quill",
        description: "A quill that once belonged to a famous writer",
        type: "TOOL",
        content:
          "This ancient quill seems to carry the creative spirit of its previous owner, ready to channel inspiration into written words.",
        media: ["/assets/items/quill.png"],
        location: { x: 7, y: 7, mapName: "Overworld" },
        exp: 5,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "USE",
            condition: "Write with quill",
            revealedContent:
              "Words flow effortlessly as the quill guides your hand.",
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
        tags: ["quill", "ancient", "writing"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
      {
        id: "book",
        name: "Mysterious Tome",
        description: "A book filled with cryptic writings",
        type: "SCROLL",
        content:
          "This mysterious tome contains cryptic writings that seem to shift and change as you read them.",
        media: ["/assets/items/book.png"],
        location: { x: 15, y: 10, mapName: "Overworld" },
        exp: 10,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
            condition: "Read tome",
            revealedContent: "The cryptic writings begin to make sense...",
            action: "Gain knowledge",
          },
        ],
        properties: {
          wisdom: 15,
          value: 200,
        },
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["tome", "mysterious", "cryptic"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    portals: [
      {
        position: { x: 19, y: 7 },
        destination: "desert",
        destinationPosition: { x: 1, y: 7 },
      },
    ],
  },

  // The desert area
  desert: {
    name: "Desert",
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: "desert",
    tiles: [
      // Desert tiles
    ],
    npcs: [
      {
        id: "oscar_wilde",
        name: "Oscar Wilde",
        type: "wit",
        position: { x: 10, y: 7 },
        sprite: "/assets/npcs/oscar_wilde.svg",
        dialog: [
          "The desert is quite a change from London society.",
          "I always travel with my wit. It's the only thing I can't afford to lose.",
          "Would you care for some biting social commentary?",
        ],
      },
    ],
    artifacts: [
      {
        id: "scroll",
        name: "Ancient Scroll",
        description: "A scroll containing poetic wisdom",
        type: "SCROLL",
        content:
          "This ancient scroll contains poetic wisdom that has been preserved through the ages.",
        media: ["/assets/items/scroll.png"],
        location: { x: 5, y: 12, mapName: "Desert" },
        exp: 8,
        visible: true,
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
            condition: "Read scroll",
            revealedContent: "The poetic wisdom flows through your mind...",
            action: "Gain poetic insight",
          },
        ],
        properties: {
          wisdom: 12,
          value: 150,
        },
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["scroll", "ancient", "poetry"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: "overworld",
        destinationPosition: { x: 18, y: 7 },
      },
      {
        position: { x: 19, y: 7 },
        destination: "dungeon",
        destinationPosition: { x: 1, y: 7 },
      },
    ],
  },

  // The dungeon area
  dungeon: {
    name: "Dungeon",
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: "dungeon",
    tiles: [
      // Dungeon tiles
    ],
    npcs: [
      {
        id: "edgar_allan_poe",
        name: "Edgar Allan Poe",
        type: "dark_poet",
        position: { x: 8, y: 9 },
        sprite: "/assets/npcs/poe.webp",
        dialog: [
          "Welcome to the chambers of dread and wonder.",
          "In these dark halls, imagination takes flight.",
          "Would you like to hear a tale of mystery and woe?",
        ],
      },
    ],
    artifacts: [
      {
        id: "raven",
        name: "Obsidian Raven",
        description: "A small statue of a raven, emanating mysterious energy",
        type: "ARTIFACT",
        content:
          "This obsidian raven statue seems to watch you with ancient eyes, emanating mysterious energy.",
        media: ["/assets/items/raven.png"],
        location: { x: 12, y: 5, mapName: "Dungeon" },
        exp: 15,
        visible: true,
        area: "Dungeon",
        interactions: [
          {
            type: "REVEAL",
            condition: "Examine raven",
            revealedContent: "The raven's eyes seem to hold ancient secrets...",
            action: "Gain dark knowledge",
          },
        ],
        properties: {
          magic: 15,
          element: "dark",
        },
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["raven", "obsidian", "dark"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: "desert",
        destinationPosition: { x: 18, y: 7 },
      },
      {
        position: { x: 19, y: 7 },
        destination: "yosemite",
        destinationPosition: { x: 1, y: 7 },
      },
    ],
  },

  // The Yosemite area (reward area for level 1)
  yosemite: {
    name: "Yosemite",
    width: 20,
    height: 15,
    tileSize: TILE_SIZE,
    music: "yosemiteTheme",
    tiles: [
      // Yosemite tiles - natural beauty
    ],
    npcs: [
      {
        id: "john_muir",
        name: "John Muir",
        type: "naturalist",
        position: { x: 10, y: 10 },
        sprite: "/assets/npcs/muir.webp",
        dialog: [
          "Welcome to Yosemite, a temple of nature's wonder!",
          "The mountains are calling, and you have come.",
          "Would you like to hear about the beauty of this wilderness?",
        ],
      },
    ],
    artifacts: [
      {
        id: "golden_acorn",
        name: "Golden Acorn",
        description: "A rare golden acorn that glows with natural energy",
        type: "TREASURE",
        content:
          "This rare golden acorn glows with natural energy, a symbol of the wilderness's power.",
        media: ["/assets/items/golden_acorn.png"],
        location: { x: 10, y: 8, mapName: "Yosemite" },
        exp: 20,
        visible: true,
        area: "Yosemite",
        interactions: [
          {
            type: "COLLECT",
            condition: "Found in wilderness",
            revealedContent: "The acorn's natural energy flows through you...",
            action: "Gain wilderness connection",
          },
        ],
        properties: {
          nature: 20,
          value: 300,
        },
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["acorn", "golden", "nature"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    portals: [
      {
        position: { x: 0, y: 7 },
        destination: "dungeon",
        destinationPosition: { x: 18, y: 7 },
      },
    ],
  },
};

// Helper function to get map by name
export const getMapByName = (name) => {
  return Object.values(mapData).find(
    (map) => map.name.toLowerCase() === name.toLowerCase(),
  );
};

// Helper function to find NPC by ID across all maps
export const findNPCById = (id) => {
  for (const map of Object.values(mapData)) {
    const npc = map.npcs.find((npc) => npc.id === id);
    if (npc) return npc;
  }
  return null;
};

// Helper function to find artifact by ID across all maps
export const findArtifactById = (id) => {
  for (const map of Object.values(mapData)) {
    const artifact = map.artifacts.find((artifact) => artifact.id === id);
    if (artifact) return artifact;
  }
  return null;
};
