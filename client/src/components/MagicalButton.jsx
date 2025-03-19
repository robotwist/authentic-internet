import React, { useState, useEffect, useRef } from 'react';
import '../styles/MagicalButton.css';

const MagicalButton = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [birdVisible, setBirdVisible] = useState(false);
  const [birdPosition, setBirdPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const handleButtonClick = () => {
    // Get the button position for the bird's starting point
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setBirdPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      });
    }
    
    // Create smoke/poof effect
    setIsVisible(false);
    setBirdVisible(true);
    
    // Play sound effect
    const poofSound = new Audio('/assets/sounds/poof.mp3');
    poofSound.volume = 0.5;
    poofSound.play().catch(err => console.log('Audio play failed:', err));
  };

  // Animate the bird flying upward and off the screen
  useEffect(() => {
    if (birdVisible) {
      const animationTimer = setTimeout(() => {
        setBirdVisible(false);
      }, 2000); // Animation duration in milliseconds
      
      return () => clearTimeout(animationTimer);
    }
  }, [birdVisible]);

  return (
    <div className="magical-container">
      {isVisible && (
        <button 
          ref={buttonRef}
          className="magical-button"
          onClick={handleButtonClick}
        >
          Press the Button
        </button>
      )}
      
      {birdVisible && (
        <div 
          className="magical-bird"
          style={{ 
            top: `${birdPosition.top}px`,
            left: `${birdPosition.left}px`
          }}
        >
          {/* Bird sprite images will be applied via CSS */}
        </div>
      )}
    </div>
  );
};

export default MagicalButton; 