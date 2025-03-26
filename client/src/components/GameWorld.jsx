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
import { TILE_SIZE, MAPS, MAP_COLS, MAP_ROWS, isWalkable } from "./Constants";
import { initSounds, playRandomPortalSound, playSound, playMusicForCurrentWorld, setGlobalEffectsVolume, stopMusic, playMusic } from "../utils/soundEffects";
import { initMusicMixer, playMusicForWorld } from "../utils/musicMixer";
import { debugNPCSprites } from "../utils/debugTools";
import AudioControls from "./AudioControls";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";
import Level4Shooter from "./Level4Shooter";
import RewardModal from "./RewardModal";
import DialogBox from './DialogBox';
import TextAdventure from './TextAdventure';
import Level3Terminal from './Level3Terminal';
import ShakespeareDialog from "./Shakespeare";
import NPCDialog from "./NPCDialog";
import RewardDisplay from "./RewardDisplay";
import MapArtifactModal from "./MapArtifactModal";
import Terminal from "./Terminal";
import { useArtifacts } from "../hooks/useArtifacts";
import { INVENTORY_ARTIFACTS, EXPERIENCE_MESSAGES } from "../constants/GameData.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import gameProgressService from "../services/GameProgressService";
import { getAuthToken, saveGameProgress, getGameProgress } from "../utils/authUtils";
import Tile from "./Tile";
import ArtifactDetails from "./ArtifactDetails";
import NPCInteraction from "./NPCs/NPCInteraction";
import Notification from "./Notification";
import useSound from '../hooks/useSound';
import { mapData } from "../maps/mapData";

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
  const [showWelcomeBackNotification, setShowWelcomeBackNotification] = useState(false);
  const [welcomeBackMessage, setWelcomeBackMessage] = useState('');
  const [isPositionRestored, setIsPositionRestored] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ type: 'experience', reward: {} });

  // Function to adjust viewport based on character position
  const adjustViewport = useCallback((pos) => {
    // Get the dimensions of the current map
    const mapWidth = MAPS[currentMapIndex].data[0].length * TILE_SIZE;
    const mapHeight = MAPS[currentMapIndex].data.length * TILE_SIZE;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Center the character in the viewport
    const viewportX = Math.max(
      0,
      Math.min(pos.x - viewportWidth / 2, mapWidth - viewportWidth)
    );
    
    const viewportY = Math.max(
      0,
      Math.min(pos.y - viewportHeight / 2, mapHeight - viewportHeight)
    );
    
    setViewport({
      x: viewportX,
      y: viewportY
    });
  }, [currentMapIndex]);

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
  
  // Check for NPC collisions during character movement
  const handleCharacterMove = useCallback((newPosition) => {
    // First update the position
    setCharacterPosition(newPosition);
    
    // Then check for NPC collision at the new position
    setTimeout(() => {
      handleNPCInteraction();
    }, 100); // Small delay to ensure position is updated
    
    // Adjust viewport to center on character
    adjustViewport(newPosition);
  }, [handleNPCInteraction, adjustViewport]);
  
  // Close NPC dialog
  const handleCloseNPCDialog = useCallback(() => {
    setShowNPCDialog(false);
    setActiveNPC(null);
  }, []);

  // Function to handle artifact pickup
  const handleArtifactPickup = useCallback(() => {
    if (!characterPosition) {
      console.error("🚨 Character position is undefined!");
      return;
    }

    const { x, y } = {
      x: characterPosition.x / TILE_SIZE,
      y: characterPosition.y / TILE_SIZE,
    };

    console.log("📍 Checking for artifact at:", { x, y });

    // Check server artifacts
    const serverArtifact = artifacts && Array.isArray(artifacts) ? artifacts.find(
      artifact => artifact && artifact.location && 
      artifact.location.x === x && 
      artifact.location.y === y &&
      (!artifact.area || artifact.area === MAPS[currentMapIndex].name)
    ) : null;
    
    // Check map artifacts
    const mapArtifactIndex = MAPS[currentMapIndex].artifacts.findIndex(
      a => a?.location?.x === x && a?.location?.y === y && a.visible
    );
    
    // Prioritize server artifacts for pickup
    if (serverArtifact) {
      // Play pickup sound
      playSound('pickup', 0.5).catch(err => console.error("Error playing pickup sound:", err));
      
      console.log("✅ Picking Up Server Artifact:", serverArtifact);
      setInventory((prev) => [...prev, serverArtifact]);
      handleGainExperience(serverArtifact.exp || 0);
      removeArtifactFromMap(serverArtifact.id);
    } else if (mapArtifactIndex !== -1) {
      // Handle map-defined artifact
      const mapArtifact = MAPS[currentMapIndex].artifacts[mapArtifactIndex];
      
      // Play pickup sound
      playSound('pickup', 0.5).catch(err => console.error("Error playing pickup sound:", err));
      
      console.log("✅ Picking Up Map Artifact:", mapArtifact);
      setInventory((prev) => [...prev, mapArtifact]);
      handleGainExperience(mapArtifact.exp || 0);
      
      // Update the map artifact to be non-visible
      MAPS[currentMapIndex].artifacts[mapArtifactIndex].visible = false;
      
      // Persist this change to localStorage
      saveMapArtifactVisibilityToStorage(mapArtifact.id);
      
      // Force a re-render
      setCharacterPosition({...characterPosition});
    } else {
      console.warn("⚠️ No artifact found at this location.");
    }
  }, [characterPosition, artifacts, currentMapIndex]);
  
  // Get the character movement hook AFTER all dependent functions are defined
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
    adjustViewport
  );

  // Function to handle experience gain
  const handleGainExperience = async (points) => {
    if (!points || points <= 0) return;
    
    setCharacter((prev) => {
      if (!prev) {
        console.error("🚨 Character is missing!");
        return prev;
      }

      const updatedExperience = (prev.experience || 0) + points;
      const prevLevel = prev.level || 1;
      const newLevel = Math.floor(updatedExperience / 100) + 1;
      const didLevelUp = newLevel > prevLevel;
      
      const updatedCharacter = { 
        ...prev, 
        experience: updatedExperience,
        level: newLevel
      };
      
      // Show reward popup
      setRewardData({
        type: 'experience',
        reward: {
          amount: points,
          levelUp: didLevelUp,
          newLevel: newLevel
        }
      });
      setShowReward(true);
      
      if (updatedCharacter.id) {
        updateCharacter(updatedCharacter)
          .then(() => console.log("✅ XP Updated on Backend"))
          .catch((err) => console.error("❌ Failed to update XP:", err));
      }

      return updatedCharacter;
    });
  };

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
    // Load level completion status from localStorage
    try {
      const level1Completed = localStorage.getItem('level-level1-completed') === 'true';
      const level2Completed = localStorage.getItem('level-level2-completed') === 'true';
      const level3Completed = localStorage.getItem('level-level3-completed') === 'true';
      const level4Completed = localStorage.getItem('level-level4-completed') === 'true';
      
      setLevelCompletion({
        level1: level1Completed,
        level2: level2Completed,
        level3: level3Completed,
        level4: level4Completed
      });
      
      console.log("✅ Loaded level completion state:", { level1Completed, level2Completed, level3Completed, level4Completed });
    } catch (error) {
      console.error("❌ Error loading level completion state:", error);
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
        if (!storedUser || !storedUser.id) {
          console.warn("🚨 No user found in localStorage. Cannot fetch character.");
          // Create a minimal default character to avoid errors when not logged in
          setCharacter({
            level: 1,
            experience: 0,
            savedQuotes: [],
            qualifyingArtifacts: {},
            id: null
          });
          return;
        }

        // Check if token exists before making the API call
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("🚨 No authentication token found. Skip character fetch to avoid 401 errors.");
          setCharacter({
            level: 1,
            experience: 0,
            savedQuotes: [],
            qualifyingArtifacts: {},
            id: null
          });
          return;
        }

        const characterData = await fetchCharacter(storedUser.id);
        console.log("✅ Character Loaded:", characterData);
        if (characterData) {
          // Update the character state with the fetched data
          setCharacter(characterData);
          
          // Store username locally for quick access and consistency
          localStorage.setItem("remembered-username", characterData.username || storedUser.username || 'traveler');
          
          // Restore player position if they're returning
          try {
            const lastPositionData = localStorage.getItem('last-character-position');
            if (lastPositionData) {
              const parsedPositionData = JSON.parse(lastPositionData);
              
              // Only restore if it's a recent position (within 7 days)
              const lastTimestamp = new Date(parsedPositionData.timestamp);
              const now = new Date();
              const daysDiff = (now - lastTimestamp) / (1000 * 60 * 60 * 24);
              
              if (daysDiff <= 7) {
                // Set a small delay to ensure the character is loaded first
                setTimeout(() => {
                  // Update map index and position
                  setCurrentMapIndex(parsedPositionData.mapIndex);
                  setCharacterPosition(parsedPositionData.position);
                  
                  // Set position restored flag to trigger animation
                  setIsPositionRestored(true);
                  
                  // Reset the flag after animation completes
                  setTimeout(() => {
                    setIsPositionRestored(false);
                  }, 3000);
                  
                  // Add a position restoration message
                  setWelcomeBackMessage(prev => 
                    `${prev} You've been placed exactly where you left off in ${MAPS[parsedPositionData.mapIndex].name}.`
                  );
                }, 500);
              }
            }
          } catch (error) {
            console.error("❌ Error restoring character position:", error);
          }
          
          // Check if this is a returning visit after some time away
          const lastActivity = localStorage.getItem('last-activity-date');
          const now = new Date();
          
          if (lastActivity) {
            const lastDate = new Date(lastActivity);
            const hoursDiff = Math.abs(now - lastDate) / 36e5; // Convert to hours
            
            if (hoursDiff > 8) {
              const message = `Welcome back! It's been ${Math.floor(hoursDiff)} hours since your last visit. Your progress has been preserved.`;
              setWelcomeBackMessage(message);
              setShowWelcomeBackNotification(true);
              
              // Auto-dismiss after 6 seconds
              setTimeout(() => {
                setShowWelcomeBackNotification(false);
              }, 6000);
            }
          }
          
          // Update the last activity timestamp
          localStorage.setItem('last-activity-date', now.toISOString());
        } else {
          // Fallback to default character if API returns nothing
          setCharacter({
            level: 1,
            experience: 0,
            savedQuotes: [],
            qualifyingArtifacts: {},
            id: null
          });
        }
      } catch (err) {
        console.error("❌ Failed to load character:", err);
        // Set a default character to avoid UI errors
        setCharacter({
          level: 1,
          experience: 0,
          savedQuotes: [],
          qualifyingArtifacts: {},
          id: null
        });
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
      
      // Only in development mode
      if (process.env.NODE_ENV === 'development') {
        // Shift + 1 to trigger level 1 completion for testing
        if (event.shiftKey && event.key === '1') {
          console.log("🛠️ DEV: Manually triggering Level 1 completion");
          handleLevelCompletion('level1');
        }
        
        // Shift + 0 to reset level completion for testing
        if (event.shiftKey && event.key === '0') {
          console.log("🛠️ DEV: Resetting level completion and rewards state");
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
      
      // Toggle world map with 'M' key
      if (event.key === 'm' || event.key === 'M') {
        setShowWorldMap(prev => !prev);
        
        // Play a sound when toggling the map
        playSound('pickup', 0.3).catch(err => console.error("Error playing sound:", err));
      }

      // Toggle feedback form with 'F' key
      if (event.key === 'f' || event.key === 'F') {
        setShowFeedback(prev => !prev);
        
        // Play a sound when toggling the feedback form
        playSound('pickup', 0.3).catch(err => console.error("Error playing sound:", err));
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
    // Initialize sound effects and music mixer when component mounts
    initSounds();
    initMusicMixer();
    
    // Play the appropriate music for the current world
    const currentMapName = MAPS[currentMapIndex].name;
    let worldTheme = 'Overworld';
    
    // Determine the appropriate theme based on the map name
    if (currentMapName.includes('Yosemite')) {
      worldTheme = 'Yosemite';
    } else if (currentMapName.includes('Terminal') || currentMapName.includes('Dungeon')) {
      worldTheme = 'Terminal';
    } else if (currentMapName.includes('Hemingway')) {
      worldTheme = 'Hemingway';
    } else if (currentMapName.includes('TextAdventure')) {
      worldTheme = 'TextAdventure';
    }
    
    // Play the corresponding music
    playMusicForWorld(worldTheme);
    
    // In development mode, run NPC sprite debug to help identify issues
    if (process.env.NODE_ENV === 'development') {
      // Wait a bit to ensure DOM is fully loaded
      setTimeout(() => {
        debugNPCSprites();
      }, 2000);
    }
    
    // Cleanup function to stop music when component unmounts
    return () => {
      // The music mixer's stopAllMusic function will be called automatically
    };
  }, []);

  // Add sound volume handler for the AudioControls component
  const handleEffectsVolumeChange = useCallback((volume) => {
    setGlobalEffectsVolume(volume);
  }, []);

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

  const removeArtifactFromMap = (artifactId) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
  };

  const handleUpdateArtifact = (updatedArtifact) => {
    if (!updatedArtifact || !updatedArtifact.id) {
      console.error("🚨 Invalid artifact update: Missing id!", updatedArtifact);
      return;
    }

    setInventory((prevInventory) => {
      const exists = prevInventory.some((artifact) => artifact.id === updatedArtifact.id);
      if (!exists) {
        console.warn("⚠️ Artifact not found in inventory:", updatedArtifact.id);
      } else {
        console.log("🔄 Updating artifact in inventory:", updatedArtifact);
      }

      return prevInventory.map((artifact) =>
        artifact.id === updatedArtifact.id ? updatedArtifact : artifact
      );
    });
  };

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
        spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE };
      }
      // Add return paths
      else if (currentMapName === "Desert 1" && col < 3) {
        // Left side of Desert 1 returns to Overworld 3
        destinationMap = "Overworld 3";
        spawnPosition = { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE };
      }
      else if (currentMapName === "Dungeon 1" && col < 3) {
        // Left side of Dungeon 1 returns to Desert 3
        destinationMap = "Desert 3";
        spawnPosition = { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE };
      }
      else if (currentMapName === "Yosemite" && col < 3) {
        // Left side of Yosemite returns to Dungeon 3
        destinationMap = "Dungeon 3";
        spawnPosition = { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE };
      }
      
      // Find the index of the destination map
      const destinationIndex = MAPS.findIndex(map => map.name === destinationMap);
      
      if (destinationIndex !== -1) {
        // Play random portal sound (30% chance of toilet flush)
        playRandomPortalSound().catch(err => console.error("Error playing portal sound:", err));
        
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
          // Stop the 3HWV music immediately upon entering Yosemite
          stopMusic();
          
          // Play level complete sound first
          playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
          
          // Add slight delay to show portal transition first and let the sound play
          setTimeout(() => {
            // Set level 1 as completed via the normal handler
            handleLevelCompletion('level1', true); // Pass true to indicate we're coming from a portal
          }, 1000);
        }
      }
    }
    
    // Check if we've visited Yosemite, which unlocks special portals everywhere
    const visitedYosemite = localStorage.getItem('visited-yosemite') === 'true';
    
    // Special portals - can be accessed from any map after visiting Yosemite or directly in Yosemite
    // Level3Terminal Portal (code 7)
    if (MAPS[currentMapIndex].data[row][col] === 7 && (visitedYosemite || MAPS[currentMapIndex].name === "Yosemite")) {
      // Load the Level3Terminal experience
      playRandomPortalSound().catch(err => console.error("Error playing portal sound:", err));
      
      // Allow access to Terminal Void
      console.log("🖥️ Entering Terminal Void portal");
      setCurrentSpecialWorld('terminal');
    }
    
    // Level4Shooter Portal (code 6)
    if (MAPS[currentMapIndex].data[row][col] === 6 && (visitedYosemite || MAPS[currentMapIndex].name === "Yosemite")) {
      playRandomPortalSound().catch(err => console.error("Error playing portal sound:", err));
      
      // Allow access to Hemingway Challenge
      console.log("🖥️ Entering Hemingway Challenge portal");
      setCurrentSpecialWorld('hemingway');
    }
    
    // TextAdventure Portal (code 9)
    if (MAPS[currentMapIndex].data[row][col] === 9 && (visitedYosemite || MAPS[currentMapIndex].name === "Yosemite")) {
      playRandomPortalSound().catch(err => console.error("Error playing portal sound:", err));
      
      // Allow access to Text Adventure
      console.log("📚 Entering Text Adventure portal");
      setCurrentSpecialWorld('text_adventure');
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

  const handleLevelCompletion = (level, isComingFromPortal = false) => {
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
        
        // If we're not coming from a portal transition, handle sounds
        if (!isComingFromPortal) {
          // Stop the current music (which should be 3HWV in most cases)
          stopMusic(); 
          
          // Play level complete sound
          playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
        }
        
        // Play Yosemite theme after a short delay
        setTimeout(() => {
          playMusic('yosemiteTheme', 0.3, true); // Play Yosemite theme
        }, isComingFromPortal ? 500 : 1500);
        
        // Show the NKD Man Extension reward after the win notification closes
        setTimeout(() => {
          // Check if we've already shown this reward by checking localStorage
          const rewardShown = localStorage.getItem('nkd-man-reward-shown');
          if (!rewardShown) {
            setCurrentAchievement('level1');
            setShowRewardModal(true);
            // Play level completion music when reward modal is shown
            playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
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
        // Play level complete sound
        playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
        break;
      case 'level3':
        message = 'Extraordinary! You have completed Level 3 - The Terminal Void!';
        // Play level complete sound
        playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
        setTimeout(() => {
          const goToLevel4 = window.confirm('You have unlocked Level 4: The Hemingway Challenge! Ready to enter?');
          if (goToLevel4) {
            // Play random portal sound with a slightly higher chance (5%) of toilet flush for Level 4 special portal
            playRandomPortalSound(0.05).catch(err => console.error("Error playing portal sound:", err));
            setShowLevel4(true);
          }
        }, 3000);
        break;
      case 'level4':
        message = 'Amazing! You have completed Level 4 - The Hemingway Challenge!';
        // Play level complete sound
        playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
        break;
      default:
        message = 'Level completed!';
        // Play level complete sound
        playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
    }
    
    handleGainExperience(level === 'level3' ? 20 : level === 'level4' ? 30 : 10);
    
    setWinMessage(message);
    setShowWinNotification(true);
    
    setTimeout(() => {
      setShowWinNotification(false);
    }, 5000);

    if (isComingFromPortal) {
      // Additional logic for coming from a portal
      // This is a placeholder and should be replaced with actual implementation
      console.log("🏞️ Coming from a portal");
    }
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

  // Add a handler for the Terminal experience
  const handleTerminalComplete = () => {
    handleLevelCompletion('level3');
    setCurrentSpecialWorld(null);
  };
  
  const handleTerminalExit = () => {
    setCurrentSpecialWorld(null);
  };

  // Existing handlers for other special worlds
  const handleHemingwayComplete = () => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed Hemingway\'s Adventure');
    setShowRewardModal(true);
    // Play level completion music when reward modal is shown
    playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
  };

  const handleHemingwayExit = () => {
    setCurrentSpecialWorld(null);
  };

  const handleTextAdventureComplete = () => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed The Writer\'s Journey');
    setShowRewardModal(true);
    // Play level completion music when reward modal is shown
    playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
  };

  const handleTextAdventureExit = () => {
    setCurrentSpecialWorld(null);
  };

  useEffect(() => {
    // Save character position to localStorage whenever it changes
    try {
      // Save both the current map and position
      const positionData = {
        mapIndex: currentMapIndex,
        position: characterPosition,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('last-character-position', JSON.stringify(positionData));
    } catch (error) {
      console.error("❌ Error saving character position:", error);
    }
  }, [characterPosition, currentMapIndex, artifacts]);

  // Update map index and adjust level if needed
  useEffect(() => {
    if (currentMapIndex >= 0 && currentMapIndex < MAPS.length) {
      console.log(`🗺️ Switched to map: ${MAPS[currentMapIndex].name}`);
      
      // Play appropriate music for the current map
      const currentMapName = MAPS[currentMapIndex].name;
      
      // Special case for Yosemite - always play Yosemite music when entering
      if (currentMapName === "Yosemite") {
        console.log("🏞️ Entered Yosemite area - playing Yosemite theme");
        // Make sure any currently playing music (like 3HWV) is stopped
        stopMusic(); 
        
        // Add a small delay before playing the new music to ensure clean transition
        setTimeout(() => {
          playMusic('yosemiteTheme', 0.3, true); // Play Yosemite theme
        }, 100);
        
        // Mark that we've been to Yosemite (unlock portals)
        try {
          localStorage.setItem('visited-yosemite', 'true');
        } catch (error) {
          console.error("Error saving Yosemite visit status:", error);
        }
      } else {
        // For all other maps, play the appropriate music
        playMusicForCurrentWorld(currentMapName);
      }
    }
  }, [currentMapIndex]);

  // Load level completion status from localStorage
  const loadLevelCompletionStatus = () => {
    const level1Completed = getGameProgress('level-level1-completed') === 'true';
    const level2Completed = getGameProgress('level-level2-completed') === 'true';
    const level3Completed = getGameProgress('level-level3-completed') === 'true';
    const level4Completed = getGameProgress('level-level4-completed') === 'true';
    
    return { level1Completed, level2Completed, level3Completed, level4Completed };
  };

  // Update character position
  const fetchCharacterData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No authentication token found. Cannot fetch character data.");
        return null;
      }
      
      // Look for stored user data
      const userData = gameProgressService.userData;
      if (!userData || !userData.id) {
        console.warn("No user data found. Cannot fetch character data.");
        return null;
      }
      
      // Make API request to get character data
      const response = await API.get(`/api/users/${userData.id}`);
      
      // Return character data
      return response.data;
    } catch (error) {
      console.error("Error fetching character data:", error);
      return null;
    }
  };

  // Record level completion
  const recordLevelCompletion = (level) => {
    try {
      // Save level completion to localStorage so we don't show rewards again
      saveGameProgress(`level-${level}-completed`, 'true');
      
      // Also update XP in the game progress service
      gameProgressService.addExperience(level * 50); // Award XP based on level
      
      return true;
    } catch (error) {
      console.error("Error saving level completion:", error);
      return false;
    }
  };

  // In the useEffect for initialization
  useEffect(() => {
    // Initialize the game progress service with user data
    const initGameProgress = async () => {
      const characterData = await fetchCharacterData();
      if (characterData) {
        gameProgressService.init(characterData);
        // Rest of your initialization code...
      }
    };
    
    initGameProgress();
    
    // Rest of your useEffect...
  }, []);

  // In your artifact collection code
  const collectArtifact = (artifact) => {
    // Add to inventory using the game progress service
    gameProgressService.addToInventory(artifact);
    
    // Rest of your collection code...
  };

  // Update the saveQuoteToCollection function to show rewards
  const saveQuoteToCollection = useCallback(() => {
    if (!character?.id) {
      console.warn("Cannot save quote: User not authenticated");
      return;
    }
    
    // Get the current quote from the active NPC's dialog
    let quoteToSave = "";
    
    if (activeNPC?.type === NPC_TYPES.GUIDE && activeNPC?.apiType === 'shakespeare') {
      // If the NPC is Shakespeare, get the quote from the dialog
      quoteToSave = selectedResponse?.response || "To be, or not to be, that is the question.";
    } else {
      // Generic quote if no specific one is found
      quoteToSave = "A mysterious quote from the journeys through the Authentic Internet.";
    }
    
    // Ensure quote is not empty
    if (!quoteToSave.trim()) {
      console.error("Cannot save empty quote");
      return;
    }
    
    // Create quote object
    const newQuote = {
      id: Math.random().toString(36).substring(2, 15),
      text: quoteToSave,
      source: activeNPC?.name || "Unknown",
      timestamp: new Date().toISOString(),
      location: MAPS[currentMapIndex].name
    };
    
    // Save to local storage first
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '[]');
    savedQuotes.push(newQuote);
    localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
    
    // Then update on the server if authenticated
    if (character?.id) {
      gameProgressService.saveQuote(newQuote)
        .then(() => {
          console.log("Quote saved successfully!");
          
          // Show reward popup for quote acquisition
          setRewardData({
            type: 'quote',
            reward: newQuote
          });
          setShowReward(true);
        })
        .catch(error => {
          console.error("Error saving quote:", error);
        });
    }
    
    console.log("Quote saved:", newQuote);
  }, [activeNPC, character, currentMapIndex, selectedResponse]);

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
              levelCompletion={levelCompletion}
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
              className={isPositionRestored ? 'position-restored' : ''}
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
          </div>
        </div>
        
        {/* Reward Modal */}
        {showRewardModal && (
          <RewardModal 
            visible={showRewardModal}
            onClose={() => setShowRewardModal(false)}
            achievement={currentAchievement}
          />
        )}

        {showNPCDialog && activeNPC && (
          <NPCDialog
            isOpen={showNPCDialog}
            onClose={handleCloseNPCDialog}
            npc={activeNPC}
            onResponseSelect={(response) => setSelectedResponse(response)}
            onInteract={(callbackName) => {
              // Handle special NPC callbacks
              if (callbackName === 'unlockLevel') {
                setLevelCompletion(prev => ({
                  ...prev,
                  [activeNPC.unlockLevel]: true
                }));
                recordLevelCompletion(activeNPC.unlockLevel);
              } else if (callbackName === 'grantAchievement' && activeNPC.achievement) {
                gameProgressService.completeAchievement(activeNPC.achievement);
                setCurrentAchievement(activeNPC.achievement);
                setShowRewardModal(true);
              } else if (callbackName === 'saveQuote') {
                // Save the currently displayed quote
                saveQuoteToCollection();
              }
            }}
            character={character}
          />
        )}

        {/* Reward Display */}
        {showReward && (
          <RewardDisplay
            visible={showReward}
            type={rewardData.type}
            reward={rewardData.reward}
            onClose={() => setShowReward(false)}
            autoCloseTime={5000}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GameWorld;