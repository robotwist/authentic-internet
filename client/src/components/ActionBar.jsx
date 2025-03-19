import React from 'react';
import PropTypes from 'prop-types';
import './ActionBar.css';

const ActionBar = ({ 
  onOpenInventory, 
  onShowQuotes, 
  onCreateInspiration,
  inventory = [], 
  exp = 0, 
  level = 1,
  isLoggedIn = false
}) => {
  return (
    <div className="action-bar">
      <div className="action-bar-left">
        <button 
          className="action-button inventory-button" 
          onClick={onOpenInventory}
          title="Open Inventory"
        >
          <span className="action-icon">🎒</span>
          <span className="action-label">Inventory</span>
          <span className="inventory-count">{inventory.length}</span>
        </button>
        
        <button 
          className="action-button quotes-button" 
          onClick={onShowQuotes}
          title="View Saved Quotes"
        >
          <span className="action-icon">📜</span>
          <span className="action-label">Quotes</span>
        </button>
      </div>
      
      <div className="action-bar-center">
        {isLoggedIn && (
          <button 
            className="action-button inspiration-button" 
            onClick={onCreateInspiration}
            title="Create Something Meaningful"
          >
            <span className="action-icon">✨</span>
            <span className="action-label">Create Inspiration</span>
          </button>
        )}
      </div>
      
      <div className="action-bar-right">
        <div className="character-stats">
          <div className="level-indicator" title="Your Level">
            <span className="level-label">Level</span>
            <span className="level-value">{level}</span>
          </div>
          <div className="exp-bar" title={`Experience: ${exp} points`}>
            <div 
              className="exp-progress" 
              style={{ 
                width: `${Math.min(100, (exp % 100))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

ActionBar.propTypes = {
  onOpenInventory: PropTypes.func.isRequired,
  onShowQuotes: PropTypes.func.isRequired,
  onCreateInspiration: PropTypes.func.isRequired,
  inventory: PropTypes.array,
  exp: PropTypes.number,
  level: PropTypes.number,
  isLoggedIn: PropTypes.bool
};

export default ActionBar; 