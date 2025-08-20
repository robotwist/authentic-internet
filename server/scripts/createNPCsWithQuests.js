import mongoose from 'mongoose';
import NPC from '../models/NPC.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentic-internet';

// Comprehensive NPC data with quests for each portal level
const npcData = [
  // Overworld 3 - Portal to Yosemite
  {
    name: "William Shakespeare",
    type: "shakespeare",
    position: { x: 400, y: 300 },
    area: "Overworld 3",
    dialogue: [
      "Good morrow, traveler! I am William Shakespeare, weaver of words and teller of tales.",
      "What brings you to this realm of endless possibility?",
      "Perhaps you seek wisdom, or mayhap you desire a tale of love and loss?",
      "All the world's a stage, and all the men and women merely players...",
      "I sense a portal nearby that leads to a place of great natural beauty. But first, let me share a story with you."
    ],
    quests: [
      {
        id: "shakespeare_story_quest",
        title: "The Bard's Tale",
        description: "Help Shakespeare create a new story by collecting words and phrases from the world around you.",
        stages: [
          {
            task: "Find 3 words that inspire you in the Overworld",
            dialogue: "Every word has power, young storyteller. Find three that speak to your soul.",
            completed: false,
            reward: { exp: 50, item: "Quill of Inspiration", ability: null }
          },
          {
            task: "Create a short poem using those words",
            dialogue: "Now weave those words into something beautiful. Poetry is the language of the heart.",
            completed: false,
            reward: { exp: 75, item: "Poet's Scroll", ability: null }
          },
          {
            task: "Share your poem with another traveler",
            dialogue: "Stories are meant to be shared. Find someone to hear your creation.",
            completed: false,
            reward: { exp: 100, item: "Bard's Crown", ability: "Storytelling Mastery" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wit: 95,
        wisdom: 88,
        curiosity: 85,
        passion: 92,
        melancholy: 70,
        enthusiasm: 80,
        advocacy: 60,
        adventure: 75,
        humor: 90,
        patience: 85
      }
    }
  },

  // Yosemite - Multiple portals
  {
    name: "John Muir",
    type: "john_muir",
    position: { x: 300, y: 200 },
    area: "Yosemite",
    dialogue: [
      "Welcome to Yosemite Valley! The grandeur of these peaks never ceases to amaze me.",
      "Have you noticed how the valley seems to tell its own story through its formations?",
      "Every rock, every waterfall has a tale to share with those who listen carefully.",
      "I've discovered three mystical portals in this valley - each offers unique challenges and wisdom.",
      "The mountains are calling and I must go. But first, let me share the valley's secrets with you."
    ],
    quests: [
      {
        id: "muir_conservation_quest",
        title: "The Naturalist's Survey",
        description: "Help John Muir document endangered species and locations that need protection.",
        stages: [
          {
            task: "Observe and record 5 different plant species in Yosemite",
            dialogue: "The flora here tells stories of adaptation and survival. Will you help me document their wisdom?",
            completed: false,
            reward: { exp: 80, item: "Botanical Journal", ability: null }
          },
          {
            task: "Track and photograph wildlife in the area",
            dialogue: "The animals are the true residents here - we must learn their needs and habits.",
            completed: false,
            reward: { exp: 120, item: "Wildlife Camera", ability: null }
          },
          {
            task: "Identify locations needing immediate conservation attention",
            dialogue: "Some places cry out for protection - your fresh eyes might see what I've missed.",
            completed: false,
            reward: { exp: 200, item: "Conservation Report", ability: "Nature's Voice" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 95,
        curiosity: 98,
        passion: 95,
        melancholy: 40,
        enthusiasm: 95,
        advocacy: 100,
        adventure: 90,
        humor: 75,
        patience: 90
      }
    }
  },

  // Desert 1 - Portal to Desert 2
  {
    name: "Desert Sage",
    type: "SAGE",
    position: { x: 350, y: 250 },
    area: "Desert 1",
    dialogue: [
      "Greetings, wanderer. I am the Desert Sage, keeper of ancient knowledge.",
      "The desert holds many secrets, but they are not given freely to those who do not understand patience.",
      "Water is life here, but wisdom is the true oasis.",
      "I sense you seek passage to deeper deserts. But first, you must prove your worth.",
      "The sands of time flow differently here. What do you seek in the depths?"
    ],
    quests: [
      {
        id: "desert_wisdom_quest",
        title: "The Path of Patience",
        description: "Learn the ways of the desert through meditation and observation.",
        stages: [
          {
            task: "Spend 5 minutes meditating in the desert (real time)",
            dialogue: "The desert teaches patience. Sit with me and learn to listen to the wind.",
            completed: false,
            reward: { exp: 60, item: "Desert Meditation Stone", ability: null }
          },
          {
            task: "Find 3 different types of desert life",
            dialogue: "Life finds a way even here. Discover the resilient creatures of the sands.",
            completed: false,
            reward: { exp: 90, item: "Desert Survival Guide", ability: null }
          },
          {
            task: "Navigate through a sandstorm using only the stars",
            dialogue: "When the winds howl, the stars will guide you. Trust in ancient wisdom.",
            completed: false,
            reward: { exp: 150, item: "Star Compass", ability: "Desert Navigation" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 100,
        curiosity: 70,
        passion: 60,
        melancholy: 80,
        enthusiasm: 40,
        advocacy: 30,
        adventure: 50,
        humor: 30,
        patience: 100
      }
    }
  },

  // Desert 2 - Portal to Desert 3
  {
    name: "Nomad Trader",
    type: "EXPLORER",
    position: { x: 400, y: 300 },
    area: "Desert 2",
    dialogue: [
      "Ah, a fellow traveler! I am the Nomad Trader, and I've seen things that would make your head spin.",
      "The deeper deserts hold treasures beyond imagination, but also dangers beyond reckoning.",
      "I trade in stories and secrets. What have you learned in your travels?",
      "The path ahead is treacherous, but I can guide you if you help me with a small matter.",
      "Every oasis has its price, and every secret has its keeper."
    ],
    quests: [
      {
        id: "nomad_trade_quest",
        title: "The Merchant's Network",
        description: "Help the Nomad Trader establish trade routes and gather rare goods.",
        stages: [
          {
            task: "Collect 5 rare artifacts from different areas",
            dialogue: "I need rare goods to establish new trade routes. Find me artifacts of value.",
            completed: false,
            reward: { exp: 70, item: "Trading License", ability: null }
          },
          {
            task: "Establish contact with 3 different NPCs",
            dialogue: "A good trader knows everyone. Make connections and build relationships.",
            completed: false,
            reward: { exp: 100, item: "Network Map", ability: null }
          },
          {
            task: "Successfully complete a trade deal with another player",
            dialogue: "The art of the deal is everything. Show me you can negotiate.",
            completed: false,
            reward: { exp: 180, item: "Merchant's Guild Badge", ability: "Trade Mastery" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 80,
        curiosity: 90,
        passion: 70,
        melancholy: 50,
        enthusiasm: 85,
        advocacy: 40,
        adventure: 95,
        humor: 75,
        patience: 60
      }
    }
  },

  // Desert 3 - Portal to Dungeon Level 1
  {
    name: "Ancient Guardian",
    type: "SAGE",
    position: { x: 450, y: 350 },
    area: "Desert 3",
    dialogue: [
      "Halt, seeker. I am the Ancient Guardian, protector of the threshold between worlds.",
      "Beyond this point lies the realm of trials and tests. Are you prepared for what awaits?",
      "Many have sought the treasures of the dungeon, but few have returned unchanged.",
      "The path to wisdom is paved with challenges. Prove yourself worthy of passage.",
      "The ancient ones left their mark here. Do you have the courage to face their legacy?"
    ],
    quests: [
      {
        id: "guardian_trial_quest",
        title: "The Guardian's Trial",
        description: "Prove your worthiness to enter the dungeon realm through a series of tests.",
        stages: [
          {
            task: "Solve the Guardian's riddle",
            dialogue: "Wisdom is the first test. Answer this riddle: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?'",
            completed: false,
            reward: { exp: 80, item: "Riddle Stone", ability: null }
          },
          {
            task: "Demonstrate courage by facing a fear",
            dialogue: "Courage is the second test. Face something that frightens you and overcome it.",
            completed: false,
            reward: { exp: 120, item: "Courage Medal", ability: null }
          },
          {
            task: "Show compassion by helping another player",
            dialogue: "Compassion is the final test. Help someone in need without expecting reward.",
            completed: false,
            reward: { exp: 200, item: "Guardian's Blessing", ability: "Dungeon Access" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 100,
        curiosity: 40,
        passion: 60,
        melancholy: 70,
        enthusiasm: 30,
        advocacy: 50,
        adventure: 40,
        humor: 20,
        patience: 95
      }
    }
  },

  // Dungeon Level 1 - Portal to Dungeon Level 2
  {
    name: "Dungeon Guide",
    type: "GUIDE",
    position: { x: 300, y: 200 },
    area: "Dungeon Level 1",
    dialogue: [
      "Welcome to the first level of the dungeon, brave adventurer. I am your guide through these depths.",
      "The deeper you go, the greater the challenges and rewards become.",
      "Many have entered these halls, but few have reached the deepest levels.",
      "Each level tests different aspects of your character. Are you ready for the trials ahead?",
      "The ancient ones built these dungeons as tests of worthiness. Prove yourself worthy."
    ],
    quests: [
      {
        id: "dungeon_mastery_quest",
        title: "Dungeon Mastery",
        description: "Learn the ways of the dungeon and prove your worth as an adventurer.",
        stages: [
          {
            task: "Navigate through the first level without getting lost",
            dialogue: "The first test is navigation. Find your way through this level's maze.",
            completed: false,
            reward: { exp: 90, item: "Dungeon Map", ability: null }
          },
          {
            task: "Defeat 3 dungeon creatures or solve 3 puzzles",
            dialogue: "Combat and wit are both needed here. Show me your skills.",
            completed: false,
            reward: { exp: 130, item: "Adventurer's Kit", ability: null }
          },
          {
            task: "Find the hidden treasure of this level",
            dialogue: "Every level has its secrets. Discover what lies hidden in the shadows.",
            completed: false,
            reward: { exp: 220, item: "Level 1 Master Badge", ability: "Dungeon Sense" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 85,
        curiosity: 75,
        passion: 80,
        melancholy: 60,
        enthusiasm: 90,
        advocacy: 40,
        adventure: 100,
        humor: 70,
        patience: 80
      }
    }
  },

  // Dungeon Level 2 - Portal to Dungeon Level 3
  {
    name: "Shadow Master",
    type: "SAGE",
    position: { x: 350, y: 250 },
    area: "Dungeon Level 2",
    dialogue: [
      "Ah, you've reached the second level. I am the Shadow Master, keeper of dark secrets.",
      "The shadows here hold knowledge that can only be learned by those who embrace the darkness.",
      "Light and shadow are two sides of the same coin. Learn to use both.",
      "The deeper levels require mastery of stealth and subtlety. Are you ready to learn?",
      "Some truths can only be found in darkness. Will you face what lies in the shadows?"
    ],
    quests: [
      {
        id: "shadow_mastery_quest",
        title: "Shadow Mastery",
        description: "Learn to navigate the shadows and master the art of stealth.",
        stages: [
          {
            task: "Navigate through a dark area without being detected",
            dialogue: "The first lesson is stealth. Move through the shadows without being seen.",
            completed: false,
            reward: { exp: 100, item: "Shadow Cloak", ability: null }
          },
          {
            task: "Learn to read the signs and symbols in the shadows",
            dialogue: "The shadows speak to those who know how to listen. Learn their language.",
            completed: false,
            reward: { exp: 150, item: "Shadow Codex", ability: null }
          },
          {
            task: "Use shadow magic to solve a complex puzzle",
            dialogue: "Now combine stealth and magic. Use the shadows to unlock ancient secrets.",
            completed: false,
            reward: { exp: 250, item: "Shadow Master Badge", ability: "Shadow Magic" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 90,
        curiosity: 80,
        passion: 70,
        melancholy: 85,
        enthusiasm: 50,
        advocacy: 30,
        adventure: 85,
        humor: 40,
        patience: 90
      }
    }
  },

  // Dungeon Level 3 - Portal to Yosemite
  {
    name: "Ancient One",
    type: "SAGE",
    position: { x: 400, y: 300 },
    area: "Dungeon Level 3",
    dialogue: [
      "You have reached the deepest level, seeker. I am the Ancient One, guardian of the final threshold.",
      "Few have come this far, and fewer still have proven worthy of the ultimate test.",
      "The portal to Yosemite lies beyond, but only those who have mastered all aspects of the dungeon may pass.",
      "You have shown courage, wisdom, and skill. Now show me your heart.",
      "The final test is not of strength or knowledge, but of character. Are you ready?"
    ],
    quests: [
      {
        id: "ancient_one_final_quest",
        title: "The Final Test",
        description: "Face the ultimate test of character and prove yourself worthy of the Ancient One's blessing.",
        stages: [
          {
            task: "Reflect on your journey and share what you've learned",
            dialogue: "Tell me what this journey has taught you about yourself and the world.",
            completed: false,
            reward: { exp: 150, item: "Wisdom Crystal", ability: null }
          },
          {
            task: "Help another player complete their quest",
            dialogue: "True mastery comes from helping others. Guide someone else to success.",
            completed: false,
            reward: { exp: 200, item: "Mentor's Staff", ability: null }
          },
          {
            task: "Make a sacrifice for the greater good",
            dialogue: "The final test requires sacrifice. Give up something valuable for the benefit of others.",
            completed: false,
            reward: { exp: 300, item: "Ancient One's Blessing", ability: "Portal Mastery" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    personality: {
      traits: {
        wisdom: 100,
        curiosity: 60,
        passion: 50,
        melancholy: 70,
        enthusiasm: 40,
        advocacy: 80,
        adventure: 60,
        humor: 30,
        patience: 100
      }
    }
  }
];

async function createNPCsWithQuests() {
  try {
    console.log('🌱 Starting NPC creation with quests...');
    
    // Clear existing NPCs
    await NPC.deleteMany({});
    console.log('🧹 Cleared existing NPCs');
    
    // Insert new NPCs with quests
    const createdNPCs = await NPC.insertMany(npcData);
    console.log(`✅ Created ${createdNPCs.length} NPCs with quests:`, 
      createdNPCs.map(npc => `${npc.name} (${npc.area})`));
    
    return createdNPCs;
  } catch (error) {
    console.error('❌ Error creating NPCs:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting NPC and quest system setup...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Create NPCs with quests
    await createNPCsWithQuests();
    
    console.log('✨ NPC and quest system setup completed successfully!');
  } catch (error) {
    console.error('💥 Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
