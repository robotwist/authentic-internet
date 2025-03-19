import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter,
  updateArtifact
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
import Dialog from "./Dialog";
import ActionBar from "./ActionBar";
import WorldGuideOnboarding from "./WorldGuideOnboarding";
import CreativeAspirations from "./CreativeAspirations";
import Level3Terminal from "./Level3Terminal";

const MOVEMENT_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

const YosemiteAccess = ({ onAccess, showButton }) => {
  if (!showButton) return null;
  
  return (
    <div className="yosemite-access">
      <button 
        onClick={onAccess}
        className="yosemite-access-button"
      >
        Visit Yosemite with John Muir
      </button>
    </div>
  );
};

const GameWorld = ({ 
  mapData, 
  artifacts: initialArtifacts = [], 
  npcs = [], 
  character: initialCharacter = {
    position: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
    exp: 0,
    level: 1
  },
  isLoggedIn = false,
  username = ''
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
  const [showDropDown, setShowDropDown] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showYosemiteButton, setShowYosemiteButton] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showWorldGuide, setShowWorldGuide] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showCreativeAspirations, setShowCreativeAspirations] = useState(false);
  const [showLevel3Terminal, setShowLevel3Terminal] = useState(false);
  const [gameLevel, setGameLevel] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);
  const [levelUpMessage, setLevelUpMessage] = useState(null);

  // Add Dante quotes for level transitions
  const DANTE_QUOTES = {
    level2: "In the middle of the journey of our life, I found myself in a dark forest, for the straight way was lost.",
    level3: "All hope abandon, ye who enter here."
  };

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
        e.target.tagName.toLowerCase() === 'textarea') {
      
      // Only allow Escape key to close dialogs
      if (e.key === 'Escape') {
        setIsInDialog(false);
        setIsInMenu(false);
        setCurrentNPC(null);
        setDialogOpen(false);
        setShowInventory(false);
        setShowForm(false);
        setShowSavedQuotes(false);
      }
      return;
    }

    const key = e.key.toLowerCase();
    
    // Skip keyboard handling during onboarding
    if (showWorldGuide) return;
    
    // Escape key should exit any dialog or menu, regardless of other conditions
    if (key === 'escape') {
      e.preventDefault();
      setIsInDialog(false);
      setIsInMenu(false);
      setCurrentNPC(null);
      setDialogOpen(false);
      setShowInventory(false);
      setShowForm(false);
      setShowSavedQuotes(false);
      return;
    }

    // If dialog or menu is open, prevent other keyboard actions
    if (dialogOpen || isInDialog || isInMenu) {
      return;
    }
    
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
        handleShowCreateArtifact();
        break;
      case 'q':
        e.preventDefault();
        setShowSavedQuotes(true);
        break;
      case 'f':
        if (inventory.length > 0 && !showDropDown) {
          setShowDropDown(true);
        } else {
          setShowDropDown(false);
        }
        break;
      default:
        break;
    }

    // Debug mode with 'D' + 'Shift' key
    if (e.key.toLowerCase() === 'd' && e.shiftKey) {
      setDebugMode(prev => !prev);
      console.log("Debug mode:", !debugMode);
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
  }, [characterPosition, debugMode]);

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
  const handleTouchMove = useCallback((direction) => {
    // Ignore touch moves when dialog is open
    if (dialogOpen || isInDialog || isInMenu) return;
    
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

    // Add a small vibration for tactile feedback if supported and on mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(20); // Short 20ms vibration
    }

    if (isValidMove(newPosition)) {
      setCharacterPosition(newPosition);
      adjustViewport(newPosition);
      
      // Check for artifacts at the new position
      checkForArtifactsAtPosition(newPosition);
    }
  }, [characterPosition, dialogOpen, isInDialog, isInMenu, isMobile]);

  // Add this function to check for artifacts
  const checkForArtifactsAtPosition = (position) => {
    const tileX = Math.floor(position.x / TILE_SIZE);
    const tileY = Math.floor(position.y / TILE_SIZE);
    
    const artifact = findArtifactAtLocation(tileX, tileY);
    if (artifact && isMobile) {
      // For mobile, show a pickup button or notification
      if (window.showNotification) {
        window.showNotification(`Found: ${artifact.name}. Tap pickup to collect.`, 'info');
      }
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

  // Add/enhance the useEffect for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Add a class to the body for CSS targeting
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // iOS specific event to handle virtual keyboard
    window.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setKeyboardVisible(true);
        // Add a class to handle viewport adjustments when keyboard is visible
        document.body.classList.add('keyboard-open');
      }
    });
    
    window.addEventListener('focusout', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setKeyboardVisible(false);
        document.body.classList.remove('keyboard-open');
      }
    });
    
    // Handle iOS PWA standalone mode detection
    const isInStandaloneMode = () => 
      (window.navigator.standalone) || 
      (window.matchMedia('(display-mode: standalone)').matches);
    
    if (isInStandaloneMode()) {
      document.body.classList.add('standalone-mode');
    }
    
    // Handle iOS orientation changes
    window.addEventListener('orientationchange', () => {
      // Small timeout to ensure the UI updates after orientation change completes
      setTimeout(() => {
        adjustViewport(characterPosition);
        // Force re-render for iOS
        setRenderKey(prev => prev + 1);
      }, 300);
    });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', () => {});
      window.removeEventListener('focusin', () => {});
      window.removeEventListener('focusout', () => {});
    };
  }, []);

  // Handle dropping an artifact at the current location
  const handleDropArtifact = async (artifact) => {
    if (!artifact) return;
    
    try {
      const dropLocation = {
        x: Math.floor(characterPosition.x / TILE_SIZE),
        y: Math.floor(characterPosition.y / TILE_SIZE)
      };
      
      console.log(`Dropping artifact "${artifact.name}" at position:`, dropLocation);
      
      // Update the artifact in the database
      const response = await updateArtifact(artifact.id || artifact._id, {
        status: 'dropped',
        location: dropLocation,
        visible: true
      });
      
      if (response) {
        // Remove from inventory
        setInventory(prev => prev.filter(item => (item.id || item._id) !== (artifact.id || artifact._id)));
        
        // Add to the world artifacts
        const droppedArtifact = {
          ...artifact,
          status: 'dropped',
          location: dropLocation,
          visible: true
        };
        
        setArtifacts(prev => [...prev, droppedArtifact]);
        
        // Play drop sound
        const dropSound = new Audio('/assets/sounds/drop.mp3');
        dropSound.volume = 0.3;
        dropSound.play().catch(console.error);
        
        // Show notification
        if (window.showNotification) {
          window.showNotification(`Dropped ${artifact.name}`, 'info');
        }
        
        // Close dropdown
        setShowDropDown(false);
        
        // Save updated game state
        const gameState = {
          characterPosition,
          currentMapIndex,
          inventory: inventory.filter(item => (item.id || item._id) !== (artifact.id || artifact._id)),
          exp,
          pickedUpArtifacts
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
      }
    } catch (error) {
      console.error("Error dropping artifact:", error);
      if (window.showNotification) {
        window.showNotification("Failed to drop artifact. Please try again.", 'error');
      }
    }
  };

  // Add a new useEffect to check if we should show the Yosemite button
  // This will show the button after 2 minutes of gameplay or if the player has explored enough
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowYosemiteButton(true);
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearTimeout(timer);
  }, []);
  
  // Add a function to handle direct access to Yosemite
  const handleYosemiteAccess = () => {
    const yosemiteMapIndex = MAPS.findIndex(map => map.name === "Yosemite");
    
    if (yosemiteMapIndex !== -1) {
      // Start transition effects
      setIsTransitioning(true);
      setShowPortalFlash(true);
      
      // Set character level to 2 if it's not already
      if (character && character.level < 2) {
        const updatedCharacter = {
          ...character,
          level: 2,
          experience: 0
        };
        
        setCharacter(updatedCharacter);
        
        if (updatedCharacter.id) {
          updateCharacter(updatedCharacter)
            .then(() => console.log("✅ Character level set to 2"))
            .catch((err) => console.error("❌ Failed to update character:", err));
        }
      }
      
      // Transition to Yosemite
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
            alert("John Muir: Welcome to Yosemite, the grandest of all the special temples of Nature! Now that you've joined me in this majestic wilderness, let me guide you. Explore Half Dome, Yosemite Falls, and the Mist Trail. The wonders of Yosemite await!");
          }, 500);
        }, 1000);
      }, 500);
    }
  };

  // Check if this is a new user who needs onboarding
  useEffect(() => {
    const checkNewUser = async () => {
      if (isLoggedIn && character && !localStorage.getItem('onboardingCompleted')) {
        // If user is level 1 and has no artifacts, show the onboarding
        if (character.level === 1 && character.exp === 0 && (!inventory || inventory.length === 0)) {
          // Wait a moment for the game world to load before showing the guide
          setTimeout(() => {
            setShowWorldGuide(true);
          }, 2000);
        }
      }
    };
    
    checkNewUser();
  }, [isLoggedIn, character, inventory]);
  
  // Handle completing the onboarding
  const handleCompleteOnboarding = () => {
    setShowWorldGuide(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Show a congratulatory message
    setTimeout(() => {
      alert('Congratulations! You have completed the onboarding experience. Your artifact is now in the world for others to find and interact with, which will earn you experience points. Explore the world to find artifacts created by others!');
    }, 500);
  };

  // Show creative aspirations overlay
  const handleShowCreativeAspirations = () => {
    setShowCreativeAspirations(true);
  };

  // Handle when user clicks Start Creating in the aspirations overlay
  const handleStartCreating = () => {
    setShowCreativeAspirations(false);
    // Either show the artifact creation form or move to a location for creation
    setShowForm(true);
  };

  // Determine the game level based on character experience or level
  useEffect(() => {
    if (character && character.level >= 3) {
      setGameLevel(3);
      // Only show terminal if player is at level 3
      setShowLevel3Terminal(true);
    } else if (character && character.level >= 2) {
      setGameLevel(2);
      // Level 2 Yosemite experience
    } else {
      setGameLevel(1);
      // Level 1 standard experience
    }
  }, [character]);

  // Check if character has any artifacts that qualify for level progression
  const checkLevelQualification = useCallback(() => {
    if (!artifacts || !username) return;
    
    // Filter artifacts created by this user
    const userArtifacts = artifacts.filter(a => a.creator === username);
    
    if (userArtifacts.length === 0) return;
    
    // Level 2 qualification: At least one artifact with 3+ total interactions
    const level2Artifact = userArtifacts.find(artifact => {
      const totalInteractions = (artifact.interactions?.views || 0) + 
                               (artifact.interactions?.saves || 0) + 
                               (artifact.interactions?.shares || 0);
      return totalInteractions >= 3;
    });
    
    // Level 3 qualification: At least one artifact with 5+ total interactions and at least 2 saves
    const level3Artifact = userArtifacts.find(artifact => {
      const totalInteractions = (artifact.interactions?.views || 0) + 
                               (artifact.interactions?.saves || 0) + 
                               (artifact.interactions?.shares || 0);
      return totalInteractions >= 5 && (artifact.interactions?.saves || 0) >= 2;
    });
    
    // Update character level based on artifact qualifications
    if (level3Artifact && character.level < 3) {
      const updatedCharacter = {
        ...character,
        level: 3,
        exp: Math.max(character.exp, 300),
        qualifyingArtifacts: {
          ...(character.qualifyingArtifacts || {}),
          level3: level3Artifact._id
        }
      };
      
      setCharacter(updatedCharacter);
      
      // Show level up notification with guide appearance
      setLevelUpMessage({
        guide: "Virgil",
        level: 3,
        message: "Your creation has resonated deeply with others. The path to the inner realm is now open to you. Follow me into the darkness, where truth is found in absence of light.",
        artifactName: level3Artifact.name,
        onClose: () => {
          setLevelUpMessage(null);
          // If user is logged in, save progress
          if (isLoggedIn) {
            updateCharacter(updatedCharacter)
              .catch(err => console.error('Error updating character after level qualification:', err));
          }
        }
      });
      
    } else if (level2Artifact && character.level < 2) {
      const updatedCharacter = {
        ...character,
        level: 2,
        exp: Math.max(character.exp, 150),
        qualifyingArtifacts: {
          ...(character.qualifyingArtifacts || {}),
          level2: level2Artifact._id
        }
      };
      
      setCharacter(updatedCharacter);
      
      // Show level up notification with guide appearance
      setLevelUpMessage({
        guide: "John Muir",
        level: 2,
        message: "Your creation has touched others, and in doing so, has opened the path to Yosemite. Nature awaits you - come walk with me among the mountains and meadows where inspiration flows like water.",
        artifactName: level2Artifact.name,
        onClose: () => {
          setLevelUpMessage(null);
          // If user is logged in, save progress
          if (isLoggedIn) {
            updateCharacter(updatedCharacter)
              .catch(err => console.error('Error updating character after level qualification:', err));
          }
        }
      });
    }
  }, [artifacts, username, character, isLoggedIn]);

  // Check for level qualification whenever artifacts are updated
  useEffect(() => {
    checkLevelQualification();
  }, [artifacts, checkLevelQualification]);

  // Handle transition to level 3
  const handleTransitionToLevel3 = () => {
    // Only allow transition if character has qualified through their artifacts
    if (character.level < 3 && !debugMode) {
      // Guide message about needing more meaningful artifacts
      setErrorMessage({
        title: "Virgil",
        message: "You cannot yet enter this realm. Create artifacts that resonate with others - when your creations are viewed, saved, and shared, the way forward will reveal itself.",
        onClose: () => setErrorMessage(null)
      });
      return;
    }

    // Get qualifying artifact that opened the path
    const qualifyingArtifactId = character.qualifyingArtifacts?.level3;
    const qualifyingArtifact = qualifyingArtifactId ? artifacts.find(a => a._id === qualifyingArtifactId) : null;

    // Create divine transition effect
    const divineTransition = document.createElement('div');
    divineTransition.className = 'divine-transition';
    document.body.appendChild(divineTransition);
    setTimeout(() => divineTransition.classList.add('active'), 100);

    // Create Virgil guide appearance
    const guideAppearance = document.createElement('div');
    guideAppearance.className = 'guide-appearance virgil';
    document.body.appendChild(guideAppearance);
    setTimeout(() => guideAppearance.classList.add('active'), 500);

    // Show Dante quote
    const danteQuote = document.createElement('div');
    danteQuote.className = 'dante-quote';
    danteQuote.textContent = DANTE_QUOTES.level3;
    document.body.appendChild(danteQuote);
    setTimeout(() => danteQuote.classList.add('active'), 1000);

    // Play transition sound
    const transitionSound = new Audio('/assets/sounds/digital-transition.mp3');
    transitionSound.volume = 0.5;
    transitionSound.play().catch(console.error);

    // Add visual effects for transition
    setIsTransitioning(true);
    document.querySelector('.game-world').classList.add('level-3-transition');

    // Create cursor animation element
    const cursorElement = document.createElement('div');
    cursorElement.className = 'cursor-entry';
    document.body.appendChild(cursorElement);

    // After animation completes, show the terminal
    setTimeout(() => {
      setShowLevel3Terminal(true);
      setGameLevel(3);
      setIsTransitioning(false);
      document.querySelector('.game-world').classList.remove('level-3-transition');
      
      // Remove transition elements
      if (divineTransition && divineTransition.parentNode) divineTransition.parentNode.removeChild(divineTransition);
      if (guideAppearance && guideAppearance.parentNode) guideAppearance.parentNode.removeChild(guideAppearance);
      if (danteQuote && danteQuote.parentNode) danteQuote.parentNode.removeChild(danteQuote);
      if (cursorElement && cursorElement.parentNode) cursorElement.parentNode.removeChild(cursorElement);
    }, 5000);
  };

  // Modify handleMapTransition for Level 2 access
  const handleMapTransition = useCallback((targetMapIndex) => {
    // Check for Level 3 portal
    const currentX = Math.floor(characterPosition.x / TILE_SIZE);
    const currentY = Math.floor(characterPosition.y / TILE_SIZE);
    const currentTile = MAPS[currentMapIndex].data[currentY][currentX];

    // Level 3 portal is a special type of portal (value 13 in the map data)
    if (currentTile === 13) {
      handleTransitionToLevel3();
      return;
    }
    
    // Yosemite (Level 2) access check
    if (targetMapIndex === 2 && character.level < 2 && !debugMode) {
      // Guide message about needing more meaningful artifacts
      setErrorMessage({
        title: "John Muir",
        message: "The path to Yosemite is not yet open to you. Create artifacts that touch others' hearts - when your creations begin to resonate with the world, I will guide you to the mountains.",
        onClose: () => setErrorMessage(null)
      });
      return;
    }
    
    // Regular map transition logic
    if (targetMapIndex !== undefined && targetMapIndex !== currentMapIndex) {
      // Dante-inspired transition for Level 2
      if (targetMapIndex === 2) {
        // Create divine transition effect
        const divineTransition = document.createElement('div');
        divineTransition.className = 'divine-transition';
        document.body.appendChild(divineTransition);
        setTimeout(() => divineTransition.classList.add('active'), 100);

        // Create John Muir guide appearance
        const guideAppearance = document.createElement('div');
        guideAppearance.className = 'guide-appearance john-muir';
        document.body.appendChild(guideAppearance);
        setTimeout(() => guideAppearance.classList.add('active'), 500);

        // Show Dante quote
        const danteQuote = document.createElement('div');
        danteQuote.className = 'dante-quote';
        danteQuote.textContent = DANTE_QUOTES.level2;
        document.body.appendChild(danteQuote);
        setTimeout(() => danteQuote.classList.add('active'), 1000);
      }
      
      // Transition animation
      setIsTransitioning(true);
      setShowPortalFlash(true);
      
      // Play portal sound if available
      const portalSound = new Audio('/assets/sounds/portal.mp3');
      portalSound.volume = 0.5;
      portalSound.play().catch(console.error);
      
      // Level 2 (Yosemite) special intro dialog with John Muir
      if (targetMapIndex === 2 && !showedLevel2Intro) {
        // Get qualifying artifact that opened the path
        const qualifyingArtifactId = character.qualifyingArtifacts?.level2;
        const qualifyingArtifact = qualifyingArtifactId ? artifacts.find(a => a._id === qualifyingArtifactId) : null;
        
        const muirIntro = {
          title: "John Muir",
          message: `Welcome to Yosemite, my dear friend! Your creation "${qualifyingArtifact?.name || 'artifact'}" has opened the way to this sacred place. The grandeur of these mountains will lift your spirit. Let us walk among the sequoias and beside the shimmering waters. The wilderness holds answers to questions we have not yet learned to ask.`,
          onClose: () => {
            // Continue with map transition after greeting
            setTimeout(() => {
              setCurrentMapIndex(targetMapIndex);
              setCharacterPosition({
                x: 5 * TILE_SIZE,
                y: 5 * TILE_SIZE
              });
              setIsTransitioning(false);
              setShowPortalFlash(false);
              setShowedLevel2Intro(true);
            }, 500);
          }
        };
        
        // Show dialog after a short delay
        setTimeout(() => {
          setErrorMessage(muirIntro);
        }, 1000);
      } else {
        // Standard transition without dialog
        setTimeout(() => {
          setCurrentMapIndex(targetMapIndex);
          setCharacterPosition({
            x: 5 * TILE_SIZE,
            y: 5 * TILE_SIZE
          });
          setIsTransitioning(false);
          setShowPortalFlash(false);
        }, 1000);
      }
    }
  }, [characterPosition.x, characterPosition.y, currentMapData, currentMapIndex, handleTransitionToLevel3, showedLevel2Intro, character.level, debugMode]);

  return (
    <ErrorBoundary>
      <div className="game-container" style={{ 
        width: '100%', 
        maxWidth: '768px', 
        height: isMobile ? 'calc(100vh - 60px)' : '768px', 
        overflow: 'hidden',
        margin: '0 auto'
      }}>
        {/* Only show normal game world if not in terminal mode */}
        {!showLevel3Terminal ? (
          <>
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
              <div className={`game-world ${isTransitioning ? 'transitioning' : ''} level-${gameLevel}`} style={{
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
          </>
        ) : (
          <Level3Terminal
            showLevel3Terminal={showLevel3Terminal}
            handleTransitionToLevel3={handleTransitionToLevel3}
          />
        )}
        {levelUpMessage && (
          <div className="level-up-notification">
            <div className="level-up-content">
              <h3>Level {levelUpMessage.level} Unlocked</h3>
              <div className="guide-message">
                <div className="guide-portrait">
                  <img 
                    src={`/assets/guides/${levelUpMessage.guide.toLowerCase()}.png`} 
                    alt={levelUpMessage.guide}
                  />
                </div>
                <div className="guide-text">
                  <h4>{levelUpMessage.guide}</h4>
                  <p>{levelUpMessage.message}</p>
                </div>
              </div>
              <div className="artifact-recognition">
                <p>Your artifact "{levelUpMessage.artifactName}" has opened the way.</p>
              </div>
              <button onClick={levelUpMessage.onClose}>Continue Journey</button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GameWorld;