import React from "react";
import HeartDisplay from "../Combat/HeartDisplay";
import ICONS from "../../constants/Icons";
import "./GameHUD.css";
import "./DockCombatHud.css";

const getItemIcon = (itemType) => {
  const iconPath = ICONS.items[itemType];
  if (iconPath) {
    return <img src={iconPath} alt={itemType} className="item-icon-image" />;
  }
  return <span className="item-icon-unknown">?</span>;
};

/**
 * Hearts, rupees, keys, and A/B item slots — shown inside the bottom dock Status panel.
 */
const DockCombatHud = ({
  health,
  maxHealth,
  rupees = 0,
  keys = 0,
  equippedItem = null,
  isDamaged = false,
}) => {
  return (
    <div className="dock-combat-hud" aria-label="Health and inventory">
      <div className="dock-combat-hud-hearts">
        <HeartDisplay
          currentHealth={health}
          maxHealth={maxHealth}
          isDamaged={isDamaged}
        />
        {keys > 0 && (
          <div className="dock-combat-key-count">
            <img src={ICONS.ui.key} alt="" className="key-icon" /> × {keys}
          </div>
        )}
      </div>
      <div className="dock-combat-hud-items-row">
        <div className="hud-items">
          <div className="item-slot item-a">
            <span className="item-label">A</span>
            <div className="item-icon">
              <img
                src={ICONS.ui.sword}
                alt="Sword"
                className="item-icon-image"
              />
            </div>
          </div>
          <div className="item-slot item-b">
            <span className="item-label">B</span>
            <div className="item-icon">
              {equippedItem ? getItemIcon(equippedItem) : "—"}
            </div>
          </div>
        </div>
        <div className="rupee-count dock-combat-rupees">
          <img src={ICONS.ui.rupee} alt="" className="rupee-icon" />{" "}
          {rupees.toString().padStart(3, "0")}
        </div>
      </div>
    </div>
  );
};

export default DockCombatHud;
