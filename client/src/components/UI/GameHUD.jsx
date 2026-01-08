import React from "react";
import HeartDisplay from "../Combat/HeartDisplay";
import ICONS from "../../constants/Icons";
import "./GameHUD.css";

/**
 * GameHUD - Zelda-style heads-up display
 * Shows health, items, rupees, keys, current area, XP, and level
 */
const GameHUD = ({
  health,
  maxHealth,
  rupees = 0,
  keys = 0,
  currentArea = "Overworld",
  equippedItem = null,
  onItemUse,
  experience = 0,
  level = 1,
  experienceToNextLevel = 100,
  isDamaged = false,
}) => {
  // Calculate XP progress percentage
  const experienceInCurrentLevel = experience - getExperienceForLevel(level);
  const experienceNeededForNextLevel =
    experienceToNextLevel - getExperienceForLevel(level);
  const xpProgress =
    experienceNeededForNextLevel > 0
      ? Math.min(
          100,
          (experienceInCurrentLevel / experienceNeededForNextLevel) * 100,
        )
      : 100;

  return (
    <div className="game-hud">
      {/* Top bar with XP, hearts, and area name */}
      <div className="hud-top-bar">
        <div className="hud-left">
          {/* XP Bar and Level Display */}
          <div className="xp-display">
            <div className="level-badge" title={`Level ${level}`}>
              <img
                src={ICONS.ui.level}
                alt="Level"
                className="level-icon"
              />
              <span className="level-number">{level}</span>
            </div>
            <div
              className="xp-bar-container"
              title={`${Math.floor(experienceInCurrentLevel)} / ${experienceNeededForNextLevel} XP`}
            >
              <div className="xp-bar-background">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="xp-bar-shine"></div>
                </div>
              </div>
              <span className="xp-text">
                {Math.floor(experienceInCurrentLevel)} /{" "}
                {experienceNeededForNextLevel}
              </span>
            </div>
          </div>
          {/* Hearts below XP */}
          <HeartDisplay
            currentHealth={health}
            maxHealth={maxHealth}
            isDamaged={isDamaged}
          />
        </div>

        <div className="hud-center">
          <div className="area-name">{currentArea}</div>
        </div>

        <div className="hud-right">
          {keys > 0 && <div className="key-count">
            <img src={ICONS.ui.key} alt="Key" className="key-icon" /> × {keys}
          </div>}
        </div>
      </div>

      {/* Bottom bar with items and rupees */}
      <div className="hud-bottom-bar">
        <div className="hud-items">
          <div className="item-slot item-a">
            <span className="item-label">A</span>
            <div className="item-icon">
              <img src={ICONS.ui.sword} alt="Sword" className="item-icon-image" />
            </div>
          </div>

          <div className="item-slot item-b">
            <span className="item-label">B</span>
            <div className="item-icon">
              {equippedItem ? getItemIcon(equippedItem) : "—"}
            </div>
          </div>
        </div>

        <div className="rupee-count">
          <img src={ICONS.ui.rupee} alt="Rupee" className="rupee-icon" /> {rupees.toString().padStart(3, "0")}
        </div>
      </div>
    </div>
  );
};

// Helper function to get item icons
const getItemIcon = (itemType) => {
  const iconPath = ICONS.items[itemType];
  if (iconPath) {
    return <img src={iconPath} alt={itemType} className="item-icon-image" />;
  }
  return <span className="item-icon-unknown">❓</span>; // Fallback for unknown items
};

// Helper function to calculate experience needed for a level
// Using exponential curve: 100 * 1.5^(level-1)
const getExperienceForLevel = (level) => {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export default GameHUD;
