import { TILE_SIZE } from "../MapConstants";
import {
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
} from "../GameConstants";
import { doubleMapSize } from "./doubleMapSize.js";

export default [
  {
    name: "Overworld 2",
    data: doubleMapSize([
      [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 3, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    artifacts: [
      {
        id: "overworld2_artifact_enchanted_mirror",
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
        id: "overworld2_npc_zeus",
        _id: "overworld2_npc_zeus",
        name: "Zeus the Weatherman",
        type: NPC_TYPES.ZEUS,
        apiType: "zeus",
        sprite: "/assets/npcs/zeus.svg",
        position: { x: 6 * TILE_SIZE, y: 6 * TILE_SIZE }, // Doubled - converted to pixel coordinates (384, 384)
        dialogue: [
          "I am Zeus. You want power, mortal?",
          "Done — lightning and thunder are yours. Press L to cast when the storm is right.",
          "There's a challenge ahead. Combine what you learn with whatever tools you find.",
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
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    artifacts: [
      {
        id: "overworld3_artifact_ancient_tome",
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
        id: "overworld3_npc_shakespeare",
        _id: "overworld3_npc_shakespeare",
        name: "William Shakespeare",
        type: NPC_TYPES.SHAKESPEARE,
        sprite: "/assets/npcs/shakespeare.webp",
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
      [3, 3, 3, 3, 3, 1, 1, 1, 1, 1],
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
        id: "desert1_artifact_golden_idol",
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
        id: "desert1_npc_alexander_pope",
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
          id: "desert1_quest_poets_insight",
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
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
      [3, 3, 3, 1, 1, 1, 1, 1, 3, 1],
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
        id: "desert2_artifact_desert_compass",
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
        id: "desert2_npc_oscar_wilde",
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
          id: "desert2_quest_wit_of_the_desert",
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
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1],
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
        id: "desert3_artifact_sandstone_tablet",
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
        id: "desert3_npc_ada_lovelace",
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
          id: "desert3_quest_first_algorithm",
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
        0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        0, 0, 0, 0, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        0, 0, 0, 2, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
        2, 2, 2, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1,
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
        0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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
        1, 0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      // Row 20-29: Central valley, Shooter Portal Shrine (NE), and John Muir's area
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 2, 2, 2, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
        2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1,
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
        2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 2, 2, 2, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1,
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
        1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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
        1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
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
        id: "yosemite_npc_john_muir",
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
          id: "yosemite_quest_valleys_secrets",
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
        id: "hemingway_battleground_artifact_war_manuscript",
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
        _id: "hemingway1",
        type: NPC_TYPES.WRITER,
        name: "Ernest Hemingway",
        position: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }, // Doubled - converted to pixel coordinates (256, 256)
        sprite: "/assets/hemingway.png",
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
        id: "text_adventure_artifact_story_compass",
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
        id: "terminal3_artifact_digital_codex",
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
        id: "level4shooter_artifact_hemingway_typewriter",
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
      [0, 0, 4, 4, 4, 4, 4, 4, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
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
        id: "dungeon_level_1_artifact_dungeon_key",
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
      [0, 0, 4, 4, 4, 4, 4, 4, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
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
        id: "dungeon_level_2_artifact_ancient_scroll",
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
      [0, 0, 4, 4, 4, 4, 4, 4, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
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
        id: "dungeon_level_3_artifact_terminal_key",
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
  }
];
