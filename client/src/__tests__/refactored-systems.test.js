/**
 * Unit tests for the refactored game systems
 * These tests demonstrate how the clean, modular code is easily testable
 * compared to the original spaghetti code which was nearly impossible to test
 */

import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { Enemy, EnemyFactory, GroundMovementBehavior, MeleeAttackBehavior } from '../systems/EnemyBehaviorSystem';

describe('PhysicsSystem', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsSystem();
  });

  test('should apply gravity to falling entities', () => {
    const entity = {
      velocity: { x: 0, y: 0 }
    };

    physics.applyGravity(entity, 1);

    expect(entity.velocity.y).toBe(0.5);
  });

  test('should enforce terminal velocity', () => {
    const entity = {
      velocity: { x: 0, y: 30 } // Above terminal velocity
    };

    physics.applyGravity(entity, 1);

    expect(entity.velocity.y).toBe(20); // Should be capped at terminal velocity
  });

  test('should update entity position based on velocity', () => {
    const entity = {
      position: { x: 10, y: 10 },
      velocity: { x: 5, y: -3 }
    };

    physics.updatePosition(entity, 1);

    expect(entity.position.x).toBe(15);
    expect(entity.position.y).toBe(7);
  });

  test('should make entity jump when allowed', () => {
    const entity = {
      velocity: { x: 0, y: 0 }
    };

    const jumped = physics.jump(entity, true);

    expect(jumped).toBe(true);
    expect(entity.velocity.y).toBe(-12); // Jump force
  });

  test('should not jump when not allowed', () => {
    const entity = {
      velocity: { x: 0, y: 0 }
    };

    const jumped = physics.jump(entity, false);

    expect(jumped).toBe(false);
    expect(entity.velocity.y).toBe(0);
  });

  test('should set horizontal movement correctly', () => {
    const entity = {
      velocity: { x: 0, y: 0 }
    };

    physics.setHorizontalMovement(entity, 5, 'right');
    expect(entity.velocity.x).toBe(5);

    physics.setHorizontalMovement(entity, 5, 'left');
    expect(entity.velocity.x).toBe(-5);

    physics.setHorizontalMovement(entity, 5, 'stop');
    expect(entity.velocity.x).toBe(0);
  });

  test('should calculate distance between entities', () => {
    const entityA = { position: { x: 0, y: 0 } };
    const entityB = { position: { x: 3, y: 4 } };

    const distance = physics.getDistance(entityA, entityB);

    expect(distance).toBe(5); // 3-4-5 triangle
  });
});

describe('CollisionSystem', () => {
  let collision;

  beforeEach(() => {
    collision = new CollisionSystem();
  });

  test('should detect collision between rectangles', () => {
    const entityA = {
      position: { x: 10, y: 10 },
      size: { width: 20, height: 20 }
    };
    const entityB = {
      position: { x: 15, y: 15 },
      size: { width: 20, height: 20 }
    };

    const isColliding = collision.isColliding(entityA, entityB);

    expect(isColliding).toBe(true);
  });

  test('should not detect collision when rectangles are apart', () => {
    const entityA = {
      position: { x: 10, y: 10 },
      size: { width: 20, height: 20 }
    };
    const entityB = {
      position: { x: 50, y: 50 },
      size: { width: 20, height: 20 }
    };

    const isColliding = collision.isColliding(entityA, entityB);

    expect(isColliding).toBe(false);
  });

  test('should detect entity standing on platform', () => {
    const entity = {
      position: { x: 15, y: 35 },
      size: { width: 20, height: 20 },
      velocity: { x: 0, y: 0 }
    };
    const platform = {
      position: { x: 10, y: 50 },
      size: { width: 100, height: 20 }
    };

    const onPlatform = collision.isOnPlatform(entity, platform);

    expect(onPlatform).toBe(true);
  });

  test('should determine collision side correctly', () => {
    const movingEntity = {
      position: { x: 40, y: 10 },
      size: { width: 20, height: 20 }
    };
    const staticEntity = {
      position: { x: 50, y: 50 },
      size: { width: 20, height: 20 }
    };

    const side = collision.getCollisionSide(movingEntity, staticEntity);

    expect(side).toBe('top'); // Moving entity is above static entity
  });

  test('should resolve collision correctly', () => {
    const entity = {
      position: { x: 40, y: 45 },
      size: { width: 20, height: 20 },
      velocity: { x: 0, y: 5 }
    };
    const platform = {
      position: { x: 30, y: 50 },
      size: { width: 40, height: 20 }
    };

    collision.resolveCollision(entity, platform, 'top');

    expect(entity.position.y).toBe(30); // Should be on top of platform
    expect(entity.velocity.y).toBe(0); // Velocity should be stopped
  });

  test('should find collectible collisions', () => {
    const player = {
      position: { x: 15, y: 15 },
      size: { width: 20, height: 20 }
    };
    const collectibles = [
      {
        position: { x: 10, y: 10 },
        size: { width: 20, height: 20 },
        collected: false
      },
      {
        position: { x: 100, y: 100 },
        size: { width: 20, height: 20 },
        collected: false
      }
    ];

    const collisions = collision.getCollectibleCollisions(player, collectibles);

    expect(collisions).toHaveLength(1);
    expect(collisions[0]).toBe(collectibles[0]);
  });
});

