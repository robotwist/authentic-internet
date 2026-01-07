import { v4 as uuidv4 } from "uuid";
import { NPC_TYPES } from "../../components/GameConstants";

// Overworld map data
export const OVERWORLD_MAPS = [
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
      [0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    npcs: [
      {
        id: uuidv4(),
        _id: uuidv4(), // Add _id for NPCInteraction component compatibility
        name: "William Shakespeare",
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 256, y: 512 }, // Central area (pixel coordinates: 4 tiles x, 8 tiles y)
        sprite: "/assets/npcs/shakespeare.webp",
        patrolArea: {
          startX: 64, // 1 tile * 64px
          startY: 384, // 6 tiles * 64px
          width: 448, // 7 tiles * 64px
          height: 384, // 6 tiles * 64px
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
        position: { x: 384, y: 832 }, // Pixel coordinates (6 tiles x * 64px, 13 tiles y * 64px) - walkable grass tile
        sprite: "/assets/npcs/john_muir.webp",
        patrolArea: {
          startX: 192, // 3 tiles * 64px
          startY: 832, // 13 tiles * 64px
          width: 640, // 10 tiles * 64px
          height: 256, // 4 tiles * 64px
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
        position: { x: 8, y: 15 }, // Near Shakespeare in the southern area
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
        location: { x: 3, y: 2, mapName: "Overworld" },
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
        location: { x: 7, y: 13, mapName: "Overworld" },
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
        description:
          "A mysterious mirror that seems to reflect more than just light",
        type: "ARTIFACT",
        content:
          "Whispers of ancient wisdom echo from its surface, waiting to be discovered.",
        media: ["/assets/artifacts/enchanted_mirror.png"],
        location: { x: 3, y: 3, mapName: "Overworld 2" },
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
        position: { x: 3, y: 3 },
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
        content:
          "The pages contain knowledge of artifact creation and manipulation, with spaces for users to add their own discoveries.",
        media: ["/assets/artifacts/ancient_tome.png"],
        location: { x: 3, y: 7, mapName: "Overworld 3" },
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
        position: { x: 5, y: 7 },
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
        content:
          "This golden idol was worshipped by an ancient desert civilization.",
        media: ["/assets/artifacts/golden_idol.png"],
        location: { x: 4, y: 6, mapName: "Desert 1" },
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
        position: { x: 256, y: 192 }, // Central desert (4 tiles x, 3 tiles y)
        sprite: "/assets/npcs/alexander_pope.svg",
        patrolArea: {
          startX: 128, // 2 tiles * 64px
          startY: 128, // 2 tiles * 64px
          width: 256, // 4 tiles * 64px
          height: 256, // 4 tiles * 64px
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
        description:
          "An ancient navigation device that points to something other than north",
        type: "TOOL",
        content:
          "The needle spins wildly when near certain artifacts, perhaps it can help locate hidden treasures.",
        media: ["/assets/artifacts/desert_compass.png"],
        location: { x: 1, y: 7, mapName: "Desert 2" },
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
        position: { x: 320, y: 320 }, // Oasis area (5 tiles x, 5 tiles y)
        sprite: "/assets/npcs/oscar_wilde.svg",
        patrolArea: {
          startX: 192, // 3 tiles * 64px
          startY: 256, // 4 tiles * 64px
          width: 320, // 5 tiles * 64px
          height: 192, // 3 tiles * 64px
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
        content:
          "The inscriptions tell of a great civilization and their powerful artifacts, now scattered across the lands.",
        media: ["/assets/artifacts/sandstone_tablet.png"],
        location: { x: 2, y: 6, mapName: "Desert 3" },
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
        position: { x: 256, y: 256 }, // Center of desert (4 tiles x, 4 tiles y)
        sprite: "/assets/npcs/ada_lovelace.webp",
        patrolArea: {
          startX: 128, // 2 tiles * 64px
          startY: 192, // 3 tiles * 64px
          width: 384, // 6 tiles * 64px
          height: 256, // 4 tiles * 64px
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
    data: [
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
        2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1,
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
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
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
    ],
    specialPortals: [
      {
        position: { x: 9, y: 14 },
        type: "terminal",
        destination: "Terminal3",
        tileType: 6,
      },
      {
        position: { x: 28, y: 24 },
        type: "shooter",
        destination: "Level4Shooter",
        tileType: 7,
      },
      {
        position: { x: 11, y: 34 },
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
        position: { x: 320, y: 1344 }, // Center valley area for easy finding (pixel coordinates)
        sprite: "/assets/npcs/john_muir.png",
        patrolArea: {
          startX: 256, // 4 tiles * 64px
          startY: 1024, // 16 tiles * 64px
          width: 768, // 12 tiles * 64px - larger patrol area for bigger map
          height: 768, // 12 tiles * 64px
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
];