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
    
    // Otherwise move to the next dialogue
    if (currentDialogueIndex < dialogueArray.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      // We've reached the end of the dialogue
      onClose();
    }
  };

  // Safely access NPC type even if it's nested or undefined
  const npcType = npc?.type?.toLowerCase ? npc.type.toLowerCase() : 'generic';
  const npcName = npc?.name || 'Unknown NPC';
  
  return (
    <div className="dialog-overlay" data-npc-type={npcType}>
      <div className="dialog-box">
        <div className="dialog-header">
          <h3>{npcName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          <div className="npc-message">
            {displayedText}
            {isTyping && <span className="typing-cursor">_</span>}
          </div>
        </div>
        
        <div className="dialog-actions">
          <button 
            onClick={handleNext}
            disabled={!currentDialogue}
            className="dialog-btn"
          >
            {isTyping ? 'Skip' : currentDialogueIndex < dialogueArray.length - 1 ? 'Next' : 'Close'}
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
    ]).isRequired,
    type: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default DialogBox; 