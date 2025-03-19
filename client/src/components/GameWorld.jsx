import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter
} from "../api/api";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation";
import Inventory from "./Inventory";
import SavedQuotes from "./SavedQuotes";
import ErrorBoundary from "./ErrorBoundary";
import Map from "./Map";
import { useCharacterMovement } from "./CharacterMovement";
import { TILE_SIZE, MAPS, MAP_COLS, MAP_ROWS } from "./Constants";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import NPC from "./NPC";
import TouchControls from './TouchControls';

const MOVEMENT_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

const GameWorld = ({ 
  mapData, 
  artifacts: initialArtifacts = [], 
  npcs = [], 
  character: initialCharacter = {
    position: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
    exp: 0,
    level: 1
  }
}) => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState(initialCharacter.position);
  const [character, setCharacter] = useState(initialCharacter);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPortalFlash, setShowPortalFlash] = useState(false);
  const [pickedUpArtifacts, setPickedUpArtifacts] = useState([]);
  const [exp, setExp] = useState(initialCharacter.exp || 0);
  const [movementDirection, setMovementDirection] = useState(null);
  const [isInDialog, setIsInDialog] = useState(false);
  const [isInMenu, setIsInMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentNPC, setCurrentNPC] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSavedQuotes, setShowSavedQuotes] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showedLevel2Intro, setShowedLevel2Intro] = useState(false);

  useEffect(() => {
    fetchArtifacts()
      .then((data) => {
        console.log("📦 Loaded Artifacts:", data);
        setArtifacts(data);
      })
      .catch((error) => console.error("❌ Error fetching artifacts:", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.id) {
          console.warn("🚨 No user found in localStorage. Using default character.");
          return;
        }

        const characterData = await fetchCharacter(storedUser.id);
        if (!characterData) {
          console.warn("🚨 No character data received. Using default character.");
          return;
        }

        // Ensure character data has all required fields
        const validatedCharacter = {
          ...characterData,
          position: characterData.position || { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
          exp: characterData.exp || 0,
          level: characterData.level || 1
        };

        console.log("✅ Character Loaded:", validatedCharacter);
        setCharacter(validatedCharacter);
        setCharacterPosition(validatedCharacter.position);
      } catch (err) {
        console.error("❌ Failed to load character:", err);
        // Keep using default character state
      }
    };

    loadCharacter();
  }, []);

  // Validate character position when it changes
  useEffect(() => {
    if (!characterPosition || typeof characterPosition.x !== 'number' || typeof characterPosition.y !== 'number') {
      console.warn("🚨 Invalid character position detected. Resetting to default position.");
      setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
    }
  }, [characterPosition]);

  useEffect(() => {
    if (character && character.experience >= character.level * 10) {
      setCharacter((prevChar) => {
        const updatedCharacter = {
          ...prevChar,
          level: prevChar.level + 1,
          experience: prevChar.experience - prevChar.level * 10,
        };

        if (updatedCharacter.id) {
          updateCharacter(updatedCharacter)
            .then(() => console.log("✅ Character leveled up in backend"))
            .catch((err) => console.error("❌ Failed to update character:", err));
        } else {
          console.warn("🚨 Character ID missing. Cannot update backend.");
        }

        alert("You have leveled up, mighty warrior! You now have 2 adoring fans.");
        return updatedCharacter;
      });
    }
  }, [character?.experience, character?.level]);

  const adjustViewport = (pos) => {
    const viewportWidth = 12 * TILE_SIZE;
    const viewportHeight = 12 * TILE_SIZE;
    const mapWidth = MAP_COLS * TILE_SIZE;
    const mapHeight = MAP_ROWS * TILE_SIZE;

    // Center the viewport on the character
    let newViewportX = pos.x - (viewportWidth / 2);
    let newViewportY = pos.y - (viewportHeight / 2);

    // Clamp viewport to map boundaries
    newViewportX = Math.max(0, Math.min(newViewportX, mapWidth - viewportWidth));
    newViewportY = Math.max(0, Math.min(newViewportY, mapHeight - viewportHeight));

    setViewport({
      x: newViewportX,
      y: newViewportY
    });
  };

  const handleCreateArtifact = (name, description, messageText) => {
    if (!isLoggedIn) {
      alert("You need to be logged in to create artifacts.");
      return;
    }

    const newArtifact = {
      name,
      description,
      messageText,
      location: { x: characterPosition.x / TILE_SIZE, y: characterPosition.y / TILE_SIZE },
      area: currentMap?.name || "Overworld",
      visible: true,
      status: "dropped",
      type: "artifact"
    };

    console.log("✨ Creating artifact at:", newArtifact.location);

    createArtifact(newArtifact)
      .then((data) => {
        console.log("✅ Artifact Created:", data);
        updateArtifactsState(data);
        // Refresh artifacts to ensure we have the latest data
        refreshArtifacts();
        setShowForm(false); // Close the form after successful creation
      })
      .catch((error) => {
        console.error("❌ Error creating artifact:", error);
        alert("Failed to create artifact. Please try again.");
      });
  };

  const updateArtifactsState = (newArtifact) => {
    setArtifacts((prev) => [...prev, newArtifact]);
  };

  const refreshArtifacts = async () => {
    try {
      const updatedArtifacts = await fetchArtifacts();
      setArtifacts(updatedArtifacts);
    } catch (error) {
      console.error("❌ Error refreshing artifacts:", error);
    }
  };

  const findArtifactAtLocation = (x, y) => {
    // First check artifacts from the current map
    const mapArtifact = MAPS[currentMapIndex].artifacts.find(
      (a) => a.location && a.location.x === x && a.location.y === y
    );
    if (mapArtifact) return mapArtifact;

    // Then check user-created artifacts
    return artifacts.find(
      (a) => a.location && a.location.x === x && a.location.y === y && a.visible
    );
  };

  const handleArtifactPickup = (artifact) => {
    if (!artifact) return;
    
    console.log("🎒 Picking up artifact:", artifact);

    // Add artifact to inventory
    setInventory(prev => [...prev, artifact]);
    
    // Remove from pickedUpArtifacts if it's there
    setPickedUpArtifacts(prev => prev.filter(a => a.id !== artifact.id));
    
    // Remove artifact from world
    setArtifacts(prev => prev.filter(a => a.id !== artifact.id));
    
    // Add experience
    if (artifact.exp) {
      const newExp = exp + artifact.exp;
      setExp(newExp);
      
      // Update character state
      setCharacter(prev => ({
        ...prev,
        exp: newExp
      }));
    }

    // Play pickup sound
    const pickupSound = new Audio('/assets/sounds/pickup.mp3');
    pickupSound.volume = 0.3;
    pickupSound.play().catch(console.error);

    // Show pickup notification
    if (window.showNotification) {
      window.showNotification(`Picked up ${artifact.name}`, 'success');
    }

    // Save game state
    const gameState = {
      characterPosition,
      currentMapIndex,
      inventory: [...inventory, artifact],
      exp,
      pickedUpArtifacts: pickedUpArtifacts.filter(a => a.id !== artifact.id)
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
  };

  // Load saved game state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const { inventory: savedInventory, exp: savedExp } = JSON.parse(savedState);
      if (savedInventory) setInventory(savedInventory);
      if (savedExp) setExp(savedExp);
    }
  }, []);

  const handleKeyDown = (e) => {
    // Prevent game actions if typing in an input field, textarea, or if a dialog or chat is open
    if (e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'textarea' || 
        dialogOpen || isInDialog || isInMenu) {
      
      // Only allow Escape key to close dialogs
      if (e.key === 'Escape') {
        setIsInDialog(false);
        setIsInMenu(false);
      }
      return;
    }

    const key = e.key.toLowerCase();
    
    // Handle movement keys
    if (MOVEMENT_KEYS.includes(key)) {
      e.preventDefault();
      const newPosition = { ...characterPosition };
      
      switch(key) {
        case 'w':
        case 'arrowup':
          newPosition.y -= TILE_SIZE;
          setMovementDirection('up');
          break;
        case 's':
        case 'arrowdown':
          newPosition.y += TILE_SIZE;
          setMovementDirection('down');
          break;
        case 'a':
        case 'arrowleft':
          newPosition.x -= TILE_SIZE;
          setMovementDirection('left');
          break;
        case 'd':
        case 'arrowright':
          newPosition.x += TILE_SIZE;
          setMovementDirection('right');
          break;
        default:
          break;
      }

      if (isValidMove(newPosition)) {
        setCharacterPosition(newPosition);
        adjustViewport(newPosition);
      }
      return;
    }

    // Handle action keys
    switch(key) {
      // Disabling T and E keyboard shortcuts as requested
      // case 't':
      // case 'e':
      //   e.preventDefault();
      //   const nearbyNPC = npcs.find(npc => {
      //     const dx = (characterPosition.x - npc.position.x * TILE_SIZE);
      //     const dy = (characterPosition.y - npc.position.y * TILE_SIZE);
      //     const distance = Math.sqrt(dx * dx + dy * dy);
      //     return distance <= TILE_SIZE * 3;
      //   });
        
      //   if (nearbyNPC) {
      //     setCurrentNPC(nearbyNPC);
      //     setIsInDialog(true);
      //     // Play dialog sound
      //     const dialogSound = new Audio('/assets/sounds/dialog.mp3');
      //     dialogSound.volume = 0.2;
      //     dialogSound.play().catch(console.error);
      //   }
      //   break;
      
      case 'escape':
        if (isInDialog) {
          setIsInDialog(false);
          setCurrentNPC(null);
        }
        break;
        
      case 'p':
        e.preventDefault();
        const artifactAtLocation = findArtifactAtLocation(
          Math.floor(characterPosition.x / TILE_SIZE),
          Math.floor(characterPosition.y / TILE_SIZE)
        );
        if (artifactAtLocation) {
          handleArtifactPickup(artifactAtLocation);
        }
        break;
        
      case 'd':
        e.preventDefault();
        // If inventory is not empty, show quick drop interface
        if (inventory.length > 0) {
          setIsInMenu(true);
          setShowInventory(true);
          // Focus on drop mode for the inventory interface
          setTimeout(() => {
            const firstArtifact = document.querySelector('.artifact-item');
            if (firstArtifact) {
              firstArtifact.click();
              const dropButton = document.querySelector('.artifact-actions button:nth-child(2)');
              if (dropButton) dropButton.click();
            }
          }, 100);
        }
        break;
        
      case 'i':
        e.preventDefault();
        setIsInMenu(true);
        setShowInventory(prev => !prev);
        break;
      case 'c':
        e.preventDefault();
        if (isLoggedIn) {
          setIsInMenu(true);
          setShowForm(true);
          setFormPosition({ 
            x: Math.floor(characterPosition.x / TILE_SIZE), 
            y: Math.floor(characterPosition.y / TILE_SIZE) 
          });
        }
        break;
      case 'q':
        e.preventDefault();
        setShowSavedQuotes(true);
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (e) => {
    const key = e.key.toLowerCase();
    if (MOVEMENT_KEYS.includes(key)) {
      setMovementDirection(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [characterPosition]);

  // Calculate experience level based on exp
  const getLevel = (exp) => {
    if (exp >= 1000) return 5;
    if (exp >= 750) return 4;
    if (exp >= 500) return 3;
    if (exp >= 250) return 2;
    return 1;
  };

  useCharacterMovement(characterPosition, setCharacterPosition, currentMapIndex, setCurrentMapIndex, isLoggedIn, visibleArtifact, handleArtifactPickup, setShowForm, setFormPosition, setShowInventory, adjustViewport);

  useEffect(() => {
    const { x, y } = {
      x: Math.floor(characterPosition.x / TILE_SIZE),
      y: Math.floor(characterPosition.y / TILE_SIZE),
    };

    // Check both map artifacts and user-created artifacts
    const mapArtifact = MAPS[currentMapIndex].artifacts.find(
      (artifact) => artifact.visible && artifact.location && 
      artifact.location.x === x && artifact.location.y === y
    );

    const userArtifact = artifacts.find(
      (artifact) => artifact.visible && artifact.location &&
      artifact.location.x === x && artifact.location.y === y
    );

    setVisibleArtifact(mapArtifact || userArtifact || null);
  }, [characterPosition, currentMapIndex, artifacts]);

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    if (MAPS[currentMapIndex].data[row][col] === 5) {
      // Find Yosemite map index
      const yosemiteMapIndex = MAPS.findIndex(map => map.name === "Yosemite");
      
      // Check if player completed level 1 and should go to Yosemite
      if (character.level >= 2 && yosemiteMapIndex !== -1 && !showedLevel2Intro) {
        // Start transition effects
        setIsTransitioning(true);
        setShowPortalFlash(true);
        
        // First phase of transition
        setTimeout(() => {
          setCurrentMapIndex(yosemiteMapIndex);
          // Spawn near John Muir at the entrance
          setCharacterPosition({ x: 3 * TILE_SIZE, y: 17 * TILE_SIZE });
          
          // Second phase - remove effects
          setTimeout(() => {
            setIsTransitioning(false);
            setShowPortalFlash(false);
            
            // Show John Muir's introduction to Yosemite
            setTimeout(() => {
              setShowedLevel2Intro(true);
              alert("John Muir: Welcome to Yosemite, the grandest of all the special temples of Nature! Now that you've completed the first level, I'll guide you through this majestic wilderness. Explore Half Dome, Yosemite Falls, and the Mist Trail. The wonders of Yosemite await!");
            }, 500);
          }, 1000);
        }, 500);
      } 
      // Original portal logic for other levels
      else if (currentMapIndex < MAPS.length - 1) {
        // Start transition effects
        setIsTransitioning(true);
        setShowPortalFlash(true);
        
        // First phase of transition
        setTimeout(() => {
          // If already shown level 2 intro and on a level before Yosemite, go to next level
          // Otherwise follow normal progression
          if (showedLevel2Intro && yosemiteMapIndex !== -1 && currentMapIndex < yosemiteMapIndex) {
            setCurrentMapIndex(yosemiteMapIndex);
            setCharacterPosition({ x: 3 * TILE_SIZE, y: 17 * TILE_SIZE });
          } else {
            setCurrentMapIndex((prev) => prev + 1);
            setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
          }
          
          // Second phase - remove effects
          setTimeout(() => {
            setIsTransitioning(false);
            setShowPortalFlash(false);
          }, 1000);
        }, 500);
      } else if (currentMapIndex === MAPS.length - 1) {
        // This is the final dungeon portal
        setIsTransitioning(true);
        setShowPortalFlash(true);
        
        // Update character to mark final dungeon as completed
        if (character && character.id) {
          const updatedCharacter = {
            ...character,
            completedMaps: [...(character.completedMaps || []), 'final-dungeon'],
            achievements: [...(character.achievements || []), 'final-dungeon-completed'],
            exp: (character.exp || 0) + 500 // Bonus experience for completing the final dungeon
          };
          
          // Save to database
          updateCharacter(updatedCharacter)
            .then(() => {
              setCharacter(updatedCharacter);
              console.log("Final dungeon completion saved!");
              
              // Show completion message
              setTimeout(() => {
                alert("Congratulations! You've completed the final dungeon and unlocked the NKD Man Chrome Extension! Visit your profile to customize your avatar.");
                
                // Return to first map
                setCurrentMapIndex(0);
                setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
                setIsTransitioning(false);
                setShowPortalFlash(false);
              }, 1500);
            })
            .catch(err => console.error("❌ Failed to save dungeon completion:", err));
        }
      }
    }
  }, [characterPosition, currentMapIndex, character, showedLevel2Intro]);

  // Add isValidMove function that was missing
  const isValidMove = (newPosition) => {
    // Ensure position is within map bounds
    const row = Math.floor(newPosition.y / TILE_SIZE);
    const col = Math.floor(newPosition.x / TILE_SIZE);
    
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
      return false;
    }

    // Check if the new position is a walkable tile (not a wall)
    const tileType = MAPS[currentMapIndex].data[row][col];
    return tileType !== 1; // Assuming 1 represents walls
  };

  // Add handleExp function
  const handleExp = (amount) => {
    setExp(prev => prev + amount);
    setCharacter(prev => ({
      ...prev,
      exp: (prev.exp || 0) + amount
    }));
  };

  // Add useEffect for controls fade-out
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const renderArtifacts = () => {
    return artifacts
      .filter(artifact => artifact.visible)
      .map(artifact => (
        <div
          key={artifact.id}
          className="artifact"
          style={{
            position: 'absolute',
            left: `${artifact.location.x * TILE_SIZE}px`,
            top: `${artifact.location.y * TILE_SIZE}px`,
            width: `${TILE_SIZE}px`,
            height: `${TILE_SIZE}px`,
            backgroundImage: `url('/assets/artifacts/${artifact.type.toLowerCase()}.svg')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: 4
          }}
        >
          <div className="artifact-tooltip">
            {artifact.name}
          </div>
        </div>
      ));
  };

  const handleDeleteQuote = (index) => {
    if (!character || !character.savedQuotes) return;
    
    const updatedQuotes = [...character.savedQuotes];
    updatedQuotes.splice(index, 1);
    
    const updatedCharacter = {
      ...character,
      savedQuotes: updatedQuotes
    };
    
    setCharacter(updatedCharacter);
    
    // Update in database if needed
    if (updatedCharacter.id) {
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ Quote deleted from character profile"))
        .catch(err => console.error("❌ Failed to delete quote:", err));
    }
  };

  // Add event listeners for UI events from Navbar
  useEffect(() => {
    // Function to handle inventory toggle event
    const handleShowInventory = () => {
      setIsInMenu(true);
      setShowInventory(true);
    };
    
    // Function to handle create artifact event
    const handleShowCreateArtifact = () => {
      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to create artifacts. Please log in first.");
        return;
      }
      
      setIsInMenu(true);
      setShowForm(true);
      setFormPosition({ 
        x: Math.floor(characterPosition.x / TILE_SIZE), 
        y: Math.floor(characterPosition.y / TILE_SIZE) 
      });
    };
    
    // Function to handle quotes event
    const handleShowQuotes = () => {
      setShowSavedQuotes(true);
    };
    
    // Add event listeners with correct event names from Navbar
    window.addEventListener('showInventory', handleShowInventory);
    window.addEventListener('showCreateArtifact', handleShowCreateArtifact);
    window.addEventListener('showQuotes', handleShowQuotes);
    
    // Additional debug logging
    console.log("✅ Event listeners added for UI interactions");
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('showInventory', handleShowInventory);
      window.removeEventListener('showCreateArtifact', handleShowCreateArtifact);
      window.removeEventListener('showQuotes', handleShowQuotes);
      console.log("✅ Event listeners removed");
    };
  }, [characterPosition]);

  // Handle touch controls movement
  const handleTouchMove = (direction) => {
    const newPosition = { ...characterPosition };
      
    switch(direction) {
      case 'up':
        newPosition.y -= TILE_SIZE;
        setMovementDirection('up');
        break;
      case 'down':
        newPosition.y += TILE_SIZE;
        setMovementDirection('down');
        break;
      case 'left':
        newPosition.x -= TILE_SIZE;
        setMovementDirection('left');
        break;
      case 'right':
        newPosition.x += TILE_SIZE;
        setMovementDirection('right');
        break;
      default:
        break;
    }

    if (isValidMove(newPosition)) {
      setCharacterPosition(newPosition);
      adjustViewport(newPosition);
    }
  };

  // Event listener for artifact pickup button
  useEffect(() => {
    const handleArtifactPickupEvent = () => {
      // Check if the character is standing on an artifact
      const characterTileX = Math.floor(characterPosition.x / TILE_SIZE);
      const characterTileY = Math.floor(characterPosition.y / TILE_SIZE);
      
      const artifact = findArtifactAtLocation(characterTileX, characterTileY);
      if (artifact) {
        handleArtifactPickup(artifact);
      }
    };
    
    window.addEventListener('artifactPickup', handleArtifactPickupEvent);
    
    return () => window.removeEventListener('artifactPickup', handleArtifactPickupEvent);
  }, [characterPosition, artifacts]);

  // Event listener for artifact drop button 
  useEffect(() => {
    const handleArtifactDropEvent = () => {
      // Show inventory with drop mode if inventory is not empty
      if (inventory.length > 0) {
        setIsInMenu(true);
        setShowInventory(true);
        // Focus on drop mode for the inventory interface
        setTimeout(() => {
          const firstArtifact = document.querySelector('.artifact-item');
          if (firstArtifact) {
            firstArtifact.click();
            const dropButton = document.querySelector('.artifact-actions button:nth-child(2)');
            if (dropButton) dropButton.click();
          }
        }, 100);
      }
    };
    
    window.addEventListener('artifactDrop', handleArtifactDropEvent);
    
    return () => window.removeEventListener('artifactDrop', handleArtifactDropEvent);
  }, [inventory]);

  // Check for mobile/tablet devices and resize events
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add an event listener for auth errors
  useEffect(() => {
    const handleAuthError = (event) => {
      // Show error message and redirect to login
      alert(event.detail.message || "Your session has expired. Please login again.");
      // Set logged in state to false
      setIsLoggedIn(false);
    };
    
    window.addEventListener('authError', handleAuthError);
    
    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  return (
    <div className="game-container" style={{ 
      width: '100%', 
      maxWidth: '768px', 
      height: isMobile ? 'calc(100vh - 60px)' : '768px', 
      overflow: 'hidden',
      margin: '0 auto'
    }}>
      {showControls && (
        <div className="controls-hint" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          zIndex: 100,
          opacity: 1,
          transition: 'opacity 1s ease-out'
        }}>
          <div>🎮 Controls:</div>
          <div>Arrow Keys / D-Pad - Move Character</div>
          <div>Click on NPCs - Talk to Characters</div>
          <div>Top Navigation Bar - Access Menus</div>
          <div>Use "Quotes" Button - View Saved Quotes</div>
          <div>P Button - Pick Up Artifact (when standing on it)</div>
          <div>D Button - Drop Artifact (from inventory)</div>
          <div>Esc - Close Dialogs</div>
        </div>
      )}
      <div className="viewport" style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className={`game-world ${isTransitioning ? 'transitioning' : ''}`} style={{
          transform: `translate(${-viewport.x}px, ${-viewport.y}px)`,
          position: 'absolute',
          width: `${MAP_COLS * TILE_SIZE}px`,
          height: `${MAP_ROWS * TILE_SIZE}px`
        }}>
          <Map 
            mapData={MAPS[currentMapIndex].data} 
            mapName={MAPS[currentMapIndex].name}
          />
          <Character
            x={characterPosition.x}
            y={characterPosition.y}
            exp={character.exp}
            level={getLevel(character.exp)}
            movementDirection={movementDirection}
            avatar={character.avatar}
          />
          <ErrorBoundary>
            {/* Render NPCs */}
            {MAPS[currentMapIndex].npcs?.map((npc) => (
              <NPC
                key={`npc-${npc.id}`}
                npc={npc}
                position={npc.position}
                characterPosition={characterPosition}
                mapData={MAPS[currentMapIndex].data}
                character={character}
                onUpdateCharacter={(updatedCharacter) => {
                  setCharacter(updatedCharacter);
                  // Save to backend if needed
                  if (updatedCharacter.id) {
                    updateCharacter(updatedCharacter)
                      .catch(err => console.error("Failed to update character:", err));
                  }
                }}
                onDialogStateChange={(isOpen) => {
                  setDialogOpen(isOpen);
                }}
              />
            ))}
            {/* Render map artifacts */}
            {MAPS[currentMapIndex].artifacts.map((artifact) =>
              artifact.visible ? (
                <Artifact
                  key={`map-artifact-${artifact.id}`}
                  artifact={{
                    ...artifact,
                    location: {
                      x: artifact.location?.x || 0,
                      y: artifact.location?.y || 0
                    }
                  }}
                  characterPosition={characterPosition}
                  visible={true}
                />
              ) : null
            )}
            {/* Render user-created artifacts */}
            {artifacts.map((artifact) =>
              artifact.visible ? (
                <Artifact
                  key={`user-artifact-${artifact.id || artifact._id}`}
                  artifact={{
                    ...artifact,
                    location: {
                      x: artifact.location?.x || 0,
                      y: artifact.location?.y || 0
                    }
                  }}
                  characterPosition={characterPosition}
                  visible={true}
                />
              ) : null
            )}
          </ErrorBoundary>
        </div>
      </div>

      {showForm && (
        <ArtifactCreation
          position={characterPosition}
          onClose={() => setShowForm(false)}
          refreshArtifacts={refreshArtifacts}
        />
      )}

      {showInventory && (
        <Inventory 
          artifacts={inventory}
          onClose={() => setShowInventory(false)}
          onUpdateArtifact={handleArtifactPickup}
          onGainExperience={handleExp}
          refreshArtifacts={refreshArtifacts}
          characterPosition={characterPosition}
        />      
      )}

      {showPortalFlash && <div className="portal-flash" />}

      {/* Quotes button */}
      <button 
        className="quotes-button"
        onClick={() => setShowSavedQuotes(true)}
        disabled={dialogOpen}
      >
        📜 Quotes
      </button>

      {/* Saved Quotes Modal */}
      {showSavedQuotes && (
        <SavedQuotes 
          quotes={character?.savedQuotes || []}
          onClose={() => setShowSavedQuotes(false)}
          onDeleteQuote={handleDeleteQuote}
        />
      )}

      {/* Add TouchControls component */}
      <TouchControls onMove={handleTouchMove} />
    </div>
  );
};

export default GameWorld;