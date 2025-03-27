/**
 * EnemyGenerator.js
 * Utility for generating enemies in the Level4Shooter game
 */

class EnemyGenerator {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.enemyTypes = {
      BASIC: 'basic',
      FLYING: 'flying',
      ARMORED: 'armored'
    };
    
    // Enemy stats configuration
    this.enemyStats = {
      [this.enemyTypes.BASIC]: {
        health: 20,
        speed: 2,
        damage: 10,
        score: 50,
        experience: 15,
        size: { width: 40, height: 40 }
      },
      [this.enemyTypes.FLYING]: {
        health: 15,
        speed: 3.5,
        damage: 15,
        score: 75,
        experience: 20,
        size: { width: 36, height: 30 },
        flyingPattern: 'sine' // or 'zigzag' or 'targeted'
      },
      [this.enemyTypes.ARMORED]: {
        health: 40,
        speed: 1.2,
        damage: 20,
        score: 100,
        experience: 30,
        size: { width: 45, height: 50 },
        armor: 5 // Damage reduction
      }
    };
    
    // Difficulty scaling
    this.difficultyMultiplier = 1.0;
  }
  
  /**
   * Set the difficulty multiplier
   * @param {number} multiplier - Difficulty multiplier to apply to enemy stats
   */
  setDifficultyMultiplier(multiplier) {
    this.difficultyMultiplier = multiplier;
  }
  
  /**
   * Generate a new enemy
   * @param {string} type - Enemy type to generate
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} level - Level information for context-specific behaviors
   * @returns {Object} - New enemy object
   */
  generateEnemy(type, x, y, level) {
    if (!this.enemyStats[type]) {
      console.error(`Unknown enemy type: ${type}`);
      type = this.enemyTypes.BASIC; // Fallback to basic enemy
    }
    
    const baseStats = this.enemyStats[type];
    const scaledHealth = Math.floor(baseStats.health * this.difficultyMultiplier);
    const scaledDamage = Math.floor(baseStats.damage * this.difficultyMultiplier);
    
    // Create the enemy object
    const enemy = {
      type,
      x,
      y,
      width: baseStats.size.width,
      height: baseStats.size.height,
      velocityX: -baseStats.speed,
      velocityY: 0,
      health: scaledHealth,
      maxHealth: scaledHealth,
      damage: scaledDamage,
      score: baseStats.score,
      experience: baseStats.experience,
      isActive: true,
      isHit: false,
      hitTime: 0,
      deathTime: 0,
      isDying: false,
      currentLevel: level.name,
      
      // Copy any special properties based on enemy type
      ...(baseStats.armor && { armor: baseStats.armor }),
      ...(baseStats.flyingPattern && { 
        flyingPattern: baseStats.flyingPattern,
        flyingOffset: 0,
        flyingDirection: 1
      })
    };
    
    return enemy;
  }
  
  /**
   * Update an enemy's position and behavior
   * @param {Object} enemy - The enemy to update
   * @param {Object} player - The player for tracking
   * @param {number} deltaTime - Time since last update in ms
   * @param {Array} platforms - Array of platform objects for collision
   */
  updateEnemy(enemy, player, deltaTime, platforms) {
    // If the enemy is dying, just return
    if (enemy.isDying) return;
    
    // Movement based on enemy type
    switch (enemy.type) {
      case this.enemyTypes.BASIC:
        this.updateBasicEnemy(enemy, platforms);
        break;
      case this.enemyTypes.FLYING:
        this.updateFlyingEnemy(enemy, player, deltaTime);
        break;
      case this.enemyTypes.ARMORED:
        this.updateArmoredEnemy(enemy, player, platforms);
        break;
    }
    
    // Hit animation
    if (enemy.isHit) {
      const hitDuration = 200; // ms
      if (Date.now() - enemy.hitTime > hitDuration) {
        enemy.isHit = false;
      }
    }
  }
  
  /**
   * Update a basic enemy
   * @param {Object} enemy - The enemy to update
   * @param {Array} platforms - Array of platform objects
   */
  updateBasicEnemy(enemy, platforms) {
    // Apply gravity
    enemy.velocityY += 0.5;
    
    // Update position
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;
    
    // Check ground collision
    let onGround = false;
    for (const platform of platforms) {
      if (this.checkPlatformCollision(enemy, platform)) {
        enemy.y = platform.y - enemy.height;
        enemy.velocityY = 0;
        onGround = true;
        break;
      }
    }
    
    // Check if at edge of platform and reverse direction
    if (onGround) {
      let shouldReverse = true;
      
      // Find current platform
      const currentPlatform = platforms.find(platform => 
        enemy.y + enemy.height === platform.y &&
        enemy.x + enemy.width > platform.x &&
        enemy.x < platform.x + platform.width
      );
      
      if (currentPlatform) {
        if (enemy.velocityX < 0 && enemy.x > currentPlatform.x) {
          shouldReverse = false;
        }
        else if (enemy.velocityX > 0 && enemy.x + enemy.width < currentPlatform.x + currentPlatform.width) {
          shouldReverse = false;
        }
      }
      
      if (shouldReverse) {
        enemy.velocityX *= -1;
      }
    }
    
    // Boundary check
    if (enemy.x < 0) {
      enemy.x = 0;
      enemy.velocityX *= -1;
    } else if (enemy.x + enemy.width > this.gameWidth) {
      enemy.x = this.gameWidth - enemy.width;
      enemy.velocityX *= -1;
    }
  }
  
  /**
   * Update a flying enemy
   * @param {Object} enemy - The enemy to update
   * @param {Object} player - The player for tracking
   * @param {number} deltaTime - Time since last update
   */
  updateFlyingEnemy(enemy, player, deltaTime) {
    // Flying enemies don't have gravity
    
    // Different flying patterns
    switch (enemy.flyingPattern) {
      case 'sine':
        // Sin wave pattern
        enemy.flyingOffset += 0.05;
        enemy.velocityY = Math.sin(enemy.flyingOffset) * 2;
        break;
        
      case 'zigzag':
        // Zigzag pattern
        enemy.flyingOffset += 0.02;
        if (Math.floor(enemy.flyingOffset) % 2 === 0) {
          enemy.velocityY = 2 * enemy.flyingDirection;
        } else {
          enemy.velocityY = -2 * enemy.flyingDirection;
        }
        
        // Change direction when reaching top or bottom
        if (enemy.y < 50 || enemy.y > this.gameHeight - 100) {
          enemy.flyingDirection *= -1;
        }
        break;
        
      case 'targeted':
        // Follow player pattern
        const dy = player.y - enemy.y;
        enemy.velocityY = dy > 0 ? 1.5 : (dy < 0 ? -1.5 : 0);
        break;
    }
    
    // Update position
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;
    
    // Boundary check
    if (enemy.y < 0) {
      enemy.y = 0;
      enemy.velocityY *= -1;
    } else if (enemy.y + enemy.height > this.gameHeight) {
      enemy.y = this.gameHeight - enemy.height;
      enemy.velocityY *= -1;
    }
    
    if (enemy.x < 0) {
      enemy.x = 0;
      enemy.velocityX *= -1;
    } else if (enemy.x + enemy.width > this.gameWidth) {
      enemy.x = this.gameWidth - enemy.width;
      enemy.velocityX *= -1;
    }
  }
  
  /**
   * Update an armored enemy
   * @param {Object} enemy - The enemy to update
   * @param {Object} player - The player for tracking
   * @param {Array} platforms - Array of platform objects
   */
  updateArmoredEnemy(enemy, player, platforms) {
    // Apply gravity
    enemy.velocityY += 0.5;
    
    // Armored enemies target player horizontally if they're on ground
    let onGround = false;
    for (const platform of platforms) {
      if (this.checkPlatformCollision(enemy, platform)) {
        enemy.y = platform.y - enemy.height;
        enemy.velocityY = 0;
        onGround = true;
        
        // Track player if on ground
        if (player.x < enemy.x) {
          enemy.velocityX = -this.enemyStats[enemy.type].speed * 0.8;
        } else {
          enemy.velocityX = this.enemyStats[enemy.type].speed * 0.8;
        }
        
        break;
      }
    }
    
    // Update position
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;
    
    // Boundary check
    if (enemy.x < 0) {
      enemy.x = 0;
      enemy.velocityX *= -1;
    } else if (enemy.x + enemy.width > this.gameWidth) {
      enemy.x = this.gameWidth - enemy.width;
      enemy.velocityX *= -1;
    }
  }
  
  /**
   * Check if enemy collides with a platform
   * @param {Object} enemy - The enemy
   * @param {Object} platform - The platform
   * @returns {boolean} - True if collision detected
   */
  checkPlatformCollision(enemy, platform) {
    return (
      enemy.x + enemy.width > platform.x &&
      enemy.x < platform.x + platform.width &&
      enemy.y + enemy.height >= platform.y &&
      enemy.y + enemy.height <= platform.y + 10 &&
      enemy.velocityY > 0
    );
  }
  
  /**
   * Generate a boss for the given level
   * @param {string} level - Level name ('paris', 'spain', 'africa')
   * @returns {Object} - Boss object
   */
  generateBoss(level) {
    // Base boss stats
    const bossBaseStats = {
      paris: {
        name: "Gertrude Stein",
        health: 400,
        damage: 25,
        speed: 1.5,
        width: 80,
        height: 100,
        attackPatterns: ['charge', 'summon', 'projectile'],
        quote: "Paris was where the twentieth century was."
      },
      spain: {
        name: "Matador",
        health: 600,
        damage: 30,
        speed: 2,
        width: 90,
        height: 110,
        attackPatterns: ['charge', 'throw', 'stomp'],
        quote: "Death in the afternoon comes for us all."
      },
      africa: {
        name: "Great White Hunter",
        health: 800,
        damage: 35,
        speed: 1.8,
        width: 100,
        height: 120,
        attackPatterns: ['shoot', 'call', 'rush'],
        quote: "The hunt is all that matters in the end."
      }
    };
    
    if (!bossBaseStats[level]) {
      console.error(`Unknown boss level: ${level}`);
      level = 'paris'; // Fallback
    }
    
    const stats = bossBaseStats[level];
    
    // Create boss object
    const boss = {
      name: stats.name,
      level,
      x: this.gameWidth - 200,
      y: this.gameHeight - 250,
      width: stats.width,
      height: stats.height,
      health: stats.health * this.difficultyMultiplier,
      maxHealth: stats.health * this.difficultyMultiplier,
      damage: stats.damage,
      speed: stats.speed,
      attackPatterns: stats.attackPatterns,
      currentAttack: null,
      attackCooldown: 0,
      isActive: true,
      isAttacking: false,
      isHit: false,
      hitTime: 0,
      quote: stats.quote,
      
      // Boss specific properties
      state: 'idle', // idle, charging, summoning, attacking, etc.
      phase: 1, // Boss phases (gets harder at lower health)
      minionCount: 0,
      attackTimer: 0
    };
    
    return boss;
  }
  
  /**
   * Update boss behavior
   * @param {Object} boss - The boss to update
   * @param {Object} player - The player for targeting
   * @param {number} deltaTime - Time since last update in ms
   * @param {Function} spawnEnemy - Callback to spawn a minion
   * @returns {Array} - Any projectiles or effects created by boss
   */
  updateBoss(boss, player, deltaTime, spawnEnemy) {
    if (!boss.isActive) return [];
    
    // Update hit animation
    if (boss.isHit) {
      const hitDuration = 200; // ms
      if (Date.now() - boss.hitTime > hitDuration) {
        boss.isHit = false;
      }
    }
    
    // Update boss phase based on health percentage
    const healthPercent = boss.health / boss.maxHealth * 100;
    if (healthPercent < 30) {
      boss.phase = 3;
    } else if (healthPercent < 60) {
      boss.phase = 2;
    } else {
      boss.phase = 1;
    }
    
    // Attack cooldown
    if (boss.attackCooldown > 0) {
      boss.attackCooldown -= deltaTime;
    }
    
    // Boss AI by state
    if (boss.state === 'idle' && boss.attackCooldown <= 0) {
      // Choose a random attack pattern
      const attackIndex = Math.floor(Math.random() * boss.attackPatterns.length);
      boss.currentAttack = boss.attackPatterns[attackIndex];
      boss.state = boss.currentAttack;
      boss.isAttacking = true;
      boss.attackTimer = 0;
    }
    
    // Process based on current attack/state
    const projectiles = [];
    switch (boss.state) {
      case 'charge':
        return this.processBossCharge(boss, player, deltaTime);
      
      case 'summon':
        return this.processBossSummon(boss, deltaTime, spawnEnemy);
      
      case 'projectile':
      case 'throw':
      case 'shoot':
        return this.processBossRangedAttack(boss, player, deltaTime);
      
      case 'stomp':
      case 'rush':
      case 'call':
        return this.processBossSpecialAttack(boss, player, deltaTime);
      
      default:
        // Move toward player in idle state
        if (player.x < boss.x) {
          boss.x -= boss.speed;
        } else if (player.x > boss.x) {
          boss.x += boss.speed;
        }
    }
    
    return projectiles;
  }
  
  /**
   * Process boss charge attack
   * @param {Object} boss - The boss
   * @param {Object} player - The player
   * @param {number} deltaTime - Time since last update
   * @returns {Array} - Any effects created
   */
  processBossCharge(boss, player, deltaTime) {
    boss.attackTimer += deltaTime;
    
    if (boss.attackTimer < 1000) {
      // Wind up animation
      boss.state = 'charging';
    } else if (boss.attackTimer < 3000) {
      // Charge toward player
      const direction = player.x < boss.x ? -1 : 1;
      boss.x += direction * (boss.speed * 3);
    } else {
      // End attack
      boss.state = 'idle';
      boss.isAttacking = false;
      boss.attackCooldown = 3000; // 3 seconds cooldown
    }
    
    return [];
  }
  
  /**
   * Process boss summon minions attack
   * @param {Object} boss - The boss
   * @param {number} deltaTime - Time since last update
   * @param {Function} spawnEnemy - Callback to spawn enemies
   * @returns {Array} - Any effects created
   */
  processBossSummon(boss, deltaTime, spawnEnemy) {
    boss.attackTimer += deltaTime;
    
    // Spawn minions based on phase
    const maxMinions = boss.phase === 3 ? 4 : (boss.phase === 2 ? 3 : 2);
    
    if (boss.attackTimer < 2000 && boss.minionCount < maxMinions) {
      if (boss.attackTimer % 500 < 50 && boss.minionCount < maxMinions) {
        // Spawn enemy to the left of boss
        const enemyType = boss.phase === 3 ? this.enemyTypes.ARMORED : 
                          (boss.phase === 2 ? this.enemyTypes.FLYING : this.enemyTypes.BASIC);
        
        spawnEnemy(enemyType, boss.x - 50, boss.y - 50);
        boss.minionCount++;
      }
    } else if (boss.attackTimer >= 2000) {
      // End attack
      boss.state = 'idle';
      boss.isAttacking = false;
      boss.minionCount = 0;
      boss.attackCooldown = 5000; // 5 seconds cooldown
    }
    
    return [];
  }
  
  /**
   * Process boss ranged attack (projectile/throw/shoot)
   * @param {Object} boss - The boss
   * @param {Object} player - The player
   * @param {number} deltaTime - Time since last update
   * @returns {Array} - Any projectiles created
   */
  processBossRangedAttack(boss, player, deltaTime) {
    boss.attackTimer += deltaTime;
    
    const projectiles = [];
    
    if (boss.attackTimer < 500) {
      // Wind up animation
    } else if (boss.attackTimer < 2500) {
      // Fire projectiles at intervals
      const intervalTime = boss.phase === 3 ? 300 : (boss.phase === 2 ? 400 : 500);
      
      if (boss.attackTimer % intervalTime < 50) {
        // Create projectile
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        const speed = 5 + boss.phase;
        
        projectiles.push({
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height / 2,
          width: 20,
          height: 20,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          damage: boss.damage / 2,
          type: boss.state,
          lifespan: 3000, // 3 seconds
          createTime: Date.now()
        });
      }
    } else {
      // End attack
      boss.state = 'idle';
      boss.isAttacking = false;
      boss.attackCooldown = 4000; // 4 seconds cooldown
    }
    
    return projectiles;
  }
  
  /**
   * Process boss special attack (stomp/rush/call)
   * @param {Object} boss - The boss
   * @param {Object} player - The player
   * @param {number} deltaTime - Time since last update
   * @returns {Array} - Any effects created
   */
  processBossSpecialAttack(boss, player, deltaTime) {
    boss.attackTimer += deltaTime;
    
    if (boss.attackTimer < 1000) {
      // Wind up animation
    } else if (boss.attackTimer < 1500) {
      // Special attack effect
      const effects = [];
      
      if (boss.state === 'stomp') {
        // Stomp effect - create shockwave
        effects.push({
          x: boss.x - 100,
          y: boss.y + boss.height - 20,
          width: boss.width + 200,
          height: 40,
          type: 'shockwave',
          damage: boss.damage,
          lifespan: 500,
          createTime: Date.now()
        });
      } else if (boss.state === 'rush') {
        // Rush quickly toward player
        const rushSpeed = boss.speed * 5;
        boss.x += (player.x > boss.x) ? rushSpeed : -rushSpeed;
      } else if (boss.state === 'call') {
        // Call effect - area damage
        effects.push({
          x: boss.x - 50,
          y: boss.y - 50,
          width: boss.width + 100,
          height: boss.height + 100,
          type: 'aura',
          damage: Math.floor(boss.damage * 0.7),
          lifespan: 800,
          createTime: Date.now()
        });
      }
      
      return effects;
    } else {
      // End attack
      boss.state = 'idle';
      boss.isAttacking = false;
      boss.attackCooldown = 3500; // 3.5 seconds cooldown
    }
    
    return [];
  }
}

export default EnemyGenerator; 