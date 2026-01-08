import React from "react";
import ICONS from "../../constants/Icons";
import "./HeartDisplay.css";

/**
 * HeartDisplay - Zelda-style heart container display
 * Shows health as heart containers (full, half, empty)
 */
const HeartDisplay = ({ currentHealth, maxHealth, isDamaged = false }) => {
  // Health is stored in half-hearts (like Zelda)
  // e.g., 6 = 3 full hearts, 7 = 3.5 hearts
  const maxHearts = Math.ceil(maxHealth / 2);
  const hearts = [];

  for (let i = 0; i < maxHearts; i++) {
    const heartValue = (i + 1) * 2; // Each heart = 2 half-hearts
    const heartHealth = currentHealth - i * 2;

    let heartState = "empty";
    if (heartHealth >= 2) {
      heartState = "full";
    } else if (heartHealth === 1) {
      heartState = "half";
    }

    hearts.push(
      <div key={i} className={`heart heart-${heartState}`}>
        <img
          src={ICONS.ui.heart[heartState]}
          alt={`${heartState} heart`}
          className="heart-icon"
        />
      </div>,
    );
  }

  return (
    <div className={`heart-display ${isDamaged ? "damaged" : ""}`}>
      {hearts}
    </div>
  );
};

export default HeartDisplay;
