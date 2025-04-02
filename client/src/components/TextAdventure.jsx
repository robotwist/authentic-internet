import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TextAdventure.css';

const TextAdventure = ({ onComplete, onExit, username = 'traveler' }) => {
  const [currentRoom, setCurrentRoom] = useState('start');
  const [inventory, setInventory] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [health, setHealth] = useState(100);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const historyRef = useRef(null);
  const inputRef = useRef(null);

  // Game world definition
  const GAME_WORLD = {
    start: {
      description: `Welcome, ${username}, to the Text Adventure. You find yourself in a dimly lit room with stone walls. A single torch provides flickering illumination. There's a wooden door to the north and a small chest in the corner.`,
      exits: {
        north: 'hallway'
      },
      items: ['torch'],
      firstTime: true,
      interactions: {
        'examine chest': {
          text: 'You open the small chest and find a rusty key inside.',
          addItems: ['rusty key']
        },
        'take torch': {
          text: 'You pull the torch from its sconce. The room grows darker, but you now have a light source.',
          addItems: ['torch'],
          removeFromRoom: ['torch']
        }
      }
    },
    hallway: {
      description: 'You enter a long hallway with portraits of famous authors on the walls. You recognize Hemingway, Fitzgerald, and Austen among them. The hallway extends east, and there\'s a locked door to the west.',
      exits: {
        south: 'start',
        east: 'library',
        west: 'lockedRoom',
        secret: 'secretPassage'
      },
      items: [],
      interactions: {
        'examine portraits': {
          text: 'As you look at the portraits closely, you notice Hemingway\'s eyes seem to follow you. Behind his portrait, there appears to be a small lever.',
          revealExit: 'secret'
        },
        'pull lever': {
          text: 'You pull the lever behind Hemingway\'s portrait. A section of the wall slides away, revealing a secret passage!',
          prerequisite: 'examine portraits',
          revealExit: 'secret'
        }
      },
      lockedExits: {
        west: {
          key: 'rusty key',
          message: 'The door is locked. It looks like it needs a key.'
        }
      }
    },
    library: {
      description: 'You enter a vast library. Shelves stacked with countless books reach toward the high ceiling. A large desk sits in the center, with an open book glowing with strange symbols.',
      exits: {
        west: 'hallway',
        north: 'studyRoom'
      },
      items: ['ancient tome'],
      interactions: {
        'read book': {
          text: 'As you read the glowing book, the symbols seem to rearrange themselves. You learn about a hidden sanctuary for writers, where inspiration flows like water. The text mentions a password: "Iceberg Theory".',
          addKnowledge: 'password'
        },
        'read tome': {
          text: 'As you read the ancient tome, the symbols seem to rearrange themselves. You learn about a hidden sanctuary for writers, where inspiration flows like water. The text mentions a password: "Iceberg Theory".',
          addKnowledge: 'password'
        },
        'read ancient tome': {
          text: 'As you read the ancient tome, the symbols seem to rearrange themselves. You learn about a hidden sanctuary for writers, where inspiration flows like water. The text mentions a password: "Iceberg Theory".',
          addKnowledge: 'password'
        },
        'take tome': {
          text: 'You pick up the ancient tome. It feels heavy in your hands, and the strange symbols on its cover seem to shift when you\'re not looking directly at them.',
          addItems: ['ancient tome'],
          removeFromRoom: ['ancient tome']
        }
      }
    },
    studyRoom: {
      description: 'A cozy study with a fireplace and comfortable armchairs. There\'s a writing desk with papers scattered across it, and a typewriter that seems to be typing by itself.',
      exits: {
        south: 'library'
      },
      items: ['mysterious letter'],
      interactions: {
        'examine typewriter': {
          text: 'The typewriter is typing the same sentence over and over: "All good books are alike in that they are truer than if they had really happened." It\'s a Hemingway quote.',
          addKnowledge: 'hemingway_quote'
        },
        'read letter': {
          text: 'The letter is addressed to you. It reads: "To find the treasure of words, one must face the critic within. Enter the sanctuary and speak the truth about writing."',
          prerequisite: 'take letter'
        },
        'take letter': {
          text: 'You take the mysterious letter and place it in your pocket.',
          addItems: ['mysterious letter'],
          removeFromRoom: ['mysterious letter']
        }
      }
    },
    lockedRoom: {
      description: 'You enter a small study with bookshelves lining the walls. A writing desk faces a window that overlooks an endless sea. This must have been Hemingway\'s private writing room.',
      exits: {
        east: 'hallway'
      },
      items: ['hemingway\'s pen'],
      interactions: {
        'examine desk': {
          text: 'Among the papers on the desk, you find a half-written manuscript and Hemingway\'s famous fountain pen.',
        },
        'take pen': {
          text: 'You take Hemingway\'s fountain pen. It feels surprisingly heavy, as if weighted with the importance of the words it has written.',
          addItems: ['hemingway\'s pen'],
          removeFromRoom: ['hemingway\'s pen']
        },
        'read manuscript': {
          text: 'The manuscript appears to be an unfinished story about a writer seeking the ultimate truth. The last written line reads: "The sanctuary lies beyond the critic\'s shadow."',
          addKnowledge: 'sanctuary_clue'
        }
      }
    },
    secretPassage: {
      description: 'A narrow, dimly lit passage leads downward. The walls are inscribed with famous literary quotes. The path spirals down to a heavy oak door with a small plaque that reads "Sanctuary of Truth".',
      exits: {
        up: 'hallway',
        door: 'sanctuary'
      },
      items: [],
      interactions: {
        'read quotes': {
          text: 'The quotes are from various authors, but they all share a theme: the struggle and joy of writing. One Hemingway quote stands out: "Write hard and clear about what hurts."',
          addKnowledge: 'writing_truth'
        },
        'examine door': {
          text: 'The door has no handle or keyhole. Instead, there\'s a small brass plate with the inscription: "Speak the theory that reveals truth beneath the surface." Perhaps you could try to speak the password you learned.',
        },
        'speak iceberg theory': {
          text: 'You speak the words "Iceberg Theory" clearly, and the door responds with a soft glow. It swings open, revealing the sanctuary beyond.',
          addKnowledge: 'used_password',
          revealExit: 'door',
          prerequisite: 'password'
        }
      },
      lockedExits: {
        door: {
          password: 'Iceberg Theory',
          message: 'The door remains closed. Perhaps you should speak the password you learned in the library. (Try: "speak [password]")',
          knowledgeRequired: 'password'
        }
      }
    },
    sanctuary: {
      description: 'You enter a circular room with a high domed ceiling painted with constellations. In the center stands a pedestal with a glowing manuscript. Around the room are shadowy figures - the ghosts of great writers past, watching you expectantly.',
      exits: {
        back: 'secretPassage'
      },
      items: ['truth manuscript'],
      interactions: {
        'examine manuscript': {
          text: 'The manuscript glows with an inner light. As you approach, you can see it\'s blank, waiting to be written upon.',
        },
        'talk to ghosts': {
          text: 'The spirits of the writers seem to whisper collectively: "To complete your journey, you must write one truth. One sentence that reveals something true about yourself or the world."',
          addKnowledge: 'final_task'
        },
        'write truth': {
          text: 'You take Hemingway\'s pen and write a single, honest truth on the manuscript. The words glow and then sink into the page. The spirits nod in approval, and the manuscript transforms into a completed story - your story.',
          prerequisite: ['hemingway\'s pen', 'talk to ghosts'],
          triggerEnding: true
        }
      }
    }
  };

  // Initialize the game
  useEffect(() => {
    addToHistory('system', `⭐ Text Adventure: The Writer's Journey ⭐`);
    addToHistory('system', 'Type "help" for a list of commands.');
    displayRoomDescription(currentRoom);
    
    return () => {
      // Cleanup
    };
  }, []);

  // Auto-scroll to bottom of history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [gameHistory]);

  // Focus input when game state changes
  useEffect(() => {
    if (inputRef.current && !gameComplete && !gameOver) {
      inputRef.current.focus();
    }
  }, [currentRoom, gameComplete, gameOver]);

  // Type current text with typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    
    let i = 0;
    const text = GAME_WORLD[currentRoom].description;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setCurrentText(prev => prev + text.charAt(i));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, [isTyping, currentRoom]);

  // Add message to game history
  const addToHistory = (type, text) => {
    setGameHistory(prev => [...prev, { type, text }]);
  };

  // Display room description
  const displayRoomDescription = (roomId) => {
    const room = GAME_WORLD[roomId];
    if (!room) return;
    
    setCurrentText('');
    setIsTyping(true);
    
    // Add items to room description if they exist
    if (room.items && room.items.length > 0) {
      const itemText = room.items.length === 1 
        ? `You see a ${room.items[0]}.` 
        : `You see: ${room.items.join(', ')}.`;
      
      addToHistory('room', itemText);
    }
    
    // Add exits to room description
    const exits = Object.keys(room.exits).filter(exit => {
      // Filter out any hidden exits
      if (exit === 'secret' && !room.revealedExits?.includes('secret')) {
        return false;
      }
      return true;
    });
    
    if (exits.length > 0) {
      addToHistory('room', `Exits: ${exits.join(', ')}.`);
    }
    
    // Mark room as visited
    if (room.firstTime) {
      GAME_WORLD[roomId].firstTime = false;
    }
  };

  // Handle player commands
  const handleCommand = (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) return;
    
    const command = userInput.trim().toLowerCase();
    addToHistory('player', `> ${userInput}`);
    setUserInput('');
    
    // Process command
    if (command === 'help') {
      addToHistory('system', 'Available commands:');
      addToHistory('system', '- look: examine your surroundings');
      addToHistory('system', '- go [direction]: move in a direction (north, south, east, west, etc)');
      addToHistory('system', '- examine [object]: look at something more closely');
      addToHistory('system', '- take [item]: pick up an item');
      addToHistory('system', '- inventory: see what you\'re carrying');
      addToHistory('system', '- use [item]: use an item you\'re carrying');
      addToHistory('system', '- talk to [character]: interact with someone');
      addToHistory('system', '- read [item]: read something');
      addToHistory('system', '- speak [words]: say something aloud');
      addToHistory('system', '- quit: exit the game');
      addToHistory('system', 'Tip: If you\'re stuck, try examining objects in the room or reading items.');
      return;
    }
    
    if (command === 'quit') {
      addToHistory('system', 'Exiting game...');
      setTimeout(() => onExit(), 1000);
      return;
    }
    
    if (command === 'inventory' || command === 'i') {
      if (inventory.length === 0) {
        addToHistory('system', 'Your inventory is empty.');
      } else {
        addToHistory('system', `Inventory: ${inventory.join(', ')}`);
      }
      return;
    }
    
    if (command === 'look' || command === 'l') {
      addToHistory('room', GAME_WORLD[currentRoom].description);
      displayRoomDescription(currentRoom);
      return;
    }
    
    // Movement commands
    if (command.startsWith('go ') || command.startsWith('move ') || 
        command.startsWith('walk ') || command.startsWith('head ')) {
      const direction = command.split(' ')[1];
      handleMovement(direction);
      return;
    }
    
    // Shorthand for movement
    if (['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd', 'back', 'door'].includes(command)) {
      const directionMap = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down' };
      const direction = directionMap[command] || command;
      handleMovement(direction);
      return;
    }
    
    // Object interactions
    const room = GAME_WORLD[currentRoom];
    
    // Special case for "speak" command when in secret passage
    if (currentRoom === 'secretPassage' && 
       (command === 'speak iceberg theory' || command === 'say iceberg theory' || command === 'iceberg theory')) {
      if (GAME_WORLD.library.playerKnowledge?.includes('password')) {
        addToHistory('system', 'You speak the words "Iceberg Theory" clearly, and the door responds with a soft glow. It swings open, revealing the sanctuary beyond.');
        // Unlock the exit permanently
        delete GAME_WORLD.secretPassage.lockedExits.door;
        handleMovement('door');
        return;
      } else {
        addToHistory('system', 'You speak the words, but nothing happens. Perhaps you need to learn their significance first.');
        return;
      }
    }
    
    if (room.interactions) {
      for (const interaction in room.interactions) {
        if (command === interaction || 
            (command.startsWith('examine ') && interaction === `examine ${command.split(' ')[1]}`) || 
            (command.startsWith('look at ') && interaction === `examine ${command.split(' ')[2]}`) ||
            (command.startsWith('take ') && interaction === `take ${command.split(' ')[1]}`) ||
            (command.startsWith('read ') && interaction === `read ${command.split(' ')[1]}`) ||
            (command.startsWith('use ') && interaction === `use ${command.split(' ')[1]}`) ||
            (command.startsWith('talk to ') && interaction === `talk to ${command.slice(8)}`) ||
            (command.startsWith('speak ') && interaction === `speak ${command.split(' ')[1]}`) ||
            (command.startsWith('say ') && interaction === `speak ${command.split(' ')[1]}`) ||
            (command.startsWith('pull ') && interaction === `pull ${command.split(' ')[1]}`) ||
            (command.startsWith('push ') && interaction === `push ${command.split(' ')[1]}`) ||
            (command.startsWith('open ') && interaction === `open ${command.split(' ')[1]}`) ||
            (command.startsWith('write ') && interaction === `write ${command.split(' ')[1]}`)) {
          
          const interactionData = room.interactions[interaction];
          
          // Check if prerequisites are met
          if (interactionData.prerequisite) {
            if (Array.isArray(interactionData.prerequisite)) {
              const allMet = interactionData.prerequisite.every(prereq => {
                return inventory.includes(prereq) || GAME_WORLD[currentRoom].completedInteractions?.includes(prereq);
              });
              
              if (!allMet) {
                addToHistory('system', 'You can\'t do that yet.');
                return;
              }
            } else if (!inventory.includes(interactionData.prerequisite) && 
                      !GAME_WORLD[currentRoom].completedInteractions?.includes(interactionData.prerequisite)) {
              addToHistory('system', 'You can\'t do that yet.');
              return;
            }
          }
          
          // Display interaction text
          addToHistory('room', interactionData.text);
          
          // Add items to inventory if specified
          if (interactionData.addItems) {
            interactionData.addItems.forEach(item => {
              if (!inventory.includes(item)) {
                setInventory(prev => [...prev, item]);
                addToHistory('system', `Added ${item} to inventory.`);
              }
            });
          }
          
          // Remove items from room if specified
          if (interactionData.removeFromRoom) {
            interactionData.removeFromRoom.forEach(item => {
              GAME_WORLD[currentRoom].items = GAME_WORLD[currentRoom].items.filter(i => i !== item);
            });
          }
          
          // Reveal hidden exits if specified
          if (interactionData.revealExit) {
            if (!GAME_WORLD[currentRoom].revealedExits) {
              GAME_WORLD[currentRoom].revealedExits = [];
            }
            GAME_WORLD[currentRoom].revealedExits.push(interactionData.revealExit);
            addToHistory('system', `You discovered a new exit: ${interactionData.revealExit}.`);
          }
          
          // Add knowledge if specified
          if (interactionData.addKnowledge) {
            if (!GAME_WORLD[currentRoom].playerKnowledge) {
              GAME_WORLD[currentRoom].playerKnowledge = [];
            }
            GAME_WORLD[currentRoom].playerKnowledge.push(interactionData.addKnowledge);
          }
          
          // Track completed interactions
          if (!GAME_WORLD[currentRoom].completedInteractions) {
            GAME_WORLD[currentRoom].completedInteractions = [];
          }
          GAME_WORLD[currentRoom].completedInteractions.push(interaction);
          
          // Trigger ending if specified
          if (interactionData.triggerEnding) {
            handleEnding();
          }
          
          return;
        }
      }
    }
    
    // Default response if no command matched
    addToHistory('system', 'I don\'t understand that command.');
  };

  // Handle player movement
  const handleMovement = (direction) => {
    const room = GAME_WORLD[currentRoom];
    
    // Check if the direction is valid
    if (!room.exits || !room.exits[direction]) {
      // Check if there's a hidden exit in this direction
      if (direction === 'secret' && room.revealedExits?.includes('secret')) {
        // The secret exit has been revealed
        const newRoom = room.exits[direction];
        setCurrentRoom(newRoom);
        addToHistory('system', `You move through the secret passage.`);
        displayRoomDescription(newRoom);
        return;
      }
      
      addToHistory('system', `You can't go ${direction} from here.`);
      return;
    }
    
    // Check if the exit is locked
    if (room.lockedExits && room.lockedExits[direction]) {
      const lockedExit = room.lockedExits[direction];
      
      // Check if a key is required
      if (lockedExit.key && inventory.includes(lockedExit.key)) {
        addToHistory('system', `You use the ${lockedExit.key} to unlock the door.`);
        
        // Unlock the exit permanently
        delete GAME_WORLD[currentRoom].lockedExits[direction];
        
        const newRoom = room.exits[direction];
        setCurrentRoom(newRoom);
        displayRoomDescription(newRoom);
        return;
      }
      
      // Check if a password is required
      if (lockedExit.password && lockedExit.knowledgeRequired) {
        if (GAME_WORLD[currentRoom].playerKnowledge?.includes(lockedExit.knowledgeRequired)) {
          addToHistory('system', `The door responds to the password: "${lockedExit.password}". It swings open.`);
          
          // Unlock the exit permanently
          delete GAME_WORLD[currentRoom].lockedExits[direction];
          
          const newRoom = room.exits[direction];
          setCurrentRoom(newRoom);
          displayRoomDescription(newRoom);
          return;
        }
      }
      
      // Exit remains locked
      addToHistory('system', lockedExit.message);
      return;
    }
    
    // Move to the new room
    const newRoom = room.exits[direction];
    setCurrentRoom(newRoom);
    addToHistory('system', `You go ${direction}.`);
    displayRoomDescription(newRoom);
  };

  // Handle game ending
  const handleEnding = () => {
    addToHistory('system', 'As you write your truth on the manuscript, the room begins to fill with a warm, golden light.');
    addToHistory('system', 'The spirits of the writers nod in approval, and Hemingway\'s ghost steps forward.');
    addToHistory('system', '"You have found the courage to write honestly," he says. "That is the greatest gift a writer can possess."');
    addToHistory('system', 'The manuscript glows brightly, then transforms into a completed book - your story.');
    addToHistory('system', 'Hemingway hands you the book. "Take this knowledge back to your world. Write true, write clear, write hard."');
    addToHistory('system', 'Congratulations! You have completed The Writer\'s Journey!');
    
    setGameComplete(true);
  };

  return (
    <div className="text-adventure-container">
      <div className="text-adventure-header">
        <h2>The Writer's Journey</h2>
        <div className="health-bar">
          <div 
            className="health-bar-fill" 
            style={{ width: `${health}%` }}
          />
          <span>Inspiration: {health}%</span>
        </div>
      </div>
      
      <div className="text-adventure-body">
        <div className="game-history" ref={historyRef}>
          {gameHistory.map((entry, index) => (
            <div key={index} className={`history-entry ${entry.type}`}>
              {entry.text}
            </div>
          ))}
          {isTyping && (
            <div className="history-entry room typing">
              {currentText}<span className="cursor">|</span>
            </div>
          )}
        </div>
        
        {!gameComplete && !gameOver && (
          <form onSubmit={handleCommand} className="command-input-container">
            <span className="command-prompt">&gt;</span>
            <input
              type="text"
              className="command-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isTyping}
              ref={inputRef}
              placeholder="Enter a command..."
            />
          </form>
        )}
      </div>
      
      {gameComplete && (
        <div className="game-complete-overlay">
          <div className="game-complete-content">
            <h2>Adventure Complete!</h2>
            <p>You have successfully completed The Writer's Journey.</p>
            <p>Your newfound literary wisdom will serve you well in your creative endeavors.</p>
            <button onClick={onComplete}>Continue Your Journey</button>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>Game Over</h2>
            <p>Your inspiration has run dry, and your journey comes to an end.</p>
            <button onClick={onExit}>Exit</button>
            <button onClick={() => {
              setGameOver(false);
              setHealth(100);
              setCurrentRoom('start');
              setInventory([]);
              setGameHistory([]);
              addToHistory('system', `⭐ Text Adventure: The Writer's Journey ⭐`);
              addToHistory('system', 'Type "help" for a list of commands.');
              displayRoomDescription('start');
            }}>Try Again</button>
          </div>
        </div>
      )}
      
      <div className="text-adventure-footer">
        <button className="exit-button" onClick={onExit}>Exit Adventure</button>
      </div>
    </div>
  );
};

TextAdventure.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  username: PropTypes.string
};

export default TextAdventure; 