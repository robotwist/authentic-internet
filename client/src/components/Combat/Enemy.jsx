import React, { useEffect, useState, useRef } from "react";
import DamageNumber from "./DamageNumber";
import "./Enemy.css";

/**
 * Enemy - Base enemy component for all enemies
 * Handles health, movement, collision, and defeat
 */
const Enemy = ({
  type = "octorok",
  position: initialPosition,
  health: initialHealth = 2,
  damage = 1,
  speed = 2,
  onDefeat,
  onDamagePlayer,
  playerPosition,
  mapData,
  onTakeDamage, // New: callback when enemy is damaged
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [health, setHealth] = useState(initialHealth);
  const [direction, setDirection] = useState("down");
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isStunned, setIsStunned] = useState(false); // New: stun on hit
  const [damageNumbers, setDamageNumbers] = useState([]); // Track floating damage numbers

  const movementTimer = useRef(null);
  const directionTimer = useRef(null);
  const animationFrameRef = useRef(null);
  const enemyRef = useRef(null);
  const lastFlashTime = useRef(0);
  const currentDirection = useRef("down");
  const lastMoveTime = useRef(Date.now());

  // Handle taking damage with flash effect
  const takeDamage = (damageAmount, knockbackDirection) => {
    const now = Date.now();
    // Prevent multiple hits in quick succession
    if (now - lastFlashTime.current < 200) return;

    lastFlashTime.current = now;

    // Reduce health
    const newHealth = health - damageAmount;
    setHealth(newHealth);

    // Show damage number
    const damageId = `dmg-${Date.now()}-${Math.random()}`;
    const isCritical = Math.random() < 0.15; // 15% chance for critical hit
    const finalDamage = isCritical ? damageAmount * 2 : damageAmount;

    setDamageNumbers((prev) => [
      ...prev,
      {
        id: damageId,
        damage: finalDamage,
        position: { ...position, x: position.x + 24, y: position.y - 10 },
        isCritical,
      },
    ]);

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // Brief stun
    setIsStunned(true);
    setTimeout(() => setIsStunned(false), 300);

    // Apply knockback with boundary check
    if (knockbackDirection) {
      const knockbackDistance = isCritical ? 48 : 32; // Increased knockback
      const newPos = { ...position };

      switch (knockbackDirection) {
        case "up":
          newPos.y = Math.max(0, newPos.y - knockbackDistance);
          break;
        case "down":
          newPos.y = Math.min(720 - 48, newPos.y + knockbackDistance);
          break;
        case "left":
          newPos.x = Math.max(0, newPos.x - knockbackDistance);
          break;
        case "right":
          newPos.x = Math.min(1280 - 48, newPos.x + knockbackDistance);
          break;
      }

      setPosition(newPos);
    }

    // Check if defeated
    if (newHealth <= 0) {
      handleDefeat();
    }

    // Notify parent
    if (onTakeDamage) {
      onTakeDamage(damageAmount);
    }
  };

  // Remove damage number after animation
  const handleDamageNumberComplete = (damageId) => {
    setDamageNumbers((prev) => prev.filter((dmg) => dmg.id !== damageId));
  };

  // Expose takeDamage to parent
  useEffect(() => {
    if (enemyRef.current) {
      enemyRef.current.takeDamage = takeDamage;
    }
  }, [position, onTakeDamage]);

  // Smooth continuous AI Movement using requestAnimationFrame
  useEffect(() => {
    if (isDead || isStunned) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = Date.now();

    const animateMovement = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Update position based on enemy type
      const newPos = { ...position };
      let moved = false;

      switch (type) {
        case "octorok":
          moved = moveOctorokSmooth(newPos, deltaTime);
          break;
        case "moblin":
          moved = moveMoblinSmooth(newPos, deltaTime);
          break;
        case "tektite":
          moved = moveTektiteSmooth(newPos, deltaTime);
          break;
        default:
          moved = moveRandomSmooth(newPos, deltaTime);
      }

      if (moved) {
        setPosition(newPos);
      }

      animationFrameRef.current = requestAnimationFrame(animateMovement);
    };

    animationFrameRef.current = requestAnimationFrame(animateMovement);

    // Change direction randomly every 2-3 seconds
    directionTimer.current = setInterval(
      () => {
        const directions = ["up", "down", "left", "right"];
        const newDir =
          directions[Math.floor(Math.random() * directions.length)];
        currentDirection.current = newDir;
        setDirection(newDir);
      },
      2000 + Math.random() * 1000,
    );

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (directionTimer.current) {
        clearInterval(directionTimer.current);
      }
    };
  }, [type, isDead, isStunned, playerPosition]);

  // Smooth Octorok AI: Random movement with continuous motion
  const moveOctorokSmooth = (newPos, deltaTime) => {
    const moveSpeed = speed * 60 * deltaTime; // Normalize speed for 60fps

    switch (currentDirection.current) {
      case "up":
        newPos.y -= moveSpeed;
        break;
      case "down":
        newPos.y += moveSpeed;
        break;
      case "left":
        newPos.x -= moveSpeed;
        break;
      case "right":
        newPos.x += moveSpeed;
        break;
    }

    // Boundary check
    if (newPos.x >= 0 && newPos.x < 1280 && newPos.y >= 0 && newPos.y < 720) {
      return true;
    }
    return false;
  };

  // Smooth Moblin AI: Chase player continuously
  const moveMoblinSmooth = (newPos, deltaTime) => {
    if (!playerPosition) return false;

    const moveSpeed = speed * 60 * deltaTime;
    const dx = playerPosition.x - newPos.x;
    const dy = playerPosition.y - newPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize movement direction
    if (distance > 5) {
      newPos.x += (dx / distance) * moveSpeed;
      newPos.y += (dy / distance) * moveSpeed;

      // Update direction for sprite
      if (Math.abs(dx) > Math.abs(dy)) {
        const newDir = dx > 0 ? "right" : "left";
        if (currentDirection.current !== newDir) {
          currentDirection.current = newDir;
          setDirection(newDir);
        }
      } else {
        const newDir = dy > 0 ? "down" : "up";
        if (currentDirection.current !== newDir) {
          currentDirection.current = newDir;
          setDirection(newDir);
        }
      }

      return true;
    }
    return false;
  };

  // Smooth Tektite AI: Jump pattern with pauses
  const moveTektiteSmooth = (newPos, deltaTime) => {
    const moveSpeed = speed * 60 * deltaTime * 1.5; // Faster movement for jumping effect

    switch (currentDirection.current) {
      case "up":
        newPos.y -= moveSpeed;
        break;
      case "down":
        newPos.y += moveSpeed;
        break;
      case "left":
        newPos.x -= moveSpeed;
        break;
      case "right":
        newPos.x += moveSpeed;
        break;
    }

    if (newPos.x >= 0 && newPos.x < 1280 && newPos.y >= 0 && newPos.y < 720) {
      return true;
    }
    return false;
  };

  // Basic random movement smooth
  const moveRandomSmooth = (newPos, deltaTime) => {
    return moveOctorokSmooth(newPos, deltaTime);
  };

  // Handle enemy defeat
  const handleDefeat = () => {
    setIsDead(true);

    // Drop hearts/rupees
    if (onDefeat) {
      const drops = [];
      // 50% chance to drop heart
      if (Math.random() < 0.5) {
        drops.push({ type: "heart", position });
      }
      // 30% chance to drop rupee
      if (Math.random() < 0.3) {
        drops.push({ type: "rupee", position });
      }
      onDefeat(drops);
    }

    // Remove enemy after death animation
    setTimeout(() => {
      if (enemyRef.current) {
        enemyRef.current.style.display = "none";
      }
    }, 500);
  };

  // Check collision with player
  useEffect(() => {
    if (isDead || !playerPosition) return;

    const distance = Math.sqrt(
      Math.pow(position.x - playerPosition.x, 2) +
        Math.pow(position.y - playerPosition.y, 2),
    );

    // If enemy touches player, damage them
    if (distance < 32 && onDamagePlayer) {
      onDamagePlayer(damage);
    }
  }, [position, playerPosition, isDead, damage, onDamagePlayer]);

  if (isDead) {
    return (
      <div
        ref={enemyRef}
        className="enemy enemy-defeated"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        💥
      </div>
    );
  }

  // Get enemy sprite based on type
  const getEnemySprite = () => {
    const sprites = {
      octorok: "🐙",
      moblin: "👹",
      tektite: "🕷️",
      keese: "🦇",
      stalfos: "💀",
    };
    return sprites[type] || "👾";
  };

  return (
    <>
      <div
        ref={enemyRef}
        className={`enemy enemy-${type} enemy-${direction} ${isFlashing ? "enemy-flash" : ""} ${isStunned ? "enemy-stunned" : ""}`}
        style={{
          left: position.x,
          top: position.y,
        }}
        data-health={health}
        data-damage={damage}
        data-hitbox="enemy"
      >
        {getEnemySprite()}
        {/* Health bar */}
        <div className="enemy-health-bar">
          <div
            className="enemy-health-fill"
            style={{ width: `${(health / initialHealth) * 100}%` }}
          />
        </div>
      </div>

      {/* Floating damage numbers */}
      {damageNumbers.map((dmg) => (
        <DamageNumber
          key={dmg.id}
          damage={dmg.damage}
          position={dmg.position}
          isCritical={dmg.isCritical}
          onComplete={() => handleDamageNumberComplete(dmg.id)}
        />
      ))}
    </>
  );
};

export default Enemy;
