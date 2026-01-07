import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./AchievementNotification.css";

/**
 * Component that displays a notification when a user unlocks an achievement
 * Uses animation to slide in from the side and eventually disappear
 */
const AchievementNotification = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Make the notification visible after a small delay for animation purposes
    const showTimeout = setTimeout(() => {
      setVisible(true);
    }, 100);

    // Automatically hide the notification after a delay
    const hideTimeout = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const handleClose = () => {
    if (closing) return;

    setClosing(true);
    setVisible(false);

    // Allow animation to complete before removing from DOM
    setTimeout(() => {
      if (onClose) onClose();
    }, 500);
  };

  return (
    <div
      className={`achievement-notification ${visible ? "visible" : ""} ${closing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div className="achievement-notification-content">
        <div className="achievement-notification-icon">🏆</div>
        <div className="achievement-notification-text">
          <div className="achievement-notification-title">
            Achievement Unlocked!
          </div>
          <div className="achievement-notification-name">
            {achievement.name}
          </div>
          <div className="achievement-notification-description">
            {achievement.description}
          </div>
        </div>
        <button
          className="achievement-notification-close"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

AchievementNotification.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    type: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
};

export default AchievementNotification;
