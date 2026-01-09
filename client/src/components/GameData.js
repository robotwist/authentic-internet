import { v4 as uuidv4 } from "uuid";
import { TILE_SIZE } from "./MapConstants";
import {
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
} from "./GameConstants";
import { isValidMapSize } from "./MapConstants";

/**
 * COORDINATE SYSTEM DOCUMENTATION:
 * - NPC positions: PIXEL coordinates (multiply tile coordinates by TILE_SIZE = 64)
 * - Artifact locations: TILE coordinates (x, y represent tile indices)
 * - Special portal positions: TILE coordinates (x, y represent tile indices)
 * - Patrol areas: PIXEL coordinates (startX, startY, width, height in pixels)
 */

// Helper function to double map size (2x width and 2x height)
const doubleMapSize = (mapData) => {
  const doubled = [];
  for (let row of mapData) {
    // Double each row horizontally
    const doubledRow = [];
    for (let cell of row) {
      doubledRow.push(cell, cell); // Duplicate each cell
    }
    // Add the doubled row twice
    doubled.push(doubledRow, [...doubledRow]);
  }
  return doubled;
};

// Maps array
export const MAPS = [
  {
    name: "Overworld",
    data: doubleMapSize([
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
      [0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    npcs: [
      {
        id: uuidv4(),
        _id: uuidv4(), // Add _id for NPCInteraction component compatibility
        name: "William Shakespeare",
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 512, y: 1024 }, // Central area (pixel coordinates: 8 tiles x, 16 tiles y) - doubled
        sprite: "/assets/npcs/shakespeare.webp",
        patrolArea: {
          startX: 128, // 2 tiles * 64px - doubled
          startY: 768, // 12 tiles * 64px - doubled
          width: 896, // 14 tiles * 64px - doubled
          height: 768, // 12 tiles * 64px - doubled
        },
        dialogue: [
          "All the world's a stage, and all the men and women merely players. (As You Like It, Act II, Scene VII)",
          "To be, or not to be: that is the question. (Hamlet, Act III, Scene I)",
          "The course of true love never did run smooth. (A Midsummer Night's Dream, Act I, Scene I)",
          "We know what we are, but know not what we may be. (Hamlet, Act IV, Scene V)",
          "Though this be madness, yet there is method in't. (Hamlet, Act II, Scene II)",
        ],
        quest: {
          id: "shakespeare_overworld_quest",
          title: "The Tempest's Trial",
          description:
            "Clear the Overworld of all threats to prove your valor, then witness the tragic finale of Hamlet",
          objectives: [
            "Defeat all enemies in the Overworld",
            "Return to Shakespeare",
            "Complete the Hamlet Finale challenge",
          ],
          requirement: {
            type: "defeat_all_enemies",
            map: "Overworld",
            count: 0, // Will be tracked dynamically
            completed: false,
          },
          reward: {
            exp: 100,
            item: "Wand of Prospero",
            itemData: {
              name: "Wand of Prospero",
              description:
                "A mystical staff from The Tempest, capable of conjuring storms and bending reality itself",
              type: "MAGIC_WEAPON",
              power: 50,
              special: "conjure_storm",
              sprite: "/assets/items/wand_prospero.png",
            },
          },
          stages: [
            "not_started",
            "enemies_defeated",
            "hamlet_complete",
            "complete",
          ],
        },
      },
      {
        id: "john_muir1",
        _id: "john_muir1", // Add _id for NPCInteraction component compatibility
        type: NPC_TYPES.JOHN_MUIR,
        name: "John Muir",
        area: "Overworld",
        position: { x: 768, y: 1664 }, // Pixel coordinates (12 tiles x * 64px, 26 tiles y * 64px) - doubled
        sprite: "/assets/npcs/john_muir.webp",
        patrolArea: {
          startX: 384, // 6 tiles * 64px - doubled
          startY: 1664, // 26 tiles * 64px - doubled
          width: 1280, // 20 tiles * 64px - doubled
          height: 512, // 8 tiles * 64px - doubled
        },
        dialogue: [
          "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
          "In every walk with nature one receives far more than he seeks. (Unpublished journals, circa 1877)",
          "The clearest way into the Universe is through a forest wilderness. (John of the Mountains, 1938)",
          "When one tugs at a single thing in nature, he finds it attached to the rest of the world. (My First Summer in the Sierra, 1911)",
          "The world is big and I want to have a good look at it before it gets dark. (Letter to his sister, 1873)",
        ],
      },
    ],
    specialPortals: [
      {
        position: { x: 16, y: 30 }, // Near Shakespeare in the southern area - doubled
        type: "dungeon",
        destination: "Library of Alexandria",
        tileType: 9, // New tile type for dungeon entrance
        name: "The Library of Alexandria",
      },
    ],
    artifacts: [
      {
        id: uuidv4(),
        name: "Ancient Sword",
        description: "A legendary blade that once belonged to a great warrior",
        type: "WEAPON",
        content: "The sword pulses with ancient power, its edge never dulling.",
        media: ["/assets/artifacts/ancient_sword.png"],
        location: { x: 6, y: 4, mapName: "Overworld" }, // Doubled
        exp: 15,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "COMBINE",
            targetArtifact: "Crystal Shard",
            result: "Crystal Sword",
            revealedContent: "The sword resonates with the crystal's energy...",
          },
        ],
        properties: {
          damage: 10,
          durability: 100,
          element: "physical",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["damage", "element"],
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
            createdAt: "2024-06-02T10:00:00Z",
          },
        ],
        remixOf: null,
      },
      {
        id: uuidv4(),
        name: "Mystic Orb",
        description: "A glowing orb filled with swirling energy.",
        type: "MAGIC",
        content:
          "It hums with an ancient power, revealing secrets to those who are worthy.",
        media: ["/assets/artifacts/mystic_orb.png"],
        location: { x: 14, y: 26, mapName: "Overworld" }, // Doubled
        exp: 20,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The orb shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 15,
          visionRange: 3,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["mystic", "orb", "magic"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
  },
  {
    name: "Overworld 2",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Enchanted Mirror",
        description:
          "A mysterious mirror that seems to reflect more than just light",
        type: "ARTIFACT",
        content:
          "Whispers of ancient wisdom echo from its surface, waiting to be discovered.",
        media: ["/assets/artifacts/enchanted_mirror.png"],
        location: { x: 6, y: 6, mapName: "Overworld 2" }, // Doubled
        exp: 18,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The mirror shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["mirror", "enchanted", "arcane"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Zeus the Weatherman",
        type: NPC_TYPES.ZEUS,
        apiType: "zeus",
        position: { x: 6 * TILE_SIZE, y: 6 * TILE_SIZE }, // Doubled - converted to pixel coordinates (384, 384)
        dialogue: [
          "By my thunderbolts! Today's forecast calls for partly cloudy with a chance of divine intervention!",
          "Expect high-pressure systems over Mount Olympus, with occasional lightning strikes... those are mine, by the way.",
          "Warning: Areas of dense fog in the Underworld region. Cerberus visibility down to three heads.",
          "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus?",
          "Even the gods cannot alter the past, but the future is yet in my power.",
        ],
      },
    ],
  },
  {
    name: "Overworld 3",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Ancient Tome",
        description: "A weathered book bound in mysterious materials",
        type: "SCROLL",
        content:
          "The pages contain knowledge of artifact creation and manipulation, with spaces for users to add their own discoveries.",
        media: ["/assets/artifacts/ancient_tome.png"],
        location: { x: 6, y: 14, mapName: "Overworld 3" }, // Doubled
        exp: 30,
        visible: true,
        area: "Overworld",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The tome shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["tome", "ancient", "knowledge"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "William Shakespeare",
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 10 * TILE_SIZE, y: 14 * TILE_SIZE }, // Doubled - converted to pixel coordinates (640, 896)
        dialogue: [
          "All the world's a stage, and all the men and women merely players.",
          "To be, or not to be, that is the question.",
          "Cowards die many times before their deaths; the valiant never taste of death but once.",
          "We know what we are, but know not what we may be.",
          "Better three hours too soon than a minute too late.",
        ],
      },
    ],
  },
  {
    name: "Desert 1",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Golden Idol",
        description: "An ancient idol that seems to radiate power",
        type: "TREASURE",
        content:
          "This golden idol was worshipped by an ancient desert civilization.",
        media: ["/assets/artifacts/golden_idol.png"],
        location: { x: 8, y: 12, mapName: "Desert 1" }, // Doubled
        exp: 20,
        visible: true,
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The idol shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["golden", "idol", "desert"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Alexander Pope",
        type: NPC_TYPES.ALEXANDER_POPE,
        position: { x: 512, y: 384 }, // Central desert (8 tiles x, 6 tiles y) - doubled
        sprite: "/assets/npcs/alexander_pope.svg",
        patrolArea: {
          startX: 256, // 4 tiles * 64px - doubled
          startY: 256, // 4 tiles * 64px - doubled
          width: 512, // 8 tiles * 64px - doubled
          height: 512, // 8 tiles * 64px - doubled
        },
        dialogue: [
          "To err is human, to forgive divine. (An Essay on Criticism, 1711)",
          "Know then thyself, presume not God to scan; The proper study of mankind is man. (An Essay on Man, 1733)",
          "Hope springs eternal in the human breast; Man never is, but always to be blessed. (An Essay on Man, 1734)",
          "A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring. (An Essay on Criticism, 1711)",
          "Fools rush in where angels fear to tread. (An Essay on Criticism, 1711)",
        ],
        quest: {
          id: uuidv4(),
          title: "Desert Poet's Insight",
          description: "Alexander Pope seeks wisdom in the desert sands",
          objectives: [
            "Find the Golden Idol",
            "Share your interpretation",
            "Return to Pope",
          ],
          reward: {
            exp: 35,
            item: "Poetic License",
          },
        },
      },
    ],
  },
  {
    name: "Desert 2",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Desert Compass",
        description:
          "An ancient navigation device that points to something other than north",
        type: "TOOL",
        content:
          "The needle spins wildly when near certain artifacts, perhaps it can help locate hidden treasures.",
        media: ["/assets/artifacts/desert_compass.png"],
        location: { x: 2, y: 14, mapName: "Desert 2" }, // Doubled
        exp: 20,
        visible: true,
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The compass shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["compass", "desert", "navigation"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Oscar Wilde",
        type: NPC_TYPES.OSCAR_WILDE,
        position: { x: 640, y: 640 }, // Oasis area (10 tiles x, 10 tiles y) - doubled
        sprite: "/assets/npcs/oscar_wilde.svg",
        patrolArea: {
          startX: 384, // 6 tiles * 64px - doubled
          startY: 512, // 8 tiles * 64px - doubled
          width: 640, // 10 tiles * 64px - doubled
          height: 384, // 6 tiles * 64px - doubled
        },
        dialogue: [
          "I can resist everything except temptation. (Lady Windermere's Fan, 1892)",
          "We are all in the gutter, but some of us are looking at the stars. (Lady Windermere's Fan, 1892)",
          "The truth is rarely pure and never simple. (The Importance of Being Earnest, 1895)",
          "To love oneself is the beginning of a lifelong romance. (An Ideal Husband, 1895)",
          "Experience is simply the name we give our mistakes. (Lady Windermere's Fan, 1892)",
        ],
        quest: {
          id: uuidv4(),
          title: "The Wit of the Desert",
          description: "Oscar Wilde seeks beauty in the harshest landscape",
          objectives: [
            "Find the Desert Compass",
            "Share a witty observation",
            "Return to Wilde",
          ],
          reward: {
            exp: 40,
            item: "Wit's Compass",
          },
        },
      },
    ],
  },
  {
    name: "Desert 3",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Sandstone Tablet",
        description: "A tablet covered in mysterious hieroglyphs",
        type: "SCROLL",
        content:
          "The inscriptions tell of a great civilization and their powerful artifacts, now scattered across the lands.",
        media: ["/assets/artifacts/sandstone_tablet.png"],
        location: { x: 4, y: 12, mapName: "Desert 3" }, // Doubled
        exp: 25,
        visible: true,
        area: "Desert",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearWater",
            revealedContent:
              "The tablet shows visions of an ancient underwater city...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "arcane",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["tablet", "sandstone", "desert"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "Ada Lovelace",
        type: NPC_TYPES.ADA_LOVELACE,
        position: { x: 512, y: 512 }, // Center of desert (8 tiles x, 8 tiles y) - doubled
        sprite: "/assets/npcs/ada_lovelace.webp",
        patrolArea: {
          startX: 256, // 4 tiles * 64px - doubled
          startY: 384, // 6 tiles * 64px - doubled
          width: 768, // 12 tiles * 64px - doubled
          height: 512, // 8 tiles * 64px - doubled
        },
        dialogue: [
          "That brain of mine is something more than merely mortal; as time will show. (Letter to her mother, 1843)",
          "The Analytical Engine weaves algebraic patterns, just as the Jacquard loom weaves flowers and leaves. (Notes on the Analytical Engine, 1843)",
          "We may say most aptly, that the Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves. (Notes, 1843)",
          "I do not believe that my father was such a poet as I shall be an Analyst. (Letter, 1844)",
          "Mathematical science shows what is. It is the language of unseen relations between things. (Letter, 1844)",
        ],
        quest: {
          id: uuidv4(),
          title: "The First Algorithm",
          description: "Ada Lovelace seeks patterns in the ancient hieroglyphs",
          objectives: [
            "Find the Sandstone Tablet",
            "Decode its patterns",
            "Return to Ada",
          ],
          reward: {
            exp: 50,
            item: "Algorithm Codex",
          },
        },
      },
    ],
  },
  {
    name: "Yosemite",
    data: doubleMapSize([
      // Row 0-9: Northern forest and mountains
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
        2, 2, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      // Row 10-19: Terminal Portal Shrine (NW) and open meadows
      [
        1, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 0, 0, 0, 0, 6, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      // Row 20-29: Central valley, Shooter Portal Shrine (NE), and John Muir's area
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        0, 0, 0, 0, 7, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      // Row 30-39: Text Adventure Portal Shrine (Center-South) and exit portal
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 8, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
    ]),
    specialPortals: [
      {
        position: { x: 18, y: 28 }, // Doubled
        type: "terminal",
        destination: "Terminal3",
        tileType: 6,
      },
      {
        position: { x: 56, y: 48 }, // Doubled
        type: "shooter",
        destination: "Level4Shooter",
        tileType: 7,
      },
      {
        position: { x: 22, y: 68 }, // Doubled
        type: "text",
        destination: "Text Adventure",
        tileType: 8,
      },
    ],
    npcs: [
      {
        id: uuidv4(),
        name: "John Muir",
        type: NPC_TYPES.JOHN_MUIR,
        position: { x: 640, y: 2688 }, // Center valley area for easy finding (pixel coordinates) - doubled
        sprite: "/assets/npcs/john_muir.png",
        patrolArea: {
          startX: 512, // 8 tiles * 64px - doubled
          startY: 2048, // 32 tiles * 64px - doubled
          width: 1536, // 24 tiles * 64px - doubled
          height: 1536, // 24 tiles * 64px - doubled
        },
        dialogue: [
          "Welcome to Yosemite Valley! The grandeur of these peaks never ceases to amaze me.",
          "Have you noticed how the valley seems to tell its own story through its formations?",
          "Every rock, every waterfall has a tale to share with those who listen carefully.",
          "I've discovered three mystical portals in this valley - one leads to a digital realm, another to Hemingway's battleground, and the third to a world of pure narrative.",
          "Each portal offers a unique challenge and wisdom to those who dare to enter.",
        ],
        quest: {
          id: uuidv4(),
          title: "Valley's Secrets",
          description:
            "Help John Muir document the unique features of Yosemite Valley",
          objectives: [
            "Find Nature's Journal",
            "Document three unique valley features",
            "Return to John Muir",
          ],
          reward: {
            exp: 50,
            item: "Conservationist's Badge",
          },
        },
      },
    ],
  },
  {
    name: "Hemingway's Battleground",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "War Manuscript",
        description: "A manuscript detailing the experiences of war",
        content:
          "The pages contain powerful descriptions of conflict and its impact on the human spirit.",
        location: { x: 8, y: 8 }, // Doubled
        exp: 40,
        visible: true,
        area: "Battleground",
        type: ARTIFACT_TYPES.SCROLL,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearWater",
            revealedContent:
              "The manuscript reveals deeper truths about the nature of conflict...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "wisdom",
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"],
        },
      },
    ],
    npcs: [
      {
        id: "hemingway1",
        type: NPC_TYPES.WRITER,
        name: "Ernest Hemingway",
        position: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }, // Doubled - converted to pixel coordinates (256, 256)
        sprite: "/assets/npcs/hemingway.png",
        dialogue: [
          "Write hard and clear about what hurts.",
          "All you have to do is write one true sentence.",
          "The world breaks everyone, and afterward, some are strong at the broken places.",
        ],
      },
    ],
  },
  {
    name: "Text Adventure",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Story Compass",
        description:
          "A mystical compass that points to narrative possibilities",
        content:
          "This compass seems to react to the strength of nearby stories.",
        location: { x: 8, y: 8 }, // Doubled
        exp: 30,
        visible: true,
        area: "TextAdventure",
        type: ARTIFACT_TYPES.KEY,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearBook",
            revealedContent:
              "The compass needle spins wildly, pointing to untold stories...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "narrative",
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"],
        },
      },
    ],
  },
  {
    name: "Terminal3",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Digital Codex",
        description: "An ancient terminal that holds forgotten digital wisdom",
        content:
          "The screen flickers with cryptic commands and mysterious data.",
        location: { x: 8, y: 8 }, // Doubled
        exp: 35,
        visible: true,
        area: "Terminal",
        type: ARTIFACT_TYPES.CONTAINER,
        interactions: [
          {
            type: ARTIFACT_INTERACTIONS.REVEAL,
            condition: "nearTerminal",
            revealedContent:
              "The terminal springs to life, revealing hidden programs...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "digital",
        },
        userModifiable: {
          riddle: true,
          properties: ["magic", "visionRange"],
        },
      },
    ],
  },
  {
    name: "Level4Shooter",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Hemingway's Typewriter",
        description: "A battle-worn typewriter that has seen many stories",
        type: "WEAPON",
        content: "The keys still hold the echoes of countless adventures.",
        media: ["/assets/artifacts/hemingway_typewriter.png"],
        location: { x: 8, y: 8, mapName: "Level4Shooter" }, // Doubled
        exp: 40,
        visible: true,
        area: "Shooter",
        interactions: [
          {
            type: "REVEAL",
            condition: "nearBattle",
            revealedContent:
              "The typewriter resonates with the spirit of adventure...",
          },
        ],
        properties: {
          magic: 10,
          visionRange: 2,
          element: "combat",
        },
        userModifiable: {
          description: true,
          content: true,
          properties: ["magic", "visionRange"],
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["hemingway", "typewriter", "shooter"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
  },
  {
    name: "Dungeon Level 1",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Dungeon Key",
        description: "A key that unlocks deeper dungeon levels",
        type: "KEY",
        content:
          "This key seems to resonate with the deeper levels of the dungeon.",
        media: ["/assets/artifacts/dungeon_key.png"],
        location: { x: 8, y: 8, mapName: "Dungeon Level 1" }, // Doubled
        exp: 20,
        visible: true,
        area: "Dungeon",
        interactions: [
          {
            type: "UNLOCK",
            targetArtifact: "Dungeon Door",
            result: "Access to Dungeon Level 2",
          },
        ],
        properties: {},
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["dungeon", "key"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
  },
  {
    name: "Dungeon Level 2",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Ancient Scroll",
        description: "A scroll containing knowledge of the dungeon's history",
        type: "SCROLL",
        content:
          "The scroll tells of a powerful artifact hidden in the deepest level.",
        media: ["/assets/artifacts/ancient_scroll.png"],
        location: { x: 8, y: 8, mapName: "Dungeon Level 2" }, // Doubled
        exp: 25,
        visible: true,
        area: "Dungeon",
        interactions: [],
        properties: {},
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["scroll", "ancient", "dungeon"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
  },
  {
    name: "Dungeon Level 3",
    data: doubleMapSize([
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
    ]),
    artifacts: [
      {
        id: uuidv4(),
        name: "Terminal Key",
        description: "A key that unlocks access to the terminal realm",
        type: "KEY",
        content: "This key seems to resonate with digital energy.",
        media: ["/assets/artifacts/terminal_key.png"],
        location: { x: 8, y: 8, mapName: "Dungeon Level 3" }, // Doubled
        exp: 30,
        visible: true,
        area: "Dungeon",
        interactions: [
          {
            type: "UNLOCK",
            targetArtifact: "Terminal Portal",
            result: "Access to Terminal3",
          },
        ],
        properties: {},
        userModifiable: {
          description: true,
          content: true,
        },
        createdBy: "system",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        tags: ["terminal", "key", "dungeon"],
        rating: 0,
        reviews: [],
        remixOf: null,
      },
    ],
  },
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
    themes: ["writing", "courage", "life"],
  },
  // ... rest of NPCs ...
};

export const WORLD_MAP = {
  structure: [
    {
      id: "overworld",
      name: "Overworld",
      x: 200,
      y: 100,
      connections: ["overworld2", "dungeon1"],
    },
    {
      id: "overworld2",
      name: "Overworld 2",
      x: 350,
      y: 200,
      connections: ["overworld", "overworld3"],
    },
    {
      id: "overworld3",
      name: "Overworld 3",
      x: 500,
      y: 100,
      connections: ["overworld2", "desert1"],
    },
    {
      id: "desert1",
      name: "Desert 1",
      x: 650,
      y: 200,
      connections: ["overworld3", "desert2", "yosemite", "hemingway"],
    },
    {
      id: "desert2",
      name: "Desert 2",
      x: 800,
      y: 100,
      connections: ["desert1", "desert3"],
    },
    {
      id: "desert3",
      name: "Desert 3",
      x: 950,
      y: 200,
      connections: ["desert2"],
    },
    {
      id: "yosemite",
      name: "Yosemite",
      x: 650,
      y: 350,
      connections: ["desert1"],
    },

    // New dungeon levels
    {
      id: "dungeon1",
      name: "Dungeon Level 1",
      x: 200,
      y: 250,
      connections: ["overworld", "dungeon2"],
      type: "dungeon",
    },
    {
      id: "dungeon2",
      name: "Dungeon Level 2",
      x: 150,
      y: 350,
      connections: ["dungeon1", "dungeon3"],
      type: "dungeon",
    },
    {
      id: "dungeon3",
      name: "Dungeon Level 3",
      x: 250,
      y: 450,
      connections: ["dungeon2", "yosemite"],
      type: "dungeon",
    },

    // Hemingway's adventure
    {
      id: "hemingway",
      name: "Hemingway's Adventure",
      x: 800,
      y: 300,
      connections: ["desert1"],
      type: "special",
    },

    // Text-based adventure
    {
      id: "text_adventure",
      name: "Text Adventure",
      x: 400,
      y: 450,
      connections: ["yosemite"],
      type: "text",
    },
  ],
  mapToId: {
    Overworld: "overworld",
    "Overworld 2": "overworld2",
    "Overworld 3": "overworld3",
    "Desert 1": "desert1",
    "Desert 2": "desert2",
    "Desert 3": "desert3",
    Yosemite: "yosemite",
    "Dungeon Level 1": "dungeon1",
    "Dungeon Level 2": "dungeon2",
    "Dungeon Level 3": "dungeon3",
    "Hemingway's Adventure": "hemingway",
    "Text Adventure": "text_adventure",
  },
};
