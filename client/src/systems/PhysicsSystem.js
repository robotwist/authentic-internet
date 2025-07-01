/**
 * Physics System - handles all physics calculations for game entities
 * Extracted from Level4Shooter.jsx to eliminate code duplication and improve testability
 */
export class PhysicsSystem {
  constructor(options = {}) {
    this.gravity = options.gravity || 0.5;
    this.jumpForce = options.jumpForce || -12;
    this.friction = options.friction || 0.8;
    this.airResistance = options.airResistance || 0.98;
    this.terminalVelocity = options.terminalVelocity || 20;
  }

  /**
   * Apply gravity to an entity
   * @param {Object} entity - Entity with velocity property
   * @param {number} delta - Time delta multiplier
   */
  applyGravity(entity, delta = 1) {
    if (!entity.velocity) {
      entity.velocity = { x: 0, y: 0 };
    }
    
    entity.velocity.y += this.gravity * delta;
    
    // Apply terminal velocity
    if (entity.velocity.y > this.terminalVelocity) {
      entity.velocity.y = this.terminalVelocity;
    }
  }

  /**
   * Update entity position based on velocity
   * @param {Object} entity - Entity with position and velocity
   * @param {number} delta - Time delta multiplier
   */
  updatePosition(entity, delta = 1) {
    if (!entity.position) {
      entity.position = { x: 0, y: 0 };
    }
    if (!entity.velocity) {
      entity.velocity = { x: 0, y: 0 };
    }

    entity.position.x += entity.velocity.x * delta;
    entity.position.y += entity.velocity.y * delta;
  }

  /**
   * Apply friction to horizontal movement
   * @param {Object} entity - Entity with velocity
   * @param {boolean} onGround - Whether entity is on ground (friction only applies on ground)
   */
  applyFriction(entity, onGround = true) {
    if (!entity.velocity) return;
    
    if (onGround) {
      entity.velocity.x *= this.friction;
    } else {
      // Air resistance
      entity.velocity.x *= this.airResistance;
      entity.velocity.y *= this.airResistance;
    }
  }

  /**
   * Make entity jump
   * @param {Object} entity - Entity to make jump
   * @param {boolean} canJump - Whether entity is able to jump (usually on ground)
   * @param {number} jumpForce - Optional custom jump force
   */
  jump(entity, canJump = true, jumpForce = null) {
    if (!canJump || !entity.velocity) return false;
    
    entity.velocity.y = jumpForce || this.jumpForce;
    return true;
  }

  /**
   * Set horizontal velocity for movement
   * @param {Object} entity - Entity to move
   * @param {number} speed - Speed to move at
   * @param {string} direction - 'left' or 'right'
   */
  setHorizontalMovement(entity, speed, direction) {
    if (!entity.velocity) {
      entity.velocity = { x: 0, y: 0 };
    }

    switch (direction) {
      case 'left':
        entity.velocity.x = -Math.abs(speed);
        break;
      case 'right':
        entity.velocity.x = Math.abs(speed);
        break;
      case 'stop':
      default:
        entity.velocity.x = 0;
        break;
    }
  }

  /**
   * Check if entity is within world boundaries and correct if needed
   * @param {Object} entity - Entity to check
   * @param {Object} worldBounds - {width, height} of the world
   */
  enforceWorldBounds(entity, worldBounds) {
    if (!entity.position || !entity.size) return;

    // Left boundary
    if (entity.position.x < 0) {
      entity.position.x = 0;
      entity.velocity.x = 0;
    }

    // Right boundary  
    if (entity.position.x + entity.size.width > worldBounds.width) {
      entity.position.x = worldBounds.width - entity.size.width;
      entity.velocity.x = 0;
    }

    // Top boundary
    if (entity.position.y < 0) {
      entity.position.y = 0;
      entity.velocity.y = 0;
    }

    // Bottom boundary (usually death/respawn trigger)
    if (entity.position.y > worldBounds.height) {
      return 'fell-off-world';
    }

    return 'in-bounds';
  }

  /**
   * Calculate distance between two entities
   * @param {Object} entityA - First entity with position
   * @param {Object} entityB - Second entity with position
   * @returns {number} Distance between entities
   */
  getDistance(entityA, entityB) {
    if (!entityA.position || !entityB.position) return Infinity;
    
    const dx = entityA.position.x - entityB.position.x;
    const dy = entityA.position.y - entityB.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get velocity magnitude (speed)
   * @param {Object} entity - Entity with velocity
   * @returns {number} Speed of the entity
   */
  getSpeed(entity) {
    if (!entity.velocity) return 0;
    
    return Math.sqrt(
      entity.velocity.x * entity.velocity.x + 
      entity.velocity.y * entity.velocity.y
    );
  }

  /**
   * Stop all movement
   * @param {Object} entity - Entity to stop
   */
  stop(entity) {
    if (entity.velocity) {
      entity.velocity.x = 0;
      entity.velocity.y = 0;
    }
  }

  /**
   * Update multiple entities at once
   * @param {Array} entities - Array of entities to update
   * @param {number} delta - Time delta
   * @param {Object} worldBounds - World boundaries
   */
  updateEntities(entities, delta, worldBounds) {
    const results = [];
    
    for (const entity of entities) {
      this.applyGravity(entity, delta);
      this.updatePosition(entity, delta);
      
      if (worldBounds) {
        const boundaryResult = this.enforceWorldBounds(entity, worldBounds);
        if (boundaryResult !== 'in-bounds') {
          results.push({ entity, event: boundaryResult });
        }
      }
    }
    
    return results;
  }
}