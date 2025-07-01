/**
 * Collision System - handles all collision detection and response
 * Extracted from Level4Shooter.jsx and other components to eliminate duplication
 */
export class CollisionSystem {
  constructor() {
    this.collisionTypes = {
      RECTANGLE: 'rectangle',
      CIRCLE: 'circle',
      POINT: 'point'
    };
  }

  /**
   * Check if two rectangular entities are colliding
   * @param {Object} entityA - First entity with position and size
   * @param {Object} entityB - Second entity with position and size
   * @returns {boolean} True if colliding
   */
  isColliding(entityA, entityB) {
    return (
      entityA.position.x + entityA.size.width > entityB.position.x &&
      entityA.position.x < entityB.position.x + entityB.size.width &&
      entityA.position.y + entityA.size.height > entityB.position.y &&
      entityA.position.y < entityB.position.y + entityB.size.height
    );
  }

  /**
   * Check if entity is on top of a platform (for ground detection)
   * @param {Object} entity - Entity to check
   * @param {Object} platform - Platform to check against
   * @param {number} tolerance - Pixel tolerance for "on ground" detection
   * @returns {boolean} True if entity is standing on platform
   */
  isOnPlatform(entity, platform, tolerance = 10) {
    return (
      entity.position.x + entity.size.width > platform.position.x &&
      entity.position.x < platform.position.x + platform.size.width &&
      entity.position.y + entity.size.height >= platform.position.y &&
      entity.position.y + entity.size.height <= platform.position.y + tolerance &&
      entity.velocity && entity.velocity.y >= 0 // Falling or stationary
    );
  }

  /**
   * Find all platforms an entity is colliding with
   * @param {Object} entity - Entity to check
   * @param {Array} platforms - Array of platform objects
   * @returns {Array} Array of colliding platforms
   */
  getPlatformCollisions(entity, platforms) {
    return platforms.filter(platform => this.isColliding(entity, platform));
  }

  /**
   * Find the platform an entity is standing on
   * @param {Object} entity - Entity to check
   * @param {Array} platforms - Array of platform objects
   * @returns {Object|null} Platform entity is standing on, or null
   */
  getGroundPlatform(entity, platforms) {
    return platforms.find(platform => this.isOnPlatform(entity, platform)) || null;
  }

  /**
   * Check collision between entity and collectibles
   * @param {Object} entity - Entity to check (usually player)
   * @param {Array} collectibles - Array of collectible objects
   * @returns {Array} Array of collected items
   */
  getCollectibleCollisions(entity, collectibles) {
    return collectibles.filter(collectible => 
      !collectible.collected && this.isColliding(entity, collectible)
    );
  }

  /**
   * Check if a point is inside a rectangular area
   * @param {Object} point - {x, y} coordinates
   * @param {Object} rectangle - Rectangle with position and size
   * @returns {boolean} True if point is inside rectangle
   */
  isPointInRectangle(point, rectangle) {
    return (
      point.x >= rectangle.position.x &&
      point.x <= rectangle.position.x + rectangle.size.width &&
      point.y >= rectangle.position.y &&
      point.y <= rectangle.position.y + rectangle.size.height
    );
  }

  /**
   * Get collision side (useful for determining bounce direction)
   * @param {Object} entityA - Moving entity
   * @param {Object} entityB - Static entity (like platform)
   * @returns {string} 'top', 'bottom', 'left', or 'right'
   */
  getCollisionSide(entityA, entityB) {
    const centerAX = entityA.position.x + entityA.size.width / 2;
    const centerAY = entityA.position.y + entityA.size.height / 2;
    const centerBX = entityB.position.x + entityB.size.width / 2;
    const centerBY = entityB.position.y + entityB.size.height / 2;

    const deltaX = centerAX - centerBX;
    const deltaY = centerAY - centerBY;

    const overlapX = (entityA.size.width + entityB.size.width) / 2 - Math.abs(deltaX);
    const overlapY = (entityA.size.height + entityB.size.height) / 2 - Math.abs(deltaY);

    if (overlapX > overlapY) {
      return deltaY > 0 ? 'top' : 'bottom';
    } else {
      return deltaX > 0 ? 'right' : 'left';
    }
  }

