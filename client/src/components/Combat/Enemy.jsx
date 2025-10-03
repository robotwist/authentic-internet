import React, { useEffect, useState, useRef } from 'react';
import './Enemy.css';

/**
 * Enemy - Base enemy component for all enemies
 * Handles health, movement, collision, and defeat
 */
const Enemy = ({ 
  type = 'octorok',
  position: initialPosition,
  health: initialHealth = 2,
  damage = 1,
  speed = 2,
  onDefeat,
  onDamagePlayer,
  playerPosition,
  mapData,
  onTakeDamage // New: callback when enemy is damaged
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [health, setHealth] = useState(initialHealth);
  const [direction, setDirection] = useState('down');
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isStunned, setIsStunned] = useState(false); // New: stun on hit
  
  const movementTimer = useRef(null);
  const directionTimer = useRef(null);
  const enemyRef = useRef(null);
  const lastFlashTime = useRef(0);

  // Handle taking damage with flash effect
  const takeDamage = (damageAmount, knockbackDirection) => {
    const now = Date.now();
    // Prevent multiple hits in quick succession
    if (now - lastFlashTime.current < 200) return;
    
    lastFlashTime.current = now;
    
    // Reduce health
    const newHealth = health - damageAmount;
    setHealth(newHealth);
    
    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    
    // Brief stun
    setIsStunned(true);
    setTimeout(() => setIsStunned(false), 300);
    
    // Apply knockback
    if (knockbackDirection) {
      const knockbackDistance = 24;
      const newPos = { ...position };
      
      switch (knockbackDirection) {
        case 'up':
          newPos.y -= knockbackDistance;
          break;
        case 'down':
          newPos.y += knockbackDistance;
          break;
        case 'left':
          newPos.x -= knockbackDistance;
          break;
        case 'right':
          newPos.x += knockbackDistance;
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

  // Expose takeDamage to parent
  useEffect(() => {
    if (enemyRef.current) {
      enemyRef.current.takeDamage = takeDamage;
    }
  }, [position, onTakeDamage]);

  // AI Movement based on enemy type
  useEffect(() => {
    if (isDead || isStunned) return;

    const moveEnemy = () => {
      switch (type) {
        case 'octorok':
          moveOctorok();
          break;
        case 'moblin':
          moveMoblin();
          break;
        case 'tektite':
          moveTektite();
          break;
        default:
          moveRandom();
      }
    };

    // Move enemy every 500ms
    movementTimer.current = setInterval(moveEnemy, 500);

    // Change direction randomly every 2-3 seconds
    directionTimer.current = setInterval(() => {
      const directions = ['up', 'down', 'left', 'right'];
      setDirection(directions[Math.floor(Math.random() * directions.length)]);
    }, 2000 + Math.random() * 1000);

    return () => {
      if (movementTimer.current) clearInterval(movementTimer.current);
      if (directionTimer.current) clearInterval(directionTimer.current);
    };
  }, [type, isDead, isStunned, position]);

  // Octorok AI: Random movement + occasional rock shooting
  const moveOctorok = () => {
    const newPos = { ...position };
    const moveDistance = speed;

    switch (direction) {
      case 'up':
        newPos.y -= moveDistance;
        break;
      case 'down':
        newPos.y += moveDistance;
        break;
      case 'left':
        newPos.x -= moveDistance;
        break;
      case 'right':
        newPos.x += moveDistance;
        break;
    }

    // Simple boundary check (you'd check against mapData normally)
    if (newPos.x >= 0 && newPos.x < 1280 && newPos.y >= 0 && newPos.y < 720) {
      setPosition(newPos);
    }
  };

  // Moblin AI: Chase player
  const moveMoblin = () => {
    if (!playerPosition) return;

    const newPos = { ...position };
    const dx = playerPosition.x - position.x;
    const dy = playerPosition.y - position.y;

    // Move towards player
    if (Math.abs(dx) > Math.abs(dy)) {
      newPos.x += dx > 0 ? speed : -speed;
      setDirection(dx > 0 ? 'right' : 'left');
    } else {
      newPos.y += dy > 0 ? speed : -speed;
      setDirection(dy > 0 ? 'down' : 'up');
    }

    setPosition(newPos);
  };

  // Tektite AI: Jump pattern
  const moveTektite = () => {
    // TODO: Implement jumping pattern
    moveRandom();
  };

  // Basic random movement
  const moveRandom = () => {
    const directions = ['up', 'down', 'left', 'right'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    setDirection(randomDir);
    moveOctorok(); // Use octorok movement
  };

  // Handle enemy defeat
  const handleDefeat = () => {
    setIsDead(true);
    
    // Drop hearts/rupees
    if (onDefeat) {
      const drops = [];
      // 50% chance to drop heart
      if (Math.random() < 0.5) {
        drops.push({ type: 'heart', position });
      }
      // 30% chance to drop rupee
      if (Math.random() < 0.3) {
        drops.push({ type: 'rupee', position });
      }
      onDefeat(drops);
    }

    // Remove enemy after death animation
    setTimeout(() => {
      if (enemyRef.current) {
        enemyRef.current.style.display = 'none';
      }
    }, 500);
  };

  // Check collision with player
  useEffect(() => {
    if (isDead || !playerPosition) return;

    const distance = Math.sqrt(
      Math.pow(position.x - playerPosition.x, 2) + 
      Math.pow(position.y - playerPosition.y, 2)
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
      octorok: '🐙',
      moblin: '👹',
      tektite: '🕷️',
      keese: '🦇',
      stalfos: '💀',
    };
    return sprites[type] || '👾';
  };

  return (
    <div 
      ref={enemyRef}
      className={`enemy enemy-${type} enemy-${direction} ${isFlashing ? 'enemy-flash' : ''}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      data-health={health}
      data-damage={damage}
      data-hitbox="enemy"
    >
      {getEnemySprite()}
      {/* Debug health bar */}
      <div className="enemy-health-bar">
        <div 
          className="enemy-health-fill" 
          style={{ width: `${(health / initialHealth) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Enemy;

