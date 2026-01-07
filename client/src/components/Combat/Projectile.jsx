import React, { useEffect, useState, useRef } from "react";
import "./Projectile.css";

/**
 * Projectile - Handles sword beams and enemy projectiles
 * Sword beam fires when player has full health (Zelda mechanic)
 */
const Projectile = ({
  type = "sword_beam", // sword_beam, rock, arrow, fireball
  position: initialPosition,
  direction,
  speed = 8,
  damage = 2,
  maxDistance = 400,
  onHit,
  onExpire,
  checkCollision,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isActive, setIsActive] = useState(true);
  const distanceTraveled = useRef(0);
  const animationFrame = useRef(null);

  // Movement loop
  useEffect(() => {
    if (!isActive) return;

    const moveProjectile = () => {
      setPosition((prev) => {
        const newPos = { ...prev };

        // Move based on direction
        switch (direction) {
          case "up":
            newPos.y -= speed;
            break;
          case "down":
            newPos.y += speed;
            break;
          case "left":
            newPos.x -= speed;
            break;
          case "right":
            newPos.x += speed;
            break;
        }

        // Update distance traveled
        distanceTraveled.current += speed;

        // Check if max distance reached
        if (distanceTraveled.current >= maxDistance) {
          handleExpire();
          return prev;
        }

        // Check collision if callback provided
        if (checkCollision) {
          const hitResult = checkCollision(newPos);
          if (hitResult) {
            handleHit(hitResult);
            return prev;
          }
        }

        return newPos;
      });

      animationFrame.current = requestAnimationFrame(moveProjectile);
    };

    animationFrame.current = requestAnimationFrame(moveProjectile);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isActive, direction, speed, maxDistance, checkCollision]);

  const handleHit = (target) => {
    setIsActive(false);
    if (onHit) {
      onHit(target);
    }
  };

  const handleExpire = () => {
    setIsActive(false);
    if (onExpire) {
      onExpire();
    }
  };

  if (!isActive) return null;

  // Get projectile sprite and style based on type
  const getProjectileDisplay = () => {
    const sprites = {
      sword_beam: "🗡️",
      rock: "⚪",
      arrow: "➤",
      fireball: "🗡️",
      magic: "💫",
    };

    const colors = {
      sword_beam: "#FFD700",
      rock: "#8B4513",
      arrow: "#C0C0C0",
      fireball: "#C0C0C0",
      magic: "#9370DB",
    };

    return {
      sprite: sprites[type] || "•",
      color: colors[type] || "#FFFFFF",
    };
  };

  const { sprite, color } = getProjectileDisplay();

  // Adjust rotation based on direction
  const getRotation = () => {
    switch (direction) {
      case "up":
        return -90;
      case "down":
        return 90;
      case "left":
        return 180;
      case "right":
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div
      className={`projectile projectile-${type} projectile-${direction}`}
      style={{
        left: position.x,
        top: position.y,
        transform: `rotate(${getRotation()}deg)`,
        color: color,
      }}
      data-damage={damage}
      data-hitbox="projectile"
    >
      {sprite}
      {/* Sword beam trail effect */}
      {type === "sword_beam" && <div className="sword-beam-trail" />}
    </div>
  );
};

export default Projectile;
