import React, { useEffect, useState } from 'react';
import './DamageNumber.css';

/**
 * DamageNumber - Floating damage indicator
 * Shows damage amount with animation
 */
const DamageNumber = ({ damage, position, onComplete, isCritical = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`damage-number ${isCritical ? 'damage-critical' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {damage}
    </div>
  );
};

export default DamageNumber;

