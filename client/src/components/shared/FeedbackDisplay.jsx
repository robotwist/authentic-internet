import React from 'react';
import './FeedbackDisplay.css';

const FeedbackDisplay = ({ message, type = 'info', duration = 2000 }) => {
  if (!message) return null;

  return (
    <div className={`feedback-display feedback-${type}`}>
      <div className="feedback-content">
        {message}
      </div>
    </div>
  );
};

export default FeedbackDisplay;