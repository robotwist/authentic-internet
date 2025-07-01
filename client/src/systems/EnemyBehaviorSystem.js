/**
 * Enemy Behavior System - uses strategy pattern to handle different enemy behaviors
 * Extracted from the complex switch statement logic in EnemyGenerator.js
 */

// Base behavior class
class EnemyBehavior {
  update(enemy, context) {
    throw new Error('update() must be implemented by behavior subclass');
  }
}

// Movement behaviors
export class GroundMovementBehavior extends EnemyBehavior {
  update(enemy, { platforms, delta }) {
    // Apply gravity
    enemy.velocity.y += 0.5 * delta;
    
    // Update position
    enemy.position.x += enemy.velocity.x * delta;
    enemy.position.y += enemy.velocity.y * delta;
    
    // Check ground collision
    let onGround = false;
    for (const platform of platforms) {
      if (this.checkPlatformCollision(enemy, platform)) {
        enemy.position.y = platform.position.y - enemy.size.height;
        enemy.velocity.y = 0;
        onGround = true;
        break;
      }
    }
    
    // Reverse direction at platform edges
    if (onGround) {
      const currentPlatform = this.findCurrentPlatform(enemy, platforms);
      if (this.shouldReverseDirection(enemy, currentPlatform)) {
        enemy.velocity.x *= -1;
      }
    }
  }

  checkPlatformCollision(enemy, platform) {
    return (
      enemy.position.x + enemy.size.width > platform.position.x &&
      enemy.position.x < platform.position.x + platform.size.width &&
      enemy.position.y + enemy.size.height >= platform.position.y &&
      enemy.position.y + enemy.size.height <= platform.position.y + 10 &&
      enemy.velocity.y > 0
    );
  }

  findCurrentPlatform(enemy, platforms) {
    return platforms.find(platform => 
      enemy.position.y + enemy.size.height === platform.position.y &&
      enemy.position.x + enemy.size.width > platform.position.x &&
      enemy.position.x < platform.position.x + platform.size.width
    );
  }

  shouldReverseDirection(enemy, platform) {
    if (!platform) return true;
    
    if (enemy.velocity.x < 0 && enemy.position.x <= platform.position.x) {
      return true;
    }
    if (enemy.velocity.x > 0 && enemy.position.x + enemy.size.width >= platform.position.x + platform.size.width) {
      return true;
    }
    return false;
  }
}

export class FlyingMovementBehavior extends EnemyBehavior {
  update(enemy, { player, delta }) {
    // Different flying patterns
    switch (enemy.flyingPattern) {
      case 'sine':
        this.updateSinePattern(enemy, delta);
        break;
      case 'zigzag':
        this.updateZigzagPattern(enemy, delta);
        break;
      case 'targeted':
        this.updateTargetedPattern(enemy, player, delta);
        break;
      default:
        this.updateSinePattern(enemy, delta);
    }
    
    // Update position
    enemy.position.x += enemy.velocity.x * delta;
    enemy.position.y += enemy.velocity.y * delta;
    
    this.enforceFlightBounds(enemy);
  }

  updateSinePattern(enemy, delta) {
    enemy.flyingOffset = (enemy.flyingOffset || 0) + 0.05 * delta;
    enemy.velocity.y = Math.sin(enemy.flyingOffset) * 2;
  }

  updateZigzagPattern(enemy, delta) {
    enemy.flyingOffset = (enemy.flyingOffset || 0) + 0.02 * delta;
    if (Math.floor(enemy.flyingOffset) % 2 === 0) {
      enemy.velocity.y = 2 * (enemy.flyingDirection || 1);
    } else {
      enemy.velocity.y = -2 * (enemy.flyingDirection || 1);
    }
  }

  updateTargetedPattern(enemy, player, delta) {
    const dy = player.position.y - enemy.position.y;
    enemy.velocity.y = dy > 0 ? 1.5 : (dy < 0 ? -1.5 : 0);
  }

  enforceFlightBounds(enemy) {
    // Keep flying enemies within bounds
    if (enemy.position.y < 50) {
      enemy.position.y = 50;
      enemy.velocity.y = Math.abs(enemy.velocity.y);
    }
    if (enemy.position.y > 400) {
      enemy.position.y = 400;
      enemy.velocity.y = -Math.abs(enemy.velocity.y);
    }
  }
}

export class TrackingMovementBehavior extends EnemyBehavior {
  update(enemy, { player, platforms, delta }) {
    // Apply gravity
    enemy.velocity.y += 0.5 * delta;
    
    // Track player horizontally when on ground
    let onGround = false;
    for (const platform of platforms) {
      if (this.checkGroundCollision(enemy, platform)) {
        enemy.position.y = platform.position.y - enemy.size.height;
        enemy.velocity.y = 0;
        onGround = true;
        
        // Move toward player
        const speed = enemy.stats?.speed || 1;
        if (player.position.x < enemy.position.x) {
          enemy.velocity.x = -speed * 0.8;
        } else {
          enemy.velocity.x = speed * 0.8;
        }
        break;
      }
    }
    
    // Update position
    enemy.position.x += enemy.velocity.x * delta;
    enemy.position.y += enemy.velocity.y * delta;
  }

  checkGroundCollision(enemy, platform) {
    return (
      enemy.position.x + enemy.size.width > platform.position.x &&
      enemy.position.x < platform.position.x + platform.size.width &&
      enemy.position.y + enemy.size.height >= platform.position.y &&
      enemy.position.y + enemy.size.height <= platform.position.y + 10 &&
      enemy.velocity.y > 0
    );
  }
}

