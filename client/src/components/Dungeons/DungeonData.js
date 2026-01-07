/**
 * Dungeon Data Structure
 *
 * Inspired by The Legend of Zelda's dungeon design:
 * - Multi-room layouts with locked doors
 * - Keys, puzzles, and enemies
 * - Boss room with unique encounters
 * - Treasure rewards (weapons, heart containers)
 *
 * Each dungeon is a self-contained adventure.
 */

import { v4 as uuidv4 } from "uuid";

// Tile types for dungeon rooms
export const DUNGEON_TILES = {
  FLOOR: "floor",
  WALL: "wall",
  DOOR_NORTH: "door_north",
  DOOR_SOUTH: "door_south",
  DOOR_EAST: "door_east",
  DOOR_WEST: "door_west",
  LOCKED_DOOR_NORTH: "locked_door_north",
  LOCKED_DOOR_SOUTH: "locked_door_south",
  LOCKED_DOOR_EAST: "locked_door_east",
  LOCKED_DOOR_WEST: "locked_door_west",
  STAIRS_UP: "stairs_up",
  STAIRS_DOWN: "stairs_down",
  CHEST: "chest",
  BLOCK: "block", // Pushable block puzzle element
  SPIKE: "spike",
  WATER: "water",
  BOSS_DOOR: "boss_door",
};

// Enemy types specific to dungeons
export const DUNGEON_ENEMIES = {
  KEESE_DUNGEON: "keese_dungeon", // Faster dungeon variant
  STALFOS_DUNGEON: "stalfos_dungeon",
  DARKNUT: "darknut", // Armored knight enemy
  WIZZROBE: "wizzrobe", // Magic-casting enemy
  BUBBLE: "bubble", // Invincible skull
  WALLMASTER: "wallmaster", // Hand that drags you to entrance
};

// Boss types
export const BOSSES = {
  LIBRARIAN: {
    id: "librarian",
    name: "The Librarian",
    type: "librarian",
    health: 50,
    damage: 2,
    attackPatterns: [
      "book_throw", // Throws books in 8 directions
      "silence_wave", // Close-range stun attack
      "summon_pages", // Summons paper enemies
    ],
    sprite: "/assets/bosses/librarian.webp",
    quotes: [
      "SILENCE! This is a library!",
      "Knowledge is power, and I have ALL the books!",
      "You shall be... OVERDUE!",
      "Every page must be returned to its proper place!",
    ],
  },
};

/**
 * DUNGEON 1: The Library of Alexandria
 *
 * Theme: Knowledge & Forbidden Wisdom
 * Difficulty: Beginner (6 rooms)
 * Required Items: None (entry-level dungeon)
 * Rewards: White Sword, Heart Container, Small Key x3
 */
