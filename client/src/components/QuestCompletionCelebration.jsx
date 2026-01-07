import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./QuestCompletionCelebration.css";

/**
 * Component that displays a celebration animation when a quest is completed
 */
const QuestCompletionCelebration = ({ quest, rewards, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Show the celebration after a brief delay
    const showTimeout = setTimeout(() => {
      setVisible(true);
      createParticles();
    }, 100);

    // Auto-close after duration
    const hideTimeout = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const createParticles = () => {
    const particleCount = 30;
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 0.5,
      });
    }
    setParticles(newParticles);
  };

  const handleClose = () => {
    if (closing) return;

    setClosing(true);
    setVisible(false);

    // Allow animation to complete before removing from DOM
    setTimeout(() => {
      if (onClose) onClose();
    }, 500);
  };

  const totalXP = rewards?.exp || 0;
  const items = rewards?.item ? [rewards.item] : [];
  const abilities = rewards?.ability ? [rewards.ability] : [];

  return (
    <div
      className={`quest-completion-celebration ${visible ? "visible" : ""} ${closing ? "closing" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-labelledby="quest-completion-title"
      aria-modal="true"
    >
      <div className="quest-celebration-particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="quest-celebration-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="quest-celebration-content">
        <div className="quest-celebration-icon">🎉</div>
        <h2 id="quest-completion-title" className="quest-celebration-title">
          Quest Complete!
        </h2>
        <div className="quest-celebration-quest-name">
          {quest?.title || "Quest"}
        </div>

        {(totalXP > 0 || items.length > 0 || abilities.length > 0) && (
          <div className="quest-celebration-rewards">
            <div className="quest-rewards-header">Rewards:</div>

            {totalXP > 0 && (
              <div className="quest-reward-item xp-reward">
                <span className="reward-icon">⭐</span>
                <span className="reward-text">+{totalXP} XP</span>
              </div>
            )}

            {items.map((item, index) => (
              <div key={index} className="quest-reward-item item-reward">
                <span className="reward-icon">🎁</span>
                <span className="reward-text">{item}</span>
              </div>
            ))}

            {abilities.map((ability, index) => (
              <div key={index} className="quest-reward-item ability-reward">
                <span className="reward-icon">⚡</span>
                <span className="reward-text">{ability}</span>
              </div>
            ))}
          </div>
        )}

        <button
          className="quest-celebration-close"
          onClick={handleClose}
          aria-label="Close celebration"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

QuestCompletionCelebration.propTypes = {
  quest: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
  rewards: PropTypes.shape({
    exp: PropTypes.number,
    item: PropTypes.string,
    ability: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default QuestCompletionCelebration;
