import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [shareAvailable, setShareAvailable] = useState(false);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Check if Web Share API is available
  useEffect(() => {
    setShareAvailable(navigator.share !== undefined);
  }, []);

  // Detect mobile device - memoize the check function
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth <= 768 || 
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Enhanced patrol behavior with useCallback
  const moveRandomly = useCallback(() => {
    if (!isPatrolling) return;
    
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
  }, [currentPosition, isPatrolling, mapData, npc.type]);

  useEffect(() => {
    if (!isPatrolling) return;

    const patrolInterval = setInterval(moveRandomly, 2000);
    return () => clearInterval(patrolInterval);
  }, [isPatrolling, moveRandomly]);

  // Handle mobile keyboard visibility with useCallback
  const handleFocus = useCallback(() => {
    // Only on mobile
    if (isMobile) {
      setKeyboardVisible(true);
      
      // Add class for CSS positioning
      const dialog = document.querySelector('.dialog-overlay');
      if (dialog) {
        dialog.classList.add('keyboard-open');
      }
    }
  }, [isMobile]);
  
  const handleBlur = useCallback(() => {
    setKeyboardVisible(false);
    
    // Remove class
    const dialog = document.querySelector('.dialog-overlay');
    if (dialog) {
      dialog.classList.remove('keyboard-open');
    }
  }, []);

  useEffect(() => {
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
  }, [showDialog, handleFocus, handleBlur]);

  // Generate suggested replies with useMemo
  useEffect(() => {
    if (chatHistory.length > 0 && !isTyping) {
      // Get the last NPC message to generate contextual replies
      const lastNpcMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === 'npc');
      
      if (lastNpcMessage) {
        setSuggestedReplies(getContextualReplies(npc.type));
      }
    }
  }, [chatHistory, isTyping, npc.type]);

  // Memoize the contextual replies generation
  const getContextualReplies = useCallback((npcType) => {
    const npcTypeLower = npcType.toLowerCase();
    
    switch(npcTypeLower) {
      case NPC_TYPES.SHAKESPEARE.toLowerCase():
        return [
          "Tell me about your plays",
          "What inspires your writing?",
          "Your thoughts on love?",
          "Tell me a quote"
        ];
      case NPC_TYPES.JOHN_MUIR.toLowerCase():
        return [
          "Tell me about Yosemite",
          "What about conservation?",
          "Your favorite natural place?",
          "Why is nature important?"
        ];
      case NPC_TYPES.ZEUS.toLowerCase():
        return [
          "Tell me a myth",
          "About Mount Olympus?",
          "Your favorite child?",
          "Weather prediction?"
        ];
      default:
        return [
          "Tell me more",
          "What's your philosophy?",
          "Any advice for me?",
          "Share a quote"
        ];
    }
  }, []);

  const handleInteraction = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const distance = Math.sqrt(
      Math.pow(characterPosition.x - currentPosition.x, 2) +
      Math.pow(characterPosition.y - currentPosition.y, 2)
    );

    if (distance <= TILE_SIZE * 2) {
      // Batch state updates for better performance
      const greeting = getGreeting();
      
      setShowDialog(true);
      setIsPatrolling(false);
      setChatHistory([{ role: 'npc', text: greeting }]);
      
      // Fire dialog state change callback
      onDialogStateChange?.(true);
      
      // Add a visual feedback for click interaction
      const npcElement = document.querySelector(`.npc.${npc.type}`);
      if (npcElement) {
        npcElement.classList.add('clicked');
        setTimeout(() => {
          npcElement.classList.remove('clicked');
        }, 300);
      }
      
      // Provide haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Prevent input from triggering game controls
          inputRef.current.addEventListener('keydown', e => e.stopPropagation());
        }
      }, 100);
    }
  }, [characterPosition, currentPosition, npc.type, onDialogStateChange, isMobile]);

  const handleCloseDialog = useCallback(() => {
    // Cancel any pending API requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setShowDialog(false);
    setIsPatrolling(true);
    onDialogStateChange?.(false);
  }, [onDialogStateChange]);

  const handleSubmitPrompt = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const inputText = userInput.trim();
    if (!inputText) return;

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    const newMessage = { role: 'user', text: inputText };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);
    setIsThinking(true);
    
    try {
      const contextualizedPrompt = `${inputText} (Remember to respond in character as ${npc.name}, ${npc.role})`;
      
      // Use AbortController signal with the API request
      const result = await chat(
        contextualizedPrompt, 
        npc.context, 
        npc.role, 
        npc, 
        abortControllerRef.current.signal
      );
      
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
      // Only show error if not aborted
      if (error.name !== 'AbortError') {
        console.error('Failed to get NPC response:', error);
        setChatHistory(prev => [...prev, {
          role: 'npc',
          text: getCharacterSpecificErrorMessage(npc.type)
        }]);
      }
    } finally {
      setIsTyping(false);
      setIsThinking(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [userInput, npc.name, npc.role, npc.context, npc.type]);

  // Function to handle quick reply selection
  const handleQuickReply = useCallback((reply) => {
    setUserInput(reply);
    
    // On mobile, automatically submit after selecting a quick reply
    if (isMobile) {
      setTimeout(() => {
        const formEvent = { preventDefault: () => {}, stopPropagation: () => {} };
        handleSubmitPrompt(formEvent);
      }, 100);
    }
  }, [isMobile, handleSubmitPrompt]);

  // Share quote using Web Share API
  const handleShareQuote = useCallback(async (quoteText, source) => {
    if (!shareAvailable) return;
    
    try {
      await navigator.share({
        title: `Quote from ${npc.name}`,
        text: `"${quoteText}" - ${source || npc.name}`,
        url: window.location.href
      });
      
      // Show success notification
      setNotification({
        show: true,
        message: "Quote shared successfully!"
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing quote:', error);
      }
    }
  }, [shareAvailable, npc.name]);

  // Memoize error messages to avoid recreating them on each render
  const getCharacterSpecificErrorMessage = useCallback((npcType) => {
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
  }, []);

  // Memoize NPC images to avoid recreating the mapping on each render
  const npcImages = useMemo(() => ({
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
  }), []);

  const getNPCImage = useCallback(() => {
    return npcImages[npc.type] || `/assets/npcs/${npc.type}.svg`;
  }, [npc.type, npcImages]);

  // Memoize greetings to avoid recreating the mapping on each render
  const greetings = useMemo(() => ({
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
  }), []);

  const getGreeting = useCallback(() => {
    return greetings[npc.type] || npc.dialogue?.[0] || "Hello, traveler!";
  }, [npc.type, npc.dialogue, greetings]);

  // Auto-scroll conversation to bottom when chat history changes
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Add a function to save quotes
  const handleSaveQuote = useCallback((quoteText, source) => {
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
      
      // Use Promise to handle the API call
      updateCharacter(updatedCharacter)
        .then(() => {
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
        })
        .catch(error => {
          console.error('Error saving quote:', error);
          setNotification({
            show: true,
            message: "Error saving quote. Please try again."
          });
          
          setTimeout(() => {
            setNotification({ show: false, message: '' });
          }, 3000);
        });
    }
  }, [isMobile, npc.name, npc.type, savedQuotes, character, onUpdateCharacter]);

  // Memoize the render message function to avoid recreating it on each render
  const renderMessage = useCallback((message, index) => {
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
            <div className="message-actions">
              <button 
                className={`save-quote-btn ${isAlreadySaved ? 'saved' : ''}`}
                onClick={() => handleSaveQuote(message.text, message.source)}
                title={isAlreadySaved ? "Quote already saved" : "Save this quote to your collection"}
                disabled={isAlreadySaved}
              >
                {isAlreadySaved ? '✓ Saved' : '💾 Save'}
              </button>
              
              {shareAvailable && (
                <button
                  className="share-quote-btn"
                  onClick={() => handleShareQuote(message.text, message.source)}
                  title="Share this quote"
                >
                  🔗 Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [savedQuotes, getNPCImage, handleSaveQuote, handleShareQuote, shareAvailable]);

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
              {chatHistory.map(renderMessage)}
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