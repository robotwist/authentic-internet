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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      if (isMobile) {
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
  }, [showDialog, isMobile]);

  // Generate suggested replies based on conversation context
  useEffect(() => {
    if (chatHistory.length > 0 && !isTyping) {
      // Get the last NPC message to generate contextual replies
      const lastNpcMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === 'npc');
      
      if (lastNpcMessage) {
        const npcType = npc.type.toLowerCase();
        let replies = [];
        
        // Generate replies based on NPC type and last message
        switch(npcType) {
          case NPC_TYPES.SHAKESPEARE.toLowerCase():
            replies = [
              "Tell me about your plays",
              "What inspires your writing?",
              "Your thoughts on love?",
              "Tell me a quote"
            ];
            break;
          case NPC_TYPES.JOHN_MUIR.toLowerCase():
            replies = [
              "Tell me about Yosemite",
              "What about conservation?",
              "Your favorite natural place?",
              "Why is nature important?"
            ];
            break;
          case NPC_TYPES.ZEUS.toLowerCase():
            replies = [
              "Tell me a myth",
              "About Mount Olympus?",
              "Your favorite child?",
              "Weather prediction?"
            ];
            break;
          default:
            replies = [
              "Tell me more",
              "What's your philosophy?",
              "Any advice for me?",
              "Share a quote"
            ];
        }
        
        // If we have a message text, we can use AI to generate more contextual replies
        // For now we'll use the static ones above
        setSuggestedReplies(replies);
      }
    }
  }, [chatHistory, isTyping, npc.type]);

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
        if (inputRef.current) {
          inputRef.current.focus();
          // Prevent input from triggering game controls
          inputRef.current.addEventListener('keydown', e => e.stopPropagation());
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
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Function to handle quick reply selection
  const handleQuickReply = (reply) => {
    setUserInput(reply);
    
    // On mobile, automatically submit after selecting a quick reply
    if (isMobile) {
      setTimeout(() => {
        const formEvent = { preventDefault: () => {}, stopPropagation: () => {} };
        userInput = reply; // Ensure the reply is set
        handleSubmitPrompt(formEvent);
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

  // Add a function to save quotes
  const handleSaveQuote = (quoteText, source) => {
    // Vibrate on mobile for tactile feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Create a new quote object
    const newQuote = {
      text: quoteText,
      source: source || npc.name,
      timestamp: new Date().toISOString(),
      npcType: npc.type
    };
    
    // Check if this quote is already saved
    const isAlreadySaved = savedQuotes.some(q => q.text === quoteText);
    
    if (isAlreadySaved) {
      // Show notification instead of alert
      setNotification({
        show: true,
        message: "This quote is already in your saved quotes!"
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
      
      return;
    }
    
    // Update local state
    const updatedQuotes = [...savedQuotes, newQuote];
    setSavedQuotes(updatedQuotes);
    
    // Update character state with new quote
    if (character && onUpdateCharacter) {
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes
      };
      onUpdateCharacter(updatedCharacter);
      
      // Show notification instead of alert
      setNotification({
        show: true,
        message: `Quote saved: "${quoteText.substring(0, 30)}${quoteText.length > 30 ? '...' : ''}"`
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    }
  };

  // Then in the render section, update the message rendering to include a save button
  const renderMessage = (message, index) => {
    const isNPC = message.role === 'npc';
    const messageClasses = `message ${isNPC ? 'npc-message' : 'user-message'}`;
    
    // Check if this quote is already saved
    const isAlreadySaved = savedQuotes.some(q => q.text === message.text);
    
    return (
      <div key={index} className={messageClasses}>
        {isNPC && (
          <div className="npc-avatar" style={{ backgroundImage: `url(${getNPCImage()})` }}></div>
        )}
        <div className="message-content">
          <div className="message-text">{message.text}</div>
          {isNPC && message.source && (
            <div className="message-source">Source: {message.source}</div>
          )}
          {isNPC && (
            <button 
              className={`save-quote-btn ${isAlreadySaved ? 'saved' : ''}`}
              onClick={() => handleSaveQuote(message.text, message.source)}
              title={isAlreadySaved ? "Quote already saved" : "Save this quote to your collection"}
              disabled={isAlreadySaved}
            >
              {isAlreadySaved ? '✓ Saved' : '💾 Save Quote'}
            </button>
          )}
        </div>
      </div>
    );
  };

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
        <div className={`dialog-overlay ${keyboardVisible ? 'keyboard-open' : ''} ${isMobile ? 'mobile' : ''}`}>
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>{npc.name}</h3>
              <button className="close-btn" onClick={handleCloseDialog}>×</button>
            </div>
            <div className="dialog-content" ref={conversationRef}>
              {chatHistory.map((message, index) => renderMessage(message, index))}
              {isTyping && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              {isThinking && (
                <div className="thinking-indicator">
                  <div className="thinking-text">{npc.name} is pondering...</div>
                </div>
              )}
            </div>
            
            {/* Notification */}
            {notification.show && (
              <div className="notification">
                {notification.message}
              </div>
            )}
            
            {/* Quick Replies */}
            {!isTyping && suggestedReplies.length > 0 && (
              <div className="quick-replies">
                {suggestedReplies.map((reply, index) => (
                  <button 
                    key={index} 
                    className="quick-reply-btn"
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            
            <form className="prompt-form" onSubmit={handleSubmitPrompt}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask ${npc.name} something...`}
                disabled={isTyping}
                ref={inputRef}
                autoComplete="off"
              />
              <button type="submit" disabled={isTyping || !userInput.trim()}>
                {isTyping ? "Thinking..." : "Send"}
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