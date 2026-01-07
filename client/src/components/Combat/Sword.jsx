import React, { useEffect, useState } from "react";
import SoundManager from "../utils/SoundManager";
import "./Sword.css";

/**
 * Sword - Zelda-style sword attack
 * Shows directional sword swipe animation
 */
const Sword = ({
  position,
  direction,
  onAttackComplete,
  damage = 1,
  swordType = "wooden", // wooden, white, magical
  hasFullHealth = false, // Triggers sword beam
  onSpawnProjectile, // Callback to spawn sword beam
}) => {
  const [isActive, setIsActive] = useState(true);
  const soundManager = SoundManager.getInstance();

  useEffect(() => {
    // Sword beam REMOVED - no projectiles
    // Sword attack lasts 300ms (like Zelda)
    const timer = setTimeout(() => {
      setIsActive(false);
      if (onAttackComplete) {
        onAttackComplete();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [onAttackComplete]);

  if (!isActive) return null;

  // Calculate sword position and rotation based on direction
  const getSwordStyle = () => {
    const baseStyle = {
      position: "absolute",
      left: position.x,
      top: position.y,
      width: "64px",
      height: "64px",
      pointerEvents: "none",
      zIndex: 100,
    };

    // Adjust position and rotation based on direction
    switch (direction) {
      case "up":
        return {
          ...baseStyle,
          transform: "translateY(-48px) rotate(-90deg)",
          transformOrigin: "center bottom",
        };
      case "down":
        return {
          ...baseStyle,
          transform: "translateY(48px) rotate(90deg)",
          transformOrigin: "center top",
        };
      case "left":
        return {
          ...baseStyle,
          transform: "translateX(-48px) rotate(180deg)",
          transformOrigin: "right center",
        };
      case "right":
        return {
          ...baseStyle,
          transform: "translateX(48px)",
          transformOrigin: "left center",
        };
      default:
        return baseStyle;
    }
  };

  // Get sword color based on type
  const getSwordClass = () => {
    return `sword sword-${swordType} sword-${direction}`;
  };

  return (
    <>
      <div
        className={getSwordClass()}
        style={getSwordStyle()}
        data-damage={damage}
        data-hitbox="sword"
      >
        <div className="sword-blade">
          {swordType === "wooden" && "🗡️"}
          {swordType === "white" && "⚔️"}
          {swordType === "magical" && "🔱"}
        </div>
      </div>

      {/* Visual Hitbox Indicator - shows damage radius */}
      <div
        className="sword-hitbox-indicator"
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          pointerEvents: "none",
          zIndex: 99,
        }}
      />
    </>
  );
};

export default Sword;
