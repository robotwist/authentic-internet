import mongoose from "mongoose";
import Artifact from "../models/Artifact.js";

const artifacts = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Ancient Sword",
    description: "A sword from ancient times",
    content: "This is an ancient sword.",
    riddle: "What is sharp and ancient?",
    unlockAnswer: "Ancient Sword",
    area: "Overworld",
    isExclusive: false,
    creator: new mongoose.Types.ObjectId(), // Replace with actual user ID
    location: { x: 3, y: 2 },
    type: "artifact",
    exp: 10,
    visible: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Mystic Orb",
    description: "A mysterious orb",
    content: "This is a mystic orb.",
    riddle: "What is round and mystic?",
    unlockAnswer: "Mystic Orb",
    area: "Overworld",
    isExclusive: false,
    creator: new mongoose.Types.ObjectId(), // Replace with actual user ID
    location: { x: 7, y: 5 },
    type: "artifact",
    exp: 15,
    visible: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Golden Idol",
    description: "A golden idol",
    content: "This is a golden idol.",
    riddle: "What is golden and worshipped?",
    unlockAnswer: "Golden Idol",
    area: "Desert",
    isExclusive: false,
    creator: new mongoose.Types.ObjectId(), // Replace with actual user ID
    location: { x: 4, y: 6 },
    type: "artifact",
    exp: 20,
    visible: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Dungeon Key",
    description: "A key to the dungeon",
    content: "This is a dungeon key.",
    riddle: "What unlocks the dungeon?",
    unlockAnswer: "Dungeon Key",
    area: "Dungeon",
    isExclusive: false,
    creator: new mongoose.Types.ObjectId(), // Replace with actual user ID
    location: { x: 5, y: 5 },
    type: "artifact",
    exp: 25,
    visible: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Mystic Orb",
    description: "A glowing orb filled with swirling energy.",
    content: "It hums with an ancient power.",
    riddle: "What has roots as nobody sees, is taller than trees?",
    unlockAnswer: "mountain",
    area: "Overworld",
    isExclusive: false,
    creator: new mongoose.Types.ObjectId("65f2a3d1234567890abcdef1"), 
    type: "artifact",
    messageText: "",
    sender: null,
    recipient: null,
    isRead: false,
    unlockCondition: "Solve the riddle.",
    location: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) } // ✅ Ensure location
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Enchanted Mirror",
    description: "A silver mirror that whispers secrets.",
    content: "Gazing into the mirror reveals glimpses of forgotten memories.",
    riddle: "I speak without a mouth and hear without ears. What am I?",
    unlockAnswer: "echo",
    area: "Overworld",
    isExclusive: true,
    creator: new mongoose.Types.ObjectId("65f2a3d1234567890abcdef2"),
    type: "artifact",
    messageText: "The mirror speaks: 'Beware the shadows in the glade.'",
    sender: null,
    recipient: null,
    isRead: false,
    unlockCondition: "Answer the riddle correctly.",
    location: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) } // ✅ Ensure location
  }
];

export default artifacts;