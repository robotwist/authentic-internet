import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import OptimizedImage from "./OptimizedImage";
import { v4 as uuidv4 } from "uuid";
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter,
  updateArtifact,
  deleteArtifact,
  updateUserExperience,
  addUserAchievement,
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
import DialogBox from "./DialogBox";
import TextAdventure from "./TextAdventure";
import SoundManager from "./utils/SoundManager";
import UserArtifactManager from "./UserArtifactManager";
import ArtifactDiscovery from "./ArtifactDiscovery";
import XPNotification from "./XPNotification";
import AchievementNotification from "./AchievementNotification";
import Level3Terminal from "./Level3Terminal";
import Level4Shooter from "./Level4Shooter";
import HemingwayChallenge from "./HemingwayChallenge";
import NPCInteraction from "./NPCs/NPCInteraction";
import { useAuth } from "../context/AuthContext";
import { useAchievements } from "../context/AchievementContext";
import { useGameState } from "../context/GameStateContext";
import gameStateManager from "../utils/gameStateManager";
import { IconButton } from "@mui/material";

// Performance monitoring
const PERFORMANCE_MARKERS = {
  RENDER_START: "gameworld-render-start",
  RENDER_END: "gameworld-render-end",
  STATE_UPDATE: "gameworld-state-update",
  PORTAL_TRANSITION: "gameworld-portal-transition",
};

// Memoized constants to prevent recreation
const INITIAL_CHARACTER_POSITION = { x: 64, y: 64 };
const INITIAL_VIEWPORT = { x: 0, y: 0 };
const INITIAL_LEVEL_COMPLETION = {
  level1: false,
  level2: false,
  level3: false,
  level4: false,
};

