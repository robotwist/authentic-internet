import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './XPNotification.css';

const XPNotification = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animation, setAnimation] = useState('slide-in');

  useEffect(() => {
    // Set a timeout to start the slide-out animation
    const slideOutTimer = setTimeout(() => {
      setAnimation('slide-out');
    }, duration - 500); // Start slide-out 500ms before duration ends

    // Set a timeout to hide the notification after animation completes
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    // Cleanup timers when component unmounts or when a new notification comes in
    return () => {
      clearTimeout(slideOutTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose, message]);

  if (!isVisible) return null;

  return (
    <div className={`xp-notification ${type} ${animation}`}>
      <div className="xp-notification-content">
        {type === 'success' && <span className="xp-icon">✨</span>}
        {type === 'info' && <span className="xp-icon">ℹ️</span>}
        {type === 'warning' && <span className="xp-icon">⚠️</span>}
        <span className="xp-message">{message}</span>
      </div>
    </div>
  );
};

XPNotification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'info', 'warning']),
  duration: PropTypes.number,
  onClose: PropTypes.func
};

export default XPNotification; 