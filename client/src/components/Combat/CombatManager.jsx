import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sword from './Sword';
import Enemy from './Enemy';
import Projectile from './Projectile';
import SoundManager from '../utils/SoundManager';
import './CombatManager.css';

/**
 * CombatManager - Handles all combat interactions
 * - Sword attacks
 * - Enemy spawning
 * - Collision detection
 * - Damage calculation
 * - Drop collection
 */
const CombatManager = ({ 
  playerPosition,
  playerDirection,
  playerHealth,
  maxPlayerHealth,
  onPlayerDamage,
  onPlayerHeal,
  onCollectRupee,
  currentMap,
  isAttacking,
  onAttackComplete,
  swordType = 'wooden'
}) => {
  const soundManager = SoundManager.getInstance();
  const [swordActive, setSwordActive] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [drops, setDrops] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const lastDamageTime = useRef(0);
  const DAMAGE_COOLDOWN = 1000; // 1 second invincibility

  // Handle sword attack
  useEffect(() => {
    if (isAttacking && !swordActive) {
      setSwordActive({
        position: playerPosition,
        direction: playerDirection,
        damage: getSwordDamage(swordType),
      });
    } else if (!isAttacking && swordActive) {
      // Reset sword if attack is cancelled
      setSwordActive(null);
    }
  }, [isAttacking, swordActive, playerPosition, playerDirection, swordType]);

  const handleAttackComplete = () => {
    setSwordActive(null);
    if (onAttackComplete) {
      onAttackComplete();
    }
  };

  // Handle spawning projectiles (sword beam, enemy projectiles)
  const handleSpawnProjectile = useCallback((projectileData) => {
    const newProjectile = {
      ...projectileData,
      id: `proj-${Date.now()}-${Math.random()}`,
    };
    setProjectiles(prev => [...prev, newProjectile]);
  }, []);

  // Handle projectile expiration
  const handleProjectileExpire = useCallback((projectileId) => {
    setProjectiles(prev => prev.filter(p => p.id !== projectileId));
  }, []);

  // Handle projectile hitting target
  const handleProjectileHit = useCallback((projectileId, target) => {
    // Remove projectile
    setProjectiles(prev => prev.filter(p => p.id !== projectileId));
    
    // Apply damage to target if it's an enemy
    if (target.type === 'enemy') {
      const updatedEnemy = {
        ...target,
        health: target.health - target.damageAmount,
      };

      if (updatedEnemy.health <= 0) {
        handleEnemyDefeat(target.id, [
          { type: Math.random() < 0.5 ? 'heart' : 'rupee', position: target.position }
        ]);
      } else {
        // Play enemy hit sound
        if (soundManager) {
          soundManager.playSound('enemy_hit', 0.3);
        }
        setEnemies(prev => 
          prev.map(e => e.id === target.id ? updatedEnemy : e)
        );
      }
    }
  }, []);

  // Check projectile collisions with enemies
  const checkProjectileCollision = useCallback((projPosition) => {
    for (const enemy of enemies) {
      const enemyHitbox = {
        x: enemy.position.x,
        y: enemy.position.y,
        width: 48,
        height: 48,
      };

      const projHitbox = {
        x: projPosition.x,
        y: projPosition.y,
        width: 32,
        height: 32,
      };

      if (checkCollision(projHitbox, enemyHitbox)) {
        return {
          type: 'enemy',
          id: enemy.id,
          position: enemy.position,
          damageAmount: 2, // Sword beam damage
          ...enemy,
        };
      }
    }
    return null;
  }, [enemies]);

  // Get sword damage based on type
  const getSwordDamage = (type) => {
    const damages = {
      wooden: 1,
      white: 2,
      magical: 4,
    };
    return damages[type] || 1;
  };

  // Spawn enemies based on current map
  useEffect(() => {
    if (!currentMap) return;

    // Define enemy spawns for different maps
    const enemySpawns = getEnemySpawnsForMap(currentMap);
    console.log(`🐙 Spawning ${enemySpawns.length} enemies for map: ${currentMap}`);
    setEnemies(enemySpawns);
  }, [currentMap]);

  const getEnemySpawnsForMap = (mapName) => {
    // Default spawn for testing (always spawn at least 2 enemies)
    const defaultSpawn = [
      { id: 'e-default-1', type: 'octorok', position: { x: 300, y: 250 }, health: 2 },
      { id: 'e-default-2', type: 'moblin', position: { x: 500, y: 350 }, health: 3 },
    ];

    // Map-specific spawn configurations
    const spawns = {
      'Overworld': [
        { id: 'e1', type: 'octorok', position: { x: 200, y: 200 }, health: 2 },
        { id: 'e2', type: 'octorok', position: { x: 400, y: 300 }, health: 2 },
      ],
      'Overworld 2': [
        { id: 'e3', type: 'moblin', position: { x: 300, y: 250 }, health: 3 },
        { id: 'e4', type: 'octorok', position: { x: 500, y: 400 }, health: 2 },
      ],
      'Overworld 3': [
        { id: 'e5', type: 'tektite', position: { x: 350, y: 300 }, health: 2 },
        { id: 'e6', type: 'moblin', position: { x: 600, y: 350 }, health: 3 },
      ],
      'Dungeon Level 1': [
        { id: 'e7', type: 'keese', position: { x: 250, y: 200 }, health: 1 },
        { id: 'e8', type: 'keese', position: { x: 450, y: 250 }, health: 1 },
        { id: 'e9', type: 'stalfos', position: { x: 350, y: 350 }, health: 4 },
      ],
    };

    // Return map-specific spawns or default spawns
    return spawns[mapName] || defaultSpawn;
  };

  // Handle enemy defeat
  const handleEnemyDefeat = useCallback((enemyId, droppedItems) => {
    // Play enemy defeat sound
    if (soundManager) {
      soundManager.playSound('enemy_defeat', 0.4);
    }
    
    // Remove enemy
    setEnemies(prev => prev.filter(e => e.id !== enemyId));

    // Add drops
    if (droppedItems && droppedItems.length > 0) {
      setDrops(prev => [
        ...prev,
        ...droppedItems.map((drop, index) => ({
          ...drop,
          id: `drop-${enemyId}-${index}`,
        }))
      ]);
    }
  }, [soundManager]);

  // Handle player taking damage
  const handlePlayerDamage = useCallback((damage) => {
    const now = Date.now();
    // Invincibility frames
    if (now - lastDamageTime.current < DAMAGE_COOLDOWN) {
      return;
    }

    lastDamageTime.current = now;
    if (onPlayerDamage) {
      onPlayerDamage(damage);
    }
  }, [onPlayerDamage]);

  // Check sword collision with enemies
  useEffect(() => {
    if (!swordActive || enemies.length === 0) return;

    const swordHitbox = getSwordHitbox(swordActive);

    enemies.forEach(enemy => {
      const enemyHitbox = {
        x: enemy.position.x,
        y: enemy.position.y,
        width: 48,
        height: 48,
      };

      if (checkCollision(swordHitbox, enemyHitbox)) {
        // Damage enemy
        const updatedEnemy = {
          ...enemy,
          health: enemy.health - swordActive.damage,
        };

        if (updatedEnemy.health <= 0) {
          // Enemy defeated
          handleEnemyDefeat(enemy.id, [
            { type: Math.random() < 0.5 ? 'heart' : 'rupee', position: enemy.position }
          ]);
        } else {
          // Play enemy hit sound
          if (soundManager) {
            soundManager.playSound('enemy_hit', 0.3);
          }
          // Update enemy health
          setEnemies(prev => 
            prev.map(e => e.id === enemy.id ? updatedEnemy : e)
          );
        }
      }
    });
  }, [swordActive, enemies, handleEnemyDefeat]);

  const getSwordHitbox = (sword) => {
    const baseX = sword.position.x;
    const baseY = sword.position.y;
    const size = 48;

    switch (sword.direction) {
      case 'up':
        return { x: baseX, y: baseY - size, width: 48, height: size };
      case 'down':
        return { x: baseX, y: baseY + 64, width: 48, height: size };
      case 'left':
        return { x: baseX - size, y: baseY, width: size, height: 48 };
      case 'right':
        return { x: baseX + 64, y: baseY, width: size, height: 48 };
      default:
        return { x: baseX, y: baseY, width: 48, height: 48 };
    }
  };

  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // Handle drop collection
  const handleDropCollection = useCallback((dropId) => {
    const drop = drops.find(d => d.id === dropId);
    if (!drop) return;

    // Check if player is close enough
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - drop.position.x, 2) + 
      Math.pow(playerPosition.y - drop.position.y, 2)
    );

    if (distance < 48) {
      // Collect drop
      switch (drop.type) {
        case 'heart':
          if (onPlayerHeal) {
            onPlayerHeal(2); // Heal 1 heart (2 half-hearts)
          }
          break;
        case 'rupee':
          if (onCollectRupee) {
            onCollectRupee(1);
          }
          break;
      }

      // Remove drop
      setDrops(prev => prev.filter(d => d.id !== dropId));
    }
  }, [drops, playerPosition, onPlayerHeal, onCollectRupee]);

  // Auto-collect drops when player is near
  useEffect(() => {
    drops.forEach(drop => {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - drop.position.x, 2) + 
        Math.pow(playerPosition.y - drop.position.y, 2)
      );

      if (distance < 48) {
        handleDropCollection(drop.id);
      }
    });
  }, [playerPosition, drops, handleDropCollection]);

  return (
    <div className="combat-manager">
      {/* Sword attack */}
      {swordActive && (
        <Sword
          position={swordActive.position}
          direction={swordActive.direction}
          damage={swordActive.damage}
          swordType={swordType}
          hasFullHealth={playerHealth === maxPlayerHealth}
          onSpawnProjectile={handleSpawnProjectile}
          onAttackComplete={handleAttackComplete}
        />
      )}

      {/* Projectiles (sword beams, enemy projectiles) */}
      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          type={proj.type}
          position={proj.position}
          direction={proj.direction}
          speed={proj.speed}
          damage={proj.damage}
          maxDistance={proj.maxDistance}
          checkCollision={checkProjectileCollision}
          onHit={(target) => handleProjectileHit(proj.id, target)}
          onExpire={() => handleProjectileExpire(proj.id)}
        />
      ))}

      {/* Enemies */}
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          type={enemy.type}
          position={enemy.position}
          health={enemy.health}
          onDefeat={(drops) => handleEnemyDefeat(enemy.id, drops)}
          onDamagePlayer={handlePlayerDamage}
          playerPosition={playerPosition}
        />
      ))}

      {/* Drops */}
      {drops.map(drop => (
        <div
          key={drop.id}
          className={`drop drop-${drop.type}`}
          style={{
            left: drop.position.x,
            top: drop.position.y,
          }}
          onClick={() => handleDropCollection(drop.id)}
        >
          {drop.type === 'heart' && '❤️'}
          {drop.type === 'rupee' && '💎'}
          {drop.type === 'key' && '🔑'}
        </div>
      ))}
    </div>
  );
};

export default CombatManager;

