import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "./Boss.css";

const TILE_SIZE = 64;

/**
 * Boss Component
 *
 * Handles boss enemy behavior, attacks, and defeat
 */
const Boss = ({
  bossData,
  initialPosition,
  playerPosition,
  onDefeat,
  onAttack,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [health, setHealth] = useState(bossData.health);
  const [isAttacking, setIsAttacking] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isInvincible, setIsInvincible] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Boss AI - attack patterns
  useEffect(() => {
    if (health <= 0) return;

    const attackInterval = setInterval(() => {
      if (!isAttacking) {
        performAttack();
      }
    }, 3000); // Attack every 3 seconds

    return () => clearInterval(attackInterval);
  }, [health, isAttacking]);

  // Perform attack based on current pattern
  const performAttack = useCallback(() => {
    if (!bossData.attackPatterns || bossData.attackPatterns.length === 0)
      return;

    const pattern =
      bossData.attackPatterns[currentPattern % bossData.attackPatterns.length];
    console.log(`👹 Boss using: ${pattern}`);

    setIsAttacking(true);

    // Execute attack
    if (onAttack) {
      onAttack(pattern, position, playerPosition);
    }

    // Speak a quote
    if (bossData.quotes && bossData.quotes.length > 0) {
      const quote =
        bossData.quotes[Math.floor(Math.random() * bossData.quotes.length)];
      console.log(`👹 "${quote}"`);
    }

    // Cycle to next pattern
    setCurrentPattern((prev) => (prev + 1) % bossData.attackPatterns.length);

    // End attack animation
    setTimeout(() => {
      setIsAttacking(false);
    }, 800);
  }, [bossData, currentPattern, position, playerPosition, onAttack]);

  // Take damage
  const takeDamage = useCallback(
    (damage) => {
      if (isInvincible || health <= 0) return;

      console.log(`👹 Boss takes ${damage} damage!`);

      const newHealth = Math.max(0, health - damage);
      setHealth(newHealth);

      // Flash red when hit
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      // Brief invincibility
      setIsInvincible(true);
      setTimeout(() => setIsInvincible(false), 500);

      // Check if defeated
      if (newHealth <= 0) {
        handleDefeat();
      }
    },
    [health, isInvincible],
  );

  // Handle defeat
  const handleDefeat = useCallback(() => {
    console.log("👹 Boss defeated!");
    if (onDefeat) {
      onDefeat();
    }
  }, [onDefeat]);

  // Expose takeDamage to parent via ref or context
  // For now, we'll handle collision detection in CombatManager

  return (
    <div
      className={`boss ${isAttacking ? "attacking" : ""} ${isFlashing ? "flashing" : ""} ${isInvincible ? "invincible" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: TILE_SIZE * 2,
        height: TILE_SIZE * 2,
      }}
      data-boss-id={bossData.id}
      data-health={health}
      data-max-health={bossData.health}
    >
      {/* Boss sprite */}
      <div className="boss-sprite">
        {bossData.sprite ? (
          <img src={bossData.sprite} alt={bossData.name} />
        ) : (
          <span className="boss-emoji">👹</span>
        )}
      </div>

      {/* Boss name */}
      <div className="boss-name">{bossData.name}</div>

      {/* Health bar */}
      <div className="boss-health-bar">
        <div className="boss-health-bar-background">
          <div
            className="boss-health-bar-fill"
            style={{
              width: `${(health / bossData.health) * 100}%`,
            }}
          >
            <div className="boss-health-bar-shine"></div>
          </div>
        </div>
        <div className="boss-health-text">
          {health} / {bossData.health}
        </div>
      </div>

      {/* Attack indicator */}
      {isAttacking && (
        <div className="boss-attack-indicator">
          <div className="attack-ring"></div>
        </div>
      )}
    </div>
  );
};

Boss.propTypes = {
  bossData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    health: PropTypes.number.isRequired,
    damage: PropTypes.number.isRequired,
    attackPatterns: PropTypes.arrayOf(PropTypes.string),
    sprite: PropTypes.string,
    quotes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  initialPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  playerPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onDefeat: PropTypes.func,
  onAttack: PropTypes.func,
};

export default Boss;
