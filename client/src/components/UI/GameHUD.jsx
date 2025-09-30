import React from 'react';
import HeartDisplay from '../Combat/HeartDisplay';
import './GameHUD.css';

/**
 * GameHUD - Zelda-style heads-up display
 * Shows health, items, rupees, keys, and current area
 */
const GameHUD = ({ 
  health, 
  maxHealth, 
  rupees = 0, 
  keys = 0, 
  currentArea = "Overworld",
  equippedItem = null,
  onItemUse 
}) => {
  
  return (
    <div className="game-hud">
      {/* Top bar with hearts and area name */}
      <div className="hud-top-bar">
        <div className="hud-left">
          <HeartDisplay currentHealth={health} maxHealth={maxHealth} />
        </div>
        
        <div className="hud-center">
          <div className="area-name">{currentArea}</div>
        </div>
        
        <div className="hud-right">
          {keys > 0 && (
            <div className="key-count">
              🔑 × {keys}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar with items and rupees */}
      <div className="hud-bottom-bar">
        <div className="hud-items">
          <div className="item-slot item-a">
            <span className="item-label">A</span>
            <div className="item-icon">🗡️</div>
          </div>
          
          <div className="item-slot item-b">
            <span className="item-label">B</span>
            <div className="item-icon">
              {equippedItem ? getItemIcon(equippedItem) : '—'}
            </div>
          </div>
        </div>
        
        <div className="rupee-count">
          💎 {rupees.toString().padStart(3, '0')}
        </div>
      </div>
    </div>
  );
};

// Helper function to get item icons
const getItemIcon = (itemType) => {
  const icons = {
    bomb: '💣',
    bow: '🏹',
    boomerang: '🪃',
    candle: '🕯️',
    rod: '🪄',
    key: '🔑',
    potion: '🧪',
    map: '🗺️',
    compass: '🧭',
  };
  return icons[itemType] || '❓';
};

export default GameHUD;