export const LIBRARY_OF_ALEXANDRIA = {
  id: "library_alexandria",
  name: "The Library of Alexandria",
  level: 1,
  theme: "knowledge",
  entrancePosition: { x: 8, y: 15 }, // Position in Overworld (near Shakespeare)

  // Dungeon consists of multiple rooms
  rooms: {
    // Room 1: Entrance Hall
    entrance: {
      id: "entrance",
      name: "Entrance Hall",
      description:
        "Ancient bookshelves line the walls. The air smells of old parchment.",
      width: 16,
      height: 11,

      // Room layout (16x11 grid)
      // W = wall, F = floor, D = door, L = locked door
      layout: [
        "WWWWWWWWWWWWWWWW",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "D......X.......W", // D = door west, X = entrance spawn point
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "WWWWWWLWWWWWWWWW", // L = locked door north
      ],

      startPosition: { x: 7, y: 5 }, // Where player spawns in this room

      enemies: [
        { type: "keese_dungeon", position: { x: 3, y: 3 } },
        { type: "keese_dungeon", position: { x: 12, y: 3 } },
        { type: "keese_dungeon", position: { x: 8, y: 7 } },
      ],

      items: [
        { type: "small_key", position: { x: 8, y: 9 } }, // Key drops when all enemies defeated
      ],

      doors: {
        north: { locked: true, requiresKey: true, leadsTo: "central_hall" },
        west: { locked: false, leadsTo: "overworld_exit" }, // Back to overworld
      },
    },

    // Room 2: Central Hall (hub room)
    central_hall: {
      id: "central_hall",
      name: "Central Hall",
      description:
        "A grand hall with three passages. Ancient scrolls flutter in an unseen breeze.",
      width: 16,
      height: 11,

      layout: [
        "WWWWWWWWWWWWWWWW",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "D..............D", // Doors on east and west
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "WWWWWWDWWWWWWWWW", // Door south (back to entrance)
      ],

      startPosition: { x: 8, y: 9 }, // Enter from south

      enemies: [
        { type: "stalfos_dungeon", position: { x: 5, y: 5 } },
        { type: "stalfos_dungeon", position: { x: 10, y: 5 } },
      ],

      items: [],

      doors: {
        south: { locked: false, leadsTo: "entrance" },
        east: { locked: true, requiresKey: true, leadsTo: "reading_room" },
        west: { locked: true, requiresKey: true, leadsTo: "archives" },
      },
    },

    // Room 3: Reading Room (east path)
    reading_room: {
      id: "reading_room",
      name: "Reading Room",
      description:
        "Dusty tables and chairs. Something valuable glints in the corner.",
      width: 16,
      height: 11,

      layout: [
        "WWWWWWWWWWWWWWWW",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............D", // Door west (back to central)
        "W..............W",
        "W..............W",
        "W.....C........W", // C = chest
        "W..............W",
        "WWWWWWWWWWWWWWWW",
      ],

      startPosition: { x: 14, y: 5 }, // Enter from west

      enemies: [{ type: "darknut", position: { x: 8, y: 5 } }],

      items: [
        { type: "compass", position: { x: 6, y: 8 }, inChest: true }, // Shows boss location
      ],

      doors: {
        west: { locked: false, leadsTo: "central_hall" },
      },
    },

    // Room 4: Archives (west path)
    archives: {
      id: "archives",
      name: "Archives",
      description:
        "Endless shelves of forgotten knowledge. A key rests on a pedestal.",
      width: 16,
      height: 11,

      layout: [
        "WWWWWWWWWWWWWWWW",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "D..............W", // Door east (back to central)
        "W..............W",
        "W..............W",
        "W.....K........W", // K = key
        "W..............W",
        "WWWWWWWWWWWWWWWW",
      ],

      startPosition: { x: 1, y: 5 }, // Enter from east

      enemies: [
        { type: "wizzrobe", position: { x: 8, y: 3 } },
        { type: "wizzrobe", position: { x: 8, y: 7 } },
      ],

      items: [{ type: "small_key", position: { x: 6, y: 8 } }],

      doors: {
        east: { locked: false, leadsTo: "central_hall" },
      },
    },

    // Room 5: Forbidden Section (requires 2 keys)
    forbidden_section: {
      id: "forbidden_section",
      name: "Forbidden Section",
      description:
        "Books bound in chains. Dark energy emanates from the far door.",
      width: 16,
      height: 11,

      layout: [
        "WWWWWWBWWWWWWWWW", // B = boss door
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "WWWWWWDWWWWWWWWW", // Door south
      ],

      startPosition: { x: 8, y: 9 },

      enemies: [
        { type: "darknut", position: { x: 4, y: 4 } },
        { type: "darknut", position: { x: 11, y: 4 } },
        { type: "bubble", position: { x: 8, y: 5 } },
      ],

      items: [
        { type: "boss_key", position: { x: 8, y: 7 } }, // Drops when enemies defeated
      ],

      doors: {
        south: { locked: false, leadsTo: "central_hall" },
        north: { locked: true, requiresBossKey: true, leadsTo: "boss_room" },
      },
    },

    // Room 6: Boss Room - The Librarian
    boss_room: {
      id: "boss_room",
      name: "The Librarian's Chamber",
      description:
        "A vast chamber filled with floating books. The Librarian awaits!",
      width: 16,
      height: 11,
      isBossRoom: true,

      layout: [
        "WWWWWWWWWWWWWWWW",
        "W..............W",
        "W..............W",
        "W..............W",
        "W.....B........W", // B = boss spawn
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "W..............W",
        "WWWWWWDWWWWWWWWW", // Door south
      ],

      startPosition: { x: 8, y: 9 },

      boss: {
        type: BOSSES.LIBRARIAN.type,
        position: { x: 8, y: 4 },
        ...BOSSES.LIBRARIAN,
      },

      items: [
        { type: "heart_container", position: { x: 8, y: 2 } }, // Appears after boss defeat
        { type: "white_sword", position: { x: 8, y: 5 } }, // Main reward
      ],

      doors: {
        south: { locked: false, leadsTo: "forbidden_section" },
      },
    },
  },

  // Dungeon completion tracking
  completion: {
    keysCollected: 0,
    bossDefeated: false,
    treasureObtained: false,
    roomsCleared: [],
  },
};

/**
 * Export all dungeons
 */
export const DUNGEONS = {
  LIBRARY_OF_ALEXANDRIA,
};

/**
 * Helper function to get tile type from character
 */
export const getTileFromChar = (char) => {
  const tileMap = {
    W: DUNGEON_TILES.WALL,
    ".": DUNGEON_TILES.FLOOR,
    D: DUNGEON_TILES.DOOR_NORTH, // Default, actual direction set by context
    L: DUNGEON_TILES.LOCKED_DOOR_NORTH,
    B: DUNGEON_TILES.BOSS_DOOR,
    C: DUNGEON_TILES.CHEST,
    K: DUNGEON_TILES.FLOOR, // Key is an item, not a tile
    X: DUNGEON_TILES.FLOOR, // Spawn point
    S: DUNGEON_TILES.SPIKE,
    "~": DUNGEON_TILES.WATER,
    "^": DUNGEON_TILES.STAIRS_UP,
    v: DUNGEON_TILES.STAIRS_DOWN,
  };

  return tileMap[char] || DUNGEON_TILES.FLOOR;
};

/**
 * Helper function to check if tile is walkable
 */
export const isWalkableTile = (tile) => {
  const walkable = [
    DUNGEON_TILES.FLOOR,
    DUNGEON_TILES.DOOR_NORTH,
    DUNGEON_TILES.DOOR_SOUTH,
    DUNGEON_TILES.DOOR_EAST,
    DUNGEON_TILES.DOOR_WEST,
    DUNGEON_TILES.STAIRS_UP,
    DUNGEON_TILES.STAIRS_DOWN,
  ];

  return walkable.includes(tile);
};

/**
 * Helper function to check if door is locked
 */
export const isLockedDoor = (tile) => {
  return [
    DUNGEON_TILES.LOCKED_DOOR_NORTH,
    DUNGEON_TILES.LOCKED_DOOR_SOUTH,
    DUNGEON_TILES.LOCKED_DOOR_EAST,
    DUNGEON_TILES.LOCKED_DOOR_WEST,
    DUNGEON_TILES.BOSS_DOOR,
  ].includes(tile);
};
