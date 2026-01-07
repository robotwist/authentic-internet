import mongoose from "mongoose";
import { v4: uuidv4 } from 'uuid';

const defaultCreator = "65f2a3d1234567890abcdef1";
const now = new Date().toISOString();

// Game artifact seeds for Creative Metaverse Platform
const gameArtifacts = [
  {
<<<<<<< HEAD
    _id: uuidv4(),
    name: "Hemingway's Battlefield",
    description: "Experience the thrill of war through the eyes of Ernest Hemingway in this intense side-scrolling shooter. Battle through African battlefields, face challenging bosses, and unlock the secrets of literary courage.",
    type: "shooter_experience",
    gameType: "shooter",
    category: "interactive_game",
    contentType: "interactive",
    
    // Visual properties
    image: "/assets/hemingway.png",
    screenshots: [
      "/assets/screenshots/hemingway-shooter-1.png",
      "/assets/screenshots/hemingway-shooter-2.png"
    ],
    
    // Game metadata
    difficulty: "advanced",
    estimatedDuration: "medium", // 15-30 minutes
    tags: ["action", "literature", "hemingway", "war", "boss-battles"],
    
    // Location and discovery
    area: "Yosemite",
    position: { x: 16 * 40, y: 5 * 40 }, // Pixel coordinates
    visible: true,
    discovered: false,
    
    // Interactive properties
    isInteractive: true,
    requiresUnlock: false,
    unlockConditions: [],
    
    // Completion rewards
    completionRewards: {
      xp: 150,
      powers: ["enhanced_vision", "super_strength"],
      unlockedAreas: ["crystal_caves"],
      achievements: ["literary_warrior", "hemingway_scholar"],
      items: []
    },
    
    // Game configuration
    gameData: {
      gameType: "shooter",
      levels: [
        {
          name: "African Battlefield",
          description: "Navigate through the war-torn landscapes of Africa",
          difficulty: "medium",
          bosses: [
            {
              name: "The War Machine",
              health: 1000,
              attacks: ["rapid_fire", "missile_barrage"]
            }
          ]
        }
      ],
      config: {
        playerSpeed: 5,
        jumpHeight: 15,
        gravity: 0.8,
        maxHealth: 100,
        weaponDamage: 25
      },
      assets: {
        background: "/assets/world_map_bg.jpg",
        player: "/assets/hemingway.png",
        enemies: ["/assets/enemy-grunt.png", "/assets/enemy-soldier.png"],
        boss: "/assets/boss.png",
        sounds: {
          theme: "/assets/music/hemingway/overworldTheme.mp3",
          combat: "/assets/sounds/hemingway/boss-critical.mp3",
          victory: "/assets/sounds/hemingway/boss-defeated.mp3"
        }
      }
    },
    
    // Social features
    rating: 4.7,
    ratingsCount: 23,
    likes: 45,
    shares: 12,
    comments: [],
    featured: true,
    
    // Creator information
    creator: "system", // System-generated artifact
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Analytics
    completionStats: {
      totalAttempts: 67,
      totalCompletions: 23,
      averageScore: 8420,
      topScore: 15670,
      averagePlayTime: 1380000 // 23 minutes in milliseconds
    }
=======
    id: "ancient-sword",
    name: "Ancient Sword",
    description: "A sword from ancient times",
    type: "WEAPON",
    content: "This ancient blade bears the marks of countless battles. Its steel has been tempered by time and its edge sharpened by history. The hilt is adorned with mysterious runes that seem to glow faintly in the presence of worthy warriors.",
    media: ["/assets/ancient_sword.png"],
    location: { x: 3, y: 2, mapName: "overworld" },
    exp: 10,
    visible: true,
    area: "overworld",
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
>>>>>>> bffce2f848c06153d48c6603b8397b79e406ff7d
  },
  
  {
<<<<<<< HEAD
    _id: uuidv4(),
    name: "The Writer's Journey",
    description: "Embark on an epic text-based adventure through the mind of a writer. Solve literary puzzles, make crucial decisions, and unlock the secrets of creative expression in this immersive interactive fiction experience.",
    type: "text_adventure_world",
    gameType: "text_adventure",
    category: "interactive_story",
    contentType: "interactive",
    
    // Visual properties  
    image: "/assets/artifact.webp",
    screenshots: [
      "/assets/screenshots/text-adventure-1.png",
      "/assets/screenshots/text-adventure-2.png"
    ],
    
    // Game metadata
    difficulty: "intermediate",
    estimatedDuration: "long", // 30+ minutes
    tags: ["text-adventure", "writing", "creativity", "puzzle", "story"],
    
    // Location and discovery
    area: "Yosemite", 
    position: { x: 10 * 40, y: 11 * 40 },
    visible: true,
    discovered: false,
    
    // Interactive properties
    isInteractive: true,
    requiresUnlock: false,
    unlockConditions: [],
    
    // Completion rewards
    completionRewards: {
      xp: 200,
      powers: ["enhanced_vision", "teleport"],
      unlockedAreas: ["time_nexus", "creator_sanctum"],
      achievements: ["master_storyteller", "creative_genius", "adventure_complete"],
      items: ["writers_quill", "inspiration_tome"]
    },
    
    // Game configuration
    gameData: {
      gameType: "text_adventure", 
      rooms: [
        {
          id: "start",
          name: "The Writer's Study",
          description: "You find yourself in a dimly lit study, surrounded by books and scattered papers. A single candle flickers on the desk, casting dancing shadows on the walls.",
          exits: ["library", "garden"],
          items: ["typewriter", "manuscript"],
          actions: ["write", "read", "think"]
        },
        {
          id: "library",
          name: "The Infinite Library",
          description: "Towering shelves stretch infinitely upward, filled with every story ever told and those yet to be written.",
          exits: ["start", "void"],
          items: ["golden_pen", "story_fragments"],
          actions: ["read_stories", "write_story", "search"]
        }
      ],
      config: {
        maxInventory: 10,
        startingRoom: "start",
        endingConditions: ["find_inspiration", "complete_story"],
        difficultyModifiers: {
          puzzleComplexity: "high",
          narrativeBranching: "extensive"
        }
      },
      assets: {
        background: "/assets/images/parchment-bg.jpg",
        sounds: {
          theme: "/assets/music/text-adventure/goldberg-variations-8bit.mp3",
          typewriter: "/assets/sounds/1952-Royal-Quiet-De-Luxe-audio.mp3",
          page_turn: "/assets/sounds/page-turn.mp3"
        }
      }
    },
    
    // Social features
    rating: 4.9,
    ratingsCount: 31,
    likes: 62, 
    shares: 18,
    comments: [],
    featured: true,
    
    // Creator information
    creator: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Analytics
    completionStats: {
      totalAttempts: 89,
      totalCompletions: 31,
      averageScore: 9250,
      topScore: 12400,
      averagePlayTime: 2340000 // 39 minutes in milliseconds
    }
=======
    id: "mystic-orb",
    name: "Mystic Orb",
    description: "A mysterious orb",
    type: "artifact",
    content: "This is a mystic orb.",
    media: ["/assets/mystic_orb.png"],
    location: { x: 7, y: 5, mapName: "overworld" },
    exp: 15,
    visible: true,
    area: "overworld",
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
>>>>>>> bffce2f848c06153d48c6603b8397b79e406ff7d
  },
  
  {
<<<<<<< HEAD
    _id: uuidv4(),
    name: "Terminal Challenge: Digital Archaeology",
    description: "Master the art of command-line navigation in this authentic terminal experience. Uncover digital artifacts, solve system puzzles, and learn the ancient ways of the command line interface.",
    type: "terminal_challenge",
    gameType: "terminal",
    category: "educational_game",
    contentType: "interactive",
    
    // Visual properties
    image: "/assets/artifact-gem.png", 
    screenshots: [
      "/assets/screenshots/terminal-1.png",
      "/assets/screenshots/terminal-2.png"
    ],
    
    // Game metadata
    difficulty: "expert",
    estimatedDuration: "medium", // 15-30 minutes
    tags: ["terminal", "command-line", "programming", "puzzle", "hacking"],
    
    // Location and discovery
    area: "Yosemite",
    position: { x: 5 * 40, y: 5 * 40 },
    visible: true,
    discovered: false,
    
    // Interactive properties
    isInteractive: true,
    requiresUnlock: false,
    unlockConditions: [],
    
    // Completion rewards
    completionRewards: {
      xp: 250,
      powers: ["enhanced_vision", "time_slow", "invisibility"],
      unlockedAreas: ["hidden_valley", "digital_realm"],
      achievements: ["terminal_master", "digital_archaeologist", "code_breaker"],
      items: ["admin_key", "system_access_token"]
    },
    
    // Game configuration
    gameData: {
      gameType: "terminal",
      challenges: [
        {
          id: "file_navigation",
          name: "Navigate the File System",
          description: "Use ls, cd, and pwd to explore the digital landscape",
          commands: ["ls", "cd", "pwd", "find"],
          solution: ["cd /home/user", "ls -la", "find . -name '*.txt'"],
          hints: ["Try listing directory contents", "Change to home directory first"]
        },
        {
          id: "data_extraction", 
          name: "Extract Hidden Data",
          description: "Use grep, cat, and other tools to find hidden information",
          commands: ["grep", "cat", "head", "tail", "wc"],
          solution: ["grep -r 'secret' .", "cat hidden_file.txt"],
          hints: ["Search for specific patterns", "Read file contents carefully"]
        }
      ],
      config: {
        startingDirectory: "/home/user",
        availableCommands: ["ls", "cd", "pwd", "cat", "grep", "find", "head", "tail", "wc", "chmod", "mv", "cp"],
        systemFiles: {
          "/home/user": {
            "readme.txt": "Welcome to the Terminal Challenge...",
            "secrets": {
              "password.txt": "The key is hidden in plain sight",
              "treasure_map.txt": "Follow the path of least resistance"
            }
          }
        }
      },
      assets: {
        sounds: {
          theme: "/assets/music/terminalTheme.mp3",
          keypress: "/assets/sounds/keypress.mp3",
          success: "/assets/sounds/achievement-unlock.mp3"
        }
      }
    },
    
    // Social features
    rating: 4.5,
    ratingsCount: 18,
    likes: 34,
    shares: 8,
    comments: [],
    featured: false,
    
    // Creator information
    creator: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Analytics
    completionStats: {
      totalAttempts: 42,
      totalCompletions: 18,
      averageScore: 7800,
      topScore: 11200,
      averagePlayTime: 1620000 // 27 minutes in milliseconds
    }
=======
    id: "golden-idol",
    name: "Golden Idol",
    description: "A golden idol",
    type: "TREASURE",
    content: "This is a golden idol.",
    media: ["/assets/golden_idol.png"],
    location: { x: 4, y: 6, mapName: "desert" },
    exp: 20,
    visible: true,
    area: "desert",
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
    type: "TOOL",
    content: "This is a dungeon key.",
    media: ["/assets/dungeon_key.png"],
    location: { x: 5, y: 5, mapName: "dungeon" },
    exp: 25,
    visible: true,
    area: "dungeon",
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
    type: "artifact",
    content: "Gazing into the mirror reveals glimpses of forgotten memories.",
    media: ["/assets/enchanted_mirror.png"],
    location: { x: 8, y: 3, mapName: "overworld" },
    exp: 30,
    visible: true,
    area: "overworld",
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
>>>>>>> bffce2f848c06153d48c6603b8397b79e406ff7d
  }
];

