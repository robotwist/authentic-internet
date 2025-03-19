import React, { useState, useEffect, useRef } from 'react';
import { chat, updateCharacter } from '../api/api';
import './NPC.css';
import { TILE_SIZE, NPC_TYPES, isWalkable } from './Constants';
import PropTypes from 'prop-types';

const NPC = ({ npc, position, characterPosition, onDialogStateChange, mapData, character, onUpdateCharacter }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isPatrolling, setIsPatrolling] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState(character?.savedQuotes || []);
  const conversationRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Enhanced patrol behavior
  useEffect(() => {
    if (!isPatrolling) return;

    const moveRandomly = () => {
      const currentX = currentPosition.x / TILE_SIZE;
      const currentY = currentPosition.y / TILE_SIZE;
      
      const directions = [
        { x: -1, y: 0 }, { x: 1, y: 0 }, 
        { x: 0, y: -1 }, { x: 0, y: 1 }
      ];
      
      const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
      
      for (const direction of shuffledDirections) {
        const newX = currentX + direction.x;
        const newY = currentY + direction.y;
        
        // Use the NPC type for walkable check if it's Jesus
        const characterType = npc.type === NPC_TYPES.JESUS ? 'jesus' : null;
        
        if (newX >= 0 && newX < 20 && newY >= 0 && newY < 18 && 
            isWalkable(newX * TILE_SIZE, newY * TILE_SIZE, mapData, characterType)) {
          setCurrentPosition({
            x: newX * TILE_SIZE,
            y: newY * TILE_SIZE
          });
          break;
        }
      }
    };

    const patrolInterval = setInterval(moveRandomly, 2000);
    return () => clearInterval(patrolInterval);
  }, [isPatrolling, currentPosition, mapData, npc.type]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    // Function to detect if virtual keyboard is likely visible
    const handleFocus = () => {
      // Only on mobile
      if (window.innerWidth <= 768) {
        setKeyboardVisible(true);
        
        // Add class for CSS positioning
        const dialog = document.querySelector('.dialog-overlay');
        if (dialog) {
          dialog.classList.add('keyboard-open');
        }
      }
    };
    
    const handleBlur = () => {
      setKeyboardVisible(false);
      
      // Remove class
      const dialog = document.querySelector('.dialog-overlay');
      if (dialog) {
        dialog.classList.remove('keyboard-open');
      }
    };
    
    // Input elements to watch
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });
    
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, [showDialog]);

  const handleInteraction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const distance = Math.sqrt(
      Math.pow(characterPosition.x - currentPosition.x, 2) +
      Math.pow(characterPosition.y - currentPosition.y, 2)
    );

    if (distance <= TILE_SIZE * 2) {
      setShowDialog(true);
      setIsPatrolling(false);
      onDialogStateChange?.(true);
      setChatHistory([{ role: 'npc', text: getGreeting() }]);
      
      // Add a visual feedback for click interaction
      const npcElement = document.querySelector(`.npc.${npc.type}`);
      if (npcElement) {
        npcElement.classList.add('clicked');
        setTimeout(() => {
          npcElement.classList.remove('clicked');
        }, 300);
      }
      
      setTimeout(() => {
        const inputElement = document.querySelector('.prompt-form input');
        if (inputElement) {
          inputElement.focus();
          // Prevent input from triggering game controls
          inputElement.addEventListener('keydown', e => e.stopPropagation());
        }
      }, 100);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setIsPatrolling(true);
    onDialogStateChange?.(false);
  };

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!userInput.trim()) return;

    const newMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);
    setIsThinking(true);
    
    try {
      const contextualizedPrompt = `${userInput} (Remember to respond in character as ${npc.name}, ${npc.role})`;
      const result = await chat(contextualizedPrompt, npc.context, npc.role, npc);
      
      if (Array.isArray(result.response)) {
        // Handle array of responses (e.g., from Shakespeare API)
        const formattedResponses = result.response.map(match => ({
          role: 'npc',
          text: match.text,
          source: match.source,
          type: match.type
        }));
        setChatHistory(prev => [...prev, ...formattedResponses]);
      } else if (typeof result.response === 'string' && result.response.includes('\n\n')) {
        // Handle multiple quotes separated by newlines
        const quotes = result.response.split('\n\n');
        const formattedResponses = quotes.map(quote => ({
          role: 'npc',
          text: quote,
          source: result.source
        }));
        setChatHistory(prev => [...prev, ...formattedResponses]);
      } else {
        // Handle single response
        const npcResponse = {
          role: 'npc',
          text: result.response || result.quote || "I'm afraid I don't have a response for that.",
          source: result.source
        };
        setChatHistory(prev => [...prev, npcResponse]);
      }
    } catch (error) {
      console.error('Failed to get NPC response:', error);
      setChatHistory(prev => [...prev, {
        role: 'npc',
        text: getCharacterSpecificErrorMessage(npc.type)
      }]);
    } finally {
      setIsTyping(false);
      setIsThinking(false);
      setTimeout(() => {
        const inputElement = document.querySelector('.prompt-form input');
        if (inputElement) {
          inputElement.focus();
          // Ensure the input is in focus to capture keyboard events
          inputElement.addEventListener('keydown', e => e.stopPropagation());
        }
      }, 100);
    }
  };

  const getCharacterSpecificErrorMessage = (npcType) => {
    const messages = {
      [NPC_TYPES.SHAKESPEARE]: "The fool doth think he is wise, but the wise man knows himself to be a fool. (As You Like It, Act V, Scene I)",
      [NPC_TYPES.ADA_LOVELACE]: "The science of operations, as derived from mathematics more especially, is a science of itself, and has its own abstract truth and value. (Notes on the Analytical Engine, 1843)",
      [NPC_TYPES.LORD_BYRON]: "There is a pleasure in the pathless woods, there is a rapture on the lonely shore. (Childe Harold's Pilgrimage, Canto IV, Stanza 178)",
      [NPC_TYPES.ARTIST]: "The art speaks for itself, but sometimes it needs a translator.",
      [NPC_TYPES.MICHELANGELO]: "The greater danger for most of us lies not in setting our aim too high and falling short, but in setting our aim too low and achieving our mark.",
      [NPC_TYPES.OSCAR_WILDE]: "I can resist everything except temptation. (Lady Windermere's Fan, 1892)",
      [NPC_TYPES.ALEXANDER_POPE]: "To err is human, to forgive divine. (An Essay on Criticism, 1711)",
      [NPC_TYPES.ZEUS]: "Even the gods cannot alter the past, but the future is yet in my power. (Greek mythology)",
      [NPC_TYPES.JOHN_MUIR]: "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
      [NPC_TYPES.JESUS]: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you. (Matthew 7:7)"
    };
    return messages[npcType] || "Forgive me, but I need a moment to gather my thoughts...";
  };

  const getNPCImage = () => {
    const images = {
      [NPC_TYPES.SHAKESPEARE]: '/assets/npcs/shakespeare.webp',
      [NPC_TYPES.ARTIST]: '/assets/npcs/artist.svg',
      [NPC_TYPES.MICHELANGELO]: '/assets/npcs/michelangelo.svg',
      [NPC_TYPES.ADA_LOVELACE]: '/assets/npcs/ada_lovelace.png',
      [NPC_TYPES.LORD_BYRON]: '/assets/npcs/lord_byron.webp',
      [NPC_TYPES.OSCAR_WILDE]: '/assets/npcs/oscar_wilde.svg',
      [NPC_TYPES.ALEXANDER_POPE]: '/assets/npcs/alexander_pope.svg',
      [NPC_TYPES.ZEUS]: '/assets/npcs/zeus.svg',
      [NPC_TYPES.JOHN_MUIR]: '/assets/npcs/john_muir.png',
      [NPC_TYPES.JESUS]: '/assets/npcs/jesus.png'
    };
    return images[npc.type] || `/assets/npcs/${npc.type}.svg`;
  };

  const getGreeting = () => {
    const greetings = {
      [NPC_TYPES.SHAKESPEARE]: "What's in a name? That which we call a rose by any other word would smell as sweet. (Romeo and Juliet, Act II, Scene II)",
      [NPC_TYPES.ADA_LOVELACE]: "That brain of mine is something more than merely mortal; as time will show. (Letter to her mother, 1843)",
      [NPC_TYPES.LORD_BYRON]: "She walks in beauty, like the night of cloudless climes and starry skies. (She Walks in Beauty, 1814)",
      [NPC_TYPES.ARTIST]: "Welcome! Let us explore the intersection of art and technology.",
      [NPC_TYPES.MICHELANGELO]: "I saw the angel in the marble and carved until I set him free. (Letter to Benedetto Varchi, 1549)",
      [NPC_TYPES.OSCAR_WILDE]: "The truth is rarely pure and never simple. (The Importance of Being Earnest, 1895)",
      [NPC_TYPES.ALEXANDER_POPE]: "Hope springs eternal in the human breast; Man never is, but always to be blessed. (An Essay on Man, 1734)",
      [NPC_TYPES.ZEUS]: "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus? (Iliad, 8th century BCE)",
      [NPC_TYPES.JOHN_MUIR]: "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
      [NPC_TYPES.JESUS]: "Come, follow me, and I will make you fishers of men. (Matthew 4:19)"
    };
    return greetings[npc.type] || npc.dialogue?.[0] || "Hello, traveler!";
  };

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSaveQuote = (quote) => {
    if (!character) return;
    
    // Create a new savedQuotes array if it doesn't exist
    const updatedQuotes = [...(character.savedQuotes || [])];
    
    // Check if quote is already saved
    if (!updatedQuotes.some(q => q.text === quote.text)) {
      updatedQuotes.push({
        text: quote.text,
        source: quote.source,
        timestamp: new Date().toISOString()
      });
      
      // Update character with new quotes
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes
      };
      
      // Update local state
      setSavedQuotes(updatedQuotes);
      
      // Update character in parent component
      if (onUpdateCharacter) {
        onUpdateCharacter(updatedCharacter);
      }
      
      // Update character in database
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ Quote saved to character profile"))
        .catch(err => console.error("❌ Failed to save quote:", err));
      
      return true;
    }
    
    return false;
  };

  // Add a function to ensure each message is visible
  const renderMessage = (msg, index) => (
    <div key={index} className={`message ${msg.role}`}>
      <p>{msg.text}</p>
      {msg.source && (
        <p className="message-source">Source: {msg.source}</p>
      )}
      {msg.role === 'npc' && npc.type === NPC_TYPES.SHAKESPEARE && msg.source && (
        <button 
          className="save-quote-button"
          onClick={() => {
            const saved = handleSaveQuote(msg);
            if (saved) {
              // Show saved confirmation
              const button = document.querySelector(`.message:nth-child(${index + 1}) .save-quote-button`);
              if (button) {
                button.textContent = "✓ Saved to Profile";
                button.disabled = true;
                setTimeout(() => {
                  button.textContent = "Save Quote";
                  button.disabled = false;
                }, 2000);
              }
            }
          }}
        >
          {savedQuotes?.some(q => q.text === msg.text) ? "✓ Saved" : "Save Quote"}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div
        className={`npc ${npc.type} ${isPatrolling ? 'patrolling' : ''}`}
        style={{
          position: 'absolute',
          left: `${currentPosition.x}px`,
          top: `${currentPosition.y}px`,
          width: `${TILE_SIZE}px`,
          height: `${TILE_SIZE}px`,
          backgroundImage: `url('${getNPCImage()}')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          cursor: 'pointer',
          zIndex: 5
        }}
        onClick={handleInteraction}
        data-type={npc.type}
      />
      
      {showDialog && (
        <div className={`dialog-overlay ${keyboardVisible ? 'keyboard-open' : ''}`} style={{
          left: `${Math.min(Math.max(currentPosition.x + TILE_SIZE / 2, TILE_SIZE * 2), window.innerWidth - TILE_SIZE * 2)}px`,
          top: `${Math.max(currentPosition.y, TILE_SIZE * 2)}px`,
          transform: `translate(-50%, ${currentPosition.y < window.innerHeight / 2 ? '0' : '-100%'})`
        }}>
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>{npc.name}</h3>
              <button className="close-button" onClick={handleCloseDialog}>×</button>
            </div>
            
            <div className="npc-info">
              <img src={getNPCImage()} alt={npc.name} className="npc-avatar" />
              <div className="npc-details">
                <p className="npc-role">{npc.role}</p>
                <p className="npc-description">{npc.description}</p>
              </div>
            </div>
            
            <div className="conversation" ref={conversationRef}>
              {chatHistory.map(renderMessage)}
              
              {isTyping && (
                <div className="typing-indicator">
                  <span>●</span><span>●</span><span>●</span>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmitPrompt} className="prompt-form">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isThinking ? `${npc.name} is contemplating...` : `Ask ${npc.name} something...`}
                disabled={isTyping}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => {
                  if (window.innerWidth <= 768) {
                    setKeyboardVisible(true);
                  }
                }}
                onBlur={() => setKeyboardVisible(false)}
              />
              <button type="submit" disabled={isTyping || !userInput.trim()}>
                {isTyping ? 'Thinking...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

NPC.propTypes = {
  npc: PropTypes.object.isRequired,
  position: PropTypes.object.isRequired,
  characterPosition: PropTypes.object.isRequired,
  onDialogStateChange: PropTypes.func,
  mapData: PropTypes.array.isRequired,
  character: PropTypes.object,
  onUpdateCharacter: PropTypes.func
};

export default NPC; 