// Attack behaviors
export class MeleeAttackBehavior extends EnemyBehavior {
  update(enemy, { player, delta }) {
    if (!enemy.attackCooldown) enemy.attackCooldown = 0;
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= delta;
      return;
    }

    const distance = this.getDistance(enemy.position, player.position);
    if (distance < enemy.attackRange || 50) {
      this.performMeleeAttack(enemy, player);
      enemy.attackCooldown = 1000; // 1 second cooldown
    }
  }

  performMeleeAttack(enemy, player) {
    // Create attack hitbox or damage player directly
    enemy.isAttacking = true;
    setTimeout(() => {
      enemy.isAttacking = false;
    }, 300);
  }

  getDistance(posA, posB) {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export class RangedAttackBehavior extends EnemyBehavior {
  update(enemy, { player, delta, createProjectile }) {
    if (!enemy.attackCooldown) enemy.attackCooldown = 0;
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= delta;
      return;
    }

    const distance = this.getDistance(enemy.position, player.position);
    if (distance < (enemy.attackRange || 200) && distance > 50) {
      this.performRangedAttack(enemy, player, createProjectile);
      enemy.attackCooldown = 2000; // 2 second cooldown
    }
  }

  performRangedAttack(enemy, player, createProjectile) {
    const angle = Math.atan2(
      player.position.y - enemy.position.y,
      player.position.x - enemy.position.x
    );
    
    if (createProjectile) {
      createProjectile({
        position: { ...enemy.position },
        velocity: {
          x: Math.cos(angle) * 3,
          y: Math.sin(angle) * 3
        },
        damage: enemy.stats?.damage || 10,
        source: enemy
      });
    }
  }

  getDistance(posA, posB) {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// State management
export class EnemyStateMachine {
  constructor() {
    this.currentState = 'idle';
    this.states = {
      idle: { duration: 1000 },
      moving: { duration: 2000 },
      attacking: { duration: 500 },
      hit: { duration: 200 }
    };
    this.stateTimer = 0;
  }

  update(enemy, delta) {
    this.stateTimer += delta;
    
    // Handle hit state
    if (enemy.isHit) {
      this.currentState = 'hit';
      if (this.stateTimer > this.states.hit.duration) {
        enemy.isHit = false;
        this.currentState = 'idle';
        this.stateTimer = 0;
      }
      return;
    }

    // Handle other state transitions
    const currentStateConfig = this.states[this.currentState];
    if (this.stateTimer > currentStateConfig.duration) {
      this.transitionToNextState(enemy);
      this.stateTimer = 0;
    }
  }

  transitionToNextState(enemy) {
    switch (this.currentState) {
      case 'idle':
        this.currentState = 'moving';
        break;
      case 'moving':
        this.currentState = Math.random() < 0.3 ? 'attacking' : 'idle';
        break;
      case 'attacking':
        this.currentState = 'idle';
        break;
      default:
        this.currentState = 'idle';
    }
  }

  getCurrentState() {
    return this.currentState;
  }
}

// Main enemy entity
export class Enemy {
  constructor(type, movementBehavior, attackBehavior, options = {}) {
    this.type = type;
    this.movement = movementBehavior;
    this.attack = attackBehavior;
    this.stateMachine = new EnemyStateMachine();
    
    // Default properties
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 1, y: 0 };
    this.size = { width: 32, height: 32 };
    this.health = 100;
    this.isHit = false;
    this.isAttacking = false;
    this.attackCooldown = 0;
    
    // Apply options
    Object.assign(this, options);
  }

  update(context) {
    // Update state machine
    this.stateMachine.update(this, context.delta);
    
    // Update behaviors based on current state
    const state = this.stateMachine.getCurrentState();
    
    if (state === 'moving' || state === 'idle') {
      this.movement.update(this, context);
    }
    
    if (state === 'attacking' || (state === 'moving' && Math.random() < 0.1)) {
      this.attack.update(this, context);
    }
    
    // Enforce world bounds
    this.enforceWorldBounds(context.worldBounds);
  }

  enforceWorldBounds(bounds) {
    if (bounds) {
      if (this.position.x < 0) {
        this.position.x = 0;
        this.velocity.x = Math.abs(this.velocity.x);
      }
      if (this.position.x + this.size.width > bounds.width) {
        this.position.x = bounds.width - this.size.width;
        this.velocity.x = -Math.abs(this.velocity.x);
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    this.isHit = true;
    this.stateMachine.stateTimer = 0; // Reset state timer for hit reaction
    
    if (this.health <= 0) {
      this.isDead = true;
    }
  }
}

// Factory for creating different enemy types
export class EnemyFactory {
  static createBasicEnemy(x, y) {
    return new Enemy(
      'basic',
      new GroundMovementBehavior(),
      new MeleeAttackBehavior(),
      {
        position: { x, y },
        stats: { speed: 1, damage: 15, health: 50 }
      }
    );
  }

  static createFlyingEnemy(x, y) {
    return new Enemy(
      'flying',
      new FlyingMovementBehavior(),
      new RangedAttackBehavior(),
      {
        position: { x, y },
        flyingPattern: 'sine',
        stats: { speed: 2, damage: 10, health: 30 },
        attackRange: 150
      }
    );
  }

  static createArmoredEnemy(x, y) {
    return new Enemy(
      'armored',
      new TrackingMovementBehavior(),
      new MeleeAttackBehavior(),
      {
        position: { x, y },
        stats: { speed: 0.8, damage: 25, health: 80 },
        attackRange: 60
      }
    );
  }
}