/**
 * Script to populate the database with NPCs from the MAPS data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import NPC model
import NPC from '../models/NPC.js';

// NPC data from MAPS
const NPC_DATA = [
  {
    name: 'John Muir',
    type: 'john_muir',
    position: { x: 5, y: 14 },
    area: 'Overworld',
    dialogue: [
      "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
      "In every walk with nature one receives far more than he seeks. (Unpublished journals, circa 1877)",
      "The clearest way into the Universe is through a forest wilderness. (John of the Mountains, 1938)",
      "When one tugs at a single thing in nature, he finds it attached to the rest of the world. (My First Summer in the Sierra, 1911)",
      "The world is big and I want to have a good look at it before it gets dark. (Letter to his sister, 1873)"
    ],
    personality: {
      traits: {
        wisdom: 90,
        passion: 95,
        advocacy: 100,
        adventure: 95,
        patience: 85,
        curiosity: 90
      },
      adaptiveDialogue: {
        greetings: [
          "Ah, a fellow wanderer! The wilderness welcomes you.",
          "Greetings, traveler. The mountains have much to teach us.",
          "Welcome to nature's cathedral. What brings you here today?"
        ],
        farewells: [
          "May your path lead you to new discoveries.",
          "Keep exploring, my friend. The wilderness awaits.",
          "Remember, in every walk with nature, one receives far more than he seeks."
        ],
        wisdom: [
          "The clearest way into the Universe is through a forest wilderness.",
          "When one tugs at a single thing in nature, he finds it attached to the rest of the world.",
          "In every walk with nature one receives far more than he seeks."
        ]
      }
    }
  },
  {
    name: "Zeus the Weatherman",
    type: "zeus",
    position: { x: 3, y: 3 },
    area: 'Overworld 2',
    dialogue: [
      "I control the skies and the storms that shape your world.",
      "The weather is not just science, it's divine intervention.",
      "Every cloud has a silver lining, and every storm has a purpose."
    ],
    personality: {
      traits: {
        wit: 80,
        wisdom: 85,
        enthusiasm: 90,
        humor: 75
      },
      adaptiveDialogue: {
        greetings: [
          "Greetings, mortal! How's the weather treating you?",
          "Ah, a visitor! Let me check the forecast for you.",
          "Welcome! The skies are clear today, thanks to me."
        ],
        farewells: [
          "May the weather be ever in your favor!",
          "Stay dry, my friend! Unless you want to get wet.",
          "The forecast looks bright for your journey ahead."
        ]
      }
    }
  }
];

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentic-internet';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const populateNPCs = async () => {
  try {
    console.log('🧪 Starting NPC population...');
    
    // Clear existing NPCs
    await NPC.deleteMany({});
    console.log('🗑️ Cleared existing NPCs');
    
    // Create new NPCs
    const createdNPCs = [];
    for (const npcData of NPC_DATA) {
      const npc = new NPC(npcData);
      await npc.save();
      createdNPCs.push(npc);
      console.log(`✅ Created NPC: ${npc.name} (${npc._id})`);
    }
    
    console.log(`\n🎉 Successfully populated ${createdNPCs.length} NPCs`);
    console.log('\n📋 Created NPCs:');
    createdNPCs.forEach(npc => {
      console.log(`  - ${npc.name} (ID: ${npc._id}) in ${npc.area}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating NPCs:', error);
  }
};

const main = async () => {
  await connectDB();
  await populateNPCs();
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
};

main(); 