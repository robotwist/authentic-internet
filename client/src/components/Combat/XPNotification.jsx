import React, { useEffect, useState } from "react";
import "./XPNotification.css";

const XPNotification = ({ amount, position, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
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
      className="xp-notification"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      +{amount} XP
    </div>
  );
};

export default XPNotification;
