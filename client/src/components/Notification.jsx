import React, { useState, useEffect } from 'react';
import './Notification.css';

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
  type = 'info', 
  duration = 3000, 
  onClose
}) => {
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (!message) return;
    
    setVisible(true);
    setAnimateOut(false);
    
    // Set a timeout to start the fade-out animation
    const animateTimeout = setTimeout(() => {
      setAnimateOut(true);
    }, duration - 300); // Start animation 300ms before actually closing
    
    // Set a timeout to hide the notification
    const hideTimeout = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    
    // Clean up timeouts on unmount or if props change
    return () => {
      clearTimeout(animateTimeout);
      clearTimeout(hideTimeout);
    };
  }, [message, duration, onClose]);

  // If no message or not visible, don't render anything
  if (!message || !visible) return null;

  return (
    <div className={`notification notification-${type} ${animateOut ? 'fade-out' : ''}`}>
      {/* Icon based on notification type */}
      <div className="notification-icon">
        {type === 'success' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        {type === 'warning' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )}
        {type === 'info' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        onClick={() => {
          setAnimateOut(true);
          setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
          }, 300);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default Notification; 