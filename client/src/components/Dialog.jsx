import React, { useState, useEffect } from 'react';
import './Dialog.css';

/**
 * Dialog component for in-game conversations and messages
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {function} props.onClose - Function to call when dialog is closed
 * @param {string} props.title - Dialog title
 * @param {string|React.ReactNode} props.content - Dialog content
 * @param {Array} props.options - Dialog options/choices
 * @param {string} props.characterName - Name of the speaking character (optional)
 * @param {string} props.characterAvatar - URL of character avatar (optional)
 */
const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  options = [], 
  characterName,
  characterAvatar,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Add a small delay before fully hiding for animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!isVisible) return null;
  
  const handleOptionSelect = (option) => {
    if (option.action) {
      option.action();
    }
    if (option.closeDialog) {
      onClose();
    }
  };
  
  return (
    <div className={`dialog-overlay ${isOpen ? 'active' : 'closing'}`}>
      <div className={`dialog-container ${className} ${isOpen ? 'active' : 'closing'}`}>
        {characterAvatar && (
          <div className="dialog-avatar">
            <img src={characterAvatar} alt={characterName || "Character"} />
          </div>
        )}
        
        <div className="dialog-content">
          {title && <h3 className="dialog-title">{characterName || title}</h3>}
          <div className="dialog-message">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </div>
          
          {options.length > 0 && (
            <div className="dialog-options">
              {options.map((option, index) => (
                <button
                  key={index}
                  className="dialog-option"
                  onClick={() => handleOptionSelect(option)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}
          
          {(!options || options.length === 0) && (
            <div className="dialog-close">
              <button onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog; 