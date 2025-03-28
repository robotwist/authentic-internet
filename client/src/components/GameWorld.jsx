import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ErrorBoundary from "./ErrorBoundary";
import Map from "./Map";
import WorldMap from "./WorldMap";
import FeedbackForm from "./FeedbackForm";
import useCharacterMovement from "./CharacterMovement";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, isWalkable } from "./Constants";
import { MAPS } from "./GameData";
import { debugNPCSprites } from "../utils/debugTools";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";
import Level4Shooter from "./Level4Shooter";
import RewardModal from "./RewardModal";
import DialogBox from './DialogBox';
import TextAdventure from './TextAdventure';
import SoundManager from "./utils/SoundManager";

const GameWorld = () => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState({ x: 64, y: 64 });
  const [character, setCharacter] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [levelCompletion, setLevelCompletion] = useState({
    level1: false,
    level2: false,
    level3: false,
    level4: false
  });
  const [showWinNotification, setShowWinNotification] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [showLevel4, setShowLevel4] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState('');
  const [activeNPC, setActiveNPC] = useState(null);
  const [showNPCDialog, setShowNPCDialog] = useState(false);
  const [currentSpecialWorld, setCurrentSpecialWorld] = useState(null);
  const [showWorldGuide, setShowWorldGuide] = useState(true);
  const [soundManager, setSoundManager] = useState(null);

  useEffect(() => {
    // Load and apply saved artifact visibility state
    applyMapArtifactVisibilityFromStorage();
    
    fetchArtifacts()
      .then((data) => {
        console.log("📦 Loaded Artifacts:", data);
        // Filter out any server artifacts that duplicate artifacts already defined in MAPS
        const mapArtifacts = MAPS.flatMap(map => map.artifacts.map(art => art.name));
        const filteredServerArtifacts = data.filter(serverArt => 
          !mapArtifacts.includes(serverArt.name) || 
          !serverArt.location // Include artifacts without location (inventory items)
        );
        setArtifacts(filteredServerArtifacts);
      })
      .catch((error) => console.error("❌ Error fetching artifacts:", error));
  }, []);

  useEffect(() => {
    // Check if user has already dismissed the guide
    const hasDismissedGuide = localStorage.getItem('has-dismissed-world-guide');
    if (hasDismissedGuide) {
      setShowWorldGuide(false);
    }
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
        const token = localStorage.getItem("token");
        
        // Create a default character state
        const defaultCharacter = {
          level: 1,
          experience: 0,
          savedQuotes: [],
          qualifyingArtifacts: {},
          id: null,
          username: 'guest',
          inventory: []
        };

        // If no user or token, use default character but don't reset existing state
        if (!storedUser || !storedUser.id || !token) {
          console.log("👤 Using default character for unauthenticated play");
          if (!character) {
            setCharacter(defaultCharacter);
          }
          return;
        }

        // Only fetch character if we don't have one or if the ID changed
        if (!character || character.id !== storedUser.id) {
          const characterData = await fetchCharacter(storedUser.id);
          console.log("✅ Character Loaded:", characterData);
          if (characterData) {
            setCharacter(characterData);
          } else {
            setCharacter(defaultCharacter);
          }
        }
      } catch (err) {
        console.error("❌ Failed to load character:", err);
        // Only set default character if we don't have one
        if (!character) {
          setCharacter(defaultCharacter);
        }
      }
    };

    loadCharacter();
  }, []);

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

  useEffect(() => {
    // Setup event listeners for navbar button actions
    const handleShowInventory = () => {
      setShowInventory(true);
    };

    const handleShowQuotes = () => {
      setShowQuotes(true);
    };

    // Add development keyboard shortcuts for testing
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      
      // Handle inventory toggle with 'i' key
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        setShowInventory(prev => !prev);
        return;
      }
      
      // Toggle world map with 'M' key
      if (event.key === 'm' || event.key === 'M') {
        setShowWorldMap(prev => !prev);
      }

      // Toggle feedback form with 'F' key
      if (event.key === 'f' || event.key === 'F') {
        setShowFeedback(prev => !prev);
      }

      // Development mode shortcuts
      if (process.env.NODE_ENV === 'development') {
        if (event.shiftKey && event.key === '1') {
          handleLevelCompletion('level1');
        }
        if (event.shiftKey && event.key === '0') {
          setLevelCompletion({
            level1: false,
            level2: false,
            level3: false,
            level4: false
          });
          localStorage.removeItem('level-level1-completed');
          localStorage.removeItem('level-level2-completed');
          localStorage.removeItem('level-level3-completed');
          localStorage.removeItem('level-level4-completed');
          localStorage.removeItem('nkd-man-reward-shown');
        }
      }
    };

    // Add event listeners
    window.addEventListener('showInventory', handleShowInventory);
    window.addEventListener('showQuotes', handleShowQuotes);
    window.addEventListener('keydown', handleKeyDown);

    // Store game state in window object for access by feedback form
    window.gameState = {
      currentMapIndex,
      characterLevel: character?.level || 1
    };

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('showInventory', handleShowInventory);
      window.removeEventListener('showQuotes', handleShowQuotes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMapIndex, character]);

  useEffect(() => {
    // Initialize sound manager
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
      
      // Start playing the main theme based on current map
      const currentMapName = MAPS[currentMapIndex].name;
      if (currentMapName.includes('Overworld')) {
        manager.playMusic('overworld', true);
      } else if (currentMapName === 'Yosemite') {
        manager.playMusic('yosemite', true);
      } else if (currentMapName.includes('Dungeon')) {
        manager.playMusic('terminal', true);
      }
    };
    initSoundManager();
  }, [currentMapIndex]);

  const handleCharacterMove = useCallback((newPosition, targetMapIndex) => {
    // Update character position
    setCharacterPosition(newPosition);
    
    // Update map index if needed
    if (targetMapIndex !== currentMapIndex) {
      setCurrentMapIndex(targetMapIndex);
    }

    // Adjust viewport
    const mapWidth = MAPS[currentMapIndex].data[0].length * TILE_SIZE;
    const mapHeight = MAPS[currentMapIndex].data.length * TILE_SIZE;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const viewportX = Math.max(
      0,
      Math.min(newPosition.x - viewportWidth / 2, mapWidth - viewportWidth)
    );
    
    const viewportY = Math.max(
      0,
      Math.min(newPosition.y - viewportHeight / 2, mapHeight - viewportHeight)
    );
    
    setViewport({
      x: viewportX,
      y: viewportY
    });
  }, [currentMapIndex]);

  const handleArtifactPickup = useCallback(async (artifact) => {
    if (!artifact) return;

    try {
      // Play pickup sound
      if (soundManager) soundManager.playSound('pickup');

      // Check if artifact is at player's position
      const playerX = Math.floor(characterPosition.x / TILE_SIZE);
      const playerY = Math.floor(characterPosition.y / TILE_SIZE);
      const artifactX = artifact.location ? Math.floor(artifact.location.x) : null;
      const artifactY = artifact.location ? Math.floor(artifact.location.y) : null;

      if (artifactX === playerX && artifactY === playerY) {
        // If it's a map artifact, mark it as collected
        if (artifact.id && MAPS[currentMapIndex].artifacts.some(a => a.id === artifact.id)) {
          saveMapArtifactVisibilityToStorage(artifact.id);
          
          // Update the artifact's visibility in the current map
          MAPS[currentMapIndex].artifacts = MAPS[currentMapIndex].artifacts.map(a => 
            a.id === artifact.id ? { ...a, visible: false } : a
          );
        }

        // Add to inventory
        setInventory(prev => [...prev, artifact]);
        
        // Clear visible artifact
        setVisibleArtifact(null);

        // If it's a server artifact, update it
        if (artifact._id) {
          await createArtifact({
            ...artifact,
            location: null // Remove location to indicate it's in inventory
          });
        }

        // Show feedback form
        setFormPosition({
          x: characterPosition.x,
          y: characterPosition.y
        });
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error handling artifact pickup:", error);
    }
  }, [currentMapIndex, characterPosition, soundManager]);

  // Now we can safely use handleCharacterMove in the hook
  const { isBumping, bumpDirection, movementDirection } = useCharacterMovement(
    characterPosition, 
    handleCharacterMove,
    currentMapIndex, 
    setCurrentMapIndex, 
    isLoggedIn, 
    visibleArtifact, 
    handleArtifactPickup, 
    setShowForm, 
    setFormPosition, 
    setShowInventory, 
    handleCharacterMove
  );

  useEffect(() => {
    // Check for both map artifacts and server artifacts at the player's position
    const checkBothArtifactSources = () => {
      if (!characterPosition) return;
      
      const playerX = characterPosition.x / TILE_SIZE;
      const playerY = characterPosition.y / TILE_SIZE;
      
      // Check map artifacts
      const mapArtifact = MAPS[currentMapIndex].artifacts.find(
        artifact => artifact.location && 
        artifact.visible && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY
      );
      
      // Check server artifacts
      const serverArtifact = artifacts && Array.isArray(artifacts) ? artifacts.find(
        artifact => artifact && artifact.location && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY &&
        (!artifact.area || artifact.area === MAPS[currentMapIndex].name)
      ) : null;
      
      // Prioritize server artifacts (they might be more up-to-date)
      if (serverArtifact) {
        setVisibleArtifact(serverArtifact);
      } else if (mapArtifact) {
        setVisibleArtifact(mapArtifact);
      } else {
        setVisibleArtifact(null);
      }
    };
    
    checkBothArtifactSources();
  }, [characterPosition, currentMapIndex, artifacts]);

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    
    // Map-specific portal handling
    if (MAPS[currentMapIndex].data[row][col] === 5) {
      // Get current map name for better context
      const currentMapName = MAPS[currentMapIndex].name;
      
      // Define destination based on current map - making progression more logical
      let destinationMap = null;
      let spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }; // Default spawn
      
      // Logical world progression paths
      if (currentMapName === "Overworld") {
        destinationMap = "Overworld 2";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      } 
      else if (currentMapName === "Overworld 2") {
        destinationMap = "Overworld 3";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Overworld 3") {
        destinationMap = "Desert 1";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Desert 1") {
        destinationMap = "Desert 2";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Desert 2") {
        destinationMap = "Desert 3";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Desert 3") {
        destinationMap = "Dungeon 1";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Dungeon 1") {
        destinationMap = "Dungeon 2";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Dungeon 2") {
        destinationMap = "Dungeon 3";
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      else if (currentMapName === "Dungeon 3") {
        destinationMap = "Yosemite";
        spawnPosition = { x: 10 * TILE_SIZE, y: 15 * TILE_SIZE };
      }
      
      // Find the index of the destination map
      const destinationIndex = MAPS.findIndex(map => map.name === destinationMap);
      
      if (destinationIndex !== -1) {
        // Play portal sound
        if (soundManager) soundManager.playSound('portal');
        
        // Change map
        setCurrentMapIndex(destinationIndex);
        setCharacterPosition(spawnPosition);
        
        // Announce the world name
        const portalAnnouncement = document.createElement('div');
        portalAnnouncement.className = 'world-announcement';
        portalAnnouncement.innerHTML = `<h2>Welcome to ${destinationMap}</h2>`;
        document.body.appendChild(portalAnnouncement);
        
        // Remove the announcement after a few seconds
        setTimeout(() => {
          portalAnnouncement.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(portalAnnouncement);
          }, 1000);
        }, 3000);
        
        // Check if this is the path to Yosemite (Level 1 completion)
        if (destinationMap === "Yosemite") {
          // Add slight delay to show portal transition first
          setTimeout(() => {
            handleLevelCompletion('level1');
          }, 800);
        }
      }
    }
    
    // Special portal (code 6) handling for Level 4
    if (MAPS[currentMapIndex].data[row][col] === 6) {
      if (levelCompletion.level3) {
        // Play portal sound for special portal
        if (soundManager) soundManager.playSound('portal');
        setShowLevel4(true);
      } else {
        alert("You must complete Level 3 first to access this portal.");
      }
    }
    
    // Legacy level completion logic (for backwards compatibility)
    if (currentMapIndex === 1 && row === 0 && col === 19) {
      handleLevelCompletion('level2');
    } else if (currentMapIndex === 2 && !levelCompletion.level3 && character?.qualifyingArtifacts?.level3) {
      handleLevelCompletion('level3');
    }
  }, [characterPosition, currentMapIndex, character, levelCompletion]);

  const handleDeleteQuote = (index) => {
    if (character && character.savedQuotes) {
      const updatedQuotes = [...character.savedQuotes];
      updatedQuotes.splice(index, 1);
      
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes
      };
      
      setCharacter(updatedCharacter);
      
      if (updatedCharacter.id) {
        updateCharacter(updatedCharacter)
          .then(() => console.log("✅ Quote deleted successfully"))
          .catch(err => console.error("❌ Failed to update character after quote deletion:", err));
      }
    }
  };

  const handleLevelCompletion = (level) => {
    if (levelCompletion[level]) return;
    
    setLevelCompletion(prev => ({
      ...prev,
      [level]: true
    }));
    
    // Save level completion to localStorage so we don't show rewards again
    try {
      localStorage.setItem(`level-${level}-completed`, 'true');
    } catch (error) {
      console.error("Error saving level completion to localStorage:", error);
    }
    
    let message = '';
    switch(level) {
      case 'level1':
        message = 'Congratulations! You have completed Level 1 - The Digital Wilderness!';
        // Show the NKD Man Extension reward after the win notification closes
        setTimeout(() => {
          // Check if we've already shown this reward by checking localStorage
          const rewardShown = localStorage.getItem('nkd-man-reward-shown');
          if (!rewardShown) {
            setCurrentAchievement('level1');
            setShowRewardModal(true);
            try {
              // Mark this reward as shown so we don't show it again
              localStorage.setItem('nkd-man-reward-shown', 'true');
            } catch (error) {
              console.error("Error saving reward state to localStorage:", error);
            }
          }
        }, 5500); // Wait slightly longer than the win notification
        break;
      case 'level2':
        message = 'Magnificent! You have completed Level 2 - The Realm of Shadows!';
        break;
      case 'level3':
        message = 'Extraordinary! You have completed Level 3 - The Terminal Void!';
        setTimeout(() => {
          const goToLevel4 = window.confirm('You have unlocked Level 4: The Hemingway Challenge! Ready to enter?');
          if (goToLevel4) {
            // Play random portal sound with higher chance of toilet flush for special portal
            if (soundManager) {
              if (Math.random() < 0.6) {
                soundManager.playSound('toilet_flush', 0.5);
              } else {
                soundManager.playSound('portal', 0.5);
              }
            }
            setShowLevel4(true);
          }
        }, 3000);
        break;
      case 'level4':
        message = 'Amazing! You have completed Level 4 - The Hemingway Challenge!';
        break;
      default:
        message = 'Level completed!';
    }
    
    // Play level complete sound
    if (soundManager) soundManager.playSound('level_complete');
    
    handleGainExperience(level === 'level3' ? 20 : level === 'level4' ? 30 : 10);
    
    setWinMessage(message);
    setShowWinNotification(true);
    
    setTimeout(() => {
      setShowWinNotification(false);
    }, 5000);
  };

  const handleLevel4Complete = (score) => {
    handleLevelCompletion('level4');
    setShowLevel4(false);
    
    const bonusExp = Math.floor(score / 100);
    if (bonusExp > 0) {
      handleGainExperience(bonusExp);
      alert(`You earned ${bonusExp} bonus experience points from your score!`);
    }
  };

  const handleLevel4Exit = () => {
    setShowLevel4(false);
  };

  // Utilities for persisting map artifact visibility
  const applyMapArtifactVisibilityFromStorage = () => {
    try {
      const savedState = localStorage.getItem('collectedMapArtifacts');
      if (!savedState) return;
      
      const collectedIds = JSON.parse(savedState);
      
      // Apply to all maps
      MAPS.forEach((map, mapIndex) => {
        map.artifacts.forEach((artifact, artifactIndex) => {
          if (collectedIds.includes(artifact.id)) {
            MAPS[mapIndex].artifacts[artifactIndex].visible = false;
          }
        });
      });
      
      console.log("🔍 Restored artifact visibility state from localStorage");
    } catch (error) {
      console.error("❌ Error restoring artifact visibility:", error);
    }
  };
  
  const saveMapArtifactVisibilityToStorage = (artifactId) => {
    try {
      const savedState = localStorage.getItem('collectedMapArtifacts');
      let collectedIds = savedState ? JSON.parse(savedState) : [];
      
      if (!collectedIds.includes(artifactId)) {
        collectedIds.push(artifactId);
        localStorage.setItem('collectedMapArtifacts', JSON.stringify(collectedIds));
        console.log("💾 Saved artifact collection state to localStorage");
      }
    } catch (error) {
      console.error("❌ Error saving artifact collection state:", error);
    }
  };

  // Function to find the closest NPC to the player
  const findClosestNPC = useCallback(() => {
    if (!MAPS[currentMapIndex]?.npcs?.length) return null;
    
    const playerX = characterPosition.x;
    const playerY = characterPosition.y;
    
    let closestNPC = null;
    let minDistance = Infinity;
    
    MAPS[currentMapIndex].npcs.forEach(npc => {
      if (!npc.position) return;
      
      const distance = Math.sqrt(
        Math.pow(playerX - npc.position.x, 2) + 
        Math.pow(playerY - npc.position.y, 2)
      );
      
      // Only consider NPCs within interaction range (1 tile for collision)
      if (distance <= TILE_SIZE * 1.5 && distance < minDistance) {
        minDistance = distance;
        closestNPC = npc;
      }
    });
    
    return closestNPC;
  }, [characterPosition, currentMapIndex]);
  
  // Handle NPC interactions based on collision or click
  const handleNPCInteraction = useCallback(() => {
    const closestNPC = findClosestNPC();
    if (closestNPC) {
      console.log("🗣️ Interacting with NPC:", closestNPC.name);
      setActiveNPC(closestNPC);
      setShowNPCDialog(true);
      return true; // Interaction happened
    }
    return false; // No interaction happened
  }, [findClosestNPC]);
  
  // Close NPC dialog
  const handleCloseNPCDialog = () => {
    setShowNPCDialog(false);
    setActiveNPC(null);
  };

  // Add a handler for the World Map node click
  const handleWorldMapNodeClick = (worldId) => {
    // Check if it's a special world type
    if (worldId === 'hemingway') {
      setCurrentSpecialWorld('hemingway');
      setShowWorldMap(false);
    } else if (worldId === 'text_adventure') {
      setCurrentSpecialWorld('text_adventure');
      setShowWorldMap(false);
    } else {
      // Handle normal world navigation here
      // (This would depend on your existing world navigation logic)
      setShowWorldMap(false);
    }
  };

  // Add handlers for exiting special worlds
  const handleHemingwayComplete = () => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed Hemingway\'s Adventure');
    setShowRewardModal(true);
  };

  const handleHemingwayExit = () => {
    setCurrentSpecialWorld(null);
  };

  const handleTextAdventureComplete = () => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed The Writer\'s Journey');
    setShowRewardModal(true);
  };

  const handleTextAdventureExit = () => {
    setCurrentSpecialWorld(null);
  };

  // Handle dismissing the world guide
  const handleDismissWorldGuide = () => {
    setShowWorldGuide(false);
    // Possibly save this preference to localStorage or user profile
    localStorage.setItem('has-dismissed-world-guide', 'true');
  };

  const handleCreateArtifact = (name, description, messageText) => {
    if (!isLoggedIn) {
      alert("You need to be logged in to create artifacts.");
      return;
    }

    // Check if the current position is walkable before creating an artifact
    const playerX = characterPosition.x / TILE_SIZE;
    const playerY = characterPosition.y / TILE_SIZE;
    const currentMapData = MAPS[currentMapIndex]?.data;
    
    if (!isWalkable(characterPosition.x, characterPosition.y, currentMapData)) {
      alert("You cannot place artifacts on unwalkable tiles. Please move to a grass, sand, or portal tile.");
      return;
    }

    const newArtifact = {
      name,
      description,
      messageText,
      location: { x: playerX, y: playerY },
      creator: uuidv4(),
      visible: true,
    };

    console.log("✨ Creating artifact at:", newArtifact.location);

    createArtifact(newArtifact)
      .then((data) => {
        console.log("✅ Artifact Created:", data);
        updateArtifactsState(data);
      })
      .catch((error) => console.error("❌ Error creating artifact:", error));
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
    return artifacts.find((a) => a?.location?.x === x && a?.location?.y === y);
  };

  const handleGainExperience = async (points) => {
    setCharacter((prev) => {
      // For unauthenticated users, just update local state
      if (!prev.id) {
        return {
          ...prev,
          experience: prev.experience + points
        };
      }

      // For authenticated users, update backend
      const updatedCharacter = { ...prev, experience: prev.experience + points };
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ XP Updated on Backend"))
        .catch((err) => console.error("❌ Failed to update XP:", err));

      return updatedCharacter;
    });
  };

  return (
    <ErrorBoundary>
      <div className="game-container">
        {showLevel4 && (
          <Level4Shooter 
            onComplete={handleLevel4Complete}
            onExit={handleLevel4Exit}
          />
        )}
        <div className="viewport" style={{ width: "100%", height: "100%" }}>
          <div
            className={`game-world ${currentMapIndex === 2 ? 'level-3' : currentMapIndex === 1 ? 'level-2' : 'level-1'}`}
            style={{
              transform: `translate(${-viewport.x}px, ${-viewport.y}px)`,
              width: `${MAPS[currentMapIndex].data[0].length * TILE_SIZE}px`, // Set width based on map columns
              height: `${MAPS[currentMapIndex].data.length * TILE_SIZE}px`, // Set height based on map rows
            }}
          >
            <Map 
              mapData={MAPS[currentMapIndex].data} 
              viewport={viewport} 
              mapName={MAPS[currentMapIndex].name}
              npcs={MAPS[currentMapIndex].npcs.map(npc => {
                // Ensure each NPC has a proper type that matches available sprites
                if (typeof npc.type === 'string' && !npc.sprite) {
                  // If type is a string but no sprite specified, make sure it maps to our sprite assets
                  // by adding a default sprite path based on type
                  const npcType = npc.type.toLowerCase();
                  let extension = 'png'; // Default extension
                  
                  // Determine the correct file extension based on NPC type
                  if (['shakespeare', 'lord_byron'].includes(npcType)) {
                    extension = 'webp';
                  } else if (['artist', 'oscar_wilde', 'alexander_pope', 'zeus'].includes(npcType)) {
                    extension = 'svg';
                  }
                  
                  return {
                    ...npc,
                    sprite: `/assets/npcs/${npcType}.${extension}`
                  };
                }
                return npc;
              })}
              onNPCClick={(npc) => {
                console.log("🎭 Clicked on NPC:", npc.name);
                setActiveNPC(npc);
                setShowNPCDialog(true);
              }}
            />
            <Character 
              x={characterPosition.x} 
              y={characterPosition.y} 
              exp={character?.experience || 0}
              level={character?.level || 1}
              avatar={character?.avatar}
              isBumping={isBumping}
              bumpDirection={bumpDirection}
              movementDirection={movementDirection}
            />
            <ErrorBoundary>
              {/* Render map-defined artifacts */}
              {MAPS[currentMapIndex].artifacts.map((artifact) =>
                artifact.visible && artifact.location ? (
                  <Artifact
                    key={`map-artifact-${artifact.id}`}
                    src={artifact.image}
                    artifact={artifact}
                    visible={artifact.id === visibleArtifact?.id}
                    style={{
                      position: "absolute",
                      left: `${artifact.location.x * TILE_SIZE}px`,
                      top: `${artifact.location.y * TILE_SIZE}px`,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      zIndex: 10000
                    }}
                  />
                ) : null
              )}
              
              {/* Render server-defined artifacts */}
              {artifacts && artifacts.length > 0 && artifacts
                .filter(artifact => 
                  artifact && artifact.location && 
                  // Only show server artifacts on the current map
                  (!artifact.area || artifact.area === MAPS[currentMapIndex].name)
                )
                .map((artifact) => {
                  // Generate a stable key for the artifact
                  const artifactKey = artifact._id || artifact.id || `artifact-${artifact.name}-${artifact.location.x}-${artifact.location.y}`;
                  
                  return (
                    <Artifact
                      key={`server-artifact-${artifactKey}`}
                      src={artifact.image}
                      artifact={artifact}
                      visible={artifact.id === visibleArtifact?.id || artifact._id === visibleArtifact?._id}
                      style={{
                        position: "absolute",
                        left: `${artifact.location.x * TILE_SIZE}px`,
                        top: `${artifact.location.y * TILE_SIZE}px`,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        zIndex: 10000
                      }}
                    />
                  );
                })}
            </ErrorBoundary>
            
            {/* Add the DialogBox for NPC interaction */}
            {showNPCDialog && activeNPC && (
              <DialogBox 
                npc={activeNPC} 
                onClose={handleCloseNPCDialog}
              />
            )}
          </div>
        </div>
        
        {/* Display world map when toggled */}
        {showWorldMap && (
          <WorldMap 
            currentWorld={MAPS[currentMapIndex].name} 
            onClose={() => setShowWorldMap(false)}
            onNodeClick={handleWorldMapNodeClick}
          />
        )}
        
        {/* Display feedback form when toggled */}
        {showFeedback && (
          <FeedbackForm onClose={() => setShowFeedback(false)} />
        )}
        
        {showWinNotification && (
          <div className="win-notification">
            <div className="win-content">
              <h2>Level Complete!</h2>
              <p>{winMessage}</p>
              <div className="win-stars">★★★</div>
              <button onClick={() => setShowWinNotification(false)}>Continue</button>
            </div>
          </div>
        )}

        <RewardModal 
          visible={showRewardModal} 
          onClose={() => setShowRewardModal(false)} 
          achievement={currentAchievement}
        />

        {showForm && (
          <ArtifactCreation
            position={formPosition}
            onClose={() => setShowForm(false)}
            refreshArtifacts={refreshArtifacts}
          />
        )}

        {showInventory && (
          <Inventory 
            artifacts={inventory}
            onClose={() => setShowInventory(false)}
            onUpdateArtifact={handleUpdateArtifact}
            onGainExperience={handleGainExperience}
            refreshArtifacts={refreshArtifacts}
          />      
        )}

        {showQuotes && character && (
          <SavedQuotes 
            quotes={character.savedQuotes || []}
            onClose={() => setShowQuotes(false)}
            onDeleteQuote={handleDeleteQuote}
          />      
        )}

        {/* Feedback button */}
        <div className="feedback-button" onClick={() => setShowFeedback(true)}>
          <span role="img" aria-label="Feedback">💬</span>
          <span className="feedback-text">Feedback</span>
        </div>

        {/* Map key hint - only shown when there's no other overlay */}
        {!showInventory && !showForm && !showQuotes && !showWorldMap && !showWinNotification && !showRewardModal && !showLevel4 && !showFeedback && (
          <div className="map-key-hint">
            Press 'M' to view World Map | Press 'F' for Feedback
          </div>
        )}

        {currentSpecialWorld === 'hemingway' && (
          <Level4Shooter 
            onComplete={handleHemingwayComplete}
            onExit={handleHemingwayExit}
          />
        )}

        {currentSpecialWorld === 'text_adventure' && (
          <TextAdventure 
            username={character?.username || 'traveler'}
            onComplete={handleTextAdventureComplete}
            onExit={handleTextAdventureExit}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GameWorld;