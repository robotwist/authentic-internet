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
        },
        'examine sun also rises': {
          text: 'You find a section dedicated to "The Sun Also Rises." One passage about Brett Ashley and Jake Barnes catches your eye:\n\n"You don\'t have to say it. I know how it is. It\'s all right. It\'s the way it\'s always been. It\'s the way it\'s going to be."\n\nAnd near it, written in bold, the novel\'s famous closing lines: "Oh, Jake," Brett said, "we could have had such a damned good time together."\nAhead of them lay the boulevard, the streets stretching out in emptiness, the knowledge of what could not be.\n"Yes," Jake replied. "Isn\'t it pretty to think so?"',
          addKnowledge: 'sun_also_rises'
        },
        'examine clean well lighted place': {
          text: 'You discover a section dedicated to Hemingway\'s short story "A Clean Well-Lighted Place." The passage reads:\n\n"It was a clean, well-lighted place. It was well lighted but it was not the electric light that made it what it was." \n\nFurther down, you see one of the most profound passages from the story:\n\n"What did he fear? It was not fear or dread. It was a nothing that he knew too well. It was all a nothing and a man was nothing too... Some lived in it and never felt it but he knew it all was nada y pues nada y nada y pues nada."',
          addKnowledge: 'clean_place'
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
          text: 'The quotes are from various authors, but they all share a theme: the struggle and joy of writing. Several Hemingway quotes stand out:\n\n"Write hard and clear about what hurts."\n\n"The world breaks everyone, and afterward, some are strong at the broken places."\n\n"Isn\'t it pretty to think so?" - from the end of The Sun Also Rises\n\n"The aficionado is one who is passionate about the bulls." - on being an aficionado\n\n"It was a clean, well-lighted place. It was well lighted but it was not the electric light that made it what it was." - from A Clean Well Lighted Place',
          addKnowledge: 'writing_truth'
        },
        'examine door': {
          text: 'The door has no handle or keyhole. Instead, there\'s a small brass plate with the inscription: "Speak the theory that reveals truth beneath the surface." Perhaps you could try to speak the password you learned.',
          dynamicText: (inventory) => {
            if (inventory.includes('ancient tome')) {
              return 'The door has no handle or keyhole. Instead, there\'s a small brass plate with the inscription: "Speak the theory that reveals truth beneath the surface." The symbols on the plate look similar to those on your ancient tome. Perhaps you could try to speak the password you learned, or maybe the tome itself might interact with the door somehow.';
            }
            return 'The door has no handle or keyhole. Instead, there\'s a small brass plate with the inscription: "Speak the theory that reveals truth beneath the surface." Perhaps you could try to speak the password you learned.';
          }
        },
        'speak iceberg theory': {
          text: 'You speak the words "Iceberg Theory" clearly, and the door responds with a soft glow. It swings open, revealing the sanctuary beyond.',
          addKnowledge: 'used_password',
          revealExit: 'door',
          prerequisite: 'password'
        },
        'recite iceberg theory': {
          text: 'You recite the words "Iceberg Theory" clearly, and the door responds with a soft glow. It swings open, revealing the sanctuary beyond.',
          addKnowledge: 'used_password',
          revealExit: 'door',
          prerequisite: 'password'
        },
        'use tome on door': {
          text: 'You press the ancient tome against the door. The symbols on the book glow in response, and the words "Iceberg Theory" appear briefly on its pages. The door responds with a soft glow and swings open, revealing the sanctuary beyond.',
          addKnowledge: 'used_password',
          revealExit: 'door',
          prerequisite: ['ancient tome', 'password']
        },
        'use book on door': {
          text: 'You press the ancient tome against the door. The symbols on the book glow in response, and the words "Iceberg Theory" appear briefly on its pages. The door responds with a soft glow and swings open, revealing the sanctuary beyond.',
          addKnowledge: 'used_password',
          revealExit: 'door',
          prerequisite: ['ancient tome', 'password']
        },
        'examine hemingway quotes': {
          text: 'You focus on the section of quotes from Ernest Hemingway. His sparse, direct style stands out among the other authors. The quotes reveal his insights on courage, truth, writing, and life itself. The depth beneath his simple words reminds you of his famous "iceberg theory" - that the dignity of movement of an iceberg is due to only one-eighth of it being above water.',
          addKnowledge: 'hemingway_style'
        },
        'examine aficionado': {
          text: 'You find a section with quotes about being an "aficionado" - a passionate enthusiast or devotee. From The Sun Also Rises:\n\n"The aficionado is one who is passionate about the bulls. To love the bull-fight is of course a great pleasure... But to be an aficionado is not merely to like the bullfights... An aficionado is one who understands the ceremony, the ritual, the meaning. The values."\n\nYou reflect on how Hemingway valued authenticity and deep understanding, not just casual appreciation.',
          addKnowledge: 'aficionado'
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
      addToHistory('system', '- use [item]: use an item');
      addToHistory('system', '- use [item] on [object]: use an item on something');
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
    
    // Special case for password commands when in secret passage
    if (currentRoom === 'secretPassage') {
      // Check for different variations of using the password
      const passwordCommands = [
        'speak iceberg theory', 
        'say iceberg theory', 
        'iceberg theory',
        'recite iceberg theory',
        'whisper iceberg theory',
        'tell door iceberg theory',
        'utter iceberg theory'
      ];
      
      if (passwordCommands.includes(command)) {
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
    }
    
    // Object interactions
    const room = GAME_WORLD[currentRoom];
    
    // Check for "use X on Y" pattern
    if (command.startsWith('use ') && command.includes(' on ')) {
      const parts = command.split(' on ');
      const item = parts[0].substring(4).trim(); // remove 'use ' prefix
      const target = parts[1].trim();
      const interactionKey = `use ${item} on ${target}`;
      
      if (room.interactions && room.interactions[interactionKey]) {
        const interactionData = room.interactions[interactionKey];
        
        // Check if prerequisites are met
        if (interactionData.prerequisite) {
          if (Array.isArray(interactionData.prerequisite)) {
            const allMet = interactionData.prerequisite.every(prereq => {
              return inventory.includes(prereq) || room.completedInteractions?.includes(prereq);
            });
            
            if (!allMet) {
              addToHistory('system', 'You can\'t do that yet.');
              return;
            }
          } else if (!inventory.includes(interactionData.prerequisite) && 
                    !room.completedInteractions?.includes(interactionData.prerequisite)) {
            addToHistory('system', 'You can\'t do that yet.');
            return;
          }
        }
        
        // Display interaction text
        addToHistory('room', interactionData.dynamicText ? interactionData.dynamicText(inventory) : interactionData.text);
        
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
            room.items = room.items.filter(i => i !== item);
          });
        }
        
        // Reveal hidden exits if specified
        if (interactionData.revealExit) {
          if (!room.revealedExits) {
            room.revealedExits = [];
          }
          room.revealedExits.push(interactionData.revealExit);
          addToHistory('system', `You discovered a new exit: ${interactionData.revealExit}.`);
        }
        
        // Add knowledge if specified
        if (interactionData.addKnowledge) {
          if (!room.playerKnowledge) {
            room.playerKnowledge = [];
          }
          room.playerKnowledge.push(interactionData.addKnowledge);
        }
        
        // Track completed interactions
        if (!room.completedInteractions) {
          room.completedInteractions = [];
        }
        room.completedInteractions.push(interactionKey);
        
        // Trigger ending if specified
        if (interactionData.triggerEnding) {
          handleEnding();
        }
        
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
          addToHistory('room', interactionData.dynamicText ? interactionData.dynamicText(inventory) : interactionData.text);
          
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