describe('Enemy Behavior System', () => {
  test('should create basic enemy with correct behaviors', () => {
    const enemy = EnemyFactory.createBasicEnemy(50, 100);

    expect(enemy.type).toBe('basic');
    expect(enemy.position.x).toBe(50);
    expect(enemy.position.y).toBe(100);
    expect(enemy.movement).toBeInstanceOf(GroundMovementBehavior);
    expect(enemy.attack).toBeInstanceOf(MeleeAttackBehavior);
    expect(enemy.stats.damage).toBe(15);
  });

  test('should create flying enemy with different stats', () => {
    const enemy = EnemyFactory.createFlyingEnemy(100, 200);

    expect(enemy.type).toBe('flying');
    expect(enemy.flyingPattern).toBe('sine');
    expect(enemy.attackRange).toBe(150);
    expect(enemy.stats.damage).toBe(10);
  });

  test('should update enemy state machine', () => {
    const enemy = EnemyFactory.createBasicEnemy(0, 0);
    const initialState = enemy.stateMachine.getCurrentState();

    expect(initialState).toBe('idle');

    // Simulate time passing
    enemy.stateMachine.update(enemy, 1500); // More than idle duration

    const newState = enemy.stateMachine.getCurrentState();
    expect(newState).toBe('moving');
  });

  test('should handle enemy taking damage', () => {
    const enemy = EnemyFactory.createBasicEnemy(0, 0);
    const initialHealth = enemy.health;

    enemy.takeDamage(25);

    expect(enemy.health).toBe(initialHealth - 25);
    expect(enemy.isHit).toBe(true);
  });

  test('should mark enemy as dead when health reaches zero', () => {
    const enemy = EnemyFactory.createBasicEnemy(0, 0);

    enemy.takeDamage(999); // Massive damage

    expect(enemy.health).toBeLessThanOrEqual(0);
    expect(enemy.isDead).toBe(true);
  });

  test('should enforce world boundaries', () => {
    const enemy = EnemyFactory.createBasicEnemy(-50, 0); // Start outside left boundary
    const worldBounds = { width: 800, height: 600 };

    enemy.enforceWorldBounds(worldBounds);

    expect(enemy.position.x).toBe(0); // Should be moved to left boundary
    expect(enemy.velocity.x).toBeGreaterThan(0); // Should reverse direction
  });
});

describe('Integration Tests', () => {
  test('physics and collision systems should work together', () => {
    const physics = new PhysicsSystem();
    const collision = new CollisionSystem();

    const player = {
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: 0 },
      size: { width: 32, height: 32 }
    };

    const platform = {
      position: { x: 80, y: 140 },
      size: { width: 100, height: 20 }
    };

    // Apply gravity
    physics.applyGravity(player, 1);
    expect(player.velocity.y).toBe(0.5);

    // Update position
    physics.updatePosition(player, 1);
    expect(player.position.y).toBe(100.5);

    // Continue falling until collision
    for (let i = 0; i < 20; i++) {
      physics.applyGravity(player, 1);
      physics.updatePosition(player, 1);

      if (collision.isOnPlatform(player, platform)) {
        collision.resolveCollision(player, platform, 'top');
        break;
      }
    }

    expect(player.position.y).toBe(platform.position.y - player.size.height);
    expect(player.velocity.y).toBe(0);
  });

  test('enemy should use physics and collision systems correctly', () => {
    const enemy = EnemyFactory.createBasicEnemy(100, 50);
    const platforms = [
      {
        position: { x: 80, y: 100 },
        size: { width: 100, height: 20 }
      }
    ];

    const context = {
      platforms,
      delta: 1,
      worldBounds: { width: 800, height: 600 }
    };

    // Enemy should fall and land on platform
    for (let i = 0; i < 10; i++) {
      enemy.update(context);
      
      if (enemy.position.y >= platforms[0].position.y - enemy.size.height) {
        break;
      }
    }

    expect(enemy.position.y).toBe(platforms[0].position.y - enemy.size.height);
  });
});

// Performance comparison mock (demonstrates the testability improvement)
describe('Performance Comparison', () => {
  test('refactored systems are faster and more predictable', () => {
    const startTime = performance.now();
    
    // Create and update multiple enemies
    const enemies = [];
    for (let i = 0; i < 100; i++) {
      enemies.push(EnemyFactory.createBasicEnemy(i * 10, 100));
    }

    const context = {
      platforms: [{ position: { x: 0, y: 150 }, size: { width: 1000, height: 20 } }],
      delta: 1,
      worldBounds: { width: 1000, height: 600 }
    };

    enemies.forEach(enemy => enemy.update(context));

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete quickly with modular systems
    expect(duration).toBeLessThan(50); // milliseconds
    
    // All enemies should have consistent behavior
    enemies.forEach(enemy => {
      expect(enemy.stateMachine.getCurrentState()).toMatch(/idle|moving|attacking/);
    });
  });
});