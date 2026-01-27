import React, { useState, useEffect, useCallback, useRef } from "react";
import Sword from "./Sword";
import Enemy from "./Enemy";
import Projectile from "./Projectile";
import SoundManager from "../utils/SoundManager";
import ICONS from "../../constants/Icons";
import { maybeAwardFunnyXp } from "../../utils/funnyXp";
import "./CombatManager.css";

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
  onGainExperience, // NEW: XP reward callback
  onEnemyDefeat, // NEW: Track enemy defeats for quests
  currentMap,
  isAttacking,
  onAttackComplete,
  swordType = "wooden",
  characterAttack = 1, // Character's attack stat from leveling
}) => {
  const soundManager = SoundManager.getInstance();
  const [swordActive, setSwordActive] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [drops, setDrops] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const lastDamageTime = useRef(0);
  const DAMAGE_COOLDOWN = 1000; // 1 second invincibility

  // Get sword damage based on type + character attack stat
  const getSwordDamage = useCallback(
    (type) => {
      const baseDamages = {
        wooden: 1,
        white: 2,
        magical: 4,
      };
      const baseDamage = baseDamages[type] || 1;
      // Total damage = base sword damage + character attack stat
      return baseDamage + characterAttack;
    },
    [characterAttack],
  );

  // Handle sword attack
  useEffect(() => {
    if (isAttacking && !swordActive) {
      const totalDamage = getSwordDamage(swordType);
      console.log(
        `⚔️ Sword attack damage: ${totalDamage} (base: ${swordType}, attack: ${characterAttack})`,
      );
      setSwordActive({
        position: playerPosition,
        direction: playerDirection,
        damage: totalDamage,
      });
    } else if (!isAttacking && swordActive) {
      // Reset sword if attack is cancelled
      setSwordActive(null);
    }
  }, [
    isAttacking,
    swordActive,
    playerPosition,
    playerDirection,
    swordType,
    characterAttack,
    getSwordDamage,
  ]);

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
    setProjectiles((prev) => [...prev, newProjectile]);
  }, []);

  // Handle projectile expiration
  const handleProjectileExpire = useCallback((projectileId) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));
  }, []);

  // Handle projectile hitting target
  const handleProjectileHit = useCallback((projectileId, target) => {
    // Remove projectile
    setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));

    // Apply damage to target if it's an enemy
    if (target.type === "enemy") {
      const updatedEnemy = {
        ...target,
        health: target.health - target.damageAmount,
      };

      if (updatedEnemy.health <= 0) {
        handleEnemyDefeat(
          target.id,
          [
            {
              type: Math.random() < 0.5 ? "heart" : "rupee",
              position: target.position,
            },
          ],
          target.type || "default",
        ); // Pass enemy type for XP
      } else {
        // Play enemy hit sound
        if (soundManager) {
          soundManager.playSound("enemy_hit", 0.3);
        }
        setEnemies((prev) =>
          prev.map((e) => (e.id === target.id ? updatedEnemy : e)),
        );
      }
    }
  }, []);

  // Check projectile collisions with enemies
  const checkProjectileCollision = useCallback(
    (projPosition) => {
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
            type: "enemy",
            id: enemy.id,
            position: enemy.position,
            damageAmount: 2, // Sword beam damage
            ...enemy,
          };
        }
      }
      return null;
    },
    [enemies],
  );

  // Spawn enemies based on current map
  useEffect(() => {
    if (!currentMap) return;

    // Define enemy spawns for different maps
    const enemySpawns = getEnemySpawnsForMap(currentMap);
    console.log(
      `🐙 Spawning ${enemySpawns.length} enemies for map: ${currentMap}`,
    );
    setEnemies(enemySpawns);
  }, [currentMap]);

  const getEnemySpawnsForMap = (mapName) => {
    // Default spawn for testing (always spawn at least 2 enemies)
    const defaultSpawn = [
      {
        id: "e-default-1",
        type: "octorok",
        position: { x: 300, y: 250 },
        health: 2,
      },
      {
        id: "e-default-2",
        type: "moblin",
        position: { x: 500, y: 350 },
        health: 3,
      },
    ];

    // Map-specific spawn configurations
    const spawns = {
      Overworld: [
        { id: "e1", type: "octorok", position: { x: 200, y: 200 }, health: 2 },
        { id: "e2", type: "octorok", position: { x: 400, y: 300 }, health: 2 },
      ],
      "Overworld 2": [
        { id: "e3", type: "moblin", position: { x: 300, y: 250 }, health: 3 },
        { id: "e4", type: "octorok", position: { x: 500, y: 400 }, health: 2 },
      ],
      "Overworld 3": [
        { id: "e5", type: "tektite", position: { x: 350, y: 300 }, health: 2 },
        { id: "e6", type: "moblin", position: { x: 600, y: 350 }, health: 3 },
      ],
      "Dungeon Level 1": [
        { id: "e7", type: "keese", position: { x: 250, y: 200 }, health: 1 },
        { id: "e8", type: "keese", position: { x: 450, y: 250 }, health: 1 },
        { id: "e9", type: "stalfos", position: { x: 350, y: 350 }, health: 4 },
      ],
    };

    // Return map-specific spawns or default spawns
    return spawns[mapName] || defaultSpawn;
  };

  // XP rewards by enemy type
  const XP_REWARDS = {
    octorok: 10,
    moblin: 15,
    tektite: 12,
    keese: 8,
    stalfos: 20,
    default: 5,
  };

  // Handle enemy defeat
  const handleEnemyDefeat = useCallback(
    (enemyId, droppedItems, enemyType = "default") => {
      // Play enemy defeat sound
      if (soundManager) {
        soundManager.playSound("enemy_defeat", 0.4);
      }

      // Remove enemy
      setEnemies((prev) => prev.filter((e) => e.id !== enemyId));

      // Award XP
      const xpReward = XP_REWARDS[enemyType] || XP_REWARDS.default;
      if (onGainExperience) {
        onGainExperience(xpReward, `Defeated ${enemyType}`);
        maybeAwardFunnyXp(onGainExperience, 0.025);
      }

      // Track enemy defeat for quests
      if (onEnemyDefeat) {
        onEnemyDefeat(enemyId, enemyType);
      }

      // Add drops
      if (droppedItems && droppedItems.length > 0) {
        setDrops((prev) => [
          ...prev,
          ...droppedItems.map((drop, index) => ({
            ...drop,
            id: `drop-${enemyId}-${index}`,
          })),
        ]);
      }
    },
    [soundManager, onGainExperience, onEnemyDefeat],
  );

  // Handle player taking damage
  const handlePlayerDamage = useCallback(
    (damage) => {
      const now = Date.now();
      // Invincibility frames
      if (now - lastDamageTime.current < DAMAGE_COOLDOWN) {
        return;
      }

      lastDamageTime.current = now;
      if (onPlayerDamage) {
        onPlayerDamage(damage);
      }
    },
    [onPlayerDamage],
  );

  // Check sword collision with enemies
  useEffect(() => {
    if (!swordActive || enemies.length === 0) return;

    const swordHitbox = getSwordHitbox(swordActive);
    let hitProcessed = false;

    enemies.forEach((enemy) => {
      const enemyHitbox = {
        x: enemy.position.x,
        y: enemy.position.y,
        width: 48,
        height: 48,
      };

      if (!hitProcessed && checkCollision(swordHitbox, enemyHitbox)) {
        hitProcessed = true; // Only hit one enemy per swing

        // Damage enemy
        const updatedEnemy = {
          ...enemy,
          health: enemy.health - swordActive.damage,
        };

        if (updatedEnemy.health <= 0) {
          // Enemy defeated
          handleEnemyDefeat(
            enemy.id,
            [
              {
                type: Math.random() < 0.5 ? "heart" : "rupee",
                position: enemy.position,
              },
            ],
            enemy.type,
          ); // Pass enemy type for XP calculation
        } else {
          // Play enemy hit sound
          if (soundManager) {
            soundManager.playSound("enemy_hit", 0.3);
          }

          // Trigger visual feedback with knockback
          const enemyElement = document.querySelector(
            `[data-enemy-id="${enemy.id}"]`,
          );
          if (enemyElement && enemyElement.takeDamage) {
            enemyElement.takeDamage(swordActive.damage, swordActive.direction);
          }

          // Update enemy health
          setEnemies((prev) =>
            prev.map((e) => (e.id === enemy.id ? updatedEnemy : e)),
          );
        }
      }
    });
  }, [swordActive, enemies, handleEnemyDefeat, soundManager]);

  const getSwordHitbox = (sword) => {
    const baseX = sword.position.x;
    const baseY = sword.position.y;
    const size = 64; // Increased from 48 for better feel
    const width = 56; // Slightly wider
    const height = 56;

    switch (sword.direction) {
      case "up":
        return { x: baseX - 4, y: baseY - size, width: width, height: size };
      case "down":
        return { x: baseX - 4, y: baseY + 48, width: width, height: size };
      case "left":
        return { x: baseX - size, y: baseY - 4, width: size, height: height };
      case "right":
        return { x: baseX + 48, y: baseY - 4, width: size, height: height };
      default:
        return { x: baseX, y: baseY, width: 48, height: 48 };
    }
  };

  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Handle drop collection
  const handleDropCollection = useCallback(
    (dropId) => {
      const drop = drops.find((d) => d.id === dropId);
      if (!drop) return;

      // Check if player is close enough
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - drop.position.x, 2) +
          Math.pow(playerPosition.y - drop.position.y, 2),
      );

      if (distance < 48) {
        // Collect drop
        switch (drop.type) {
          case "heart":
            if (onPlayerHeal) {
              onPlayerHeal(2); // Heal 1 heart (2 half-hearts)
            }
            break;
          case "rupee":
            if (onCollectRupee) {
              onCollectRupee(1);
            }
            break;
        }

        // Remove drop
        setDrops((prev) => prev.filter((d) => d.id !== dropId));
      }
    },
    [drops, playerPosition, onPlayerHeal, onCollectRupee],
  );

  // Auto-collect drops when player is near
  useEffect(() => {
    drops.forEach((drop) => {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - drop.position.x, 2) +
          Math.pow(playerPosition.y - drop.position.y, 2),
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
      {projectiles.map((proj) => (
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
      {enemies.map((enemy) => (
        <div key={enemy.id} data-enemy-id={enemy.id}>
          <Enemy
            type={enemy.type}
            position={enemy.position}
            health={enemy.health}
            onDefeat={(drops) => handleEnemyDefeat(enemy.id, drops, enemy.type)}
            onDamagePlayer={handlePlayerDamage}
            playerPosition={playerPosition}
          />
        </div>
      ))}

      {/* Drops */}
      {drops.map((drop) => (
        <div
          key={drop.id}
          className={`drop drop-${drop.type}`}
          style={{
            left: drop.position.x,
            top: drop.position.y,
          }}
          onClick={() => handleDropCollection(drop.id)}
        >
          {drop.type === "heart" && <img src={ICONS.drops.heart} alt="Heart" className="drop-icon" />}
          {drop.type === "rupee" && <img src={ICONS.drops.rupee} alt="Rupee" className="drop-icon" />}
          {drop.type === "key" && <img src={ICONS.ui.key} alt="Key" className="drop-icon" />}
        </div>
      ))}
    </div>
  );
};

export default CombatManager;