  /**
   * Resolve collision between entity and platform
   * @param {Object} entity - Entity that collided
   * @param {Object} platform - Platform that was hit
   * @param {string} side - Side of collision from getCollisionSide()
   */
  resolveCollision(entity, platform, side = null) {
    if (!entity.velocity) {
      entity.velocity = { x: 0, y: 0 };
    }

    const collisionSide = side || this.getCollisionSide(entity, platform);

    switch (collisionSide) {
      case 'top':
        entity.position.y = platform.position.y - entity.size.height;
        entity.velocity.y = 0;
        break;
      case 'bottom':
        entity.position.y = platform.position.y + platform.size.height;
        entity.velocity.y = 0;
        break;
      case 'left':
        entity.position.x = platform.position.x - entity.size.width;
        entity.velocity.x = 0;
        break;
      case 'right':
        entity.position.x = platform.position.x + platform.size.width;
        entity.velocity.x = 0;
        break;
    }
  }

  /**
   * Check collision between circular entities
   * @param {Object} entityA - First entity with position and radius
   * @param {Object} entityB - Second entity with position and radius
   * @returns {boolean} True if colliding
   */
  isCircleColliding(entityA, entityB) {
    const dx = entityA.position.x - entityB.position.x;
    const dy = entityA.position.y - entityB.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusSum = (entityA.radius || 0) + (entityB.radius || 0);
    
    return distance < radiusSum;
  }

  /**
   * Sweep collision detection - check if entity will collide during movement
   * @param {Object} entity - Entity to check
   * @param {Object} targetPosition - Where entity wants to move to
   * @param {Array} obstacles - Array of obstacles to check against
   * @returns {Object|null} First obstacle that would be hit, or null
   */
  sweepCollision(entity, targetPosition, obstacles) {
    // Create a temporary entity at target position
    const tempEntity = {
      position: targetPosition,
      size: entity.size
    };

    // Check each obstacle
    for (const obstacle of obstacles) {
      if (this.isColliding(tempEntity, obstacle)) {
        return obstacle;
      }
    }

    return null;
  }

  /**
   * Get safe position near current position (useful for unsticking entities)
   * @param {Object} entity - Entity to reposition
   * @param {Array} obstacles - Array of obstacles to avoid
   * @param {number} maxDistance - Maximum distance to search
   * @returns {Object|null} Safe position {x, y} or null if none found
   */
  getSafePosition(entity, obstacles, maxDistance = 50) {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 },  // Right
    ];

    for (let distance = 1; distance <= maxDistance; distance++) {
      for (const dir of directions) {
        const testPosition = {
          x: entity.position.x + dir.x * distance,
          y: entity.position.y + dir.y * distance
        };

        const tempEntity = {
          position: testPosition,
          size: entity.size
        };

        // Check if this position is safe
        let isSafe = true;
        for (const obstacle of obstacles) {
          if (this.isColliding(tempEntity, obstacle)) {
            isSafe = false;
            break;
          }
        }

        if (isSafe) {
          return testPosition;
        }
      }
    }

    return null;
  }

  /**
   * Update and resolve all collisions for multiple entities
   * @param {Array} entities - Array of entities to check
   * @param {Array} platforms - Array of platforms/obstacles
   * @returns {Array} Array of collision events
   */
  updateCollisions(entities, platforms) {
    const collisionEvents = [];

    entities.forEach(entity => {
      // Check platform collisions
      const platformCollisions = this.getPlatformCollisions(entity, platforms);
      
      platformCollisions.forEach(platform => {
        this.resolveCollision(entity, platform);
        collisionEvents.push({
          type: 'platform',
          entity,
          obstacle: platform,
          side: this.getCollisionSide(entity, platform)
        });
      });

      // Check if entity is on ground
      const groundPlatform = this.getGroundPlatform(entity, platforms);
      if (groundPlatform) {
        entity.onGround = true;
        entity.groundPlatform = groundPlatform;
      } else {
        entity.onGround = false;
        entity.groundPlatform = null;
      }
    });

    return collisionEvents;
  }
}