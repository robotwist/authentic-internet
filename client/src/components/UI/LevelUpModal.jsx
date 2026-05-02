import React, { useEffect } from "react";
import "./LevelUpModal.css";

const LevelUpModal = ({ level, stats: _stats, onClose, embedded = false }) => {
  useEffect(() => {
    if (embedded) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [embedded, onClose]);

  const modal = (
    <div
      className={
        embedded ? "level-up-modal level-up-modal--embedded" : "level-up-modal"
      }
    >
      <div className="level-up-header">
        <h2 className="level-up-title">LEVEL UP!</h2>
        <div className="level-up-number">Level {level}</div>
      </div>

      <div className="level-up-stats">
        <div className="stat-increase">
          <span className="stat-label">❤️ Max Health</span>
          <span className="stat-value">+2</span>
        </div>
        <div className="stat-increase">
          <span className="stat-label">⚔️ Attack</span>
          <span className="stat-value">+1</span>
        </div>
        {level % 2 === 0 && (
          <div className="stat-increase">
            <span className="stat-label">🛡️ Defense</span>
            <span className="stat-value">+1</span>
          </div>
        )}
      </div>

      <div className="level-up-message">All wounds healed!</div>

      <button className="level-up-close" onClick={onClose}>
        Continue
      </button>
    </div>
  );

  if (embedded) {
    return <div className="level-up-embedded">{modal}</div>;
  }

  return <div className="level-up-overlay">{modal}</div>;
};

export default LevelUpModal;
