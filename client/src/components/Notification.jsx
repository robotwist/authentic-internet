import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useTimeout } from "../hooks/useTimeout";
import "./Notification.css";

// Constants
const DEFAULT_DURATION_MS = 3000;
const FADE_OUT_DURATION_MS = 300;

/**
 * Notification component for displaying temporary messages to the user
 *
 * @param {Object} props
 * @param {string} props.message - The message to display
 * @param {string} props.type - The type of notification (info, success, warning, error)
 * @param {number} props.duration - How long to show the notification in ms (default: 3000)
 * @param {Function} props.onClose - Callback function when notification is closed
 */
const Notification = ({
  message,
  type = "info",
  duration = DEFAULT_DURATION_MS,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);
  const closeTimeoutRef = useRef(null);

  // Handle close with proper cleanup
  const handleClose = useCallback(() => {
    setAnimateOut(true);

    // Clear any existing close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // Wait for fade out animation before hiding and calling onClose
    closeTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, FADE_OUT_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setAnimateOut(false);

    // Set a timeout to start the fade-out animation
    const animateTimeout = setTimeout(() => {
      setAnimateOut(true);
    }, duration - FADE_OUT_DURATION_MS);

    // Set a timeout to hide the notification
    const hideTimeout = setTimeout(() => {
      handleClose();
    }, duration);

    // Clean up timeouts on unmount or if props change
    return () => {
      clearTimeout(animateTimeout);
      clearTimeout(hideTimeout);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [message, duration, handleClose]);

  // If no message or not visible, don't render anything
  if (!message || !visible) return null;

  // Validate notification type
  const validTypes = ["info", "success", "warning", "error"];
  const notificationType = validTypes.includes(type) ? type : "info";

  return (
    <div
      className={`notification notification-${notificationType} ${animateOut ? "fade-out" : ""}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon based on notification type */}
      <div className="notification-icon" aria-hidden="true">
        {notificationType === "success" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {notificationType === "error" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        {notificationType === "warning" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )}
        {notificationType === "info" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className="notification-content">{message}</div>

      {/* Close button */}
      <button
        className="notification-close"
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["info", "success", "warning", "error"]),
  duration: PropTypes.number,
  onClose: PropTypes.func,
};

Notification.defaultProps = {
  type: "info",
  duration: DEFAULT_DURATION_MS,
  onClose: undefined,
};

export default Notification;
