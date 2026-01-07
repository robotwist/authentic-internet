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

// Complete NPC data from MAPS
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
      "By my thunderbolts! Today's forecast calls for partly cloudy with a chance of divine intervention!",
      "Expect high-pressure systems over Mount Olympus, with occasional lightning strikes... those are mine, by the way.",
      "Warning: Areas of dense fog in the Underworld region. Cerberus visibility down to three heads.",
      "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus?",
      "Even the gods cannot alter the past, but the future is yet in my power."
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
  },
  {
    name: "William Shakespeare",
    type: "shakespeare",
    position: { x: 5, y: 7 },
    area: 'Overworld 3',
    dialogue: [
      "All the world's a stage, and all the men and women merely players.",
      "To be, or not to be, that is the question.",
      "Cowards die many times before their deaths; the valiant never taste of death but once.",
      "We know what we are, but know not what we may be.",
      "Better three hours too soon than a minute too late."
    ],
    personality: {
      traits: {
        wit: 95,
        wisdom: 90,
        creativity: 100,
        passion: 85,
        melancholy: 70
      },
      adaptiveDialogue: {
        greetings: [
          "Hark! A new player enters our stage of life.",
          "Welcome, fair traveler! What part dost thou play in this grand drama?",
          "Greetings! The world's thy oyster, and I am here to guide thee through its pearls."
        ],
        farewells: [
          "Parting is such sweet sorrow, that I shall say good night till it be morrow.",
          "Go forth and make thy mark upon the world's stage!",
          "Remember: all's well that ends well."
        ],
        wisdom: [
          "The course of true love never did run smooth.",
          "What's in a name? That which we call a rose by any other name would smell as sweet.",
          "The fault, dear Brutus, is not in our stars, but in ourselves."
        ]
      }
    }
  },
  {
    name: "John Muir (Yosemite Guide)",
    type: "GUIDE",
    position: { x: 3, y: 3 },
    area: 'Yosemite',
    dialogue: [
      "Welcome to Yosemite Valley! The grandeur of these peaks never ceases to amaze me.",
      "Have you noticed how the valley seems to tell its own story through its formations?",
      "Every rock, every waterfall has a tale to share with those who listen carefully.",
      "I've discovered three mystical portals in this valley - one leads to a digital realm, another to Hemingway's battleground, and the third to a world of pure narrative.",
      "Each portal offers a unique challenge and wisdom to those who dare to enter."
    ],
    personality: {
      traits: {
        wisdom: 95,
        passion: 100,
        advocacy: 100,
        adventure: 90,
        patience: 90,
        curiosity: 95
      },
      adaptiveDialogue: {
        greetings: [
          "Welcome to Yosemite Valley, traveler! The mountains are calling.",
          "Ah, a fellow explorer! The valley has much to share with you.",
          "Greetings! The grandeur of these peaks never ceases to amaze."
        ],
        farewells: [
          "May the valley's wisdom guide your journey.",
          "Keep exploring, my friend. The wilderness awaits your discoveries.",
          "Remember: in every walk with nature, one receives far more than he seeks."
        ],
        wisdom: [
          "The clearest way into the Universe is through a forest wilderness.",
          "When one tugs at a single thing in nature, he finds it attached to the rest of the world.",
          "The mountains are calling and I must go."
        ]
      }
    },
    quests: [{
      id: "valley-secrets",
      title: "Valley's Secrets",
      description: "Help John Muir document the unique features of Yosemite Valley",
      stages: [
        {
          task: "Find Nature's Journal",
          dialogue: "I've lost my journal somewhere in the valley. Can you help me find it?",
          completed: false,
          reward: { exp: 20, item: "Nature's Journal" }
        },
        {
          task: "Document three unique valley features",
          dialogue: "Now document the unique features you discover in the valley.",
          completed: false,
          reward: { exp: 20, item: "Valley Documentation" }
        },
        {
          task: "Return to John Muir",
          dialogue: "Excellent work! You've captured the essence of Yosemite Valley.",
          completed: false,
          reward: { exp: 10, item: "Conservationist's Badge" }
        }
      ],
      isActive: true,
      completedBy: []
    }]
  },
  {
    name: "Ernest Hemingway",
    type: "WRITER",
    position: { x: 2, y: 2 },
    area: 'Hemingway\'s Battleground',
    dialogue: [
      "Write hard and clear about what hurts.",
      "All you have to do is write one true sentence.",
      "The world breaks everyone, and afterward, some are strong at the broken places.",
      "Courage is grace under pressure.",
      "The first draft of anything is shit."
    ],
    personality: {
      traits: {
        wit: 85,
        wisdom: 90,
        passion: 95,
        courage: 100,
        melancholy: 80,
        honesty: 95
      },
      adaptiveDialogue: {
        greetings: [
          "Hello, comrade. What brings you to this battleground?",
          "Welcome to the arena of words and courage.",
          "Greetings, fellow warrior of the pen."
        ],
        farewells: [
          "Keep writing the truth, no matter how it hurts.",
          "Remember: courage is grace under pressure.",
          "Go forth and write your own story."
        ],
        wisdom: [
          "Write hard and clear about what hurts.",
          "All you have to do is write one true sentence.",
          "The world breaks everyone, and afterward, some are strong at the broken places."
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
      console.log(`✅ Created NPC: ${npc.name} (${npc._id}) in ${npc.area}`);
    }
    
    console.log(`\n🎉 Successfully populated ${createdNPCs.length} NPCs`);
    console.log('\n📋 Created NPCs:');
    createdNPCs.forEach(npc => {
      console.log(`  - ${npc.name} (ID: ${npc._id}) in ${npc.area}`);
    });
    
    console.log('\n🌍 NPC Distribution by Area:');
    const areaCounts = {};
    createdNPCs.forEach(npc => {
      areaCounts[npc.area] = (areaCounts[npc.area] || 0) + 1;
    });
    Object.entries(areaCounts).forEach(([area, count]) => {
      console.log(`  - ${area}: ${count} NPC(s)`);
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