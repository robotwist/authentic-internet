import mongoose from "mongoose";

const defaultCreator = "65f2a3d1234567890abcdef1";
const now = new Date().toISOString();

const artifacts = [
  {
    id: "ancient-sword",
    name: "Ancient Sword",
    description: "A sword from ancient times",
    type: "WEAPON",
    content: "This ancient blade bears the marks of countless battles. Its steel has been tempered by time and its edge sharpened by history. The hilt is adorned with mysterious runes that seem to glow faintly in the presence of worthy warriors.",
    media: ["/assets/ancient_sword.png"],
    location: { x: 3, y: 2, mapName: "Overworld" },
    exp: 10,
    visible: true,
    area: "Overworld",
    interactions: [
      {
        type: "SOLVE",
        condition: "Answer the riddle correctly",
        revealedContent: "The runes on its hilt begin to glow, and a voice echoes in your mind: 'Only those who seek wisdom may wield this blade. Are you worthy?'",
        action: "Unlock Ancient Sword"
      }
    ],
    properties: {
      isExclusive: false
    },
    userModifiable: {
      description: true,
      content: true
    },
    createdBy: defaultCreator,
    createdAt: now,
    updatedAt: now,
    tags: ["ancient", "weapon", "riddle"],
    rating: 0,
    reviews: [],
    remixOf: null
  },
  {
    id: "mystic-orb",
    name: "Mystic Orb",
    description: "A mysterious orb",
    type: "MAGIC",
    content: "This is a mystic orb.",
    media: ["/assets/mystic_orb.png"],
    location: { x: 7, y: 5, mapName: "Overworld" },
    exp: 15,
    visible: true,
    area: "Overworld",
    interactions: [
      {
        type: "SOLVE",
        condition: "Answer the riddle correctly",
        revealedContent: "",
        action: "Unlock Mystic Orb"
      }
    ],
    properties: {
      isExclusive: false
    },
    userModifiable: {
      description: true,
      content: true
    },
    createdBy: defaultCreator,
    createdAt: now,
    updatedAt: now,
    tags: ["mystic", "orb", "riddle"],
    rating: 0,
    reviews: [],
    remixOf: null
  },
  {
    id: "golden-idol",
    name: "Golden Idol",
    description: "A golden idol",
    type: "TREASURE",
    content: "This is a golden idol.",
    media: ["/assets/golden_idol.png"],
    location: { x: 4, y: 6, mapName: "Desert" },
    exp: 20,
    visible: true,
    area: "Desert",
    interactions: [
      {
        type: "SOLVE",
        condition: "Answer the riddle correctly",
        revealedContent: "",
        action: "Unlock Golden Idol"
      }
    ],
    properties: {
      isExclusive: false
    },
    userModifiable: {
      description: true,
      content: true
    },
    createdBy: defaultCreator,
    createdAt: now,
    updatedAt: now,
    tags: ["golden", "idol", "riddle"],
    rating: 0,
    reviews: [],
    remixOf: null
  },
  {
    id: "dungeon-key",
    name: "Dungeon Key",
    description: "A key to the dungeon",
    type: "KEY",
    content: "This is a dungeon key.",
    media: ["/assets/dungeon_key.png"],
    location: { x: 5, y: 5, mapName: "Dungeon" },
    exp: 25,
    visible: true,
    area: "Dungeon",
    interactions: [
      {
        type: "SOLVE",
        condition: "Answer the riddle correctly",
        revealedContent: "",
        action: "Unlock Dungeon Key"
      }
    ],
    properties: {
      isExclusive: false
    },
    userModifiable: {
      description: true,
      content: true
    },
    createdBy: defaultCreator,
    createdAt: now,
    updatedAt: now,
    tags: ["dungeon", "key", "riddle"],
    rating: 0,
    reviews: [],
    remixOf: null
  },
  {
    id: "enchanted-mirror",
    name: "Enchanted Mirror",
    description: "A silver mirror that whispers secrets.",
    type: "ARTIFACT",
    content: "Gazing into the mirror reveals glimpses of forgotten memories.",
    media: ["/assets/enchanted_mirror.png"],
    location: { x: 8, y: 3, mapName: "Overworld" },
    exp: 30,
    visible: true,
    area: "Overworld",
    interactions: [
      {
        type: "SOLVE",
        condition: "Answer the riddle correctly",
        revealedContent: "The mirror speaks: 'Beware the shadows in the glade.'",
        action: "Unlock Enchanted Mirror"
      }
    ],
    properties: {
      isExclusive: true
    },
    userModifiable: {
      description: true,
      content: true
    },
    createdBy: defaultCreator,
    createdAt: now,
    updatedAt: now,
    tags: ["mirror", "enchanted", "riddle"],
    rating: 0,
    reviews: [],
    remixOf: null
  }
];

export default artifacts;