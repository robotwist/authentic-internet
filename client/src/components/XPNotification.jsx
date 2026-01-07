import React, { useEffect, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import "./XPNotification.css";

// Constants
const DEFAULT_DURATION_MS = 3000;
const SLIDE_OUT_DELAY_MS = 500;

/**
 * XPNotification Component
 * Displays experience point gain notifications with animations
 *
 * @param {Object} props
 * @param {string} props.message - Custom message to display (overrides auto-generated message)
 * @param {number} props.amount - XP amount gained
 * @param {string} props.reason - Reason for XP gain
 * @param {string} props.type - Notification type (success, info, warning)
 * @param {number} props.duration - How long to show notification in ms
 * @param {Function} props.onClose - Callback when notification closes
 */
const XPNotification = ({
  message,
  amount,
  reason,
  type = "success",
  duration = DEFAULT_DURATION_MS,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animation, setAnimation] = useState("slide-in");
  const closeTimeoutRef = useRef(null);

  // Determine the display message
  const displayMessage =
    message || (amount && reason ? `+${amount} XP - ${reason}` : "XP Gained!");

  // Handle close with proper cleanup
  const handleClose = useCallback(() => {
    setIsVisible(false);

    // Clear any existing close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // Call onClose callback
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    // Set a timeout to start the slide-out animation
    const slideOutTimer = setTimeout(() => {
      setAnimation("slide-out");
    }, duration - SLIDE_OUT_DELAY_MS);

    // Set a timeout to hide the notification after animation completes
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    // Cleanup timers when component unmounts or when a new notification comes in
    return () => {
      clearTimeout(slideOutTimer);
      clearTimeout(hideTimer);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [duration, handleClose, displayMessage]);

  // Early return if not visible
  if (!isVisible) return null;

  // Validate notification type
  const validTypes = ["success", "info", "warning"];
  const notificationType = validTypes.includes(type) ? type : "success";

  return (
    <div
      className={`xp-notification ${notificationType} ${animation}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={displayMessage}
    >
      <div className="xp-notification-content">
        {notificationType === "success" && (
          <span className="xp-icon" aria-hidden="true">
            ✨
          </span>
        )}
        {notificationType === "info" && (
          <span className="xp-icon" aria-hidden="true">
            ℹ️
          </span>
        )}
        {notificationType === "warning" && (
          <span className="xp-icon" aria-hidden="true">
            ⚠️
          </span>
        )}
        {amount && (
          <span className="xp-icon" aria-hidden="true">
            🌟
          </span>
        )}
        <span className="xp-message">{displayMessage}</span>
      </div>
    </div>
  );
};

XPNotification.propTypes = {
  message: PropTypes.string,
  amount: PropTypes.number,
  reason: PropTypes.string,
  type: PropTypes.oneOf(["success", "info", "warning"]),
  duration: PropTypes.number,
  onClose: PropTypes.func,
};

XPNotification.defaultProps = {
  message: undefined,
  amount: undefined,
  reason: undefined,
  type: "success",
  duration: DEFAULT_DURATION_MS,
  onClose: undefined,
};

export default XPNotification;
