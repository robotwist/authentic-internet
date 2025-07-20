import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter,
  updateArtifact,
  deleteArtifact,
  updateUserExperience,
  addUserAchievement
} from "../api/api";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import Map from "./Map";
import WorldMap from "./WorldMap";
import FeedbackForm from "./FeedbackForm";
import { useCharacterMovement } from "./CharacterMovement";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, isWalkable } from "./Constants";
import { MAPS } from "./GameData";
import { debugNPCSprites } from "../utils/debugTools";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";
import RewardModal from "./RewardModal";
import DialogBox from './DialogBox';
import TextAdventure from './TextAdventure';
import SoundManager from "./utils/SoundManager";
import UserArtifactManager from './UserArtifactManager';
import ArtifactDiscovery from './ArtifactDiscovery';
import XPNotification from './XPNotification';
import AchievementNotification from './AchievementNotification';
import Level3Terminal from './Level3Terminal';
import Level4Shooter from './Level4Shooter';
import HemingwayChallenge from './HemingwayChallenge';
import NPCInteraction from './NPCs/NPCInteraction';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import { useGameState } from '../context/GameStateContext';
import gameStateManager from "../utils/gameStateManager";
import { IconButton } from '@mui/material';

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
  const [selectedUserArtifact, setSelectedUserArtifact] = useState(null);
  const [isPlacingArtifact, setIsPlacingArtifact] = useState(false);
  const [viewedArtifacts, setViewedArtifacts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [achievementNotification, setAchievementNotification] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [xpNotifications, setXpNotifications] = useState([]);
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showArtifactsOnMap, setShowArtifactsOnMap] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState('down');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [characterStyle, setCharacterStyle] = useState({
    left: 64,
    top: 64,
    width: TILE_SIZE,
    height: TILE_SIZE,
    transition: 'left 0.2s, top 0.2s'
  });
  const [movementTransition, setMovementTransition] = useState(null);
  const [verticalDirection, setVerticalDirection] = useState(null);
  const [horizontalDirection, setHorizontalDirection] = useState(null);
  const { user, updateUser } = useAuth();
  const { unlockAchievement, checkLevelAchievements, checkDiscoveryAchievements, checkCollectionAchievements } = useAchievements();
  const { updateGameProgress } = useGameState();
  const gameWorldRef = useRef(null);
  const characterRef = useRef(null);
  
  // Portal transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [portalNotificationActive, setPortalNotificationActive] = useState(false);
  const [activePortal, setActivePortal] = useState(null);
  const [databaseNPCs, setDatabaseNPCs] = useState([]);
  
  // Portal configuration
  const PORTAL_CONFIG = {
    // Regular progression portals (type 5)
    progression: {
      "Overworld": { destination: "Overworld 2", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Overworld 2": { destination: "Overworld 3", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Overworld 3": { 
        destination: "Yosemite", 
        spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        condition: (x, y) => x === 8 && y === 1 // Special Yosemite portal
      },
      "Desert 1": { destination: "Desert 2", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Desert 2": { destination: "Desert 3", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Desert 3": { destination: "Dungeon Level 1", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Dungeon Level 1": { destination: "Dungeon Level 2", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Dungeon Level 2": { destination: "Dungeon Level 3", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } },
      "Dungeon Level 3": { destination: "Yosemite", spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE } }
    },
    // Yosemite return portal
    yosemiteReturn: {
      destination: "Overworld 3",
      spawnPosition: { x: 8 * TILE_SIZE, y: 2 * TILE_SIZE }
    },
    // Special portals in Yosemite
    special: {
      6: { type: "terminal", title: "Terminal Challenge", message: "Press SPACE to enter the Terminal Challenge" },
      7: { type: "shooter", title: "Arcade Shooter", message: "Press SPACE to enter the Arcade Shooter" },
      8: { type: "text_adventure", title: "Text Adventure", message: "Press SPACE to enter the Text Adventure" }
    }
  };

  // Handle portal transitions
  const handlePortalTransition = useCallback((destinationMap, spawnPosition, isSpecial = false) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Play portal sound
    if (soundManager) {
      soundManager.playSound('portal');
    }
    
    // Add portal transition animation
    const gameWorld = document.querySelector('.game-world');
    if (gameWorld) {
      gameWorld.classList.add('portal-transition');
    }
    
    // Wait for animation to complete
    setTimeout(() => {
      if (isSpecial) {
        // Handle special world transition
        setCurrentSpecialWorld(destinationMap);
      } else {
        // Handle regular map transition
        const destinationIndex = MAPS.findIndex(map => map.name === destinationMap);
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition(spawnPosition);
          
          // Show world announcement
          showWorldAnnouncement(destinationMap);
          
          // Handle level completion for Yosemite
          if (destinationMap === "Yosemite") {
            setTimeout(() => {
              handleLevelCompletion('level1');
            }, 800);
          }
        } else {
          console.error(`Destination map "${destinationMap}" not found`);
        }
      }
      
      // Remove transition animation
      if (gameWorld) {
        gameWorld.classList.remove('portal-transition');
      }
      
      setIsTransitioning(false);
      setActivePortal(null);
      setPortalNotificationActive(false);
      hidePortalNotification();
    }, 1000);
  }, [isTransitioning, soundManager, setCurrentSpecialWorld, handleLevelCompletion, showWorldAnnouncement]);

  // Show world announcement
  const showWorldAnnouncement = useCallback((worldName) => {
    const announcement = document.createElement('div');
    announcement.className = 'world-announcement';
    announcement.innerHTML = `<h2>Welcome to ${worldName}</h2>`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      announcement.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }, 3000);
  }, []);

  // Portal collision detection
  useEffect(() => {
    if (!characterPosition || isTransitioning) return;
    
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    const currentMapName = MAPS[currentMapIndex]?.name || '';
    const tileType = MAPS[currentMapIndex]?.data?.[row]?.[col];
    
    // Handle regular portals (type 5)
    if (tileType === 5) {
      if (currentMapName === "Yosemite") {
        // Yosemite return portal
        if (!portalNotificationActive) {
          showPortalNotification('Return to Overworld 3', 'Press SPACE to return to Overworld 3');
          setPortalNotificationActive(true);
          setActivePortal({ type: 'yosemiteReturn', x: col, y: row });
        }
      } else {
        // Regular progression portal
        const config = PORTAL_CONFIG.progression[currentMapName];
        if (config) {
          const portalX = col;
          const portalY = row;
          
          // Check if portal condition is met (if any)
          if (!config.condition || config.condition(portalX, portalY)) {
            // Save checkpoint
            gameStateManager.saveCheckpoint(currentMapName, { ...characterPosition });
            
            // Handle transition
            handlePortalTransition(config.destination, config.spawnPosition);
          }
        }
      }
    }
    
    // Handle special portals in Yosemite
    if (currentMapName === "Yosemite" && tileType >= 6 && tileType <= 8) {
      const specialConfig = PORTAL_CONFIG.special[tileType];
      if (specialConfig && !portalNotificationActive) {
        showPortalNotification(specialConfig.title, specialConfig.message);
        setPortalNotificationActive(true);
        setActivePortal({ type: 'special', tileType, x: col, y: row });
      }
    }
    
    // Clear portal notification when not on a portal
    if (tileType !== 5 && (tileType < 6 || tileType > 8)) {
      if (portalNotificationActive) {
        hidePortalNotification();
        setPortalNotificationActive(false);
        setActivePortal(null);
      }
    }
  }, [characterPosition, currentMapIndex, isTransitioning, portalNotificationActive, handlePortalTransition, showWorldAnnouncement, gameStateManager]);

  // Handle portal activation (space key)
  useEffect(() => {
    if (!activePortal || isTransitioning) return;
    
    const handlePortalActivation = (e) => {
      if (e.code !== 'Space') return;
      
      e.preventDefault();
      
      if (activePortal.type === 'yosemiteReturn') {
        handlePortalTransition(
          PORTAL_CONFIG.yosemiteReturn.destination,
          PORTAL_CONFIG.yosemiteReturn.spawnPosition
        );
      } else if (activePortal.type === 'special') {
        const specialConfig = PORTAL_CONFIG.special[activePortal.tileType];
        if (specialConfig) {
          // Stop music for special worlds
          if (soundManager) {
            soundManager.stopMusic(true);
          }
          handlePortalTransition(specialConfig.type, null, true);
        }
      }
    };
    
    window.addEventListener('keydown', handlePortalActivation);
    
    return () => {
      window.removeEventListener('keydown', handlePortalActivation);
    };
  }, [activePortal, isTransitioning, handlePortalTransition, soundManager]);

  // Update checkForLevelUpAchievements to use our context
  const checkForLevelUpAchievements = useCallback((experience) => {
    const level = Math.floor(experience / 100) + 1;
    checkLevelAchievements(level);
  }, [checkLevelAchievements]);

  // Function to add XP and show notification  
  const addExperiencePoints = useCallback((amount, reason) => {
    // Update local experience state
    const newExperience = (user?.experience || 0) + amount;
    
    // Create a unique ID for this notification
    const notificationId = Date.now().toString();
    
    // Add the notification to state
    setXpNotifications(prev => [
      ...prev,
      { id: notificationId, amount, reason }
    ]);
    
    // Update user context
    if (user) {
      const updatedUser = { ...user, experience: newExperience };
      updateUser(updatedUser);
      
      // Also update in database if user is logged in
      try {
        updateUserExperience(newExperience).catch(err => 
          console.error('Failed to update experience in database:', err)
        );
      } catch (error) {
        console.error('Error updating experience:', error);
      }
    }
    
    // Check for level-up achievements
    checkForLevelUpAchievements(newExperience);
    
    return notificationId;
  }, [user, updateUser, setXpNotifications, checkForLevelUpAchievements]);

  // Award XP and show notification - moved up to avoid TDZ issues
  const awardXP = useCallback((amount, reason) => {
    // Use our new addExperiencePoints function
    return addExperiencePoints(amount, reason);
  }, [addExperiencePoints]);

  // Function to handle updating character in both state and backend
  const handleUpdateCharacter = useCallback((updatedCharacter) => {
    if (!updatedCharacter) return;
    
    // Update local state
    setCharacter(updatedCharacter);
    
    // Update backend if character has an ID
    if (updatedCharacter.id) {
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ Character updated in backend"))
        .catch(err => console.error("❌ Failed to update character:", err));
    } else {
      console.warn("🚨 Character ID missing. Cannot update backend.");
    }
  }, []);

  // Function to show inventory - moved to the top of component to avoid temporal dead zone
  const handleShowInventory = useCallback(() => {
    console.log("Event: showInventory triggered");
    setShowInventory(true);
  }, []);

  // Function to show quotes - moved to the top of component to avoid temporal dead zone
  const handleShowQuotes = useCallback(() => {
    setShowQuotes(true);
  }, []);

  // Function to handle level completion - moved to the top of component to avoid temporal dead zone
  const handleLevelCompletion = useCallback((level) => {
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
    
    // Create level completion artifact
    const createLevelArtifact = async () => {
      const levelArtifacts = {
        level1: {
          id: `level1-trophy-${Date.now()}`,
          name: "Digital Wilderness Trophy",
          description: "A crystalline trophy commemorating your conquest of the Digital Wilderness",
          type: "TROPHY",
          content: "This artifact pulses with digital energy, a testament to your mastery of the first level. It contains fragments of the wilderness's code and echoes of the challenges you overcame.",
          media: ["/assets/artifacts/digital_wilderness_trophy.png"],
          location: { x: 0, y: 0, mapName: "level-completion" },
          exp: 25,
          visible: true,
          area: "level-completion",
          interactions: [
            {
              type: "REVEAL",
              condition: "Level 1 completion",
              revealedContent: "The trophy resonates with your digital mastery...",
              action: "Unlock digital powers"
            }
          ],
          properties: {
            digitalMastery: 10,
            wildernessKnowledge: 5,
            element: "digital"
          },
          userModifiable: {
            description: true,
            content: true,
            properties: ["digitalMastery", "wildernessKnowledge", "element"]
          },
          createdBy: "system",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ["trophy", "digital", "wilderness", "level1"],
          rating: 0,
          reviews: [],
          remixOf: null
        },
        level2: {
          id: `level2-medallion-${Date.now()}`,
          name: "Shadow Realm Medallion",
          description: "A dark medallion that absorbs light, symbolizing your triumph over shadows",
          type: "MEDALLION",
          content: "The medallion seems to contain swirling shadows within its depths. It whispers secrets of the shadow realm and grants insight into hidden truths.",
          media: ["/assets/artifacts/shadow_realm_medallion.png"],
          location: { x: 0, y: 0, mapName: "level-completion" },
          exp: 30,
          visible: true,
          area: "level-completion",
          interactions: [
            {
              type: "REVEAL",
              condition: "Level 2 completion",
              revealedContent: "The medallion grants you shadow affinity...",
              action: "Unlock shadow powers"
            }
          ],
          properties: {
            shadowAffinity: 15,
            stealthMastery: 8,
            element: "shadow"
          },
          userModifiable: {
            description: true,
            content: true,
            properties: ["shadowAffinity", "stealthMastery", "element"]
          },
          createdBy: "system",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ["medallion", "shadow", "stealth", "level2"],
          rating: 0,
          reviews: [],
          remixOf: null
        }
      };
      
      const artifactData = levelArtifacts[level];
      if (artifactData) {
        try {
          await createArtifact(artifactData);
          console.log(`✅ Level ${level} completion artifact created`);
        } catch (error) {
          console.error(`❌ Failed to create level ${level} completion artifact:`, error);
        }
      }
    };
    
    createLevelArtifact();
  }, [levelCompletion]);

  // Handle NPC click - moved here to avoid temporal dead zone
  const handleNPCClick = useCallback((npc) => {
    console.log("NPC clicked:", npc.name);
    setActiveNPC(npc);
    setShowNPCDialog(true);
    
    // Play interaction sound if available
    if (soundManager) {
      soundManager.playSound('interact');
    }
    
    return true; // Interaction happened
  }, [soundManager]);

  useEffect(() => {
    // Check if MAPS is correctly loaded
    if (!Array.isArray(MAPS) || MAPS.length === 0) {
      console.error("❌ Error: MAPS data is missing or invalid", MAPS);
    }
  }, []);

  useEffect(() => {
    // Load and apply saved artifact visibility state
    applyMapArtifactVisibilityFromStorage();
    
    // Only fetch artifacts if we haven't loaded them already
    if (!artifacts || artifacts.length === 0) {
      console.log("📦 Loading artifacts from server...");
      
      fetchArtifacts()
        .then((data) => {
          console.log("📦 Loaded Artifacts:", data ? data.length : 0);
          // Filter out any server artifacts that duplicate artifacts already defined in MAPS
          const mapArtifacts = Array.isArray(MAPS) 
            ? MAPS.flatMap(map => (map.artifacts || []).map(art => art.name))
            : [];
          const filteredServerArtifacts = data.filter(serverArt => 
            !mapArtifacts.includes(serverArt.name) || 
            !serverArt.location // Include artifacts without location (inventory items)
          );
          setArtifacts(filteredServerArtifacts);
        })
        .catch((error) => {
          console.error("❌ Error fetching artifacts:", error);
          // Don't reset artifacts array if there's an error to prevent constant refetching
        });
    }

    // Fetch NPCs from database
    const fetchNPCs = async () => {
      try {
        console.log("👥 Loading NPCs from server...");
        const response = await fetch('/api/npcs');
        const data = await response.json();
        
        if (data.success) {
          console.log("👥 Loaded NPCs:", data.npcs.length);
          setDatabaseNPCs(data.npcs);
        } else {
          console.error("❌ Error fetching NPCs:", data.message);
        }
      } catch (error) {
        console.error("❌ Error fetching NPCs:", error);
      }
    };

    fetchNPCs();
  }, []); // Empty dependency array - only fetch artifacts once on mount

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
    // Add development keyboard shortcuts for testing
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      
      // Handle inventory toggle with 'i' key
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        console.log("Key 'i' pressed, toggling inventory");
        if(character && artifacts) {
            setShowInventory(prev => !prev);
        } else {
            console.warn("Cannot open inventory: Character or artifacts not loaded yet.");
        }
        return;
      }
      
      // Handle NPC interaction with 't' key
      if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        console.log("Key 'T' pressed, attempting NPC interaction");
        
        // Find nearby NPCs from database
        const currentMapName = MAPS[currentMapIndex]?.name || 'Unknown';
        const nearbyNPC = databaseNPCs.find(npc => {
          if (!npc || !npc.position || npc.area !== currentMapName) return false;
          
          const distance = Math.sqrt(
            Math.pow(characterPosition.x - npc.position.x * TILE_SIZE, 2) + 
            Math.pow(characterPosition.y - npc.position.y * TILE_SIZE, 2)
          );
          
          // NPC is nearby if within 2 tiles
          return distance <= TILE_SIZE * 2;
        });
        
        if (nearbyNPC) {
          console.log("Found nearby NPC:", nearbyNPC.name, "ID:", nearbyNPC._id);
          handleNPCClick(nearbyNPC);
        } else {
          console.log("No NPCs nearby in", currentMapName);
        }
        return;
      }
      
      // Toggle world map with 'm' key
      if (event.key === 'm' || event.key === 'M') {
        setShowWorldMap(prev => !prev);
      }

      // Toggle feedback form with 'f' key
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

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('showInventory', handleShowInventory);
      window.removeEventListener('showQuotes', handleShowQuotes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleShowInventory, handleShowQuotes, handleLevelCompletion, character, artifacts, handleNPCClick, characterPosition, currentMapIndex, databaseNPCs]);

  useEffect(() => {
    // Initialize sound manager
    const initSoundManager = async () => {
      try {
        // Skip if already initialized
        if (soundManager) {
          console.log("🔊 Sound manager already initialized");
          
          // Just update the music based on the current map
          const currentMapName = MAPS[currentMapIndex]?.name || '';
          
          // Always stop current music before starting new map music
          // This ensures clean transitions between map themes
          soundManager.stopMusic(true);
          
          // Play the appropriate music for the current map
          if (currentMapName === 'Yosemite') {
            console.log("🎵 Playing Yosemite music");
            soundManager.stopMusic(true); // Stop any existing music first
            setTimeout(() => {
              soundManager.playMusic('yosemite', true, 0.3);
              console.log("🎵 Yosemite music started");
            }, 500);
          } else if (currentMapName.includes('Overworld')) {
            console.log("🎵 Playing Overworld music");
            soundManager.stopMusic(true); // Stop any existing music first
            setTimeout(() => soundManager.playMusic('overworld', true, 0.3), 500);
          } else if (currentMapName.includes('Dungeon')) {
            console.log("🎵 Playing Dungeon music");
            soundManager.stopMusic(true); // Stop any existing music first
            setTimeout(() => soundManager.playMusic('terminal', true, 0.3), 500);
          }
          
          return;
        }
        
        console.log("🔊 Initializing sound manager...");
        const manager = SoundManager.getInstance();
        
        try {
          await manager.initialize();
          setSoundManager(manager);
          
          // Load discovery sound
          await manager.loadSound('discovery', '/assets/sounds/discovery.mp3');
          
          // Start playing the main theme based on current map
          const currentMapName = MAPS[currentMapIndex]?.name || '';
          if (currentMapName === 'Yosemite') {
            manager.playMusic('yosemite', true);
          } else if (currentMapName.includes('Overworld')) {
            manager.playMusic('overworld', true);
          } else if (currentMapName.includes('Dungeon')) {
            manager.playMusic('terminal', true);
          }
        } catch (soundError) {
          // Catch errors during sound initialization to prevent app crashes
          console.error("🔇 Error initializing sound manager:", soundError);
          // Set the manager anyway so we don't keep trying to initialize
          setSoundManager(manager);
        }
      } catch (error) {
        console.error("🔇 Critical error in sound initialization:", error);
        // Don't throw - just log the error to prevent app crash
      }
    };
    
    initSoundManager();
  }, [currentMapIndex, soundManager]); // Only reinitialize when map changes or if soundManager changes

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

  const adjustViewport = useCallback((position) => {
    if (!position || !MAPS[currentMapIndex]?.data) return;

    const mapWidth = MAPS[currentMapIndex].data[0].length * TILE_SIZE;
    const mapHeight = MAPS[currentMapIndex].data.length * TILE_SIZE;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const viewportX = Math.max(
      0,
      Math.min(position.x - viewportWidth / 2, mapWidth - viewportWidth)
    );
    
    const viewportY = Math.max(
      0,
      Math.min(position.y - viewportHeight / 2, mapHeight - viewportHeight)
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
  const { isBumping, bumpDirection, movementDirection, diagonalMovement } = useCharacterMovement(
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

  // Update characterStyle and movement state when position or direction changes
  useEffect(() => {
    // Update character position in the style
    setCharacterStyle(prev => ({
      ...prev,
      left: characterPosition.x,
      top: characterPosition.y
    }));

    // Update movement state based on movementDirection
    if (movementDirection) {
      // Set primary direction
      setDirection(movementDirection);
      
      // Track vertical and horizontal components separately
      if (movementDirection === 'up' || movementDirection === 'down') {
        setVerticalDirection(movementDirection);
      } else if (movementDirection === 'left' || movementDirection === 'right') {
        setHorizontalDirection(movementDirection);
      }
      
      // Process diagonal movement from useCharacterMovement
      if (diagonalMovement) {
        if (diagonalMovement.y < 0) {
          setVerticalDirection('up');
        } else if (diagonalMovement.y > 0) {
          setVerticalDirection('down');
        }
        
        if (diagonalMovement.x < 0) {
          setHorizontalDirection('left');
        } else if (diagonalMovement.x > 0) {
          setHorizontalDirection('right');
        }
      }
      
      // Animation sequence: start moving -> walking -> stop moving
      setMovementTransition('start-move');
      
      // After start animation, set to walking
      setTimeout(() => {
        setIsMoving(true);
        setMovementTransition(null);
      }, 200);
      
      // Reset isMoving after animation completes with stop animation
      const timeout = setTimeout(() => {
        setMovementTransition('stop-move');
        
        // After stop animation, reset to idle
        setTimeout(() => {
          setIsMoving(false);
          setMovementTransition(null);
          
          // Reset directions after movement stops fully
          if (!diagonalMovement || (diagonalMovement.x === 0 && diagonalMovement.y === 0)) {
            // Only reset directions if we're actually stopping and not continuing to move
            setVerticalDirection(null);
            setHorizontalDirection(null);
          }
        }, 200);
      }, 400);
      
      return () => clearTimeout(timeout);
    }
  }, [characterPosition, movementDirection, diagonalMovement]);

  useEffect(() => {
    // Check for both map artifacts and server artifacts at the player's position
    const checkBothArtifactSources = () => {
      if (!characterPosition || !MAPS || !MAPS[currentMapIndex]) return;
      
      const playerX = characterPosition.x / TILE_SIZE;
      const playerY = characterPosition.y / TILE_SIZE;
      
      // Check if the current map and its artifacts property exist before accessing them
      const mapArtifact = MAPS[currentMapIndex]?.artifacts?.find(
        artifact => artifact?.location && 
        artifact.visible && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY
      );
      
      // Check server artifacts
      const serverArtifact = artifacts && Array.isArray(artifacts) ? artifacts.find(
        artifact => artifact && artifact.location && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY &&
        (!artifact.area || artifact.area === MAPS[currentMapIndex]?.name)
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

  // Close NPC dialog
  const handleCloseNPCDialog = useCallback(() => {
    setShowNPCDialog(false);
    setActiveNPC(null);
  }, []);

  // Add a handler for the World Map node click
  const handleWorldMapNodeClick = useCallback((worldId) => {
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
  }, [setCurrentSpecialWorld, setShowWorldMap]);

  // Add handlers for exiting special worlds
  const handleHemingwayComplete = useCallback(() => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed Hemingway\'s Adventure');
    setShowRewardModal(true);
  }, [setCurrentSpecialWorld, setCurrentAchievement, setShowRewardModal]);

  const handleHemingwayExit = useCallback(() => {
    setCurrentSpecialWorld(null);
  }, [setCurrentSpecialWorld]);

  const handleTextAdventureComplete = useCallback(() => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    setCurrentAchievement('Completed The Writer\'s Journey');
    setShowRewardModal(true);
  }, [setCurrentSpecialWorld, setCurrentAchievement, setShowRewardModal]);

  const handleTextAdventureExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    setPortalNotificationActive(false);
    
    setCurrentSpecialWorld(null);
  }, [setCurrentSpecialWorld]);

  // Handle dismissing the world guide
  const handleDismissWorldGuide = useCallback(() => {
    setShowWorldGuide(false);
    // Possibly save this preference to localStorage or user profile
    localStorage.setItem('has-dismissed-world-guide', 'true');
  }, [setShowWorldGuide]);

  // Handle showing the world guide
  const handleShowWorldGuide = useCallback(() => {
    setShowWorldGuide(true);
  }, [setShowWorldGuide]);

  // Handle showing the world map
  const handleShowWorldMap = useCallback(() => {
    setShowWorldMap(true);
  }, [setShowWorldMap]);

  // Handle deleting a quote from savedQuotes
  const handleDeleteQuote = useCallback((quoteIndex) => {
    if (!character || !character.savedQuotes) return;
    
    // Create a copy of the savedQuotes array without the quote to delete
    const updatedQuotes = [...character.savedQuotes];
    updatedQuotes.splice(quoteIndex, 1);
    
    // Update the character with the new quotes array
    const updatedCharacter = {
      ...character,
      savedQuotes: updatedQuotes
    };
    
    // Update state and save to backend
    setCharacter(updatedCharacter);
    handleUpdateCharacter(updatedCharacter);
    
    console.log(`🗑️ Deleted quote at index ${quoteIndex}`);
  }, [character, handleUpdateCharacter]);

  // Utilities for persisting map artifact visibility
  const applyMapArtifactVisibilityFromStorage = () => {
    if (!Array.isArray(MAPS)) return;
    
    // Apply to all maps
    MAPS.forEach((map, mapIndex) => {
      if (!map || !Array.isArray(map.artifacts)) return;
      
      map.artifacts.forEach((artifact, artifactIndex) => {
        if (localStorage.getItem(`artifact-${artifact.id}-found`)) {
          MAPS[mapIndex].artifacts[artifactIndex].visible = false;
        }
      });
    });
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
      console.log("🎭 Clicked on NPC:", closestNPC.name);
      setActiveNPC(closestNPC);
      setShowNPCDialog(true);
      return true; // Interaction happened
    }
    return false; // No interaction happened
  }, [findClosestNPC]);
  
  // Function to handle and save gained achievements
  const handleAchievementUnlocked = useCallback((achievementId, title, description) => {
    // Check if character already has this achievement
    if (character && character.achievements && 
        character.achievements.some(a => a.id === achievementId)) {
      return; // Already has this achievement
    }
    
    // Show achievement notification
    setAchievementNotification({
      title,
      description
    });
    
    // Add achievement to character record
    if (character && character.id) {
      const newAchievement = {
        id: achievementId,
        name: title,
        description,
        unlockedAt: new Date()
      };
      
      // Update local state
      setCharacter(prev => {
        const updatedAchievements = [...(prev.achievements || []), newAchievement];
        const updatedCharacter = {
          ...prev,
          achievements: updatedAchievements
        };
        
        // Save to backend
        if (updatedCharacter.id) {
          updateCharacter(updatedCharacter)
            .then(() => console.log("✅ Achievement saved to backend"))
            .catch(err => console.error("❌ Failed to save achievement:", err));
        }
        
        return updatedCharacter;
      });
      
      // Save to local storage for offline access
      try {
        const storedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (!storedAchievements.some(a => a.id === achievementId)) {
          localStorage.setItem('achievements', JSON.stringify([
            ...storedAchievements,
            newAchievement
          ]));
        }
      } catch (err) {
        console.error("Failed to save achievement to localStorage:", err);
      }
    }
  }, [character]);

  // Load achievements from localStorage on component mount
  useEffect(() => {
    try {
      const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      setAchievements(savedAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, []);

  // Update checkForArtifactAchievements to use our context
  const checkForArtifactAchievements = (updatedInventory) => {
    checkCollectionAchievements(updatedInventory.length);
  };

  // Update the handleCreateArtifact function to include achievements
  const handleCreateArtifact = async (artifactData) => {
    try {
      const newArtifact = await createArtifact({
        ...artifactData,
        createdAt: new Date().toISOString(),
      });
      
      setArtifacts((prevArtifacts) => [...prevArtifacts, newArtifact]);
      
      // Award XP for creating an artifact
      awardXP(50, "Created a new artifact");
      
      // Check for creator achievement
      if (character && character.id) {
        const createdCount = artifacts.filter(a => a.createdBy === character.id).length + 1;
        if (createdCount >= 5) {
          handleAchievementUnlocked(
            'creator5',
            'Master Creator',
            'Created 5 artifacts to shape the Authentic Internet'
          );
        } else if (createdCount === 1) {
          handleAchievementUnlocked(
            'creator1',
            'Creator',
            'Created your first artifact in the world'
          );
        }
      }
      
      return newArtifact;
    } catch (error) {
      console.error("❌ Error creating artifact:", error);
      throw error;
    }
  };

  // Update the handleArtifactClick function to include achievements
  const handleArtifactClick = useCallback((artifactId) => {
    // Find the clicked artifact
    const clickedArtifact = artifacts.find(artifact => artifact.id === artifactId);
    if (!clickedArtifact) return;
    
    // Check if this artifact was already viewed
    const isFirstView = !viewedArtifacts.includes(artifactId);
    
    // Update viewed artifacts
    if (isFirstView) {
      const updatedViewedArtifacts = [...viewedArtifacts, artifactId];
      setViewedArtifacts(updatedViewedArtifacts);
      localStorage.setItem('viewedArtifacts', JSON.stringify(updatedViewedArtifacts));
      
      // Award XP for discovering a new artifact
      addExperiencePoints(15, `Discovered ${clickedArtifact.name}`);
      
      // Check for discovery achievements
      checkDiscoveryAchievements(updatedViewedArtifacts.length);
    } else {
      // Award smaller XP for revisiting an artifact
      awardXP(2, "Revisited an artifact");
    }
    
    // Select the artifact to display details
    setVisibleArtifact(clickedArtifact);
    
    // Save game state if user is logged in
    if (user) {
      const gameState = {
        inventory,
        viewedArtifacts,
        lastPosition: { x: characterPosition.x, y: characterPosition.y, worldId: MAPS[currentMapIndex].name },
        gameProgress: {
          currentQuest: 'Artifact Exploration',
          completedQuests: [],
          discoveredLocations: [MAPS[currentMapIndex].name]
        }
      };
      
      updateGameProgress(gameState);
    }
  }, [artifacts, viewedArtifacts, setViewedArtifacts, addExperiencePoints, checkDiscoveryAchievements, awardXP, setVisibleArtifact, user, inventory, characterPosition, currentMapIndex, updateGameProgress]);

  // Remove an XP notification
  const removeXpNotification = (id) => {
    setXpNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Remove an achievement notification
  const removeAchievementNotification = (id) => {
    setAchievementNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Handle tile clicks for game interactions
  const handleTileClick = useCallback((x, y, tileType) => {
    console.log(`Tile clicked at (${x}, ${y}), type: ${tileType}`);
    
    // Try NPC interaction first
    const npcInteracted = handleNPCInteraction();
    if (npcInteracted) return;
    
    // Check for artifacts at this position
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    const clickedArtifact = artifacts.find(artifact => 
      artifact.location && 
      Math.floor(artifact.location.x) === tileX && 
      Math.floor(artifact.location.y) === tileY
    );
    
    if (clickedArtifact) {
      handleArtifactClick(clickedArtifact.id);
      return;
    }
    
    // Handle special tile types
    if (tileType === 3) { // Special interaction tile
      console.log("Special interaction tile clicked");
      // Show a dialog or trigger an event
    } else if (tileType === 4) { // Quest tile
      console.log("Quest tile clicked");
      // Trigger quest dialog or advancement
    }
  }, [artifacts, handleNPCInteraction, handleArtifactClick]);

  // Handle tile clicks with the correct tileType
  const handleMapTileClick = useCallback((x, y) => {
    if (currentMapIndex < 0 || currentMapIndex >= MAPS.length) {
      console.error("Invalid map index:", currentMapIndex);
      return;
    }
    
    const mapData = MAPS[currentMapIndex];
    if (!mapData || !mapData.tiles) {
      console.error("Invalid map data or tiles:", mapData);
      return;
    }
    
    // Calculate the tile position in the map data
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Check if coordinates are valid
    if (tileX < 0 || tileX >= MAP_COLS || tileY < 0 || tileY >= MAP_ROWS) {
      console.error("Tile coordinates out of bounds:", tileX, tileY);
      return;
    }
    
    // Get the tile type from the map data
    const tileIndex = tileY * MAP_COLS + tileX;
    const tileType = mapData.tiles[tileIndex];
    
    // Call the tile click handler with tile type
    handleTileClick(x, y, tileType);
  }, [currentMapIndex, handleTileClick]);

  // Handle terminal adventure completion
  const handleTerminalComplete = useCallback((score) => {
    // Hide any remaining portal notification
    hidePortalNotification();
    setPortalNotificationActive(false);
    
    // Award XP and show notification
    awardXP(100, "Completed Terminal Adventure!");
    
    // Grant achievement
    handleAchievementUnlocked(
      'terminal_master',
      'Terminal Master',
      'Successfully navigated through the command line challenges'
    );
    
    // Exit the terminal adventure
    setCurrentSpecialWorld(null);
  }, [awardXP, handleAchievementUnlocked]);

  // Handle terminal adventure exit
  const handleTerminalExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    setPortalNotificationActive(false);
    
    setCurrentSpecialWorld(null);
  }, []);
  
  // Handle shooter adventure completion
  const handleShooterComplete = useCallback((score) => {
    // Award XP based on score
    const xpAmount = Math.min(200, score * 2);
    awardXP(xpAmount, `Shooter Score: ${score}`);
    
    // Grant achievement based on score
    if (score >= 1000) {
      handleAchievementUnlocked(
        'shooter_expert',
        'Pixel Sharpshooter',
        'Achieved an incredible score in the arcade shooter'
      );
    } else if (score >= 500) {
      handleAchievementUnlocked(
        'shooter_adept',
        'Arcade Adept',
        'Proved your skills in the arcade shooter challenge'
      );
    }
    
    // Exit the shooter adventure
    setCurrentSpecialWorld(null);
  }, [awardXP, handleAchievementUnlocked]);

  // Handle shooter adventure exit
  const handleShooterExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    setPortalNotificationActive(false);
    
    setCurrentSpecialWorld(null);
  }, []);

  // Update the saveGameProgress method to use context
  const saveGameProgress = () => {
    if (isLoggedIn && character?.id) {
      const gameState = {
        experience: character.experience || 0,
        avatar: character.avatar,
        inventory,
        viewedArtifacts,
        lastPosition: { x: characterPosition.x, y: characterPosition.y, worldId: MAPS[currentMapIndex].name },
        gameProgress: {
          currentQuest: 'Artifact Exploration',
          completedQuests: [],
          discoveredLocations: [MAPS[currentMapIndex].name]
        }
      };
      
      updateGameProgress(gameState);
    }
  };

  // Function to refresh the artifacts list
  const refreshArtifactList = useCallback(async () => {
    try {
      const data = await fetchArtifacts();
      console.log("📦 Refreshed Artifacts:", data ? data.length : 0);
      
      if (data && Array.isArray(data)) {
        const mapArtifacts = Array.isArray(MAPS) 
          ? MAPS.flatMap(map => (map.artifacts || []).map(art => art.name))
          : [];
        
        const filteredServerArtifacts = data.filter(serverArt => 
          !mapArtifacts.includes(serverArt.name) || 
          !serverArt.location
        );
        
        setArtifacts(filteredServerArtifacts);
      }
    } catch (error) {
      console.error("❌ Error refreshing artifacts:", error);
    }
  }, []);

  // Function to handle user artifact management
  const handleUserArtifactUpdate = useCallback(async (artifact, action) => {
    try {
      if (action === 'place') {
        setSelectedUserArtifact(artifact);
        setIsPlacingArtifact(true);
        setShowInventory(false);
      } else if (action === 'update' && artifact._id) {
        await updateArtifact(artifact);
        refreshArtifactList();
      } else if (action === 'delete' && artifact._id) {
        await deleteArtifact(artifact._id);
        setInventory(prev => prev.filter(item => item._id !== artifact._id));
        refreshArtifactList();
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing artifact:`, error);
    }
  }, [refreshArtifactList]);

  // Function to toggle artifacts visibility
  const toggleArtifactsVisibility = () => {
    setShowArtifactsOnMap(prev => !prev);
  };

  // Calculate artifacts to show based on current map
  const artifactsToShow = artifacts.filter(artifact => {
    if (!artifact.location || !Array.isArray(MAPS) || !MAPS[currentMapIndex]) {
      return false;
    }
    
    const currentMapName = MAPS[currentMapIndex].name;
    const artifactMapName = artifact.location.mapName;
    
    // Handle different naming conventions between MAPS and database
    if (artifactMapName === currentMapName) {
      return true;
    }
    
    // Handle case-insensitive matching
    if (artifactMapName.toLowerCase() === currentMapName.toLowerCase()) {
      return true;
    }
    
    // Handle specific mappings
    const mapMappings = {
      'overworld': 'Overworld',
      'desert': 'Desert 1',
      'dungeon': 'Dungeon Level 1'
    };
    
    if (mapMappings[artifactMapName] === currentMapName) {
      return true;
    }
    
    // Handle reverse mappings
    const reverseMappings = {
      'Overworld': 'overworld',
      'Desert 1': 'desert',
      'Dungeon Level 1': 'dungeon'
    };
    
    if (reverseMappings[currentMapName] === artifactMapName) {
      return true;
    }
    
    return false;
  });
  
  // Show a notification when player steps on a portal
  const showPortalNotification = (title, message) => {
    // Create the notification element if it doesn't exist
    let notification = document.getElementById('portal-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'portal-notification';
      notification.className = 'portal-notification';
      document.body.appendChild(notification);
    }
    
    // Update notification content
    notification.innerHTML = `
      <div class="portal-notification-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
    
    // Make notification visible
    setTimeout(() => {
      notification.classList.add('active');
    }, 10);
  };
  
  // Hide portal notification
  const hidePortalNotification = () => {
    const notification = document.getElementById('portal-notification');
    if (notification) {
      notification.classList.remove('active');
    }
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
              width: `${Array.isArray(MAPS) && MAPS[currentMapIndex]?.data?.[0]?.length 
                ? MAPS[currentMapIndex].data[0].length * TILE_SIZE 
                : 800}px`,
              height: `${Array.isArray(MAPS) && MAPS[currentMapIndex]?.data?.length 
                ? MAPS[currentMapIndex].data.length * TILE_SIZE 
                : 600}px`,
            }}
          >
            {MAPS[currentMapIndex] && (
              <Map 
                mapData={MAPS[currentMapIndex].data} 
                npcs={MAPS[currentMapIndex].npcs?.filter(npc => npc && npc.position) || []} 
                artifacts={!showArtifactsOnMap ? [] : artifactsToShow}
                onTileClick={handleTileClick}
                onNPCClick={handleNPCClick}
                onArtifactClick={handleArtifactClick}
                mapName={MAPS[currentMapIndex].name}
              />
            )}
            
            {/* Player Character */}
            <div 
              className={`character ${isMoving ? 'walking' : ''} ${direction} ${verticalDirection !== direction && verticalDirection ? verticalDirection : ''} ${horizontalDirection !== direction && horizontalDirection ? horizontalDirection : ''} ${movementTransition || ''}`}
              style={characterStyle}
              ref={characterRef}
            />
            
            {/* Environment Modifiers */}
            {isDarkMode && <div className="darkmode-overlay" />}
            
            {/* Buttons Menu */}
            <div className="game-controls">
              <IconButton onClick={handleShowInventory} tooltip="Inventory">
                <i className="fas fa-briefcase"></i>
              </IconButton>
              <IconButton onClick={handleShowWorldMap} tooltip="World Map">
                <i className="fas fa-map"></i>
              </IconButton>
              <IconButton onClick={handleShowQuotes} tooltip="Saved Quotes">
                <i className="fas fa-quote-right"></i>
              </IconButton>
              <IconButton onClick={handleShowWorldGuide} tooltip="World Guide">
                <i className="fas fa-compass"></i>
              </IconButton>
              <IconButton onClick={toggleArtifactsVisibility} tooltip={showArtifactsOnMap ? "Hide Artifacts" : "Show Artifacts"}>
                <i className={`fas fa-${showArtifactsOnMap ? 'eye-slash' : 'eye'}`}></i>
              </IconButton>
            </div>
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
            refreshArtifacts={refreshArtifactList}
            currentArea={MAPS[currentMapIndex].name}
          />
        )}

        {showInventory && character && (
          <Inventory
            onClose={() => setShowInventory(false)}
            character={character}
            inventory={character?.inventory || []}
            artifacts={artifacts}
            currentArea={Array.isArray(MAPS) && MAPS[currentMapIndex]?.name 
              ? MAPS[currentMapIndex].name 
              : "Unknown Area"}
            onManageUserArtifact={handleUserArtifactUpdate}
          />
        )}

        {showQuotes && character && (
          <SavedQuotes 
            quotes={character.savedQuotes || []}
            onClose={() => setShowQuotes(false)}
            onDeleteQuote={handleDeleteQuote}
          />      
        )}

        {/* NPC Interaction Dialog */}
        {showNPCDialog && activeNPC && (
          <NPCInteraction
            npc={activeNPC}
            onClose={() => {
              setShowNPCDialog(false);
              setActiveNPC(null);
            }}
            context={{
              area: MAPS[currentMapIndex]?.name || 'Unknown',
              weather: 'sunny', // Could be enhanced with real weather
              timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
            }}
          />
        )}

        {/* Feedback button */}
        <div className="feedback-button" onClick={() => setShowFeedback(true)}>
          <span role="img" aria-label="Feedback">💬</span>
          <span className="feedback-text">Feedback</span>
        </div>

        {/* Map key hint - only shown when there's no other overlay */}
        {!showInventory && !showForm && !showQuotes && !showWorldMap && !showWinNotification && !showRewardModal && !showLevel4 && !showFeedback && !showNPCDialog && (
          <div className="map-key-hint">
            PressM to view World Map | Press Fr Feedback | Press T to talk to NPCs
          </div>
        )}

        {currentSpecialWorld === 'text_adventure' && (
          <TextAdventure 
            username={character?.username || 'traveler'}
            onComplete={handleTextAdventureComplete}
            onExit={handleTextAdventureExit}
          />
        )}

        {/* Add ArtifactDiscovery component */}
        <ArtifactDiscovery
          artifacts={artifacts}
          characterPosition={characterPosition}
          currentMapName={MAPS[currentMapIndex].name}
          onArtifactFound={handleArtifactClick}
          character={character}
        />

        {notification && (
          <XPNotification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Achievement Notification */}
        {achievementNotification && (
          <AchievementNotification
            title={achievementNotification.title}
            description={achievementNotification.description}
            duration={5000}
            onClose={() => setAchievementNotification(null)}
          />
        )}

        {/* Special Worlds */}
        {currentSpecialWorld === 'textAdventure' && (
          <TextAdventure
            onComplete={handleTextAdventureComplete}
            onExit={handleTextAdventureExit}
            character={character}
          />
        )}
        
        {currentSpecialWorld === 'terminal' && (
          <Level3Terminal
            onComplete={handleTerminalComplete}
            onExit={handleTerminalExit}
            character={character}
            artifacts={artifacts}
            username={character?.username || 'User'}
            inventory={inventory}
          />
        )}
        
        {currentSpecialWorld === 'shooter' && (
          <>
            {console.log("GameWorld: Rendering Level4Shooter component")}
            <Level4Shooter
              onComplete={handleShooterComplete}
              onExit={handleShooterExit}
              character={character}
            />
          </>
        )}
        
        {currentSpecialWorld === 'hemingway' && (
          <HemingwayChallenge
            onComplete={handleHemingwayComplete}
            onExit={handleHemingwayExit}
            character={character}
          />
        )}

        {/* Debug overlay to show currentSpecialWorld state */}
        <div className="debug-overlay" style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: '#00ff00',
          padding: '10px',
          zIndex: 9999,
          pointerEvents: 'none',
          fontFamily: 'monospace'
        }}>
          currentSpecialWorld: "{currentSpecialWorld}"
        </div>

        {/* XP Notifications */}
        <div className="notification-container">
          {xpNotifications.map(notification => (
            <XPNotification
              key={notification.id}
              amount={notification.amount}
              reason={notification.reason}
              onClose={() => removeXpNotification(notification.id)}
            />
          ))}
        </div>
        
        {/* Achievement Notifications */}
        <div className="achievement-notification-container">
          {achievementNotifications.map(notification => (
            <AchievementNotification
              key={notification.id}
              achievement={notification.achievement}
              onClose={() => removeAchievementNotification(notification.id)}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GameWorld;