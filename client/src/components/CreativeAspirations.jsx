import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Artifact.css'; // Using the styles we added to Artifact.css

const CreativeAspirations = ({ onClose, onStartCreating }) => {
  const [visible, setVisible] = useState(true);

  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Slight delay to allow animation
  };

  const handleStartCreating = () => {
    setVisible(false);
    setTimeout(() => {
      if (onStartCreating) onStartCreating();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div className="creative-aspirations-overlay" onClick={handleClose}>
      <div className="creative-aspirations-container" onClick={(e) => e.stopPropagation()}>
        <h2 className="creative-aspirations-title">Your Creative Journey Begins Here</h2>
        
        <div className="creative-aspirations-questions">
          What do you want to create?<br />
          What have you already created?<br />
          What do you dream of creating?
        </div>
        
        <p className="creative-aspirations-description">
          The Authentic Internet is the place where you leave your creations for others to discover and love. 
          Share your wisdom, inspiration, and creative spirit through artifacts that will touch the lives of others.
          Each creation is a reflection of you, and every interaction with your artifacts earns you experience and recognition.
        </p>
        
        <button className="creative-aspirations-button" onClick={handleStartCreating}>
          Start Creating
        </button>
      </div>
    </div>
  );
};

CreativeAspirations.propTypes = {
  onClose: PropTypes.func,
  onStartCreating: PropTypes.func
};

export default CreativeAspirations; 