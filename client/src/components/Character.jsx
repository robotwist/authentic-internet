import React, { useState, useEffect, forwardRef } from "react";
import PropTypes from "prop-types";
import { TILE_SIZE } from "./Constants";
import "./Character.css";

const Character = forwardRef(({
  x,
  y,
  exp = 0,
  level = 1,
  movementDirection = null,
  avatar = null,
  isBumping = false,
  bumpDirection = null,
}, ref) => {
  // Calculate the bubble size based on experience
  const bubbleSize = Math.min(1.5, 1 + exp / 1000); // Max size is 1.5x
  const [isNKDMan, setIsNKDMan] = useState(true);
  const [customAvatar, setCustomAvatar] = useState(null);

  // Check if user has a custom avatar
  useEffect(() => {
    if (
      avatar &&
      avatar !== "https://api.dicebear.com/7.x/pixel-art/svg?seed=unknown"
    ) {
      setCustomAvatar(avatar);
      setIsNKDMan(false);
    }
  }, [avatar]);

  // Determine which class to apply based on movement and bumping states
  const getAnimationClass = () => {
    if (isBumping && bumpDirection) {
      return `bumping-${bumpDirection}`;
    }
    if (movementDirection) {
      return `moving-${movementDirection}`;
    }
    return "";
  };

  return (
    <div
      ref={ref}
      className={`character-container ${getAnimationClass()} ${isNKDMan ? "nkd-man" : ""}`}
      data-level={level}
      style={{
        position: "absolute",
        left: `${x - TILE_SIZE / 2}px`,
        top: `${y - TILE_SIZE / 2}px`,
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
        transform: `scale(${bubbleSize})`,
        transition: "transform 0.3s ease-out",
      }}
    >
      <div className="blue-bubble"></div>
      <div
        className="character-sprite"
        style={
          customAvatar
            ? {
                backgroundImage: `url('${customAvatar}')`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : {}
        }
      ></div>
      {exp > 0 && <div className="exp-indicator">Level {level}</div>}
    </div>
  );
});

Character.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  exp: PropTypes.number,
  level: PropTypes.number,
  movementDirection: PropTypes.oneOf([null, "up", "down", "left", "right"]),
  avatar: PropTypes.string,
  isBumping: PropTypes.bool,
  bumpDirection: PropTypes.oneOf([null, "up", "down", "left", "right"]),
};

export default Character;
