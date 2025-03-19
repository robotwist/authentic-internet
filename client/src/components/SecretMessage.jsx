import React, { useState, useEffect } from 'react';
import MagicalButton from './MagicalButton';
import '../styles/MagicalButton.css';

const SecretMessage = () => {
  const [buttonAppeared, setButtonAppeared] = useState(false);
  
  // After message is shown, reveal the button with a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonAppeared(true);
    }, 2000);
    
    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="secret-message-container">
      <div className="secret-message">
        Be patient very wise one. Seek the secret path and thee shall find the ability to create new worlds.
      </div>
      
      {buttonAppeared && <MagicalButton />}
    </div>
  );
};

export default SecretMessage; 