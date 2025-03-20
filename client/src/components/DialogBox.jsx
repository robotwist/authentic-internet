import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './DialogBox.css';

const DialogBox = ({ npc, onClose }) => {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  
  // Ensure dialogue is always valid, with fallback for invalid data
  const getDialogueArray = () => {
    if (!npc) return ['No NPC data available'];
    if (!npc.dialogue) return ['This NPC has nothing to say...'];
    
    // If npc.dialogue is a string, convert it to an array
    return Array.isArray(npc.dialogue) ? npc.dialogue : [npc.dialogue];
  };
  
  const dialogueArray = getDialogueArray();
  const currentDialogue = dialogueArray[currentDialogueIndex] || 'No dialogue available';
  
  // Typing effect
  useEffect(() => {
    if (!currentDialogue) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    let i = 0;
    const speed = 30; // ms per character
    
    const typingInterval = setInterval(() => {
      if (i < currentDialogue.length) {
        setDisplayedText(prev => prev + currentDialogue.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, speed);
    
    return () => clearInterval(typingInterval);
  }, [currentDialogue, currentDialogueIndex]);
  
  const handleNext = () => {
    // If typing is in progress, show the full text immediately
    if (isTyping) {
      setIsTyping(false);
      setDisplayedText(currentDialogue);
      return;
    }
    
    // Otherwise, move to the next dialogue if available
    if (currentDialogueIndex < dialogueArray.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      onClose(); // Close dialog when no more dialogue available
    }
  };

  return (
    <div 
      className="dialog-overlay" 
      data-npc-type={npc?.type?.toLowerCase()} // Add data attribute for CSS styling
    >
      <div className="dialog-box">
        <div className="dialog-header">
          <h3>{npc?.name || 'NPC'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          <div className={`npc-message ${isTyping ? 'typing' : ''}`}>
            {displayedText}
            {isTyping && <span className="typing-cursor">|</span>}
          </div>
        </div>
        
        <div className="dialog-footer">
          <button 
            className="dialog-btn" 
            onClick={handleNext}
          >
            {isTyping ? 'Skip' : 
              (currentDialogueIndex < dialogueArray.length - 1 ? 'Next' : 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

DialogBox.propTypes = {
  npc: PropTypes.shape({
    name: PropTypes.string,
    dialogue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    type: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired
};

export default DialogBox; 