const GameWorld = React.memo(() => {
  // Initialization guard to prevent render-order issues
  const [isInitialized, setIsInitialized] = useState(false);

  // Core game state - optimized with useReducer pattern
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState(
    INITIAL_CHARACTER_POSITION,
  );
  const [character, setCharacter] = useState(null);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);

  // Performance tracking
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  // Form position state for artifact creation modal
  const [formPosition, setFormPosition] = useState(null);
  // Show inventory state for character inventory modal
  const [showInventory, setShowInventory] = useState(false);

  // UI state - grouped for better performance
  const [uiState, setUiState] = useState({
    showInventory: false,
    showForm: false,
    showQuotes: false,
    showWorldMap: false,
    showFeedback: false,
    showWinNotification: false,
    showLevel4: false,
    showRewardModal: false,
    showNPCDialog: false,
    showWorldGuide: true,
    isPlacingArtifact: false,
    showArtifactsOnMap: true,
    isMoving: false,
    isDarkMode: false,
  });

  // Game data state
  const [gameData, setGameData] = useState({
    artifacts: [],
    levelCompletion: INITIAL_LEVEL_COMPLETION,
    achievements: [],
    viewedArtifacts: [],
    databaseNPCs: [],
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    notification: null,
    achievementNotification: null,
    xpNotifications: [],
    achievementNotifications: [],
    winMessage: "",
    currentAchievement: "",
  });

  // Character state
  const [characterState, setCharacterState] = useState({
    direction: "down",
    style: {
      left: 64,
      top: 64,
      width: TILE_SIZE,
      height: TILE_SIZE,
      transition: "left 0.2s, top 0.2s",
    },
    movementTransition: null,
    verticalDirection: null,
    horizontalDirection: null,
  });

  // Portal state
  const [portalState, setPortalState] = useState({
    isTransitioning: false,
    portalNotificationActive: false,
    activePortal: null,
  });

  // Special world state
  const [currentSpecialWorld, setCurrentSpecialWorld] = useState(null);
  const [activeNPC, setActiveNPC] = useState(null);
  const [soundManager, setSoundManager] = useState(null);
  const [selectedUserArtifact, setSelectedUserArtifact] = useState(null);
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mobile and accessibility state
  const [mobileState, setMobileState] = useState({
    isMobile: false,
    showTouchControls: false,
    touchControlsEnabled: false,
    screenReaderMode: false,
    highContrastMode: false,
    reducedMotionMode: false,
  });

  // Refs for performance optimization
  const gameWorldRef = useRef(null);
  const characterRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const updateThrottle = useRef(16); // ~60 FPS

  // Context hooks
  const { user, updateUser } = useAuth();
  const {
    unlockAchievement,
    checkLevelAchievements,
    checkDiscoveryAchievements,
    checkCollectionAchievements,
  } = useAchievements();
  const { updateGameProgress, experience, updateExperience, ...gameState } =
    useGameState();

  const awardXP = useCallback(
    (amount, reason) => {
      // Ensure we have valid experience value before updating
      const currentExp = typeof experience === 'number' ? experience : 0;
      if (typeof updateExperience === 'function') {
        updateExperience(currentExp + amount);
        console.log(`Awarded ${amount} XP for: ${reason}`);
      } else {
        console.warn('updateExperience function not available');
      }
    },
    [experience, updateExperience],
  );

  // Memoized portal configuration
  const PORTAL_CONFIG = useMemo(
    () => ({
      progression: {
        Overworld: {
          destination: "Overworld 2",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Overworld 2": {
          destination: "Overworld 3",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Overworld 3": {
          destination: "Yosemite",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
          condition: (x, y) => x === 8 && y === 1,
        },
        "Desert 1": {
          destination: "Desert 2",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Desert 2": {
          destination: "Desert 3",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Desert 3": {
          destination: "Dungeon Level 1",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Dungeon Level 1": {
          destination: "Dungeon Level 2",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Dungeon Level 2": {
          destination: "Dungeon Level 3",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Dungeon Level 3": {
          destination: "Yosemite",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
      },
      yosemiteReturn: {
        destination: "Overworld 3",
        spawnPosition: { x: 8 * TILE_SIZE, y: 2 * TILE_SIZE },
      },
      special: {
        6: {
          type: "terminal",
          title: "Terminal Challenge",
          message: "Press SPACE to enter the Terminal Challenge",
        },
        7: {
          type: "shooter",
          title: "Arcade Shooter",
          message: "Press SPACE to enter the Arcade Shooter",
        },
        8: {
          type: "text_adventure",
          title: "Text Adventure",
          message: "Press SPACE to enter the Text Adventure",
        },
      },
    }),
    [],
  );

  // Memoized current map data with safety check
  const currentMap = useMemo(
    () => {
      // Safety check to prevent initialization order issues
      if (typeof currentMapIndex !== 'number' || !MAPS || !Array.isArray(MAPS)) {
        return MAPS?.[0] || null;
      }
      return MAPS[currentMapIndex] || MAPS[0];
    },
    [currentMapIndex],
  );
  const currentMapNPCs = useMemo(() => currentMap?.npcs || [], [currentMap]);
  const currentMapArtifacts = useMemo(
    () => currentMap?.artifacts || [],
    [currentMap],
  );

  // Performance monitoring
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;

    if (renderTime > 16) {
      // Longer than 60fps threshold
      console.warn(
        `Slow render detected: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`,
      );
    }

    lastRenderTime.current = now;

    // Performance mark for render - with safety checks
    if (performance.mark) {
      performance.mark(PERFORMANCE_MARKERS.RENDER_END);
      
      // Only measure if the start mark exists
      try {
        performance.measure(
          "GameWorld Render",
          PERFORMANCE_MARKERS.RENDER_START,
          PERFORMANCE_MARKERS.RENDER_END,
        );
      } catch (error) {
        // Start mark doesn't exist yet, create it for next time
        performance.mark(PERFORMANCE_MARKERS.RENDER_START);
      }
    }
  });

  // Optimized state update function
  const updateGameState = useCallback((updates) => {
    const now = performance.now();
    if (now - lastUpdateTime.current < updateThrottle.current) {
      return; // Throttle updates
    }
    lastUpdateTime.current = now;

    setGameData((prev) => {
      const newState = { ...prev, ...updates };
      // Ensure array properties are always arrays
      if (newState.artifacts && !Array.isArray(newState.artifacts)) {
        newState.artifacts = [];
      }
      if (newState.viewedArtifacts && !Array.isArray(newState.viewedArtifacts)) {
        newState.viewedArtifacts = [];
      }
      if (newState.achievements && !Array.isArray(newState.achievements)) {
        newState.achievements = [];
      }
      if (newState.databaseNPCs && !Array.isArray(newState.databaseNPCs)) {
        newState.databaseNPCs = [];
      }
      return newState;
    });
  }, []);

  // Optimized UI state update
  const updateUIState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle NPC interactions based on collision or click
  const handleNPCInteraction = useCallback((npc) => {
    if (!npc) return;
    
    console.log("Interacting with NPC:", npc.name || npc.type);
    
    // Set the active NPC and show dialog
    setActiveNPC(npc);
    updateUIState({ showNPCDialog: true });
    
    // Play interaction sound if available
    if (soundManager) {
      soundManager.playSound("npc_interaction");
    }
    
    // Add visual feedback
    if (mobileState.screenReaderMode) {
      announceToScreenReader(`Starting conversation with ${npc.name || npc.type}`);
    }
  }, [setActiveNPC, updateUIState, soundManager, mobileState.screenReaderMode, announceToScreenReader]);

  // Handler for clicking on an NPC in the map
  const handleNPCClick = useCallback(
    (npc) => {
      handleNPCInteraction(npc);
    },
    [handleNPCInteraction],
  );

  // Optimized notification update
  const updateNotifications = useCallback((updates) => {
    setNotifications((prev) => ({ ...prev, ...updates }));
  }, []);

  // Optimized character state update
  const updateCharacterState = useCallback((updates) => {
    setCharacterState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Optimized portal state update
  const updatePortalState = useCallback((updates) => {
    setPortalState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Hide portal notification
  const hidePortalNotification = useCallback(() => {
    const notification = document.getElementById("portal-notification");
    if (notification) {
      notification.classList.remove("active");
    }
  }, []);

  // Viewport adjustment function to follow character
  const adjustViewport = useCallback((characterPos) => {
    if (!characterPos || typeof currentMapIndex !== 'number') return;
    
    const gameWorldElement = document.querySelector('.game-world');
    if (!gameWorldElement) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate new viewport position to center character
    const newViewportX = Math.max(0, characterPos.x - viewportWidth / 2);
    const newViewportY = Math.max(0, characterPos.y - viewportHeight / 2);
    
    // Get map dimensions
    const currentMapData = MAPS[currentMapIndex];
    if (currentMapData && currentMapData.data) {
      const mapWidth = currentMapData.data[0]?.length * TILE_SIZE || 800;
      const mapHeight = currentMapData.data.length * TILE_SIZE || 600;
      
      // Clamp viewport to map boundaries
      const clampedX = Math.min(newViewportX, Math.max(0, mapWidth - viewportWidth));
      const clampedY = Math.min(newViewportY, Math.max(0, mapHeight - viewportHeight));
      
      setViewport({ x: clampedX, y: clampedY });
    }
  }, [currentMapIndex, setViewport]);

  // Handle portal transitions with performance optimization
  const handlePortalTransition = useCallback(
    (destinationMap, spawnPosition, isSpecial = false) => {
      if (portalState.isTransitioning) return;

      performance.mark(PERFORMANCE_MARKERS.PORTAL_TRANSITION);

      updatePortalState({ isTransitioning: true });

      // Play portal sound
      if (soundManager) {
        soundManager.playSound("portal");
      }

      // Add portal transition animation
      const gameWorld = document.querySelector(".game-world");
      if (gameWorld) {
        gameWorld.classList.add("portal-transition");
      }

      // Use requestAnimationFrame for smooth transitions
      const transitionAnimation = () => {
        setTimeout(() => {
          if (isSpecial) {
            setCurrentSpecialWorld(destinationMap);
          } else {
            const destinationIndex = MAPS.findIndex(
              (map) => map.name === destinationMap,
            );
            if (destinationIndex !== -1) {
              setCurrentMapIndex(destinationIndex);
              setCharacterPosition(spawnPosition);

              // Show world announcement
              showWorldAnnouncement(destinationMap);

              // Handle level completion for Yosemite
              if (destinationMap === "Yosemite") {
                setTimeout(() => {
                  handleLevelCompletion("level1");
                }, 800);
              }
            } else {
              console.error(`Destination map "${destinationMap}" not found`);
            }
          }

          // Remove transition animation
          if (gameWorld) {
            gameWorld.classList.remove("portal-transition");
          }

          updatePortalState({
            isTransitioning: false,
            activePortal: null,
            portalNotificationActive: false,
          });
          hidePortalNotification();

          performance.mark(PERFORMANCE_MARKERS.PORTAL_TRANSITION + "-end");
          try {
            performance.measure(
              "Portal Transition",
              PERFORMANCE_MARKERS.PORTAL_TRANSITION,
              PERFORMANCE_MARKERS.PORTAL_TRANSITION + "-end",
            );
          } catch (error) {
            // Performance timing not available, skip measurement
            console.debug("Performance measurement skipped:", error.message);
          }
        }, 1000);
      };

      requestAnimationFrame(transitionAnimation);
    },
    [
      portalState.isTransitioning,
      soundManager,
      setCurrentSpecialWorld,
      updatePortalState,
    ],
  );

  // Optimized portal activation handler with improved detection and feedback
  const handlePortalActivation = useCallback(
    (e) => {
      if (e.key !== " " || portalState.isTransitioning) return;

      const currentMapName = currentMap?.name;
      if (!currentMapName) {
        console.log("No current map name available for portal activation");
        return;
      }

      const playerTileX = Math.floor(characterPosition.x / TILE_SIZE);
      const playerTileY = Math.floor(characterPosition.y / TILE_SIZE);
      
      console.log(`Portal activation attempt - Map: ${currentMapName}, Player position: (${playerTileX}, ${playerTileY})`);

      // Check progression portals
      const progressionPortal = PORTAL_CONFIG.progression[currentMapName];
      if (progressionPortal) {
        const { destination, spawnPosition, condition } = progressionPortal;
        console.log(`Checking progression portal to ${destination}, condition:`, condition);

        if (!condition || condition(playerTileX, playerTileY)) {
          console.log(`✅ Activating portal to ${destination}`);
          handlePortalTransition(destination, spawnPosition);
          return;
        } else {
          console.log(`❌ Portal condition not met for ${destination}`);
          // Show hint to user
          showWorldAnnouncement("Find the correct portal location to proceed");
        }
      }

      // Check special portals in Yosemite
      if (currentMapName === "Yosemite") {
        const specialPortal = PORTAL_CONFIG.special[playerTileX];
        console.log(`Checking special portal at X=${playerTileX}, Y=${playerTileY}:`, specialPortal);
        
        if (specialPortal && playerTileY === 1) {
          console.log(`✅ Activating special portal: ${specialPortal.title}`);
          updatePortalState({
            activePortal: specialPortal,
            portalNotificationActive: true,
          });
          showPortalNotification(specialPortal.title, specialPortal.message);
          return;
        }
      }
      
      // No portal found - give user feedback
      console.log("❌ No portal found at current location");
      if (soundManager) {
        soundManager.playSound("bump"); // Play bump sound to indicate no portal
      }
    },
    [
      portalState.isTransitioning,
      currentMap,
      characterPosition,
      PORTAL_CONFIG,
      handlePortalTransition,
      updatePortalState,
      showPortalNotification,
      showWorldAnnouncement,
      soundManager,
    ],
  );

  // Optimized level completion handler
  const handleLevelCompletion = useCallback(
    (level) => {
      if (gameData.levelCompletion[level]) return; // Already completed

      updateGameState({
        levelCompletion: { ...gameData.levelCompletion, [level]: true },
      });

      updateNotifications({
        showWinNotification: true,
        winMessage: `Level ${level} Complete!`,
      });

      // Play completion sound
      if (soundManager) {
        soundManager.playSound("level_complete");
      }

      // Award experience
      if (user) {
        updateUserExperience(user.id, 100);
      }

      // Check achievements
      checkLevelAchievements(level);
    },
    [
      gameData.levelCompletion,
      updateGameState,
      updateNotifications,
      soundManager,
      user,
      checkLevelAchievements,
    ],
  );

  // Optimized artifact creation
  const createLevelArtifact = useCallback(async () => {
    try {
      const artifactData = {
        name: `Level ${currentMapIndex + 1} Artifact`,
        description: `An artifact from level ${currentMapIndex + 1}`,
        type: "level",
        level: currentMapIndex + 1,
        position: { x: characterPosition.x, y: characterPosition.y },
        creator: user?.id || "anonymous",
      };

      const newArtifact = await createArtifact(artifactData);

      updateGameState({
        artifacts: [...gameData.artifacts, newArtifact],
      });

      // Play creation sound
      if (soundManager) {
        soundManager.playSound("artifact_create");
      }

      return newArtifact;
    } catch (error) {
      console.error("Error creating level artifact:", error);
      return null;
    }
  }, [
    currentMapIndex,
    characterPosition,
    user,
    gameData.artifacts,
    soundManager,
    updateGameState,
  ]);

  // Optimized NPC fetching
  const fetchNPCs = useCallback(async () => {
    try {
      // This would fetch NPCs from the database
      // For now, we'll use the static NPCs from the map
      const npcs = currentMapNPCs;
      updateGameState({ databaseNPCs: npcs });
    } catch (error) {
      console.error("Error fetching NPCs:", error);
    }
  }, [currentMapNPCs, updateGameState]);

  // Optimized character loading
  const loadCharacter = useCallback(async () => {
    if (!user) return;

    try {
      const characterData = await fetchCharacter(user.id);
      setCharacter(characterData);

      // Update character position from saved data
      if (characterData?.position) {
        setCharacterPosition(characterData.position);
      }
    } catch (error) {
      console.error("Error loading character:", error);
    }
  }, [user]);

  // Optimized key handler with throttling
  const handleKeyDown = useCallback(
    (event) => {
      const now = performance.now();
      if (now - lastUpdateTime.current < updateThrottle.current) {
        return; // Throttle key events
      }
      lastUpdateTime.current = now;

      // Enhanced keyboard navigation with accessibility support
      switch (event.key) {
        case "i":
        case "I":
          updateUIState({ showInventory: !uiState.showInventory });
          // Announce to screen readers
          if (mobileState.screenReaderMode) {
            const message = uiState.showInventory
              ? "Closing inventory"
              : "Opening inventory";
            announceToScreenReader(message);
          }
          break;
        case "q":
        case "Q":
          updateUIState({ showQuotes: !uiState.showQuotes });
          if (mobileState.screenReaderMode) {
            const message = uiState.showQuotes
              ? "Closing quotes"
              : "Opening saved quotes";
            announceToScreenReader(message);
          }
          break;
        case "m":
        case "M":
          updateUIState({ showWorldMap: !uiState.showWorldMap });
          if (mobileState.screenReaderMode) {
            const message = uiState.showWorldMap
              ? "Closing world map"
              : "Opening world map";
            announceToScreenReader(message);
          }
          break;
        case "f":
        case "F":
          updateUIState({ showFeedback: !uiState.showFeedback });
          if (mobileState.screenReaderMode) {
            const message = uiState.showFeedback
              ? "Closing feedback form"
              : "Opening feedback form";
            announceToScreenReader(message);
          }
          break;
        case "Escape":
          updateUIState({
            showInventory: false,
            showQuotes: false,
            showWorldMap: false,
            showFeedback: false,
            showForm: false,
          });
          if (mobileState.screenReaderMode) {
            announceToScreenReader("Closed all menus");
          }
          break;
        case " ":
          handlePortalActivation(event);
          break;
        case "t":
        case "T":
          // NPC interaction
          const nearbyNPC = findNearbyNPC();
          if (nearbyNPC) {
            setActiveNPC(nearbyNPC);
            updateUIState({ showNPCDialog: true });
            if (mobileState.screenReaderMode) {
              announceToScreenReader(`Talking to ${nearbyNPC.name || "NPC"}`);
            }
          } else if (mobileState.screenReaderMode) {
            announceToScreenReader("No NPC nearby to talk to");
          }
          break;
        case "h":
        case "H":
          // Toggle high contrast mode
          setMobileState((prev) => ({
            ...prev,
            highContrastMode: !prev.highContrastMode,
          }));
          if (mobileState.screenReaderMode) {
            const message = mobileState.highContrastMode
              ? "High contrast mode disabled"
              : "High contrast mode enabled";
            announceToScreenReader(message);
          }
          break;
        case "r":
        case "R":
          // Toggle reduced motion mode
          setMobileState((prev) => ({
            ...prev,
            reducedMotionMode: !prev.reducedMotionMode,
          }));
          if (mobileState.screenReaderMode) {
            const message = mobileState.reducedMotionMode
              ? "Reduced motion mode disabled"
              : "Reduced motion mode enabled";
            announceToScreenReader(message);
          }
          break;
        case "s":
        case "S":
          // Toggle screen reader mode
          setMobileState((prev) => ({
            ...prev,
            screenReaderMode: !prev.screenReaderMode,
          }));
          const message = mobileState.screenReaderMode
            ? "Screen reader mode disabled"
            : "Screen reader mode enabled";
          announceToScreenReader(message);
          break;
      }
    },
    [uiState, updateUIState, handlePortalActivation, mobileState],
  );

  // Screen reader announcement function
  const announceToScreenReader = useCallback((message) => {
    // Create a live region for screen reader announcements
    let liveRegion = document.getElementById("screen-reader-announcements");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "screen-reader-announcements";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;

    // Clear the message after a short delay
    setTimeout(() => {
      liveRegion.textContent = "";
    }, 1000);
  }, []);

  // Optimized nearby NPC finder
  const findNearbyNPC = useCallback(() => {
    const npcs = [...currentMapNPCs, ...gameData.databaseNPCs];
    return npcs.find((npc) => {
      const npcX = npc.position?.x || 0;
      const npcY = npc.position?.y || 0;
      const distance = Math.sqrt(
        Math.pow(characterPosition.x - npcX, 2) +
          Math.pow(characterPosition.y - npcY, 2),
      );
      return distance < TILE_SIZE * 2;
    });
  }, [currentMapNPCs, gameData.databaseNPCs, characterPosition]);

  // Optimized sound manager initialization
  const initSoundManager = useCallback(async () => {
    if (soundManager) return;

    try {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
      console.log("Sound manager initialized successfully");
    } catch (error) {
      console.error("Error initializing sound manager:", error);
    }
  }, [soundManager]);

  // Initialize component safely
  useEffect(() => {
    // Mark as initialized after first render cycle completes
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Performance-optimized effects
  useEffect(() => {
    performance.mark(PERFORMANCE_MARKERS.RENDER_START);

    // Initialize game state manager
    gameStateManager.init();

    // Load character and NPCs
    loadCharacter();
    fetchNPCs();

    // Initialize sound manager
    initSoundManager();

    // Set up event listeners
    const handleKeyDownEvent = (e) => handleKeyDown(e);
    window.addEventListener("keydown", handleKeyDownEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDownEvent);
      if (soundManager) {
        soundManager.cleanup();
      }
    };
  }, [loadCharacter, fetchNPCs, initSoundManager, handleKeyDown, soundManager]);

  // Music management based on current map
  useEffect(() => {
    if (!soundManager || !currentMap) return;

    const currentMapName = currentMap.name || "";
    const newMusicTrack = getMusicTrackForMap(currentMapName);
    
    console.log("Map music check - Map:", currentMapName, "Track:", newMusicTrack);
    
    // Only change music if we have a valid track and it's different from current
    if (newMusicTrack) {
      try {
        // Check if we're already playing this track by comparing current music
        const shouldChangeMusic = !soundManager.currentMusic || 
                                soundManager.currentMusic !== newMusicTrack;
        
        if (shouldChangeMusic) {
          console.log("Changing music from", soundManager.currentMusic, "to", newMusicTrack);
          
          // Stop current music before starting new one
          soundManager.stopMusic();

          // Start appropriate music for the current map
          if (currentMapName === "Yosemite") {
            soundManager.playMusic("yosemite", true, 0.3);
          } else if (currentMapName.includes("Overworld")) {
            soundManager.playMusic("overworld", true, 0.3);
          } else if (currentMapName.includes("Dungeon")) {
            soundManager.playMusic("terminal", true, 0.3);
          } else if (currentMapName.includes("Desert")) {
            soundManager.playMusic("desert", true, 0.3);
          }
        }
      } catch (error) {
        console.error("Error changing music:", error);
      }
    }
  }, [soundManager, currentMapIndex]); // Only trigger on map index change

  // Helper function to get music track for map
  const getMusicTrackForMap = useCallback((mapName) => {
    if (mapName === "Yosemite") return "yosemite";
    if (mapName.includes("Overworld")) return "overworld";
    if (mapName.includes("Dungeon")) return "terminal";
    if (mapName.includes("Desert")) return "desert";
    return null;
  }, []);

  // Portal proximity detection - show hints when near portals
  useEffect(() => {
    if (!currentMap || !characterPosition) return;

    const currentMapName = currentMap.name;
    const playerTileX = Math.floor(characterPosition.x / TILE_SIZE);
    const playerTileY = Math.floor(characterPosition.y / TILE_SIZE);

    // Check if player is near any portal
    const progressionPortal = PORTAL_CONFIG.progression[currentMapName];
    let nearPortal = false;

    if (progressionPortal) {
      const { condition } = progressionPortal;
      
      // For portals with conditions, check if player is close
      if (condition) {
        // Check surrounding tiles (1-tile radius)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (condition(playerTileX + dx, playerTileY + dy)) {
              nearPortal = true;
              break;
            }
          }
          if (nearPortal) break;
        }
      } else {
        // For portals without conditions, consider always near if on this map
        nearPortal = true;
      }
    }

    // Check special portals in Yosemite
    if (currentMapName === "Yosemite") {
      // Check if player is near any special portal (1-tile radius)
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = playerTileX + dx;
        if (PORTAL_CONFIG.special[checkX] && Math.abs(playerTileY - 1) <= 1) {
          nearPortal = true;
          break;
        }
      }
    }

    // Show/hide portal hint
    if (nearPortal && !portalState.portalNotificationActive) {
      const hintElement = document.getElementById("portal-hint");
      if (!hintElement) {
        const hint = document.createElement("div");
        hint.id = "portal-hint";
        hint.className = "portal-hint";
        hint.innerHTML = "Press SPACE to activate portal";
        document.body.appendChild(hint);
      }
      document.getElementById("portal-hint")?.classList.add("visible");
    } else {
      document.getElementById("portal-hint")?.classList.remove("visible");
    }

  }, [characterPosition, currentMap, PORTAL_CONFIG, portalState.portalNotificationActive]);

  // Optimized artifact loading
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const artifactsData = await fetchArtifacts();
        updateGameState({ artifacts: artifactsData });
      } catch (error) {
        console.error("Error loading artifacts:", error);
      }
    };

    loadArtifacts();
  }, [updateGameState]);

  // Optimized game state saving
  const saveGameProgress = useCallback(() => {
    if (!user) return;

    const gameState = {
      characterPosition,
      currentMapIndex,
      inventory,
      levelCompletion: gameData.levelCompletion,
      achievements: gameData.achievements,
      viewedArtifacts: gameData.viewedArtifacts,
    };

    gameStateManager.updateState(gameState);
  }, [user, characterPosition, currentMapIndex, inventory, gameData]);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(saveGameProgress, 30000); // Save every 30 seconds
    return () => clearInterval(autoSaveInterval);
  }, [saveGameProgress]);

  // Mobile and accessibility detection
  useEffect(() => {
    const detectMobileAndAccessibility = () => {
      const isMobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const prefersHighContrast = window.matchMedia(
        "(prefers-contrast: high)",
      ).matches;

      setMobileState((prev) => ({
        ...prev,
        isMobile,
        showTouchControls: isMobile,
        touchControlsEnabled: isMobile,
        reducedMotionMode: prefersReducedMotion,
        highContrastMode: prefersHighContrast,
      }));
    };

    detectMobileAndAccessibility();
    window.addEventListener("resize", detectMobileAndAccessibility);

    // Listen for accessibility preference changes
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");

    const handleReducedMotionChange = (e) => {
      setMobileState((prev) => ({ ...prev, reducedMotionMode: e.matches }));
    };

    const handleHighContrastChange = (e) => {
      setMobileState((prev) => ({ ...prev, highContrastMode: e.matches }));
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    highContrastQuery.addEventListener("change", handleHighContrastChange);

    return () => {
      window.removeEventListener("resize", detectMobileAndAccessibility);
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
      highContrastQuery.removeEventListener("change", handleHighContrastChange);
    };
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const performanceInterval = setInterval(() => {
        const memory = performance.memory;
        if (memory && memory.usedJSHeapSize > 100 * 1024 * 1024) {
          // 100MB threshold
          console.warn(
            "High memory usage detected:",
            Math.round(memory.usedJSHeapSize / 1024 / 1024) + "MB",
          );
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(performanceInterval);
    }
  }, []);

  // Handle artifact pickup when user presses E or P
  const handleArtifactPickup = useCallback(
    (artifact) => {
      if (!artifact) return;

      // Check if this artifact was already viewed
      const isFirstView = !Array.isArray(gameData.viewedArtifacts) || !gameData.viewedArtifacts.includes(artifact.id);

      // Update viewed artifacts
      if (isFirstView) {
        const updatedViewedArtifacts = [
          ...(Array.isArray(gameData.viewedArtifacts) ? gameData.viewedArtifacts : []),
          artifact.id,
        ];
        updateGameState({ viewedArtifacts: updatedViewedArtifacts });
        localStorage.setItem(
          "viewedArtifacts",
          JSON.stringify(updatedViewedArtifacts),
        );

        // Award XP for discovering a new artifact - with safety check
        if (typeof awardXP === 'function') {
          awardXP(15, `Discovered ${artifact.name}`);
        }

        // Check for discovery achievements
        if (typeof checkDiscoveryAchievements === 'function') {
          checkDiscoveryAchievements(updatedViewedArtifacts.length);
        }
      } else {
        // Award smaller XP for revisiting an artifact - with safety check
        if (typeof awardXP === 'function') {
          awardXP(2, "Revisited an artifact");
        }
      }

      // Select the artifact to display details
      if (typeof setVisibleArtifact === 'function') {
        setVisibleArtifact(artifact);
      }

      // Save game state if user is logged in
      if (user && typeof updateGameProgress === 'function') {
        const gameState = {
          inventory,
          viewedArtifacts: gameData.viewedArtifacts,
          lastPosition: {
            x: characterPosition.x,
            y: characterPosition.y,
            worldId: MAPS[currentMapIndex].name,
          },
          gameProgress: {
            currentQuest: "Artifact Exploration",
            completedQuests: [],
            discoveredLocations: [MAPS[currentMapIndex].name],
          },
        };

        updateGameProgress(gameState);
      }
    },
    [
      gameData.viewedArtifacts,
      updateGameState,
      updateGameProgress,
      user,
      inventory,
      characterPosition,
      currentMapIndex,
      awardXP,
      checkDiscoveryAchievements,
      setVisibleArtifact,
    ],
  );

  // Memoized character movement hook
  const characterMovement = useCharacterMovement(
    characterPosition,
    setCharacterPosition,
    currentMapIndex,
    setCurrentMapIndex,
    isLoggedIn,
    visibleArtifact,
    handleArtifactPickup,
    setFormPosition,
    setShowInventory,
    adjustViewport,
  );

  // Update characterStyle and movement state when position or direction changes
  useEffect(() => {
    // Update character position in the style
    updateCharacterState({
      style: {
        ...characterState.style,
        left: characterPosition.x,
        top: characterPosition.y,
      },
    });

    // Adjust viewport to follow character
    adjustViewport(characterPosition);

    // Update movement state based on movementDirection
    if (characterMovement.movementDirection) {
      // Set primary direction
      updateCharacterState({ direction: characterMovement.movementDirection });

      // Track vertical and horizontal components separately
      if (
        characterMovement.movementDirection === "up" ||
        characterMovement.movementDirection === "down"
      ) {
        updateCharacterState({
          verticalDirection: characterMovement.movementDirection,
        });
      } else if (
        characterMovement.movementDirection === "left" ||
        characterMovement.movementDirection === "right"
      ) {
        updateCharacterState({
          horizontalDirection: characterMovement.movementDirection,
        });
      }

      // Process diagonal movement from useCharacterMovement
      if (characterMovement.diagonalMovement) {
        if (characterMovement.diagonalMovement.y < 0) {
          updateCharacterState({ verticalDirection: "up" });
        } else if (characterMovement.diagonalMovement.y > 0) {
          updateCharacterState({ verticalDirection: "down" });
        }

        if (characterMovement.diagonalMovement.x < 0) {
          updateCharacterState({ horizontalDirection: "left" });
        } else if (characterMovement.diagonalMovement.x > 0) {
          updateCharacterState({ horizontalDirection: "right" });
        }
      }

      // Animation sequence: start moving -> walking -> stop moving
      updateCharacterState({ movementTransition: "start-move" });

      // After start animation, set to walking
      setTimeout(() => {
        updateCharacterState({ isMoving: true, movementTransition: null });
      }, 200);

      // Reset isMoving after animation completes with stop animation
      const timeout = setTimeout(() => {
        updateCharacterState({ movementTransition: "stop-move" });

        // After stop animation, reset to idle
        setTimeout(() => {
          updateCharacterState({ isMoving: false, movementTransition: null });

          // Reset directions after movement stops fully
          if (
            !characterMovement.diagonalMovement ||
            (characterMovement.diagonalMovement.x === 0 &&
              characterMovement.diagonalMovement.y === 0)
          ) {
            // Only reset directions if we're actually stopping and not continuing to move
            updateCharacterState({
              verticalDirection: null,
              horizontalDirection: null,
            });
          }
        }, 200);
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [characterPosition, characterMovement, updateCharacterState, adjustViewport]);

  useEffect(() => {
    // Check for both map artifacts and server artifacts at the player's position
    const checkBothArtifactSources = () => {
      if (!characterPosition || !MAPS || !MAPS[currentMapIndex]) return;

      const playerX = characterPosition.x / TILE_SIZE;
      const playerY = characterPosition.y / TILE_SIZE;

      // Check if the current map and its artifacts property exist before accessing them
      const mapArtifact = MAPS[currentMapIndex]?.artifacts?.find(
        (artifact) =>
          artifact?.location &&
          artifact.visible &&
          artifact.location.x === playerX &&
          artifact.location.y === playerY,
      );

      // Check server artifacts
      const serverArtifact =
        gameData.artifacts && Array.isArray(gameData.artifacts)
          ? gameData.artifacts.find(
              (artifact) =>
                artifact &&
                artifact.location &&
                artifact.location.x === playerX &&
                artifact.location.y === playerY &&
                (!artifact.area ||
                  artifact.area === MAPS[currentMapIndex]?.name),
            )
          : null;

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
  }, [characterPosition, currentMapIndex, gameData.artifacts]);

  // Close NPC dialog
  const handleCloseNPCDialog = useCallback(() => {
    updateUIState({ showNPCDialog: false });
    setActiveNPC(null);
  }, []);

  // Add a handler for the World Map node click
  const handleWorldMapNodeClick = useCallback(
    (worldId) => {
      // Check if it's a special world type
      if (worldId === "hemingway") {
        setCurrentSpecialWorld("hemingway");
        updateUIState({ showWorldMap: false });
      } else if (worldId === "text_adventure") {
        setCurrentSpecialWorld("text_adventure");
        updateUIState({ showWorldMap: false });
      } else {
        // Handle normal world navigation here
        // (This would depend on your existing world navigation logic)
        updateUIState({ showWorldMap: false });
      }
    },
    [updateUIState, setCurrentSpecialWorld],
  );

  // Add handlers for exiting special worlds
  const handleHemingwayComplete = useCallback(() => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    updateNotifications({
      currentAchievement: "Completed Hemingway's Adventure",
    });
    updateUIState({ showRewardModal: true });
  }, [setCurrentSpecialWorld, updateNotifications, updateUIState]);

  const handleHemingwayExit = useCallback(() => {
    setCurrentSpecialWorld(null);
  }, [setCurrentSpecialWorld]);

  const handleTextAdventureComplete = useCallback(() => {
    setCurrentSpecialWorld(null);
    // Give rewards, etc.
    updateNotifications({
      currentAchievement: "Completed The Writer's Journey",
    });
    updateUIState({ showRewardModal: true });
  }, [setCurrentSpecialWorld, updateNotifications, updateUIState]);

  const handleTextAdventureExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    updatePortalState({ portalNotificationActive: false });

    setCurrentSpecialWorld(null);
  }, [setCurrentSpecialWorld, updatePortalState]);

  // Handle dismissing the world guide
  const handleDismissWorldGuide = useCallback(() => {
    updateUIState({ showWorldGuide: false });
    // Possibly save this preference to localStorage or user profile
    localStorage.setItem("has-dismissed-world-guide", "true");
  }, [updateUIState]);

  // Handle showing the world guide
  const handleShowWorldGuide = useCallback(() => {
    updateUIState({ showWorldGuide: true });
  }, [updateUIState]);

  // Handle showing the world map
  const handleShowWorldMap = useCallback(() => {
    updateUIState({ showWorldMap: true });
  }, [updateUIState]);

  // Handle deleting a quote from savedQuotes
  const handleDeleteQuote = useCallback(
    (quoteIndex) => {
      if (!character || !character.savedQuotes) return;

      // Create a copy of the savedQuotes array without the quote to delete
      const updatedQuotes = [...character.savedQuotes];
      updatedQuotes.splice(quoteIndex, 1);

      // Update the character with the new quotes array
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes,
      };

      // Update state and save to backend
      setCharacter(updatedCharacter);
      updateCharacter(updatedCharacter);

      console.log(`🗑️ Deleted quote at index ${quoteIndex}`);
    },
    [character, updateCharacter],
  );

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
      const savedState = localStorage.getItem("collectedMapArtifacts");
      let collectedIds = savedState ? JSON.parse(savedState) : [];

      if (!collectedIds.includes(artifactId)) {
        collectedIds.push(artifactId);
        localStorage.setItem(
          "collectedMapArtifacts",
          JSON.stringify(collectedIds),
        );
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

    MAPS[currentMapIndex].npcs.forEach((npc) => {
      if (!npc.position) return;

      const distance = Math.sqrt(
        Math.pow(playerX - npc.position.x, 2) +
          Math.pow(playerY - npc.position.y, 2),
      );

      // Only consider NPCs within interaction range (1 tile for collision)
      if (distance <= TILE_SIZE * 1.5 && distance < minDistance) {
        minDistance = distance;
        closestNPC = npc;
      }
    });

    return closestNPC;
  }, [characterPosition, currentMapIndex]);

  // Function to handle and save gained achievements
  const handleAchievementUnlocked = useCallback(
    (achievementId, title, description) => {
      // Check if character already has this achievement
      if (
        character &&
        character.achievements &&
        character.achievements.some((a) => a.id === achievementId)
      ) {
        return; // Already has this achievement
      }

      // Show achievement notification
      updateNotifications({
        achievementNotification: {
          title,
          description,
        },
      });

      // Add achievement to character record
      if (character && character.id) {
        const newAchievement = {
          id: achievementId,
          name: title,
          description,
          unlockedAt: new Date(),
        };

        // Update local state
        setCharacter((prev) => {
          const updatedAchievements = [
            ...(prev.achievements || []),
            newAchievement,
          ];
          const updatedCharacter = {
            ...prev,
            achievements: updatedAchievements,
          };

          // Save to backend
          if (updatedCharacter.id) {
            updateCharacter(updatedCharacter)
              .then(() => console.log("✅ Achievement saved to backend"))
              .catch((err) =>
                console.error("❌ Failed to save achievement:", err),
              );
          }

          return updatedCharacter;
        });

        // Save to local storage for offline access
        try {
          const storedAchievements = JSON.parse(
            localStorage.getItem("achievements") || "[]",
          );
          if (!storedAchievements.some((a) => a.id === achievementId)) {
            localStorage.setItem(
              "achievements",
              JSON.stringify([...storedAchievements, newAchievement]),
            );
          }
        } catch (err) {
          console.error("Failed to save achievement to localStorage:", err);
        }
      }
    },
    [character, updateCharacter, updateNotifications],
  );

  // Load achievements from localStorage on component mount
  useEffect(() => {
    try {
      const savedAchievements = JSON.parse(
        localStorage.getItem("achievements") || "[]",
      );
      setGameData((prev) => ({ ...prev, achievements: savedAchievements }));
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  }, []);

  // Update checkForArtifactAchievements to use our context
  const checkForArtifactAchievements = useCallback(
    (updatedInventory) => {
      checkCollectionAchievements(updatedInventory.length);
    },
    [checkCollectionAchievements],
  );

  // Update the handleCreateArtifact function to include achievements
  const handleCreateArtifact = useCallback(
    async (artifactData) => {
      try {
        const newArtifact = await createArtifact({
          ...artifactData,
          createdAt: new Date().toISOString(),
        });

        updateGameState({ artifacts: [...gameData.artifacts, newArtifact] });

        // Award XP for creating an artifact
        if (typeof awardXP === 'function') {
          awardXP(50, "Created a new artifact");
        }

        // Check for creator achievement
        if (character && character.id) {
          const createdCount =
            (Array.isArray(gameData.artifacts) 
              ? gameData.artifacts.filter((a) => a.createdBy === character.id).length 
              : 0) + 1;
          if (createdCount >= 5) {
            handleAchievementUnlocked(
              "creator5",
              "Master Creator",
              "Created 5 artifacts to shape the Authentic Internet",
            );
          } else if (createdCount === 1) {
            handleAchievementUnlocked(
              "creator1",
              "Creator",
              "Created your first artifact in the world",
            );
          }
        }

        return newArtifact;
      } catch (error) {
        console.error("❌ Error creating artifact:", error);
        throw error;
      }
    },
    [gameData.artifacts, character, updateGameState, handleAchievementUnlocked],
  );

  // Update the handleArtifactClick function to include achievements
  const handleArtifactClick = useCallback(
    (artifactId) => {
      // Find the clicked artifact
      const clickedArtifact = Array.isArray(gameData.artifacts) 
        ? gameData.artifacts.find((artifact) => artifact.id === artifactId)
        : null;
      if (!clickedArtifact) return;

      // Check if this artifact was already viewed
      const isFirstView = !Array.isArray(gameData.viewedArtifacts) || !gameData.viewedArtifacts.includes(artifactId);

      // Update viewed artifacts
      if (isFirstView) {
        const updatedViewedArtifacts = [
          ...(Array.isArray(gameData.viewedArtifacts) ? gameData.viewedArtifacts : []),
          artifactId,
        ];
        updateGameState({ viewedArtifacts: updatedViewedArtifacts });
        localStorage.setItem(
          "viewedArtifacts",
          JSON.stringify(updatedViewedArtifacts),
        );

        // Award XP for discovering a new artifact
        if (typeof awardXP === 'function') {
          awardXP(15, `Discovered ${clickedArtifact.name}`);
        }

        // Check for discovery achievements
        checkDiscoveryAchievements(updatedViewedArtifacts.length);
      } else {
        // Award smaller XP for revisiting an artifact
        if (typeof awardXP === 'function') {
          awardXP(2, "Revisited an artifact");
        }
      }

      // Select the artifact to display details
      setVisibleArtifact(clickedArtifact);

      // Save game state if user is logged in
      if (user) {
        const gameState = {
          inventory,
          viewedArtifacts: gameData.viewedArtifacts,
          lastPosition: {
            x: characterPosition.x,
            y: characterPosition.y,
            worldId: MAPS[currentMapIndex].name,
          },
          gameProgress: {
            currentQuest: "Artifact Exploration",
            completedQuests: [],
            discoveredLocations: [MAPS[currentMapIndex].name],
          },
        };

        updateGameProgress(gameState);
      }
    },
    [
      gameData.artifacts,
      gameData.viewedArtifacts,
      updateGameState,
      updateGameProgress,
      user,
      inventory,
      characterPosition,
      currentMapIndex,
      awardXP,
      checkDiscoveryAchievements,
      setVisibleArtifact,
    ],
  );

  // Remove an XP notification
  const removeXpNotification = useCallback(
    (id) => {
      updateNotifications({
        xpNotifications: (prev) =>
          prev.filter((notification) => notification.id !== id),
      });
    },
    [updateNotifications],
  );

  // Remove an achievement notification
  const removeAchievementNotification = useCallback(
    (id) => {
      updateNotifications({
        achievementNotifications: (prev) =>
          prev.filter((notification) => notification.id !== id),
      });
    },
    [updateNotifications],
  );

  // Handle tile clicks for game interactions
  const handleTileClick = useCallback(
    (x, y, tileType) => {
      console.log(`Tile clicked at (${x}, ${y}), type: ${tileType}`);

      // Try NPC interaction first
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);
      const currentMap = MAPS[currentMapIndex];
      let npcInteracted = false;
      if (currentMap && Array.isArray(currentMap.npcs)) {
        const npc = currentMap.npcs.find(
          (npc) =>
            npc.position &&
            Math.floor(npc.position.x / TILE_SIZE) === tileX &&
            Math.floor(npc.position.y / TILE_SIZE) === tileY
        );
        if (npc) {
          handleNPCInteraction(npc);
          npcInteracted = true;
        }
      }
      if (npcInteracted) return true;

      // Check for artifacts at this position
      const clickedArtifact = Array.isArray(gameData.artifacts)
        ? gameData.artifacts.find(
            (artifact) =>
              artifact.location &&
              Math.floor(artifact.location.x) === tileX &&
              Math.floor(artifact.location.y) === tileY,
          )
        : null;

      if (clickedArtifact) {
        handleArtifactClick(clickedArtifact.id);
        return true;
      }

      // Handle special tile types
      if (tileType === 3) {
        // Special interaction tile
        console.log("Special interaction tile clicked");
        // Show a dialog or trigger an event
      } else if (tileType === 4) {
        // Quest tile
        console.log("Quest tile clicked");
        // Trigger quest dialog or advancement
      }
      return false;
    },
    [gameData.artifacts, handleNPCInteraction, handleArtifactClick, currentMapIndex],
  );

  // Handle tile clicks with the correct tileType
  const handleMapTileClick = useCallback(
    (x, y) => {
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
    },
    [currentMapIndex, handleTileClick],
  );

  // Handle terminal adventure completion
  const handleTerminalComplete = useCallback(
    (score) => {
      // Hide any remaining portal notification
      hidePortalNotification();
      updatePortalState({ portalNotificationActive: false });

      // Award XP and show notification
      if (typeof awardXP === 'function') {
        awardXP(100, "Completed Terminal Adventure!");
      }

      // Grant achievement
      handleAchievementUnlocked(
        "terminal_master",
        "Terminal Master",
        "Successfully navigated through the command line challenges",
      );

      // Exit the terminal adventure
      setCurrentSpecialWorld(null);
    },
    [awardXP, handleAchievementUnlocked, updatePortalState],
  );

  // Handle terminal adventure exit
  const handleTerminalExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    updatePortalState({ portalNotificationActive: false });

    setCurrentSpecialWorld(null);
  }, [updatePortalState]);

  // Handle shooter adventure completion
  const handleShooterComplete = useCallback(
    (score) => {
      // Award XP based on score
      const xpAmount = Math.min(200, score * 2);
      if (typeof awardXP === 'function') {
        awardXP(xpAmount, `Shooter Score: ${score}`);
      }

      // Grant achievement based on score
      if (score >= 1000) {
        handleAchievementUnlocked(
          "shooter_expert",
          "Pixel Sharpshooter",
          "Achieved an incredible score in the arcade shooter",
        );
      } else if (score >= 500) {
        handleAchievementUnlocked(
          "shooter_adept",
          "Arcade Adept",
          "Proved your skills in the arcade shooter challenge",
        );
      }

      // Exit the shooter adventure
      setCurrentSpecialWorld(null);
    },
    [awardXP, handleAchievementUnlocked],
  );

  // Handle shooter adventure exit
  const handleShooterExit = useCallback(() => {
    // Hide any remaining portal notification
    hidePortalNotification();
    updatePortalState({ portalNotificationActive: false });

    setCurrentSpecialWorld(null);
  }, [updatePortalState]);

  // Update the saveGameProgress method to use context
  const saveGameProgressWithContext = useCallback(() => {
    if (isLoggedIn && character?.id) {
      const gameState = {
        experience: character.experience || 0,
        avatar: character.avatar,
        inventory,
        viewedArtifacts: gameData.viewedArtifacts,
        lastPosition: {
          x: characterPosition.x,
          y: characterPosition.y,
          worldId: MAPS[currentMapIndex].name,
        },
        gameProgress: {
          currentQuest: "Artifact Exploration",
          completedQuests: [],
          discoveredLocations: [MAPS[currentMapIndex].name],
        },
      };

      updateGameProgress(gameState);
    }
  }, [
    isLoggedIn,
    character,
    inventory,
    gameData.viewedArtifacts,
    characterPosition,
    currentMapIndex,
    updateGameProgress,
  ]);

  // Function to refresh the artifacts list
  const refreshArtifactList = useCallback(async () => {
    try {
      const artifactsData = await fetchArtifacts();
      updateGameState({ artifacts: artifactsData });
    } catch (error) {
      console.error("❌ Error refreshing artifacts:", error);
    }
  }, [updateGameState]);

  // Function to handle user artifact management
  const handleUserArtifactUpdate = useCallback(
    async (artifact, action) => {
      try {
        if (action === "place") {
          setSelectedUserArtifact(artifact);
          updateUIState({ isPlacingArtifact: true });
          updateUIState({ showInventory: false });
        } else if (action === "update" && artifact._id) {
          await updateArtifact(artifact);
          refreshArtifactList();
        } else if (action === "delete" && artifact._id) {
          await deleteArtifact(artifact._id);
          setInventory((prev) =>
            prev.filter((item) => item._id !== artifact._id),
          );
          refreshArtifactList();
        }
      } catch (error) {
        console.error(`❌ Error ${action}ing artifact:`, error);
      }
    },
    [updateUIState, setSelectedUserArtifact, refreshArtifactList],
  );

  // Function to toggle artifacts visibility
  const toggleArtifactsVisibility = useCallback(() => {
    updateUIState({ showArtifactsOnMap: !uiState.showArtifactsOnMap });
  }, [uiState.showArtifactsOnMap, updateUIState]);

  // Calculate artifacts to show based on current map
  const artifactsToShow = useMemo(() => {
    if (!gameData.artifacts || !Array.isArray(gameData.artifacts) || !MAPS || !MAPS[currentMapIndex]) {
      return [];
    }

    const currentMapName = MAPS[currentMapIndex].name;
    const artifactMapName = gameData.artifacts.find(
      (artifact) => artifact.location,
    )?.location.mapName;

    // Handle different naming conventions between MAPS and database
    if (artifactMapName === currentMapName) {
      return gameData.artifacts.filter((artifact) => artifact.visible);
    }

    // Handle case-insensitive matching, only if artifactMapName and currentMapName are defined
    if (
      typeof artifactMapName === "string" &&
      typeof currentMapName === "string" &&
      artifactMapName.toLowerCase() === currentMapName.toLowerCase()
    ) {
      return gameData.artifacts.filter((artifact) => artifact.visible);
    }

    // Handle specific mappings
    const mapMappings = {
      overworld: "Overworld",
      desert: "Desert 1",
      dungeon: "Dungeon Level 1",
    };

    if (mapMappings[artifactMapName] === currentMapName) {
      return gameData.artifacts.filter((artifact) => artifact.visible);
    }

    // Handle reverse mappings
    const reverseMappings = {
      Overworld: "overworld",
      "Desert 1": "desert",
      "Dungeon Level 1": "dungeon",
    };

    if (reverseMappings[currentMapName] === artifactMapName) {
      return gameData.artifacts.filter((artifact) => artifact.visible);
    }

    return [];
  }, [gameData.artifacts, currentMapIndex]);

  // Show a notification when player steps on a portal
  const showPortalNotification = useCallback((title, message) => {
    // Create the notification element if it doesn't exist
    let notification = document.getElementById("portal-notification");

    if (!notification) {
      notification = document.createElement("div");
      notification.id = "portal-notification";
      notification.className = "portal-notification";
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
      notification.classList.add("active");
    }, 10);
  }, []);

  // Show world announcement when transitioning to new area
  const showWorldAnnouncement = useCallback((worldName) => {
    // Create the announcement element if it doesn't exist
    let announcement = document.getElementById("world-announcement");

    if (!announcement) {
      announcement = document.createElement("div");
      announcement.id = "world-announcement";
      announcement.className = "world-announcement";
      document.body.appendChild(announcement);
    }

    // Update announcement content
    announcement.innerHTML = `<h2>Welcome to ${worldName}</h2>`;

    // Make announcement visible
    setTimeout(() => {
      announcement.classList.add("active");
    }, 10);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      announcement.classList.add("fade-out");
      setTimeout(() => {
        if (announcement && announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      }, 1000);
    }, 3000);
  }, []);



  return (
    <ErrorBoundary>
      {/* Initialization guard to prevent render-order issues */}
      {!isInitialized ? (
        <div className="game-loading" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '18px'
        }}>
          Initializing Game World...
        </div>
      ) : (
      <div
        className={`game-container ${mobileState.highContrastMode ? "high-contrast" : ""} ${mobileState.reducedMotionMode ? "reduced-motion" : ""}`}
        role="application"
        aria-label="Authentic Internet Game World"
        aria-describedby="game-instructions"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Accessibility instructions */}
        <div id="game-instructions" className="sr-only">
          Use arrow keys or WASD to move. Press I for inventory, M for map, F
          for feedback, T to talk to NPCs, H for high contrast mode, R for
          reduced motion, S for screen reader mode. Press Escape to close menus.
        </div>

        {/* Screen reader announcements */}
        <div
          id="screen-reader-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {uiState.showLevel4 && (
          <Level4Shooter
            onComplete={handleLevel4Complete}
            onExit={handleLevel4Exit}
          />
        )}
        <div
          className="viewport"
          style={{ width: "100%", height: "100%" }}
          role="region"
          aria-label="Game viewport"
        >
          <div
            className={`game-world ${currentMapIndex === 2 ? "level-3" : currentMapIndex === 1 ? "level-2" : "level-1"} ${mobileState.reducedMotionMode ? "no-animations" : ""}`}
            style={{
              transform: mobileState.reducedMotionMode
                ? `translate(${-viewport.x}px, ${-viewport.y}px)`
                : `translate(${-viewport.x}px, ${-viewport.y}px)`,
              width: `${
                Array.isArray(MAPS) && MAPS[currentMapIndex]?.data?.[0]?.length
                  ? MAPS[currentMapIndex].data[0].length * TILE_SIZE
                  : 800
              }px`,
              height: `${
                Array.isArray(MAPS) && MAPS[currentMapIndex]?.data?.length
                  ? MAPS[currentMapIndex].data.length * TILE_SIZE
                  : 600
              }px`,
            }}
            role="region"
            aria-label={`Current area: ${MAPS[currentMapIndex]?.name || "Unknown"}`}
          >
            {MAPS[currentMapIndex] && (
              <Map
                mapData={MAPS[currentMapIndex].data}
                npcs={
                  MAPS[currentMapIndex].npcs?.filter(
                    (npc) => npc && npc.position,
                  ) || []
                }
                artifacts={!uiState.showArtifactsOnMap ? [] : artifactsToShow}
                onTileClick={handleMapTileClick}
                onNPCClick={handleNPCClick}
                onArtifactClick={handleArtifactClick}
                mapName={MAPS[currentMapIndex].name}
              />
            )}

            {/* Player Character */}
            <div
              className={`character ${uiState.isMoving ? "walking" : ""} ${characterState.direction} ${characterState.verticalDirection !== characterState.direction && characterState.verticalDirection ? characterState.verticalDirection : ""} ${characterState.horizontalDirection !== characterState.direction && characterState.horizontalDirection ? characterState.horizontalDirection : ""} ${characterState.movementTransition || ""}`}
              style={characterState.style}
              ref={characterRef}
              role="img"
              aria-label={`Player character at position ${Math.round(characterPosition.x / TILE_SIZE)}, ${Math.round(characterPosition.y / TILE_SIZE)}`}
              data-testid="character"
            />

            {/* Environment Modifiers */}
            {uiState.isDarkMode && <div className="darkmode-overlay" />}

            {/* Buttons Menu */}
            <div className="game-controls">
              <IconButton
                onClick={() => updateUIState({ showInventory: true })}
                tooltip="Inventory"
              >
                <i className="fas fa-briefcase"></i>
              </IconButton>
              <IconButton
                onClick={() => updateUIState({ showWorldMap: true })}
                tooltip="World Map"
              >
                <i className="fas fa-map"></i>
              </IconButton>
              <IconButton
                onClick={() => updateUIState({ showQuotes: true })}
                tooltip="Saved Quotes"
              >
                <i className="fas fa-quote-right"></i>
              </IconButton>
              <IconButton
                onClick={() => updateUIState({ showWorldGuide: true })}
                tooltip="World Guide"
              >
                <i className="fas fa-compass"></i>
              </IconButton>
              <IconButton
                onClick={toggleArtifactsVisibility}
                tooltip={
                  uiState.showArtifactsOnMap
                    ? "Hide Artifacts"
                    : "Show Artifacts"
                }
              >
                <i
                  className={`fas fa-${uiState.showArtifactsOnMap ? "eye-slash" : "eye"}`}
                ></i>
              </IconButton>
            </div>
          </div>
        </div>

        {/* Display world map when toggled */}
        {uiState.showWorldMap && (
          <WorldMap
            currentWorld={MAPS[currentMapIndex].name}
            onClose={() => updateUIState({ showWorldMap: false })}
            onNodeClick={handleWorldMapNodeClick}
          />
        )}

        {/* Display feedback form when toggled */}
        {uiState.showFeedback && (
          <FeedbackForm
            onClose={() => updateUIState({ showFeedback: false })}
          />
        )}

        {uiState.showWinNotification && (
          <div className="win-notification">
            <div className="win-content">
              <h2>Level Complete!</h2>
              <p>{notifications.winMessage}</p>
              <div className="win-stars">★★★</div>
              <button
                onClick={() => updateUIState({ showWinNotification: false })}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        <RewardModal
          visible={uiState.showRewardModal}
          onClose={() => updateUIState({ showRewardModal: false })}
          achievement={notifications.currentAchievement}
        />

        {uiState.showForm && (
          <ArtifactCreation
            position={formPosition}
            onClose={() => updateUIState({ showForm: false })}
            refreshArtifacts={refreshArtifactList}
            currentArea={MAPS[currentMapIndex].name}
          />
        )}

        {uiState.showInventory && character && (
          <Inventory
            onClose={() => updateUIState({ showInventory: false })}
            character={character}
            inventory={character?.inventory || []}
            artifacts={gameData.artifacts}
            currentArea={
              Array.isArray(MAPS) && MAPS[currentMapIndex]?.name
                ? MAPS[currentMapIndex].name
                : "Unknown Area"
            }
            onManageUserArtifact={handleUserArtifactUpdate}
          />
        )}

        {uiState.showQuotes && character && (
          <SavedQuotes
            quotes={character.savedQuotes || []}
            onClose={() => updateUIState({ showQuotes: false })}
            onDeleteQuote={handleDeleteQuote}
          />
        )}

        {/* NPC Interaction Dialog */}
        {uiState.showNPCDialog && activeNPC && (
          <NPCInteraction
            npc={activeNPC}
            onClose={() => {
              updateUIState({ showNPCDialog: false });
              setActiveNPC(null);
            }}
            context={{
              area: MAPS[currentMapIndex]?.name || "Unknown",
              weather: "sunny", // Could be enhanced with real weather
              timeOfDay:
                new Date().getHours() < 12
                  ? "morning"
                  : new Date().getHours() < 18
                    ? "afternoon"
                    : "evening",
            }}
          />
        )}

        {/* Feedback button */}
        <div
          className="feedback-button"
          onClick={() => updateUIState({ showFeedback: true })}
        >
          <span role="img" aria-label="Feedback">
            💬
          </span>
          <span className="feedback-text">Feedback</span>
        </div>

        {/* Map key hint - only shown when there's no other overlay */}
        {!uiState.showInventory &&
          !uiState.showForm &&
          !uiState.showQuotes &&
          !uiState.showWorldMap &&
          !uiState.showWinNotification &&
          !uiState.showRewardModal &&
          !uiState.showLevel4 &&
          !uiState.showFeedback &&
          !uiState.showNPCDialog && (
            <div className="map-key-hint" role="status" aria-live="polite">
              {mobileState.isMobile ? (
                <span>
                  Tap and drag to move | Tap NPCs to talk | Use menu buttons
                </span>
              ) : (
                <span>
                  Press M to view World Map | Press F for Feedback | Press T to
                  talk to NPCs
                </span>
              )}
            </div>
          )}

        {/* Mobile touch controls */}
        {mobileState.showTouchControls && mobileState.touchControlsEnabled && (
          <div
            className="mobile-controls"
            role="group"
            aria-label="Mobile game controls"
          >
            <button
              className="mobile-control-btn inventory-btn"
              onClick={() => updateUIState({ showInventory: true })}
              aria-label="Open inventory"
            >
              <span role="img" aria-hidden="true">
                📦
              </span>
            </button>
            <button
              className="mobile-control-btn map-btn"
              onClick={() => updateUIState({ showWorldMap: true })}
              aria-label="Open world map"
            >
              <span role="img" aria-hidden="true">
                🗺️
              </span>
            </button>
            <button
              className="mobile-control-btn feedback-btn"
              onClick={() => updateUIState({ showFeedback: true })}
              aria-label="Open feedback form"
            >
              <span role="img" aria-hidden="true">
                💬
              </span>
            </button>
            <button
              className="mobile-control-btn accessibility-btn"
              onClick={() =>
                setMobileState((prev) => ({
                  ...prev,
                  screenReaderMode: !prev.screenReaderMode,
                }))
              }
              aria-label={
                mobileState.screenReaderMode
                  ? "Disable screen reader mode"
                  : "Enable screen reader mode"
              }
            >
              <span role="img" aria-hidden="true">
                🔊
              </span>
            </button>
          </div>
        )}

        {/* Accessibility status indicator */}
        {mobileState.screenReaderMode && (
          <div
            className="accessibility-status"
            role="status"
            aria-live="polite"
          >
            <span>Screen reader mode active</span>
          </div>
        )}

        {currentSpecialWorld === "text_adventure" && (
          <TextAdventure
            username={character?.username || "traveler"}
            onComplete={handleTextAdventureComplete}
            onExit={handleTextAdventureExit}
          />
        )}

        {/* Add ArtifactDiscovery component */}
        <ArtifactDiscovery
          artifacts={gameData.artifacts}
          characterPosition={characterPosition}
          currentMapName={MAPS[currentMapIndex].name}
          onArtifactFound={handleArtifactClick}
          character={character}
        />

        {notifications.notification && (
          <XPNotification
            message={notifications.notification.message}
            type={notifications.notification.type}
            duration={notifications.notification.duration}
            onClose={() => updateNotifications({ notification: null })}
          />
        )}

        {/* Achievement Notification */}
        {notifications.achievementNotification && (
          <AchievementNotification
            title={notifications.achievementNotification.title}
            description={notifications.achievementNotification.description}
            duration={5000}
            onClose={() =>
              updateNotifications({ achievementNotification: null })
            }
          />
        )}

        {/* Special Worlds */}
        {currentSpecialWorld === "textAdventure" && (
          <TextAdventure
            onComplete={handleTextAdventureComplete}
            onExit={handleTextAdventureExit}
            character={character}
          />
        )}

        {currentSpecialWorld === "terminal" && (
          <Level3Terminal
            onComplete={handleTerminalComplete}
            onExit={handleTerminalExit}
            character={character}
            artifacts={gameData.artifacts}
            username={character?.username || "User"}
            inventory={inventory}
          />
        )}

        {currentSpecialWorld === "shooter" && (
          <>
            {console.log("GameWorld: Rendering Level4Shooter component")}
            <Level4Shooter
              onComplete={handleShooterComplete}
              onExit={handleShooterExit}
              character={character}
            />
          </>
        )}

        {currentSpecialWorld === "hemingway" && (
          <HemingwayChallenge
            onComplete={handleHemingwayComplete}
            onExit={handleHemingwayExit}
            character={character}
          />
        )}

        {/* Debug overlay to show currentSpecialWorld state */}
        <div
          className="debug-overlay"
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "#00ff00",
            padding: "10px",
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: "monospace",
          }}
        >
          currentSpecialWorld: "{currentSpecialWorld}"
        </div>

        {/* XP Notifications */}
        <div className="notification-container">
          {notifications.xpNotifications.map((notification) => (
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
          {notifications.achievementNotifications.map((notification) => (
            <AchievementNotification
              key={notification.id}
              achievement={notification.achievement}
              onClose={() => removeAchievementNotification(notification.id)}
            />
          ))}
        </div>
      </div>
      )}
    </ErrorBoundary>
  );
});

GameWorld.displayName = "GameWorld";

export default GameWorld;
