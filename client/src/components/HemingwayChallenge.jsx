import React from "react";
import PropTypes from "prop-types";
import "./TextAdventure.css"; // Reusing existing styles temporarily

const HemingwayChallenge = ({ onComplete, onExit }) => {
  return (
    <div className="text-adventure-container">
      <div className="text-adventure-header">
        <h2>Hemingway Challenge</h2>
        <div className="health-bar">
          <div className="health-bar-fill" style={{ width: `100%` }} />
          <span>Progress: 100%</span>
        </div>
      </div>

      <div className="text-adventure-body">
        <div className="game-history">
          <div className="history-entry system">
            This is a placeholder for the Hemingway Challenge.
          </div>
          <div className="history-entry system">
            The actual game component is currently being developed.
          </div>
          <div className="history-entry room">
            "For sale: baby shoes, never worn." - Ernest Hemingway
          </div>
        </div>
      </div>

      <div className="game-complete-overlay">
        <div className="game-complete-content">
          <h2>Hemingway Challenge</h2>
          <p>Write clear, concise prose in the style of Hemingway.</p>
          <button onClick={() => onComplete(150)}>Complete Challenge</button>
          <button onClick={onExit}>Exit Challenge</button>
        </div>
      </div>

      <div className="text-adventure-footer">
        <button className="exit-button" onClick={onExit}>
          Exit Challenge
        </button>
      </div>
    </div>
  );
};

HemingwayChallenge.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default HemingwayChallenge;