// Traditional artifact seeds (enhanced for Creative Metaverse)
const traditionArtifacts = [
  {
    _id: uuidv4(),
    name: "Shakespeare's Lost Sonnet",
    description: "A recently discovered sonnet manuscript that reveals deep insights into Shakespeare's creative process and philosophical thoughts on the nature of creativity itself.",
    type: "writing",
    category: "poetry",
    contentType: "text",
    
    // Visual properties
    image: "/assets/artifacts/scroll.svg",
    
    // Metadata
    tags: ["shakespeare", "poetry", "literature", "renaissance", "manuscript"],
    
    // Location and discovery
    area: "Overworld",
    position: { x: 3 * 40, y: 7 * 40 },
    visible: true,
    discovered: false,
    
    // Content
    content: `When time's cruel hand doth steal the writer's fire,
And passion's flame burns low in weary breast,
Yet still the soul doth yearn, aspire, desire
To craft new worlds from chaos and unrest.

The quill becomes both sword and sacred wand,
Through ink-stained fingers flow the dreams of ages,
While mortal flesh may fail, the words shall stand
Eternal, written on time's endless pages.

What power lies within the written word!
To move the heart, to change the very world,
Like phoenix rising when the flame is stirred,
New meaning from old letters is unfurled.

So write, dear friend, though death may stop thy breath—
In verses lives the conquest over death.`,
    
    // Interactive properties
    isInteractive: false,
    completionRewards: {
      xp: 75,
      achievements: ["shakespeare_scholar"],
      items: ["quill_of_inspiration"]
    },
    
    // Social features
    rating: 4.8,
    ratingsCount: 27,
    likes: 52,
    shares: 15,
    comments: [],
    featured: true,
    
    // Creator information
    creator: "shakespeare", // Historical figure
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  {
    _id: uuidv4(),
    name: "Muir's Nature Wisdom",
    description: "A collection of John Muir's profound observations about the interconnectedness of nature and humanity, discovered in his personal field journal from Yosemite expeditions.",
    type: "writing",
    category: "nature_writing",
    contentType: "text",
    
    // Visual properties
    image: "/assets/artifacts/scroll.svg",
    
    // Metadata
    tags: ["john_muir", "nature", "conservation", "yosemite", "wilderness"],
    
    // Location and discovery
    area: "Yosemite",
    position: { x: 8 * 40, y: 3 * 40 },
    visible: true,
    discovered: false,
    
    // Content
    content: `The mountains are fountains of men as well as of rivers, of glaciers, of fertile soil. The great poets, philosophers, prophets, able men whose thoughts and deeds have moved the world, have come down from the mountains.

In every walk with nature, one receives far more than they seek. The clearest way into the Universe is through a forest wilderness. Going to the mountains is going home.

When we try to pick out anything by itself, we find it hitched to everything else in the Universe. Nature's peace will flow into you as sunshine flows into trees. The winds will blow their own freshness into you, and the storms their energy, while cares will drop away from you like the leaves of Autumn.

Keep close to Nature's heart, and break clear away, once in a while, and climb a mountain or spend a week in the woods. Wash your spirit clean.`,
    
    // Interactive properties
    isInteractive: false,
    completionRewards: {
      xp: 100,
      powers: ["nature_communion"],
      achievements: ["nature_philosopher"],
      items: ["compass_of_truth"]
    },
    
    // Social features
    rating: 4.9,
    ratingsCount: 34,
    likes: 68,
    shares: 22,
    comments: [],
    featured: true,
    
    // Creator information
    creator: "john_muir", // Historical figure
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Combine all artifacts
const allArtifacts = [...gameArtifacts, ...traditionArtifacts];

module.exports = {
  gameArtifacts,
  traditionArtifacts,
  allArtifacts,
  
  // Seeding function
  seedArtifacts: async (ArtifactModel) => {
    try {
      console.log('🌱 Starting artifact seeding...');
      
      // Clear existing artifacts
      await ArtifactModel.deleteMany({});
      console.log('🧹 Cleared existing artifacts');
      
      // Insert all artifacts
      const insertedArtifacts = await ArtifactModel.insertMany(allArtifacts);
      console.log(`✅ Created ${insertedArtifacts.length} artifacts:`, 
        insertedArtifacts.map(a => `${a.name} (${a.type})`));
      
      // Log game artifacts specifically  
      const gameArts = insertedArtifacts.filter(a => 
        ['shooter_experience', 'text_adventure_world', 'terminal_challenge'].includes(a.type)
      );
      console.log(`🎮 Game artifacts created: ${gameArts.length}`, 
        gameArts.map(a => `${a.name} -> ${a.area} (${a.position.x}, ${a.position.y})`));
      
      return insertedArtifacts;
      
    } catch (error) {
      console.error('❌ Error seeding artifacts:', error);
      throw error;
    }
  }
};