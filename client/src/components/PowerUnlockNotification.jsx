import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { getPowerDefinition } from "../constants/Powers";
import "./PowerUnlockNotification.css";

// Constants - extracted magic numbers for maintainability
const ANIMATION_DELAY_MS = 100;
const AUTO_CLOSE_DELAY_MS = 5000;
const FADE_OUT_DURATION_MS = 500;
const PARTICLE_COUNT = 20;
const PARTICLE_DELAY_INCREMENT = 0.1;
const PARTICLE_ANGLE_INCREMENT = 18;

/**
 * PowerUnlockNotification Component
 * Displays a notification when a player unlocks a new power
 *
 * @param {Object} props
 * @param {Object} props.power - The power object containing id, name, description, and optional source
 * @param {Function} props.onClose - Callback function called when notification closes
 */
const PowerUnlockNotification = ({ power, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const powerDef = getPowerDefinition(power?.id);
  const closeTimeoutRef = useRef(null);
  const fadeOutTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // Handle close with proper cleanup
  const handleClose = useCallback(() => {
    setIsVisible(false);

    // Clear any existing fade-out timeout
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current);
    }

    // Wait for fade out animation before calling onClose
    fadeOutTimeoutRef.current = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, FADE_OUT_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    // Validate power data
    if (!power || !powerDef) {
      console.warn("PowerUnlockNotification: Invalid power data provided");
      if (onClose) {
        onClose();
      }
      return;
    }

    // Trigger animation
    animationTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, ANIMATION_DELAY_MS);

    // Auto-close after specified delay
    closeTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, AUTO_CLOSE_DELAY_MS);

    // Cleanup function - clear all timeouts
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
    };
  }, [power, powerDef, onClose, handleClose]);

  // Early return if invalid power data
  if (!power || !powerDef) {
    return null;
  }

  // Generate particle styles
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    key: i,
    delay: `${i * PARTICLE_DELAY_INCREMENT}s`,
    angle: `${i * PARTICLE_ANGLE_INCREMENT}deg`,
  }));

  return (
    <div
      className={`power-unlock-notification ${isVisible ? "visible" : ""}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="power-unlock-content">
        <div className="power-unlock-icon" aria-hidden="true">
          {powerDef.icon}
        </div>
        <div className="power-unlock-text">
          <h3>Power Unlocked!</h3>
          <p className="power-name">{power.name || powerDef.name}</p>
          <p className="power-description">
            {power.description || powerDef.description}
          </p>
          {power.source && (
            <p className="power-source">Unlocked from: {power.source}</p>
          )}
        </div>
        <button
          className="close-notification"
          onClick={handleClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
      <div className="power-unlock-particles" aria-hidden="true">
        {particles.map((particle) => (
          <div
            key={particle.key}
            className="particle"
            style={{
              "--delay": particle.delay,
              "--angle": particle.angle,
            }}
          />
        ))}
      </div>
    </div>
  );
};

PowerUnlockNotification.propTypes = {
  power: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    source: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PowerUnlockNotification;
