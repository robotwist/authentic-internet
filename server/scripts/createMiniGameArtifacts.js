import mongoose from 'mongoose';
import User from '../models/User.js';
import Artifact from '../models/Artifact.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentic-internet';

// Mini-game artifacts data
const miniGameArtifacts = [
  {
    name: "Hemingway's Arcade Adventure",
    description: "A side-scrolling shooter game featuring Ernest Hemingway as your AI companion. Navigate through Paris, Spain, and Africa while collecting manuscripts and defeating enemies.",
    contentType: "game",
    content: "A side-scrolling shooter game featuring Ernest Hemingway as your AI companion.",
    area: "Yosemite",
    location: { x: 16, y: 5 },
    gameType: "shooter",
    category: "arcade",
    difficulty: "intermediate",
    estimatedDuration: "medium",
    gameData: {
      gameType: "shooter",
      difficulty: "medium",
      estimatedPlayTime: 15,
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1,
      levels: ["paris", "spain", "africa"],
      features: ["AI Companion", "Collectibles", "Multiple Levels", "Story Integration"]
    },
    gameConfig: {
      gameType: "shooter",
      difficulty: "medium",
      estimatedPlayTime: 15,
      gameData: {
        levels: ["paris", "spain", "africa"],
        features: ["AI Companion", "Collectibles", "Multiple Levels", "Story Integration"]
      },
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1
    },
    completionRewards: {
      experience: 150,
      coins: 50,
      powers: ["Enhanced Movement", "Double Jump"],
      achievements: ["First Victory", "Speed Runner", "Perfect Score"]
    },
    isInteractive: true,
    allowsUserProgress: true,
    discovered: true,
    requiresUnlock: false,
    featured: true,
    featuredAt: new Date(),
    marketplace: {
      isListed: true,
      listedAt: new Date(),
      price: 0,
      category: "featured",
      tags: ["shooter", "hemingway", "adventure"],
      description: "Experience the world through Hemingway's eyes in this action-packed adventure."
    }
  },
  {
    name: "Terminal Challenge",
    description: "A coding challenge game that tests your programming skills. Solve puzzles, debug code, and unlock new areas through terminal commands.",
    contentType: "game",
    content: "A coding challenge game that tests your programming skills through terminal commands.",
    area: "Yosemite",
    location: { x: 5, y: 5 },
    gameType: "terminal",
    category: "puzzle",
    difficulty: "advanced",
    estimatedDuration: "long",
    gameData: {
      gameType: "terminal",
      difficulty: "hard",
      estimatedPlayTime: 20,
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1,
      features: ["Coding Challenges", "Debug Puzzles", "Command Line Interface", "Progressive Difficulty"]
    },
    gameConfig: {
      gameType: "terminal",
      difficulty: "hard",
      estimatedPlayTime: 20,
      gameData: {
        features: ["Coding Challenges", "Debug Puzzles", "Command Line Interface", "Progressive Difficulty"]
      },
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1
    },
    completionRewards: {
      experience: 200,
      coins: 75,
      powers: ["Code Mastery", "Debug Vision"],
      achievements: ["Code Breaker", "Terminal Master", "Debug Expert"]
    },
    isInteractive: true,
    allowsUserProgress: true,
    discovered: true,
    requiresUnlock: false,
    featured: true,
    featuredAt: new Date(),
    marketplace: {
      isListed: true,
      listedAt: new Date(),
      price: 0,
      category: "featured",
      tags: ["terminal", "coding", "puzzle"],
      description: "Master the art of programming through interactive terminal challenges."
    }
  },
  {
    name: "Text Adventure Quest",
    description: "An interactive text-based adventure game where your choices shape the story. Explore mysterious locations, solve puzzles, and uncover hidden secrets.",
    contentType: "game",
    content: "An interactive text-based adventure game where your choices shape the story.",
    area: "Yosemite",
    location: { x: 10, y: 11 },
    gameType: "textAdventure",
    category: "story",
    difficulty: "intermediate",
    estimatedDuration: "long",
    gameData: {
      gameType: "textAdventure",
      difficulty: "medium",
      estimatedPlayTime: 25,
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1,
      features: ["Interactive Story", "Multiple Endings", "Puzzle Solving", "Exploration"]
    },
    gameConfig: {
      gameType: "textAdventure",
      difficulty: "medium",
      estimatedPlayTime: 25,
      gameData: {
        features: ["Interactive Story", "Multiple Endings", "Puzzle Solving", "Exploration"]
      },
      controlScheme: ["keyboard"],
      multiplayer: false,
      maxPlayers: 1
    },
    completionRewards: {
      experience: 175,
      coins: 60,
      powers: ["Story Insight", "Puzzle Mastery"],
      achievements: ["Story Explorer", "Choice Maker", "Secret Finder"]
    },
    isInteractive: true,
    allowsUserProgress: true,
    discovered: true,
    requiresUnlock: false,
    featured: true,
    featuredAt: new Date(),
    marketplace: {
      isListed: true,
      listedAt: new Date(),
      price: 0,
      category: "featured",
      tags: ["text-adventure", "story", "puzzle"],
      description: "Embark on a text-based journey where every choice matters."
    }
  }
];

async function createCreatorUser() {
  try {
    // Check if creator user already exists
    let creatorUser = await User.findOne({ username: 'Aurthurneticus_Interneticus' });
    
    if (!creatorUser) {
      // Create the creator user
      creatorUser = new User({
        username: 'Aurthurneticus_Interneticus',
        email: 'creator@authentic-internet.com',
        password: 'CreatorPassword123!', // This will be hashed by the User model
        bio: 'The mysterious creator of the Authentic Internet universe. Master of digital realms and guardian of interactive experiences.',
        avatar: '/assets/avatars/creator.png',
        level: 100,
        exp: 10000,
        coins: 1000,
        isCreator: true,
        creatorBadge: true,
        featuredCreator: true,
        createdAt: new Date('2024-01-01'),
        lastSeen: new Date()
      });
      
      await creatorUser.save();
      console.log('✅ Creator user created successfully');
    } else {
      console.log('ℹ️ Creator user already exists');
    }
    
    return creatorUser._id;
  } catch (error) {
    console.error('❌ Error creating creator user:', error);
    throw error;
  }
}

async function createMiniGameArtifacts(creatorId) {
  try {
    for (const artifactData of miniGameArtifacts) {
      // Check if artifact already exists
      const existingArtifact = await Artifact.findOne({ 
        name: artifactData.name,
        creator: creatorId 
      });
      
      if (existingArtifact) {
        console.log(`ℹ️ Artifact "${artifactData.name}" already exists, skipping...`);
        continue;
      }
      
      // Create new artifact
      const artifact = new Artifact({
        ...artifactData,
        creator: creatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        discovered: true,
        requiresUnlock: false,
        completionStats: {
          totalAttempts: 0,
          totalCompletions: 0,
          averageScore: 0,
          topScore: 0
        },
        socialData: {
          likes: 0,
          comments: [],
          shares: 0,
          featured: true
        }
      });
      
      await artifact.save();
      console.log(`✅ Created artifact: "${artifactData.name}"`);
    }
    
    console.log('🎉 All mini-game artifacts created successfully!');
  } catch (error) {
    console.error('❌ Error creating mini-game artifacts:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting mini-game artifacts creation...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Create creator user
    const creatorId = await createCreatorUser();
    
    // Create mini-game artifacts
    await createMiniGameArtifacts(creatorId);
    
    console.log('✨ Mini-game artifacts setup completed successfully!');
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
