import { v4 as uuidv4 } from "uuid";
import { NPC_TYPES } from "../../components/GameConstants";

// Dungeon and special area map data
export const DUNGEON_MAPS = [
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
        content:
          "The pages contain powerful descriptions of conflict and its impact on the human spirit.",
        location: { x: 4, y: 4 },
        exp: 40,
        visible: true,
        area: "Battleground",
        type: "SCROLL",
        interactions: [
          {
            type: "REVEAL",
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
        position: { x: 2, y: 2 },
        sprite: "/assets/npcs/hemingway.png",
        dialogue: [
          "Write hard and clear about what hurts.",
          "All you have to do is write one true sentence.",
          "The world breaks everyone, and afterward, some are strong at the broken places.",
          "We know what we are, but know not what we may be.",
        ],
      },
    ],
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
        description:
          "A mystical compass that points to narrative possibilities",
        content:
          "This compass seems to react to the strength of nearby stories.",
        location: { x: 4, y: 4 },
        exp: 30,
        visible: true,
        area: "TextAdventure",
        type: "KEY",
        interactions: [
          {
            type: "REVEAL",
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
        content:
          "The screen flickers with cryptic commands and mysterious data.",
        location: { x: 4, y: 4 },
        exp: 35,
        visible: true,
        area: "Terminal",
        type: "CONTAINER",
        interactions: [
          {
            type: "REVEAL",
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
        content:
          "This key seems to resonate with the deeper levels of the dungeon.",
        media: ["/assets/artifacts/dungeon_key.png"],
        location: { x: 4, y: 4, mapName: "Dungeon Level 1" },
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
        content:
          "The scroll tells of a powerful artifact hidden in the deepest level.",
        media: ["/assets/artifacts/ancient_scroll.png"],
        location: { x: 4, y: 4, mapName: "Dungeon Level 2" },
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