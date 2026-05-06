import { NPC_TYPES } from "../GameConstants";
import { doubleMapSize } from "./doubleMapSize.js";

export default {
  name: "Overworld",
  // Source rows/cols below are expanded by doubleMapSize() (each cell becomes 2×2 in-game). Edit numbers here, save, and the dev server should refresh the map.
  data: doubleMapSize([
    [0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 5, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 19, 2, 2, 2, 2, 2, 2, 2, 2, 2],
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
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]),
  npcs: [
    {
      id: "overworld_npc_world_guide",
      _id: "overworld_npc_world_guide",
      name: "World Guide",
      type: NPC_TYPES.GUIDE,
      area: "Overworld",
      position: { x: 384, y: 192 }, // Near spawn path for immediate onboarding
      sprite: "/assets/npcs/Socrates1Crop.png",
      patrolArea: {
        startX: 256,
        startY: 128,
        width: 256,
        height: 192,
      },
      dialogue: [
        "I am the humble world guide, unassuming, I know. Beautiful, of course.  All knowing, a decent cook by all accounts. I know all! I know all! Welcome, traveler. Press T near me anytime and I will guide you.",
        "You look like a smart kid but you also look a bit lost. By the way, where are your clothes? Anyway, this is actually all I know. They put me on sort of a loop so you'll have to excuse me if I repeat myself. Core controls: move with WASD or arrow keys, press T to talk, I opens Bag, C opens Field Notes, and M opens the map.",
        "Here's a tip if you get bored or lost or are dumber than you look. World route: Overworld -> Desert -> Dungeon -> Yosemite. Portals drive progression, and your blue-gold warp takes fast travel to Yosemite.",
        "If you haven't left on the adventure yet maybe you have gotten hit on the head too many times: reach John Muir in Yosemite and trigger level victory for your reward moment.",
        "Tip: Just keep goiong really fast and if anything gets in your way, turn. Charles DeMarr said that.",
      ],
    },
    {
      id: "overworld_npc_shakespeare",
      _id: "overworld_npc_shakespeare", // Add _id for NPCInteraction component compatibility
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
      id: "overworld_artifact_ancient_sword",
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
      id: "overworld_artifact_mystic_orb",
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
};
