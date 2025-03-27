/**
 * LevelData.js
 * Defines the level layouts, quotes, and progression for the Level4Shooter game
 */

// Constants for sizing
const TILE_SIZE = 32;

/**
 * Level definitions for the Hemingway shooter game
 */
const LevelData = {
  // Level configuration
  levels: [
    {
      id: 'paris',
      name: 'Paris',
      description: 'The streets of 1920s Paris',
      subtitle: 'The City of Light',
      introText: [
        "Paris in the 1920s was a beacon for writers and artists. Hemingway arrived here in 1921 with his wife Hadley, eager to join the literary scene.",
        "The city was cheap for Americans with dollars, allowing Hemingway to write while living simply. Here he met Gertrude Stein, F. Scott Fitzgerald, and other influential figures.",
        "Navigate the streets of Paris, collecting inspiration and avoiding the distractions that could derail your writing career. The cafés provide respite, but beware the critics!"
      ],
      bossName: "Gertrude Stein",
      bossQuote: "You are all a lost generation.",
      victoryText: "With Gertrude Stein's blessing, you've established yourself in the Parisian literary scene. Your journey continues to Spain.",
      spawnRate: 3000, // ms between enemy spawns
      enemyTypes: ['basic', 'flying'],
      enemyCount: 30,
      itemFrequency: 0.2 // probability of item spawn per enemy
    },
    {
      id: 'spain',
      name: 'Spain',
      description: 'The bullrings of 1930s Spain',
      subtitle: 'Death in the Afternoon',
      introText: [
        "Spain captivated Hemingway with its bullfights, civil war, and passionate culture. He first visited in 1923 and returned many times throughout his life.",
        "His experiences watching bullfights inspired 'Death in the Afternoon', and the Spanish Civil War became the backdrop for 'For Whom the Bell Tolls'.",
        "Fight through the chaos of war-torn Spain, facing more dangerous enemies as you document the struggle and search for meaning in conflict."
      ],
      bossName: "The Matador",
      bossQuote: "The bulls are the real heroes. No man dies as bravely as the bull.",
      victoryText: "You've captured the essence of Spain's tragic beauty. Africa calls with new adventures and challenges.",
      spawnRate: 2500, // ms between enemy spawns
      enemyTypes: ['basic', 'flying', 'armored'],
      enemyCount: 40,
      itemFrequency: 0.25 // probability of item spawn per enemy
    },
    {
      id: 'africa',
      name: 'Africa',
      description: 'The savannas of East Africa',
      subtitle: 'The Green Hills',
      introText: [
        "Africa represented the ultimate adventure for Hemingway. He went on safari in 1933 and 1954, hunting big game and collecting experiences for his writing.",
        "The continent inspired works like 'The Snows of Kilimanjaro' and 'The Green Hills of Africa', reflecting his love of hunting and respect for the wilderness.",
        "Survive the wilds of Africa, facing the most challenging enemies yet. This is your final test as you solidify your legendary status."
      ],
      bossName: "The Great White Hunter",
      bossQuote: "There is no hunting like the hunting of man, and those who have hunted armed men long enough and liked it, never care for anything else thereafter.",
      victoryText: "With Africa conquered, you've cemented your legacy as one of America's greatest writers. Your journey with Hemingway is complete.",
      spawnRate: 2000, // ms between enemy spawns
      enemyTypes: ['basic', 'flying', 'armored'],
      enemyCount: 50,
      itemFrequency: 0.3 // probability of item spawn per enemy
    }
  ],
  
  // Platform layouts for each level
  platforms: {
    paris: [
      // Ground level
      { x: 0, y: 550, width: 800, height: 50, type: 'ground' },
      
      // Cafe platforms
      { x: 100, y: 400, width: 150, height: 20, type: 'floating' },
      { x: 350, y: 350, width: 150, height: 20, type: 'floating' },
      { x: 600, y: 450, width: 150, height: 20, type: 'floating' },
      
      // Upper level platforms
      { x: 200, y: 250, width: 100, height: 20, type: 'floating' },
      { x: 500, y: 200, width: 100, height: 20, type: 'floating' }
    ],
    
    spain: [
      // Ground level
      { x: 0, y: 550, width: 800, height: 50, type: 'ground' },
      
      // Arena platforms
      { x: 150, y: 450, width: 120, height: 20, type: 'floating' },
      { x: 400, y: 400, width: 120, height: 20, type: 'floating' },
      { x: 650, y: 450, width: 120, height: 20, type: 'floating' },
      
      // Upper ruins platforms
      { x: 100, y: 300, width: 80, height: 20, type: 'floating' },
      { x: 250, y: 250, width: 80, height: 20, type: 'floating' },
      { x: 400, y: 200, width: 80, height: 20, type: 'floating' },
      { x: 550, y: 250, width: 80, height: 20, type: 'floating' },
      { x: 700, y: 300, width: 80, height: 20, type: 'floating' }
    ],
    
    africa: [
      // Ground level
      { x: 0, y: 550, width: 800, height: 50, type: 'ground' },
      
      // Tree platforms
      { x: 100, y: 450, width: 100, height: 20, type: 'floating' },
      { x: 300, y: 400, width: 100, height: 20, type: 'floating' },
      { x: 500, y: 350, width: 100, height: 20, type: 'floating' },
      { x: 700, y: 300, width: 100, height: 20, type: 'floating' },
      
      // Rock formations
      { x: 150, y: 300, width: 70, height: 20, type: 'floating' },
      { x: 350, y: 250, width: 70, height: 20, type: 'floating' },
      { x: 550, y: 200, width: 70, height: 20, type: 'floating' }
    ]
  },
  
  // Item spawn points for each level
  itemSpawnPoints: {
    paris: [
      { x: 150, y: 350, types: ['health', 'ammo'] },
      { x: 400, y: 300, types: ['health', 'ammo'] },
      { x: 650, y: 400, types: ['health', 'ammo'] },
      { x: 250, y: 200, types: ['health', 'ammo', 'experience'] },
      { x: 550, y: 150, types: ['health', 'ammo', 'experience'] }
    ],
    
    spain: [
      { x: 200, y: 400, types: ['health', 'ammo'] },
      { x: 450, y: 350, types: ['health', 'ammo'] },
      { x: 700, y: 400, types: ['health', 'ammo'] },
      { x: 150, y: 250, types: ['health', 'ammo', 'experience'] },
      { x: 300, y: 200, types: ['health', 'ammo', 'experience'] },
      { x: 450, y: 150, types: ['health', 'ammo', 'experience'] },
      { x: 600, y: 200, types: ['health', 'ammo', 'experience'] }
    ],
    
    africa: [
      { x: 150, y: 400, types: ['health', 'ammo'] },
      { x: 350, y: 350, types: ['health', 'ammo'] },
      { x: 550, y: 300, types: ['health', 'ammo'] },
      { x: 750, y: 250, types: ['health', 'ammo'] },
      { x: 200, y: 250, types: ['health', 'ammo', 'experience'] },
      { x: 400, y: 200, types: ['health', 'ammo', 'experience'] },
      { x: 600, y: 150, types: ['health', 'ammo', 'experience'] }
    ]
  },
  
  // Enemy spawn points for each level
  enemySpawnPoints: {
    paris: [
      { x: 800, y: 500, types: ['basic'] },
      { x: 800, y: 350, types: ['flying'] },
      { x: 800, y: 200, types: ['basic', 'flying'] }
    ],
    
    spain: [
      { x: 800, y: 500, types: ['basic', 'armored'] },
      { x: 800, y: 350, types: ['flying', 'basic'] },
      { x: 800, y: 200, types: ['flying'] },
      { x: 0, y: 500, types: ['armored'] },
      { x: 0, y: 350, types: ['flying'] }
    ],
    
    africa: [
      { x: 800, y: 500, types: ['basic', 'armored'] },
      { x: 800, y: 350, types: ['flying', 'armored'] },
      { x: 800, y: 200, types: ['flying'] },
      { x: 0, y: 500, types: ['armored'] },
      { x: 0, y: 350, types: ['flying'] },
      { x: 0, y: 200, types: ['basic', 'flying'] }
    ]
  },
  
  // Boss spawn locations
  bossSpawnPoints: {
    paris: { x: 700, y: 400 },
    spain: { x: 700, y: 450 },
    africa: { x: 700, y: 450 }
  },
  
  // Starting positions for player and companion
  playerStart: {
    paris: { x: 100, y: 450 },
    spain: { x: 100, y: 450 },
    africa: { x: 100, y: 450 }
  },
  
  companionStart: {
    paris: { x: 150, y: 450 },
    spain: { x: 150, y: 450 },
    africa: { x: 150, y: 450 }
  },
  
  // Hemingway quotes for each level
  hemingwayQuotes: {
    paris: [
      "If you are lucky enough to have lived in Paris as a young man, then wherever you go for the rest of your life, it stays with you, for Paris is a moveable feast.",
      "You're an expatriate. You've lost touch with the soil. You get precious. Fake European standards have ruined you.",
      "I've seen you, beauty, and you belong to me now, whoever you are waiting for and if I never see you again, I thought. You belong to me and all Paris belongs to me and I belong to this notebook and this pencil.",
      "Never go on trips with anyone you do not love.",
      "By then I knew that everything good and bad left an emptiness when it stopped. But if it was bad, the emptiness filled up by itself. If it was good you could only fill it by finding something better."
    ],
    spain: [
      "Bullfighting is the only art in which the artist is in danger of death and in which the degree of brilliance in the performance is left to the fighter's honor.",
      "No one you love is ever truly lost.",
      "For whom the bell tolls? It tolls for thee.",
      "There is nothing else than now. There is neither yesterday, certainly, nor is there any tomorrow.",
      "The world breaks everyone and afterward many are strong at the broken places."
    ],
    africa: [
      "All modern American literature comes from one book by Mark Twain called Huckleberry Finn.",
      "The world is a fine place and worth fighting for.",
      "I never knew of a morning in Africa when I woke up that I was not happy.",
      "There are some things which cannot be learned quickly, and time, which is all we have, must be paid heavily for their acquiring.",
      "The most painful thing is losing yourself in the process of loving someone too much, and forgetting that you are special too."
    ],
    generic: [
      "Courage is grace under pressure.",
      "There is nothing to writing. All you do is sit down at a typewriter and bleed.",
      "The best way to find out if you can trust somebody is to trust them.",
      "Happiness in intelligent people is the rarest thing I know.",
      "Always do sober what you said you'd do drunk. That will teach you to keep your mouth shut.",
      "The first draft of anything is shit.",
      "All you have to do is write one true sentence. Write the truest sentence that you know.",
      "Every day is a new day. It is better to be lucky. But I would rather be exact. Then when luck comes you are ready."
    ]
  },
  
  // Level completion requirements
  completionRequirements: {
    paris: {
      enemiesDefeated: 20,
      minScore: 1000,
      bossDefeated: true
    },
    spain: {
      enemiesDefeated: 30,
      minScore: 2000,
      bossDefeated: true
    },
    africa: {
      enemiesDefeated: 40,
      minScore: 3000,
      bossDefeated: true
    }
  },
  
  // Player progression system
  playerProgression: {
    // Level thresholds - player starts at level 1
    experienceThresholds: [
      0,      // Level 1
      100,    // Level 2
      250,    // Level 3
      500,    // Level 4
      1000,   // Level 5
      2000,   // Level 6
      4000,   // Level 7
      8000    // Level 8
    ],
    
    // Stats increases per level
    statsPerLevel: {
      damage: 5,        // Damage increase per level
      maxHealth: 10,    // Max health increase per level
      maxAmmo: 5        // Max ammo increase per level
    },
    
    // Base player stats
    baseStats: {
      health: 100,
      maxHealth: 100,
      damage: 10,
      speed: 5,
      jumpPower: 13,
      ammo: 50,
      maxAmmo: 50
    }
  },
  
  // Get a specific level by ID
  getLevel(levelId) {
    return this.levels.find(level => level.id === levelId) || this.levels[0];
  },
  
  // Get platforms for a specific level
  getPlatformsForLevel(levelId) {
    return this.platforms[levelId] || this.platforms.paris;
  },
  
  // Get item spawn points for a specific level
  getItemSpawnPointsForLevel(levelId) {
    return this.itemSpawnPoints[levelId] || this.itemSpawnPoints.paris;
  },
  
  // Get enemy spawn points for a specific level
  getEnemySpawnPointsForLevel(levelId) {
    return this.enemySpawnPoints[levelId] || this.enemySpawnPoints.paris;
  },
  
  // Get boss spawn point for a specific level
  getBossSpawnPointForLevel(levelId) {
    return this.bossSpawnPoints[levelId] || this.bossSpawnPoints.paris;
  },
  
  // Get player start position for a specific level
  getPlayerStartForLevel(levelId) {
    return this.playerStart[levelId] || this.playerStart.paris;
  },
  
  // Get companion start position for a specific level
  getCompanionStartForLevel(levelId) {
    return this.companionStart[levelId] || this.companionStart.paris;
  },
  
  // Get a random quote from Hemingway for a specific level
  getRandomHemingwayQuote(levelId) {
    const quotes = this.hemingwayQuotes[levelId] || this.hemingwayQuotes.generic;
    const index = Math.floor(Math.random() * quotes.length);
    return {
      text: quotes[index],
      attribution: "Ernest Hemingway"
    };
  },
  
  // Get completion requirements for a specific level
  getCompletionRequirementsForLevel(levelId) {
    return this.completionRequirements[levelId] || this.completionRequirements.paris;
  },
  
  // Calculate the level based on experience
  calculatePlayerLevel(experience) {
    let level = 1;
    for (let i = 1; i < this.playerProgression.experienceThresholds.length; i++) {
      if (experience >= this.playerProgression.experienceThresholds[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  },
  
  // Get the experience needed for the next level
  getExperienceForNextLevel(currentLevel) {
    if (currentLevel >= this.playerProgression.experienceThresholds.length) {
      return null; // Max level reached
    }
    return this.playerProgression.experienceThresholds[currentLevel];
  },
  
  // Calculate stats for a given player level
  getPlayerStatsForLevel(level) {
    const { baseStats, statsPerLevel } = this.playerProgression;
    const levelBonus = level - 1;
    
    return {
      maxHealth: baseStats.maxHealth + (statsPerLevel.maxHealth * levelBonus),
      damage: baseStats.damage + (statsPerLevel.damage * levelBonus),
      maxAmmo: baseStats.maxAmmo + (statsPerLevel.maxAmmo * levelBonus),
      speed: baseStats.speed,
      jumpPower: baseStats.jumpPower
    };
  }
};

export default LevelData; 