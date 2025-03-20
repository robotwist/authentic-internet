import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './DialogBox.css';

const DialogBox = ({ npc, onClose }) => {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  
  // If npc.dialogue is a string, convert it to an array
  const dialogueArray = Array.isArray(npc.dialogue) ? npc.dialogue : [npc.dialogue];
  const currentDialogue = dialogueArray[currentDialogueIndex];
  
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
    
    // Otherwise move to the next dialogue
    if (currentDialogueIndex < dialogueArray.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      // We've reached the end of the dialogue
      onClose();
    }
  };
  
  return (
    <div className="dialog-overlay" onClick={handleNext}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{npc.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="dialog-content">
          <div className="npc-message">
            {displayedText}
            {isTyping && <span className="typing-cursor">_</span>}
          </div>
        </div>
        <div className="dialog-footer">
          {isTyping ? (
            <button className="dialog-btn" onClick={handleNext}>Skip</button>
          ) : (
            <button className="dialog-btn" onClick={handleNext}>
              {currentDialogueIndex < dialogueArray.length - 1 ? 'Next' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

DialogBox.propTypes = {
  npc: PropTypes.shape({
    name: PropTypes.string.isRequired,
    dialogue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]).isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default DialogBox; 