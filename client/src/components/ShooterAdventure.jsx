import React from 'react';
import PropTypes from 'prop-types';
import './TextAdventure.css'; // Reusing existing styles temporarily

const ShooterAdventure = ({ onComplete, onExit }) => {
  return (
    <div className="text-adventure-container">
      <div className="text-adventure-header">
        <h2>Shooter Adventure</h2>
        <div className="health-bar">
          <div 
            className="health-bar-fill" 
            style={{ width: `100%` }}
          />
          <span>Health: 100%</span>
        </div>
      </div>
      
      <div className="text-adventure-body">
        <div className="game-history">
          <div className="history-entry system">
            This is a placeholder for the Shooter Adventure game.
          </div>
          <div className="history-entry system">
            The actual game component is currently being developed.
          </div>
        </div>
      </div>
      
      <div className="game-complete-overlay">
        <div className="game-complete-content">
          <h2>Adventure Placeholder</h2>
          <p>The Shooter Adventure is under construction.</p>
          <button onClick={() => onComplete(100)}>Complete Adventure</button>
          <button onClick={onExit}>Exit Adventure</button>
        </div>
      </div>
      
      <div className="text-adventure-footer">
        <button className="exit-button" onClick={onExit}>Exit Adventure</button>
      </div>
    </div>
  );
};

ShooterAdventure.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired
};

export default ShooterAdventure; 