import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTimeout } from "../../hooks/useTimeout";
import "./DamageNumber.css";

// Constants
const ANIMATION_DURATION_MS = 1000;

/**
 * DamageNumber - Floating damage indicator
 * Shows damage amount with animation
 *
 * @param {Object} props
 * @param {number} props.damage - The damage amount to display
 * @param {Object} props.position - Position object with x and y coordinates
 * @param {Function} props.onComplete - Callback function when animation completes
 * @param {boolean} props.isCritical - Whether this is a critical hit
 */
const DamageNumber = ({ damage, position, onComplete, isCritical = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Use custom hook for timeout with proper cleanup
  useTimeout(() => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  }, ANIMATION_DURATION_MS);

  // Early return if not visible
  if (!isVisible) return null;

  // Validate position
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    console.warn("DamageNumber: Invalid position provided");
    return null;
  }

  return (
    <div
      className={`damage-number ${isCritical ? "damage-critical" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="status"
      aria-live="polite"
      aria-label={`Damage: ${damage}${isCritical ? " (Critical)" : ""}`}
    >
      {damage}
    </div>
  );
};

DamageNumber.propTypes = {
  damage: PropTypes.number.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onComplete: PropTypes.func,
  isCritical: PropTypes.bool,
};

DamageNumber.defaultProps = {
  onComplete: undefined,
  isCritical: false,
};

export default DamageNumber;
