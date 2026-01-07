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
  fetchQuests,
  completeQuestStage,
} from "../api/api";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import MapComponent from "./Map";
import WorldMap from "./WorldMap";
import FeedbackForm from "./FeedbackForm";
import { useCharacterMovement } from "./CharacterMovement";
import GameHUD from "./UI/GameHUD";
import { getPowerDefinition } from "../constants/Powers";
import ControlsGuide from "./UI/ControlsGuide";
import TouchControls from "./TouchControls";
import Minimap from "./UI/Minimap";
import CombatManager from "./Combat/CombatManager";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, isWalkable } from "./Constants";
import { MAPS } from "./GameData";
import { debugNPCSprites } from "../utils/debugTools";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";
import RewardModal from "./RewardModal";
import LevelUpModal from "./UI/LevelUpModal";
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
import ArtifactGameLauncher from "./ArtifactGameLauncher";
import MultiplayerChat from "./MultiplayerChat";
import NPCInteraction from "./NPCs/NPCInteraction";
import Dungeon from "./Dungeons/Dungeon";
import { LIBRARY_OF_ALEXANDRIA } from "./Dungeons/DungeonData";
import HamletFinale from "./MiniGames/HamletFinale";
import QuestCompletionCelebration from "./QuestCompletionCelebration";
import { useAuth } from "../context/AuthContext";
import { useAchievements } from "../context/AchievementContext";
import { useGameState } from "../context/GameStateContext";
import { useWebSocket } from "../context/WebSocketContext";
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

  // Minimap explored tiles (fog of war)
  const [exploredTiles, setExploredTiles] = useState(new Set());

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
    showControlsGuide: false,
    showWinNotification: false,
    showLevel4: false,
    showRewardModal: false,
    showNPCDialog: false,
    showWorldGuide: true,
    isPlacingArtifact: false,
    showArtifactsOnMap: true,
    isMoving: false,
    isDarkMode: false,
    inDungeon: false,
  });

  // Dungeon state
  const [dungeonState, setDungeonState] = useState({
    currentDungeon: null,
    smallKeys: 0,
    hasBossKey: false,
    dungeonEntryPosition: null, // Where player was in overworld
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

  // Combat state (Zelda-style)
  const [playerHealth, setPlayerHealth] = useState(6); // 3 hearts (6 half-hearts)
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(6);
  const [rupees, setRupees] = useState(0);
  const [keys, setKeys] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [swordType, setSwordType] = useState("wooden"); // wooden, white, magical
  const [equippedItem, setEquippedItem] = useState(null);
  const [isInvincible, setIsInvincible] = useState(false);

  // XP and Leveling System
  const [characterStats, setCharacterStats] = useState({
    experience: 0,
    level: 1,
    attack: 1,
    defense: 0,
  });
  const [movementTransition, setMovementTransition] = useState(null);
  const [verticalDirection, setVerticalDirection] = useState(null);
  const [horizontalDirection, setHorizontalDirection] = useState(null);
  const { user, updateUser } = useAuth();
  const {
    unlockAchievement,
    checkLevelAchievements,
    checkDiscoveryAchievements,
    checkCollectionAchievements,
  } = useAchievements();
  const { updateGameProgress } = useGameState();

  // WebSocket connection for multiplayer
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [worldId, setWorldId] = useState("overworld");
  const [nearbyPlayer, setNearbyPlayer] = useState(null);
  const gameWorldRef = useRef(null);
  const characterRef = useRef(null);
  const [portalNotificationActive, setPortalNotificationActive] =
    useState(false);

  // Artifact Game Launcher state
  const [currentGameArtifact, setCurrentGameArtifact] = useState(null);
  const [showGameLauncher, setShowGameLauncher] = useState(false);

  // Quest tracking state
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questStatusMap, setQuestStatusMap] = useState(new Map());
  const [questCompletionCelebration, setQuestCompletionCelebration] =
    useState(null);

  // Update checkForLevelUpAchievements to use our context
  const checkForLevelUpAchievements = useCallback(
    (experience) => {
      const level = Math.floor(experience / 100) + 1;
      checkLevelAchievements(level);
    },
    [checkLevelAchievements],
  );

  // Fetch active quests on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchQuests()
        .then((response) => {
          if (response.success) {
            setActiveQuests(response.data.activeQuests || []);
            setCompletedQuests(response.data.completedQuests || []);
          }
        })
        .catch((err) => console.error("Error fetching quests:", err));
    }
  }, [user?.id]);

  // Create quest status map for NPCs when quests or current map changes
  useEffect(() => {
    if (!MAPS[currentMapIndex]?.npcs) return;

    const statusMap = new Map();
    const currentNPCs = MAPS[currentMapIndex].npcs || [];

    currentNPCs.forEach((npc) => {
      const npcId = npc._id || npc.id;
      if (!npcId) return;

      // Check if NPC has any active quests
      const npcActiveQuests = activeQuests.filter(
        (quest) =>
          quest.npcId === npcId ||
          quest.npcId?.toString() === npcId?.toString(),
      );

      // Check if NPC has any completed quests
      const npcCompletedQuests = completedQuests.filter(
        (quest) =>
          quest.npcId === npcId ||
          quest.npcId?.toString() === npcId?.toString(),
      );

      // Check if NPC has quests in their data (available but not started)
      const hasQuestsData = npc.quests && npc.quests.length > 0;

      // Determine status: available > active > completed
      if (
        hasQuestsData &&
        npcActiveQuests.length === 0 &&
        npcCompletedQuests.length === 0
      ) {
        // Has quests in data but none started/completed = available
        statusMap.set(npcId, {
          status: "available",
          icon: "!",
          color: "#f39c12",
          title: "Has available quests!",
        });
      } else if (npcActiveQuests.length > 0) {
        // Has active quests
        statusMap.set(npcId, {
          status: "active",
          icon: "?",
          color: "#3498db",
          title: "Has active quests",
        });
      } else if (npcCompletedQuests.length > 0) {
        // Has completed quests
        statusMap.set(npcId, {
          status: "completed",
          icon: "✓",
          color: "#27ae60",
          title: "Quest completed",
        });
      }
    });

    setQuestStatusMap(statusMap);
  }, [activeQuests, completedQuests, currentMapIndex]);

  // Portal notification functions - defined early so they can be used in callbacks
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
      notification.classList.add("visible");
    }, 10);

    // Hide notification after a few seconds
    setTimeout(() => {
      notification.classList.remove("visible");
    }, 4000);
  }, []);

  const hidePortalNotification = useCallback(() => {
    const notification = document.getElementById("portal-notification");
    if (notification) {
      notification.classList.remove("active");
      notification.classList.remove("visible");
    }
  }, []);

  // UI state update function - allows partial updates
  const updateUIState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Portal activation handler - defined early so it can be used in handleKeyDown
  // Note: This function will be fully defined later with all dependencies
  // For now, we create a placeholder that will be replaced
  let handlePortalActivation = null;

  // Quest validation: Check if gameplay actions complete quest stages
  const validateQuestProgress = useCallback(
    async (actionType, actionData = {}) => {
      if (activeQuests.length === 0) return;

      for (const quest of activeQuests) {
        const currentStage = quest.stages?.[quest.currentStage];
        if (!currentStage || currentStage.completed) continue;

        const task = currentStage.task?.toLowerCase() || "";
        let shouldComplete = false;

        // Check task requirements
        if (actionType === "artifact_collected" && task.includes("collect")) {
          // Check if task mentions artifacts or specific artifact
          if (task.includes("artifact") || task.includes("item")) {
            shouldComplete = true;
          }
        } else if (
          actionType === "game_completed" &&
          task.includes("complete")
        ) {
          // Check if task mentions games or mini-games
          if (
            task.includes("game") ||
            task.includes("mini-game") ||
            task.includes("challenge")
          ) {
            shouldComplete = true;
          }
        } else if (
          actionType === "artifact_discovered" &&
          task.includes("discover")
        ) {
          shouldComplete = true;
        }

        if (shouldComplete) {
          try {
            const response = await completeQuestStage(
              quest.questId,
              quest.currentStage,
            );
            if (response.success) {
              // Refresh quests
              const questResponse = await fetchQuests();
              if (questResponse.success) {
                setActiveQuests(questResponse.data.activeQuests || []);
                setCompletedQuests(questResponse.data.completedQuests || []);
              }

              const rewards = response.data.rewards;

              // If quest is fully completed, show celebration
              if (response.data.questCompleted) {
                const completedQuest = {
                  title: quest.title,
                  description: quest.description,
                };
                setQuestCompletionCelebration({
                  quest: completedQuest,
                  rewards: rewards,
                });
              } else {
                // Show progress notification for stage completion
                let rewardText = `Quest progress!`;
                if (rewards.exp) rewardText += ` +${rewards.exp} XP`;
                if (rewards.item) rewardText += ` +${rewards.item}`;

                // Show a brief notification
                showPortalNotification("Quest Progress", rewardText);
                setTimeout(() => hidePortalNotification(), 3000);
              }
            }
          } catch (error) {
            console.error("Error completing quest stage:", error);
          }
        }
      }
    },
    [activeQuests, showPortalNotification, hidePortalNotification],
  );

  // Function to add XP and show notification
  const addExperiencePoints = useCallback(
    (amount, reason) => {
      // Update local experience state
      const newExperience = (user?.experience || 0) + amount;

      const newHealth = Math.max(0, playerHealth - damage);
      setPlayerHealth(newHealth);

      // Play damage sound
      if (soundManager) {
        soundManager.playSound("damage", 0.5);
      }

      // Trigger hit animation (retreat and flash)
      setCharacterState((prev) => ({ ...prev, isHit: true }));
      setTimeout(() => {
        setCharacterState((prev) => ({ ...prev, isHit: false }));
      }, 400); // Match CSS animation duration

      // Invincibility frames
      setIsInvincible(true);
      setTimeout(() => setIsInvincible(false), 1000);

      // Check for game over
      if (newHealth <= 0) {
        handleGameOver();
      }
    },
    [playerHealth, isInvincible, soundManager],
  );

  const handlePlayerHeal = useCallback(
    (amount) => {
      const newHealth = Math.min(maxPlayerHealth, playerHealth + amount);
      setPlayerHealth(newHealth);

      if (soundManager) {
        soundManager.playSound("heal", 0.3);
      }
    },
    [playerHealth, maxPlayerHealth, soundManager],
  );

  const handleCollectRupee = useCallback(
    (amount) => {
      setRupees((prev) => prev + amount);

      if (soundManager) {
        soundManager.playSound("rupee", 0.3);
      }
    },
    [soundManager],
  );

  const handleCollectKey = useCallback(() => {
    setKeys((prev) => prev + 1);

    if (soundManager) {
      soundManager.playSound("key", 0.3);
    }
  }, [soundManager]);

  // XP and Leveling System
  // Calculate XP required for next level
  const calculateXPForLevel = useCallback((level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }, []);

  // Handle gaining experience with level-up logic
  const handleGainExperience = useCallback(
    (amount, source = "Unknown", position = null) => {
      console.log(`Gained ${amount} XP from: ${source}`);

      // Add XP notification at enemy position
      if (position) {
        setXPNotifications((prev) => [
          ...prev,
          { amount, position, id: uuidv4() },
        ]);
      }

      setCharacterStats((prev) => {
        const newXP = prev.experience + amount;
        const xpNeeded = calculateXPForLevel(prev.level + 1);

        // Check for level up
        if (newXP >= xpNeeded) {
          const newLevel = prev.level + 1;
          const newMaxHealth = maxPlayerHealth + 2;
          const newAttack = prev.attack + 1;
          const newDefense =
            newLevel % 2 === 0 ? prev.defense + 1 : prev.defense;

          // Full heal on level up
          setPlayerHealth(newMaxHealth);
          setMaxPlayerHealth(newMaxHealth);

          // Show level-up modal
          setShowLevelUpModal(true);

          // Play level-up sound
          if (soundManager) {
            soundManager.playSound("powerup", 0.7); // Use powerup sound for now
          }

          console.log(`🌟 LEVEL UP! Now level ${newLevel}`);
          console.log(`  +2 Max Health (${newMaxHealth})`);
          console.log(`  +1 Attack (${newAttack})`);
          if (newLevel % 2 === 0) {
            console.log(`  +1 Defense (${newDefense})`);
          }

          return {
            experience: newXP,
            level: newLevel,
            attack: newAttack,
            defense: newDefense,
          };
        }

        return { ...prev, experience: newXP };
      });
    },
    [calculateXPForLevel, maxPlayerHealth, soundManager],
  );

  const handleGameOver = useCallback(() => {
    console.log("Game Over!");
    // Reset player health
    setPlayerHealth(Math.floor(maxPlayerHealth / 2)); // Respawn with half health
    // Reset position to start
    setCharacterPosition(INITIAL_CHARACTER_POSITION);

    if (soundManager) {
      soundManager.playSound("gameover", 0.5);
    }
  }, [maxPlayerHealth, soundManager]);

  // Memoized portal configuration
  const PORTAL_CONFIG = useMemo(
    () => ({
      progression: {
        Overworld: [
          {
            destination: "Overworld 2",
            spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
            condition: (x, y) => x === 8 && y === 11,
          },
          {
            destination: "Dungeon Level 1",
            spawnPosition: { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
            condition: (x, y) => x === 10 && y === 12,
          },
        ],
        "Overworld 2": {
          destination: "Overworld 3",
          spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
        },
        "Overworld 3": [
          {
            destination: "Desert 1",
            spawnPosition: { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE },
            condition: (x, y) => x === 8 && y === 0,
          },
          {
            destination: "Yosemite",
            spawnPosition: { x: 10 * TILE_SIZE, y: 20 * TILE_SIZE }, // Central spawn for larger map
            condition: (x, y) => x === 8 && y === 11,
          },
        ],
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
          spawnPosition: { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
        },
        "Dungeon Level 2": {
          destination: "Dungeon Level 3",
          spawnPosition: { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
        },
        "Dungeon Level 3": {
          destination: "Yosemite",
          spawnPosition: { x: 10 * TILE_SIZE, y: 20 * TILE_SIZE }, // Central spawn for larger map
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
  const currentMap = useMemo(() => {
    // Safety check to prevent initialization order issues
    if (typeof currentMapIndex !== "number" || !MAPS || !Array.isArray(MAPS)) {
      return MAPS?.[0] || null;
    }
    return MAPS[currentMapIndex] || MAPS[0];
  }, [currentMapIndex]);
  const currentMapNPCs = useMemo(() => currentMap?.npcs || [], [currentMap]);
  const currentMapArtifacts = useMemo(
    () => currentMap?.artifacts || [],
    [currentMap],
  );

  // Update explored tiles for minimap fog of war
  useEffect(() => {
    const tileX = Math.floor(characterPosition.x / TILE_SIZE);
    const tileY = Math.floor(characterPosition.y / TILE_SIZE);

    // Explore tiles in a radius around the player (view distance)
    const viewRadius = 3; // Explore 3 tiles in all directions

    setExploredTiles((prevExploredTiles) => {
      const newExploredTiles = new Set(prevExploredTiles);
      let hasNewTiles = false;

      for (let dy = -viewRadius; dy <= viewRadius; dy++) {
        for (let dx = -viewRadius; dx <= viewRadius; dx++) {
          const x = tileX + dx;
          const y = tileY + dy;

          // Check if tile is within map bounds
          if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) {
            const tileKey = `${x},${y}`;
            if (!newExploredTiles.has(tileKey)) {
              newExploredTiles.add(tileKey);
              hasNewTiles = true;
            }
          }
        }
      }

      // Only update if new tiles were explored
      return hasNewTiles ? newExploredTiles : prevExploredTiles;
    });
  }, [characterPosition]); // Remove exploredTiles from dependencies

  // Performance monitoring - only run occasionally to avoid render loops
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;

    // Only log slow renders occasionally (every 100th render) to avoid console spam
    if (renderTime > 16 && renderCount.current % 100 === 0) {
      console.warn(
        `Slow render detected: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`,
      );
    }

    lastRenderTime.current = now;

    // Performance mark for render - with safety checks
    if (performance.mark && renderCount.current % 100 === 0) {
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
    // Empty dependency array would prevent this from running on every render,
    // but we want to track render count, so we'll keep it running but throttle logging
  });

  // Optimized state update function
  const updateGameState = useCallback(
    (updates) => {
      const now = performance.now();
      if (now - lastUpdateTime.current < updateThrottle.current) {
        return; // Throttle updates
      }
      lastUpdateTime.current = now;

      // Artifact Game Launcher handlers
      const handleGameComplete = useCallback(
        (completionData) => {
          console.log("🎉 Game completed:", completionData);

          // Resume background music
          if (soundManager) {
            const currentMapName = MAPS[currentMapIndex]?.name || "";
            soundManager.playMusic(currentMapName);
          }

          // Validate quest progress for game completion
          validateQuestProgress("game_completed", {
            gameType: completionData.artifact?.type || "game",
            artifact: completionData.artifact,
          });

          // Close game launcher
          setShowGameLauncher(false);
          setCurrentGameArtifact(null);

          // Show completion notification
          if (completionData.artifact) {
            showPortalNotification(
              "Quest Complete!",
              `You completed ${completionData.artifact.name}!`,
            );

            // Auto-hide notification after 3 seconds
            setTimeout(() => {
              hidePortalNotification();
            }, 3000);
          }
        },
        [soundManager, currentMapIndex, validateQuestProgress],
      );

      const handleGameExit = useCallback(() => {
        console.log("🚪 Exiting game launcher");

        // Resume background music
        if (soundManager) {
          const currentMapName = MAPS[currentMapIndex]?.name || "";
          soundManager.playMusic(currentMapName);
        }

        // Close game launcher
        setShowGameLauncher(false);
        setCurrentGameArtifact(null);
      }, [soundManager, currentMapIndex]);

      // Function to handle updating character in both state and backend
      const handleUpdateCharacter = useCallback(
        (updatedCharacter) => {
          if (!updatedCharacter) return;

          console.log("Interacting with NPC:", npc.name || npc.type);

          // Special handling for Shakespeare's quest
          if (
            npc.name === "William Shakespeare" &&
            shakespeareQuest.stage === "enemies_defeated"
          ) {
            console.log("🎭 Triggering Hamlet Finale!");
            setShowHamletFinale(true);

            // Play dramatic sound
            if (soundManager) {
              soundManager.playSound("quest_start", 0.8);
            }

            if (mobileState.screenReaderMode) {
              announceToScreenReader("Beginning the Hamlet Finale challenge!");
            }
            return; // Don't show regular dialogue
          }

          // Set the active NPC and show dialog
          setActiveNPC(npc);
          updateUIState({ showNPCDialog: true });

          // Play interaction sound if available
          if (soundManager) {
            soundManager.playSound("npc_interaction");
          }

          // Add visual feedback
          if (mobileState.screenReaderMode) {
            announceToScreenReader(
              `Starting conversation with ${npc.name || npc.type}`,
            );
          }
        },
        [
          setActiveNPC,
          updateUIState,
          soundManager,
          mobileState.screenReaderMode,
          announceToScreenReader,
          shakespeareQuest.stage,
        ],
      );

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

      // Viewport adjustment function to follow character
      const adjustViewport = useCallback(
        (characterPos) => {
          if (!characterPos || typeof currentMapIndex !== "number") return;

          const gameWorldElement = document.querySelector(".game-world");
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
            const clampedX = Math.min(
              newViewportX,
              Math.max(0, mapWidth - viewportWidth),
            );
            const clampedY = Math.min(
              newViewportY,
              Math.max(0, mapHeight - viewportHeight),
            );

            setViewport({ x: clampedX, y: clampedY });
          }
        },
        [currentMapIndex, setViewport],
      );

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
                  console.error(
                    `Destination map "${destinationMap}" not found`,
                  );
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
                console.debug(
                  "Performance measurement skipped:",
                  error.message,
                );
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

      // Automatic portal activation on collision
      useEffect(() => {
        const handlePortalCollision = (event) => {
          if (portalState.isTransitioning) return;

          const { tileX, tileY, tileType } = event.detail;
          const currentMapName = currentMap?.name;

          if (!currentMapName) return;

          console.log(
            `Portal collision detected - Map: ${currentMapName}, Tile: (${tileX}, ${tileY}), Type: ${tileType}`,
          );

          // Handle progression portals (type 5)
          if (tileType === 5) {
            const progressionPortal = PORTAL_CONFIG.progression[currentMapName];
            if (progressionPortal) {
              // Handle multiple portals per map (array)
              if (Array.isArray(progressionPortal)) {
                for (const portal of progressionPortal) {
                  const { destination, spawnPosition, condition } = portal;

                  // Check if portal condition is met
                  if (condition && condition(tileX, tileY)) {
                    console.log(`✅ Auto-activating portal to ${destination}`);
                    handlePortalTransition(destination, spawnPosition);
                    return;
                  }
                }
              } else {
                // Handle single portal (object)
                const { destination, spawnPosition, condition } =
                  progressionPortal;

                // Check if portal condition is met (if any)
                if (!condition || condition(tileX, tileY)) {
                  console.log(`✅ Auto-activating portal to ${destination}`);
                  handlePortalTransition(destination, spawnPosition);
                  return;
                }
              }
            }
          }

          // Handle special portals in Yosemite (types 6-8)
          if (currentMapName === "Yosemite" && tileType >= 6 && tileType <= 8) {
            const specialPortal = PORTAL_CONFIG.special[tileX];

            if (specialPortal && tileY === 1) {
              console.log(
                `✅ Auto-activating special portal: ${specialPortal.title}`,
              );

              // Activate the special world directly
              if (specialPortal.type === "terminal") {
                setCurrentSpecialWorld("terminal");
              } else if (specialPortal.type === "shooter") {
                setCurrentSpecialWorld("shooter");
              } else if (specialPortal.type === "text_adventure") {
                setCurrentSpecialWorld("text_adventure");
              }

              updatePortalState({
                activePortal: specialPortal,
                portalNotificationActive: true,
              });
              return;
            }
          }
        };

        window.addEventListener("portalCollision", handlePortalCollision);
        return () => {
          window.removeEventListener("portalCollision", handlePortalCollision);
        };
      }, [
        portalState.isTransitioning,
        currentMap,
        PORTAL_CONFIG,
        handlePortalTransition,
        updatePortalState,
      ]);

      // Optimized portal activation handler with improved detection and feedback (kept for manual SPACE activation)
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

          console.log(
            `Manual portal activation attempt - Map: ${currentMapName}, Player position: (${playerTileX}, ${playerTileY})`,
          );

          // Check for dungeon portal (tile type 9)
          const currentMapData = currentMap?.data;
          if (
            currentMapData &&
            playerTileY >= 0 &&
            playerTileY < currentMapData.length
          ) {
            const row = currentMapData[playerTileY];
            if (row && playerTileX >= 0 && playerTileX < row.length) {
              const tileType = row[playerTileX];
              if (tileType === 9) {
                // Dungeon portal detected!
                console.log("🏰 Dungeon portal detected!");

                // Check if there's a special portal defined for this location
                const dungeonPortal = currentMap?.specialPortals?.find(
                  (portal) =>
                    portal.position.x === playerTileX &&
                    portal.position.y === playerTileY &&
                    portal.type === "dungeon",
                );

                if (dungeonPortal) {
                  console.log(`✅ Entering ${dungeonPortal.name}`);
                  handleEnterDungeon(dungeonPortal.destination);
                  return;
                }
              }
            }
          }

          // Check progression portals
          const progressionPortal = PORTAL_CONFIG.progression[currentMapName];
          if (progressionPortal) {
            // Handle multiple portals per map (array)
            if (Array.isArray(progressionPortal)) {
              for (const portal of progressionPortal) {
                const { destination, spawnPosition, condition } = portal;
                console.log(
                  `Checking progression portal to ${destination}, condition:`,
                  condition,
                );

                if (condition && condition(playerTileX, playerTileY)) {
                  console.log(`✅ Activating portal to ${destination}`);
                  handlePortalTransition(destination, spawnPosition);
                  return;
                }
              }
              console.log(`❌ Portal condition not met`);
              showWorldAnnouncement(
                "Find the correct portal location to proceed",
              );
            } else {
              // Handle single portal (object)
              const { destination, spawnPosition, condition } =
                progressionPortal;
              console.log(
                `Checking progression portal to ${destination}, condition:`,
                condition,
              );

              if (!condition || condition(playerTileX, playerTileY)) {
                console.log(`✅ Activating portal to ${destination}`);
                handlePortalTransition(destination, spawnPosition);
                return;
              } else {
                console.log(`❌ Portal condition not met for ${destination}`);
                showWorldAnnouncement(
                  "Find the correct portal location to proceed",
                );
              }
            }
          }

          // Check special portals in Yosemite
          if (currentMapName === "Yosemite") {
            const specialPortal = PORTAL_CONFIG.special[playerTileX];
            console.log(
              `Checking special portal at X=${playerTileX}, Y=${playerTileY}:`,
              specialPortal,
            );

            if (specialPortal && playerTileY === 1) {
              console.log(
                `✅ Activating special portal: ${specialPortal.title}`,
              );
              updatePortalState({
                activePortal: specialPortal,
                portalNotificationActive: true,
              });
              showPortalNotification(
                specialPortal.title,
                specialPortal.message,
              );
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

      // =====================================
      // Add to inventory
      setInventory((prev) => [
        ...prev,
        {
          id: "wand_of_prospero",
          name: "Wand of Prospero",
          description:
            "A mystical staff from The Tempest, capable of conjuring storms and bending reality itself",
          type: "MAGIC_WEAPON",
          power: 50,
          special: "conjure_storm",
        },
      ]);

      // Award XP
      handleGainExperience(result.exp || 100, "Completed Hamlet Finale");

      // Close the finale
      setShowHamletFinale(false);

      // Show achievement
      if (soundManager) {
        soundManager.playSound("powerup", 0.8);
      }

      console.log("⚔️ Wand of Prospero obtained!");
    },
    [handleGainExperience, soundManager],
  );

  // Boss defeat
  const handleBossDefeat = useCallback(
    (dungeonId) => {
      console.log(`🎉 Boss defeated in: ${dungeonId}`);

      // Play boss defeat fanfare
      if (soundManager) {
        soundManager.playSound("boss_defeat", 1.0);
      }

      // Award massive XP
      handleGainExperience(100, "Boss defeated");

      // Mark dungeon as complete
      console.log("🏆 Dungeon complete! Treasure revealed.");

      // Optionally: Track dungeon completion in gameData
      // This allows for future features like dungeon tracker, etc.
    },
    [soundManager, handleGainExperience],
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
        case "c":
        case "C":
        case "?":
          updateUIState({ showControlsGuide: !uiState.showControlsGuide });
          if (mobileState.screenReaderMode) {
            const message = uiState.showControlsGuide
              ? "Closing controls guide"
              : "Opening keyboard controls guide";
            announceToScreenReader(message);
          }
          break;
        case "Escape":
          updateUIState({
            showInventory: false,
            showQuotes: false,
            showWorldMap: false,
            showFeedback: false,
            showControlsGuide: false,
            showForm: false,
          });
          if (mobileState.screenReaderMode) {
            announceToScreenReader("Closed all menus");
          }
          break;
        case " ":
          handlePortalActivation(event);
          break;
        case "z":
        case "Z":
          // Sword attack with cooldown and AUTO-TARGETING
          const now = Date.now();
          const ATTACK_COOLDOWN = 400; // ms between attacks

          if (
            !isAttacking &&
            now - lastAttackTimeRef.current >= ATTACK_COOLDOWN
          ) {
            lastAttackTimeRef.current = now;

            // AUTO-TARGET: Find closest enemy and face them
            const enemies = document.querySelectorAll('[data-hitbox="enemy"]');
            let closestEnemy = null;
            let closestDistance = Infinity;

            enemies.forEach((enemyElement) => {
              const enemyRect = enemyElement.getBoundingClientRect();
              const enemyX = parseFloat(enemyElement.style.left) || 0;
              const enemyY = parseFloat(enemyElement.style.top) || 0;

              const dx = enemyX - characterPosition.x;
              const dy = enemyY - characterPosition.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < closestDistance && distance < 150) {
                // 150px auto-target range
                closestDistance = distance;
                closestEnemy = { x: enemyX, y: enemyY, dx, dy };
              }
            });

            // Face the closest enemy
            if (closestEnemy) {
              const { dx, dy } = closestEnemy;
              let targetDirection = characterState.direction;

              // Determine which direction to face based on angle to enemy
              if (Math.abs(dx) > Math.abs(dy)) {
                targetDirection = dx > 0 ? "right" : "left";
              } else {
                targetDirection = dy > 0 ? "down" : "up";
              }

              // Update character direction to face enemy
              setCharacterState((prev) => ({
                ...prev,
                direction: targetDirection,
              }));
            }

            setIsAttacking(true);
            if (soundManager) {
              soundManager.playSound("sword", 0.3);
            }
            // CombatManager will reset attack state via onAttackComplete
            if (mobileState.screenReaderMode) {
              announceToScreenReader("Sword attack");
            }
          }
          event.preventDefault();
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

    console.log(
      "Map music check - Map:",
      currentMapName,
      "Track:",
      newMusicTrack,
    );

    // Only change music if we have a valid track and it's different from current
    if (newMusicTrack) {
      try {
        // Check if we're already playing this track by comparing current music
        const shouldChangeMusic =
          !soundManager.currentMusic ||
          soundManager.currentMusic !== newMusicTrack;

        if (shouldChangeMusic) {
          console.log(
            "Changing music from",
            soundManager.currentMusic,
            "to",
            newMusicTrack,
          );

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
      // Handle multiple portals per map (array)
      const portals = Array.isArray(progressionPortal)
        ? progressionPortal
        : [progressionPortal];

      for (const portal of portals) {
        const { condition } = portal;

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

        if (nearPortal) break;
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
  }, [
    characterPosition,
    currentMap,
    PORTAL_CONFIG,
    portalState.portalNotificationActive,
  ]);

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
      const isFirstView =
        !Array.isArray(gameData.viewedArtifacts) ||
        !gameData.viewedArtifacts.includes(artifact.id);

      // Update viewed artifacts
      if (isFirstView) {
        const updatedViewedArtifacts = [
          ...(Array.isArray(gameData.viewedArtifacts)
            ? gameData.viewedArtifacts
            : []),
          artifact.id,
        ];
        updateGameState({ viewedArtifacts: updatedViewedArtifacts });
        localStorage.setItem(
          "viewedArtifacts",
          JSON.stringify(updatedViewedArtifacts),
        );

        // Award XP for discovering a new artifact - with safety check
        if (typeof awardXP === "function") {
          awardXP(15, `Discovered ${artifact.name}`);
        }

        // Check for discovery achievements
        if (typeof checkDiscoveryAchievements === "function") {
          checkDiscoveryAchievements(updatedViewedArtifacts.length);
        }
      } else {
        // Award smaller XP for revisiting an artifact - with safety check
        if (typeof awardXP === "function") {
          awardXP(2, "Revisited an artifact");
        }
      }

      // Select the artifact to display details
      if (typeof setVisibleArtifact === "function") {
        setVisibleArtifact(artifact);
      }

      // Save game state if user is logged in
      if (user && typeof updateGameProgress === "function") {
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

  // Get active powers from user
  const activePowers = user?.activePowers || [];

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
    activePowers, // Pass active powers to movement hook
  );

  // Update characterStyle and movement state when position or direction changes
  useEffect(() => {
    // Update character position in the style
    setCharacterState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        left: characterPosition.x,
        top: characterPosition.y,
      },
    }));

    // Adjust viewport to follow character
    adjustViewport(characterPosition);
  }, [characterPosition, adjustViewport]);

  // Separate effect for handling movement animations to avoid infinite loops
  useEffect(() => {
    // Update movement state based on movementDirection
    if (characterMovement.movementDirection) {
      // Build all state updates at once to minimize re-renders
      const stateUpdates = {
        direction: characterMovement.movementDirection,
      };

      // Track vertical and horizontal components separately
      if (
        characterMovement.movementDirection === "up" ||
        characterMovement.movementDirection === "down"
      ) {
        stateUpdates.verticalDirection = characterMovement.movementDirection;
      } else if (
        characterMovement.movementDirection === "left" ||
        characterMovement.movementDirection === "right"
      ) {
        stateUpdates.horizontalDirection = characterMovement.movementDirection;
      }

      // Process diagonal movement from useCharacterMovement
      if (characterMovement.diagonalMovement) {
        if (characterMovement.diagonalMovement.y < 0) {
          stateUpdates.verticalDirection = "up";
        } else if (characterMovement.diagonalMovement.y > 0) {
          stateUpdates.verticalDirection = "down";
        }

        if (characterMovement.diagonalMovement.x < 0) {
          stateUpdates.horizontalDirection = "left";
        } else if (characterMovement.diagonalMovement.x > 0) {
          stateUpdates.horizontalDirection = "right";
        }
      }

      stateUpdates.movementTransition = "start-move";

      // Apply all updates at once
      setCharacterState((prev) => ({ ...prev, ...stateUpdates }));

      // After start animation, set to walking
      const walkTimeout = setTimeout(() => {
        setCharacterState((prev) => ({
          ...prev,
          isMoving: true,
          movementTransition: null,
        }));
      }, 200);

      // Reset isMoving after animation completes with stop animation
      const stopTimeout = setTimeout(() => {
        setCharacterState((prev) => ({
          ...prev,
          movementTransition: "stop-move",
        }));

        // After stop animation, reset to idle
        setTimeout(() => {
          setCharacterState((prev) => {
            const shouldResetDirections =
              !characterMovement.diagonalMovement ||
              (characterMovement.diagonalMovement.x === 0 &&
                characterMovement.diagonalMovement.y === 0);

            return {
              ...prev,
              isMoving: false,
              movementTransition: null,
              ...(shouldResetDirections && {
                verticalDirection: null,
                horizontalDirection: null,
              }),
            };
          });
        }, 200);
      }, 400);

      return () => {
        clearTimeout(walkTimeout);
        clearTimeout(stopTimeout);
      };
    }
  }, [characterMovement.movementDirection, characterMovement.diagonalMovement]);

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

    // Check for both regular portals and artifact game interactions
    checkArtifactGameInteractions();
    checkBothArtifactSources();
  }, [characterPosition, currentMapIndex, artifacts]);

  useEffect(() => {
    // Subscribe to position changes to detect and handle artifact interactions
    const checkArtifactGameInteractions = () => {
      if (!characterPosition || !artifacts?.length) return;

      const currentMapName = MAPS[currentMapIndex]?.name || "";

      // Find game artifacts in the current area that the character is near
      const gameArtifacts = artifacts.filter(
        (artifact) =>
          artifact.area === currentMapName &&
          [
            "shooter_experience",
            "text_adventure_world",
            "terminal_challenge",
          ].includes(artifact.type) &&
          artifact.isInteractive,
      );

      // Check if character is close enough to any game artifact
      for (const artifact of gameArtifacts) {
        if (!artifact.position) continue;

        const artifactX = artifact.position.x;
        const artifactY = artifact.position.y;
        const distance = Math.sqrt(
          Math.pow(characterPosition.x - artifactX, 2) +
            Math.pow(characterPosition.y - artifactY, 2),
        );

        // If within interaction range (approximately 1.5 tiles)
        if (distance <= TILE_SIZE * 1.5) {
          // Show interaction notification
          if (!portalNotificationActive) {
            showPortalNotification(
              artifact.name,
              `Press SPACE to play ${artifact.name}`,
            );
            setPortalNotificationActive(true);

            // Handle space key press to launch the game
            const handleGameLaunch = (e) => {
              if (e.code === "Space" && distance <= TILE_SIZE * 1.5) {
                // Play interaction sound
                if (soundManager) {
                  soundManager.playSound("portal");
                }

                // Hide notification
                hidePortalNotification();
                setPortalNotificationActive(false);

                // Set current game artifact and show launcher
                setCurrentGameArtifact(artifact);
                setShowGameLauncher(true);

                // Stop background music for immersive game experience
                if (soundManager) {
                  soundManager.stopMusic(true);
                }

                // Remove event listener
                window.removeEventListener("keydown", handleGameLaunch);
              }
            };

            // Add event listener
            window.addEventListener("keydown", handleGameLaunch);

            // Cleanup function
            return () => {
              window.removeEventListener("keydown", handleGameLaunch);
              setPortalNotificationActive(false);
            };
          }

          // Break once we find an artifact in range
          break;
        }
      }
    };

    const checkPortalCollisions = () => {
      if (!characterPosition) return;

      const row = Math.floor(characterPosition.y / TILE_SIZE);
      const col = Math.floor(characterPosition.x / TILE_SIZE);

      // Handle regular portals (type 5) for any map
      if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 5) {
        // Get the current map's name
        const currentMapName = MAPS[currentMapIndex]?.name || "";

        // For Yosemite map, handle type 5 portal specially to return to Overworld 3
        if (currentMapName === "Yosemite") {
          // Notify user they're on a regular portal
          if (!portalNotificationActive) {
            showPortalNotification(
              "Return to Overworld 3",
              "Press SPACE to return to Overworld 3",
            );
            setPortalNotificationActive(true);

            // When space is pressed while on this tile, go back to Overworld 3
            const handleRegularPortalEnter = (e) => {
              if (
                e.code === "Space" &&
                MAPS[currentMapIndex]?.data?.[row]?.[col] === 5 &&
                currentMapName === "Yosemite"
              ) {
                // Play portal sound
                if (soundManager) {
                  soundManager.playSound("portal");
                }

                // Hide the portal notification
                hidePortalNotification();
                setPortalNotificationActive(false);

                // Find Overworld 3 map index
                const destinationIndex = MAPS.findIndex(
                  (map) => map.name === "Overworld 3",
                );
                if (destinationIndex !== -1) {
                  // Change map to Overworld 3
                  setCurrentMapIndex(destinationIndex);
                  // Set character position near the portal to Yosemite
                  setCharacterPosition({ x: 8, y: 2 });

                  // Announce the world name
                  const portalAnnouncement = document.createElement("div");
                  portalAnnouncement.className = "world-announcement";
                  portalAnnouncement.innerHTML =
                    "<h2>Welcome back to Overworld 3</h2>";
                  document.body.appendChild(portalAnnouncement);

                  // Remove the announcement after a few seconds
                  setTimeout(() => {
                    portalAnnouncement.classList.add("fade-out");
                    setTimeout(() => {
                      document.body.removeChild(portalAnnouncement);
                    }, 1000);
                  }, 3000);
                } else {
                  console.error("Destination map Overworld 3 not found");
                }

                // Remove the event listener
                window.removeEventListener("keydown", handleRegularPortalEnter);
              }
            };

            // Add temporary event listener for space key
            window.addEventListener("keydown", handleRegularPortalEnter);

            // Clean up function to remove listener when player moves away
            return () => {
              window.removeEventListener("keydown", handleRegularPortalEnter);
              setPortalNotificationActive(false);
            };
          }
        }
        // For all other maps, handle type 5 portal with the standard progression
        else {
          // Save current position as a checkpoint before transitioning
          gameStateManager.saveCheckpoint(currentMapName, {
            ...characterPosition,
          });

          // Define destination based on current map - making progression more logical
          let destinationMap = null;
          let spawnPosition = { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }; // Default spawn

          // Logical world progression paths
          if (currentMapName === "Overworld") {
            destinationMap = "Overworld 2";
          } else if (currentMapName === "Overworld 2") {
            destinationMap = "Overworld 3";
          } else if (currentMapName === "Overworld 3") {
            // Need to check for specific portal coordinates to determine destination
            const portalX = Math.floor(characterPosition.x / TILE_SIZE);
            const portalY = Math.floor(characterPosition.y / TILE_SIZE);

            // Special Yosemite portal is at x=8, y=1 in Overworld 3
            if (portalX === 8 && portalY === 1) {
              destinationMap = "Yosemite";
              // Reset the level1 completed flag for testing purposes
              try {
                localStorage.removeItem("level-level1-completed");
                localStorage.removeItem("nkd-man-reward-shown");
                console.log("🏆 Reset level1 completion flags for testing");
              } catch (error) {
                console.error("Error resetting level completion flags:", error);
              }
            } else {
              // Default portal in Overworld 3 goes to Desert 1
              destinationMap = "Desert 1";
            }
          } else if (currentMapName === "Desert 1") {
            destinationMap = "Desert 2";
          } else if (currentMapName === "Desert 2") {
            destinationMap = "Desert 3";
          } else if (currentMapName === "Desert 3") {
            destinationMap = "Dungeon Level 1";
          } else if (currentMapName === "Dungeon Level 1") {
            destinationMap = "Dungeon Level 2";
          } else if (currentMapName === "Dungeon Level 2") {
            destinationMap = "Dungeon Level 3";
          } else if (currentMapName === "Dungeon Level 3") {
            // Change to go to Yosemite instead of directly to Text Adventure
            destinationMap = "Yosemite";
          }

          // Find the index of the destination map
          const destinationIndex = MAPS.findIndex(
            (map) => map.name === destinationMap,
          );

          if (destinationIndex !== -1) {
            // Play portal sound
            if (soundManager) soundManager.playSound("portal");

            // Change map
            setCurrentMapIndex(destinationIndex);
            setCharacterPosition(spawnPosition);

            // Announce the world name
            const portalAnnouncement = document.createElement("div");
            portalAnnouncement.className = "world-announcement";
            portalAnnouncement.innerHTML = `<h2>Welcome to ${destinationMap}</h2>`;
            document.body.appendChild(portalAnnouncement);

            // Remove the announcement after a few seconds
            setTimeout(() => {
              portalAnnouncement.classList.add("fade-out");
              setTimeout(() => {
                document.body.removeChild(portalAnnouncement);
              }, 1000);
            }, 3000);

            // Check if this is the path to Yosemite (Level 1 completion)
            if (destinationMap === "Yosemite") {
              // Add slight delay to show portal transition first
              setTimeout(() => {
                handleLevelCompletion("level1");
              }, 800);
            }
          } else {
            console.error(`Destination map "${destinationMap}" not found`);
          }
        }
      }

      // Handle special portals in Yosemite map
      const currentMapName = MAPS[currentMapIndex]?.name || "";
      if (currentMapName === "Yosemite") {
        // Terminal portal (code 6)
        if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 6) {
          // Notify user they're on a mysterious portal
          if (!portalNotificationActive) {
            showPortalNotification(
              "Mysterious Portal",
              "Press SPACE to investigate this strange energy",
            );
            setPortalNotificationActive(true);

            // When space is pressed while on this tile, enter the terminal
            const handleTerminalEnter = (e) => {
              if (
                e.code === "Space" &&
                MAPS[currentMapIndex]?.data?.[row]?.[col] === 6 &&
                currentMapName === "Yosemite"
              ) {
                // Play portal sound
                if (soundManager) {
                  // Stop Yosemite music first
                  soundManager.stopMusic(true);
                  // Play portal sound
                  soundManager.playSound("portal");
                }
                // Hide the portal notification before launching terminal
                hidePortalNotification();
                setPortalNotificationActive(false);
                // Launch terminal special world
                setCurrentSpecialWorld("terminal");
                // Remove the event listener
                window.removeEventListener("keydown", handleTerminalEnter);
              }
            };

            // Add temporary event listener for space key
            window.addEventListener("keydown", handleTerminalEnter);

            // Clean up function to remove listener when player moves away
            return () => {
              window.removeEventListener("keydown", handleTerminalEnter);
              setPortalNotificationActive(false);
            };
          }
        }

        // Shooter portal (code 7)
        else if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 7) {
          // Notify user they're on a mysterious portal
          if (!portalNotificationActive) {
            showPortalNotification(
              "Mysterious Portal",
              "Press SPACE to investigate this strange energy",
            );
            setPortalNotificationActive(true);

            // When space is pressed while on this tile, enter the shooter
            const handleShooterEnter = (e) => {
              if (
                e.code === "Space" &&
                MAPS[currentMapIndex]?.data?.[row]?.[col] === 7 &&
                currentMapName === "Yosemite"
              ) {
                console.log(
                  "SHOOTER PORTAL: Space key pressed on shooter portal",
                );

                // Play portal sound
                if (soundManager) {
                  // Stop Yosemite music first
                  soundManager.stopMusic(true);
                  // Play portal sound
                  soundManager.playSound("portal");
                  console.log("SHOOTER PORTAL: Portal sound played");
                }
                // Hide the portal notification before launching shooter
                hidePortalNotification();
                setPortalNotificationActive(false);
                // Launch shooter special world
                console.log(
                  "SHOOTER PORTAL: Setting currentSpecialWorld to 'shooter'",
                );
                setCurrentSpecialWorld("shooter");
                console.log(
                  "SHOOTER PORTAL: State updated, should render Level4Shooter now",
                );

                // Remove the event listener
                window.removeEventListener("keydown", handleShooterEnter);
              }
            };

            // Add temporary event listener for space key
            window.addEventListener("keydown", handleShooterEnter);

            // Clean up function to remove listener when player moves away
            return () => {
              window.removeEventListener("keydown", handleShooterEnter);
              setPortalNotificationActive(false);
            };
          }
        }

        // Text Adventure portal (code 8)
        else if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 8) {
          // Notify user they're on a mysterious portal
          if (!portalNotificationActive) {
            showPortalNotification(
              "Mysterious Portal",
              "Press SPACE to investigate this strange energy",
            );
            setPortalNotificationActive(true);

            // When space is pressed while on this tile, enter the text adventure
            const handleTextEnter = (e) => {
              if (
                e.code === "Space" &&
                MAPS[currentMapIndex]?.data?.[row]?.[col] === 8 &&
                currentMapName === "Yosemite"
              ) {
                // Play portal sound
                if (soundManager) {
                  // Stop Yosemite music first
                  soundManager.stopMusic(true);
                  // Play portal sound
                  soundManager.playSound("portal");
                }
                // Hide the portal notification before launching text adventure
                hidePortalNotification();
                setPortalNotificationActive(false);
                // Launch text adventure special world
                setCurrentSpecialWorld("text_adventure");
                // Remove the event listener
                window.removeEventListener("keydown", handleTextEnter);
              }
            };

            // Add temporary event listener for space key
            window.addEventListener("keydown", handleTextEnter);

            // Clean up function to remove listener when player moves away
            return () => {
              window.removeEventListener("keydown", handleTextEnter);
              setPortalNotificationActive(false);
            };
          }
        } else {
          // Reset portal notification when not on a special portal
          if (portalNotificationActive) {
            hidePortalNotification();
            setPortalNotificationActive(false);
          }
        }
      }

      // Legacy level completion logic (for backwards compatibility)
      if (currentMapIndex === 1 && row === 0 && col === 19) {
        handleLevelCompletion("level2");
      } else if (
        currentMapIndex === 2 &&
        !levelCompletion.level3 &&
        character?.qualifyingArtifacts?.level3
      ) {
        handleLevelCompletion("level3");
      }
    };

    checkPortalCollisions();
  }, [characterPosition, currentMapIndex, character, levelCompletion]);

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
        if (typeof awardXP === "function") {
          awardXP(50, "Created a new artifact");
        }

        // Check for creator achievement
        if (character && character.id) {
          const createdCount =
            (Array.isArray(gameData.artifacts)
              ? gameData.artifacts.filter((a) => a.createdBy === character.id)
                  .length
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
      const clickedArtifact = artifacts.find(
        (artifact) => artifact.id === artifactId,
      );
      if (!clickedArtifact) return;

      // Check if this artifact was already viewed
      const isFirstView = !viewedArtifacts.includes(artifactId);

      // Update viewed artifacts
      if (isFirstView) {
        const updatedViewedArtifacts = [...viewedArtifacts, artifactId];
        setViewedArtifacts(updatedViewedArtifacts);
        localStorage.setItem(
          "viewedArtifacts",
          JSON.stringify(updatedViewedArtifacts),
        );

        // Award XP for discovering a new artifact
        addExperiencePoints(15, `Discovered ${clickedArtifact.name}`);

        // Validate quest progress for artifact discovery
        validateQuestProgress("artifact_discovered", {
          artifact: clickedArtifact,
        });

        // Check for discovery achievements
        checkDiscoveryAchievements(updatedViewedArtifacts.length);
      } else {
        // Award smaller XP for revisiting an artifact
        awardXP(2, "Revisited an artifact");
      }

      // Select the artifact to display details
      setVisibleArtifact(clickedArtifact);

      // Save game state if user is logged in
      if (user && typeof updateGameProgress === "function") {
        const gameState = {
          inventory,
          viewedArtifacts: isFirstView
            ? [...viewedArtifacts, artifactId]
            : viewedArtifacts,
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
      artifacts,
      viewedArtifacts,
      user,
      inventory,
      characterPosition,
      currentMapIndex,
      addExperiencePoints,
      awardXP,
      checkDiscoveryAchievements,
      setVisibleArtifact,
      validateQuestProgress,
      updateGameProgress,
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
            Math.floor(npc.position.y / TILE_SIZE) === tileY,
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
    [
      gameData.artifacts,
      handleNPCInteraction,
      handleArtifactClick,
      currentMapIndex,
    ],
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
      setPortalNotificationActive(false);

      // Award XP and show notification
      awardXP(100, "Completed Terminal Adventure!");

      // Validate quest progress for game completion
      validateQuestProgress("game_completed", { gameType: "terminal", score });

      // Grant achievement
      handleAchievementUnlocked(
        "terminal_master",
        "Terminal Master",
        "Successfully navigated through the command line challenges",
      );

      // Exit the terminal adventure
      setCurrentSpecialWorld(null);
    },
    [awardXP, handleAchievementUnlocked, validateQuestProgress],
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
      awardXP(xpAmount, `Shooter Score: ${score}`);

      // Validate quest progress for game completion
      validateQuestProgress("game_completed", { gameType: "shooter", score });

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
    if (
      !gameData.artifacts ||
      !Array.isArray(gameData.artifacts) ||
      !MAPS ||
      !MAPS[currentMapIndex]
    ) {
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

  return (
    <ErrorBoundary>
      {/* Initialization guard to prevent render-order issues */}
      {!isInitialized ? (
        <div
          className="game-loading"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "transparent",
            color: "#fff",
            fontSize: "18px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          Loading...
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
            Use arrow keys or WASD to move. Press I for inventory, M for map, C
            for controls guide, F for feedback, T to talk to NPCs, H for high
            contrast mode, R for reduced motion, S for screen reader mode. Press
            Escape to close menus.
          </div>

          {/* Screen reader announcements */}
          <div
            id="screen-reader-announcements"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />

          {/* Zelda-style HUD */}
          <GameHUD
            health={playerHealth}
            maxHealth={maxPlayerHealth}
            rupees={rupees}
            keys={keys}
            currentArea={MAPS[currentMapIndex]?.name || "Overworld"}
            equippedItem={equippedItem}
            experience={characterStats.experience}
            level={characterStats.level}
            experienceToNextLevel={calculateXPForLevel(
              characterStats.level + 1,
            )}
            isDamaged={characterState.isHit}
          />

          {/* Minimap with fog of war */}
          <Minimap
            mapData={MAPS[currentMapIndex]?.data || []}
            playerPosition={characterPosition}
            npcs={MAPS[currentMapIndex]?.npcs || []}
            portals={MAPS[currentMapIndex]?.specialPortals || []}
            tileSize={TILE_SIZE}
            exploredTiles={exploredTiles}
            currentArea={MAPS[currentMapIndex]?.name || "Overworld"}
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
                  Array.isArray(MAPS) &&
                  MAPS[currentMapIndex]?.data?.[0]?.length
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
              {/* Conditional rendering: Dungeon or Overworld */}
              {uiState.inDungeon && dungeonState.currentDungeon ? (
                <Dungeon
                  dungeonData={dungeonState.currentDungeon}
                  playerPosition={characterPosition}
                  onPlayerMove={setCharacterPosition}
                  onCollectItem={handleDungeonItemCollect}
                  onEnemyDefeat={handleDungeonEnemyDefeat}
                  onBossDefeat={handleBossDefeat}
                  onExit={handleExitDungeon}
                  playerKeys={dungeonState.smallKeys}
                  hasBossKey={dungeonState.hasBossKey}
                  characterRef={characterRef}
                />
              ) : (
                MAPS[currentMapIndex] && (
                  <MapComponent
                    mapData={MAPS[currentMapIndex].data}
                    npcs={
                      MAPS[currentMapIndex].npcs?.filter(
                        (npc) => npc && npc.position,
                      ) || []
                    }
                    artifacts={
                      !uiState.showArtifactsOnMap ? [] : artifactsToShow
                    }
                    onTileClick={handleMapTileClick}
                    onNPCClick={handleNPCClick}
                    onArtifactClick={handleArtifactClick}
                    mapName={MAPS[currentMapIndex].name}
                    questStatusMap={questStatusMap}
                  />
                )
              )}

              {/* Player Character */}
              <div
                className={`character ${uiState.isMoving ? "walking" : ""} ${characterState.direction} ${characterState.verticalDirection !== characterState.direction && characterState.verticalDirection ? characterState.verticalDirection : ""} ${characterState.horizontalDirection !== characterState.direction && characterState.horizontalDirection ? characterState.horizontalDirection : ""} ${characterState.movementTransition || ""} ${isInvincible ? "character-invincible" : ""} ${characterState.isHit ? "character-hit" : ""}`}
                style={{
                  ...characterState.style,
                  // Use custom character sprite if available, otherwise fallback to default
                  ...(user?.characterSprite
                    ? {
                        background: `url(${user.characterSprite}) no-repeat center center`,
                        backgroundSize: "cover",
                        imageRendering: "pixelated",
                      }
                    : {}),
                }}
                ref={characterRef}
                role="img"
                aria-label={`${user?.characterName || "Player"} at position ${Math.round(characterPosition.x / TILE_SIZE)}, ${Math.round(characterPosition.y / TILE_SIZE)}`}
                data-testid="character"
              />

              {/* Other Players */}
              {otherPlayers.map((player) => (
                <div
                  key={player.userId}
                  className="other-player"
                  style={{
                    position: "absolute",
                    left: `${player.position.x}px`,
                    top: `${player.position.y}px`,
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    zIndex: 10,
                  }}
                >
                  <div className="other-player-avatar">
                    <img
                      src={player.avatar || "/assets/default-avatar.svg"}
                      alt={player.username}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        border: "2px solid #3498db",
                      }}
                    />
                  </div>
                  <div className="other-player-name">{player.username}</div>
                </div>
              ))}

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
                  onClick={() => updateUIState({ showControlsGuide: true })}
                  tooltip="Keyboard Controls (C)"
                >
                  <i className="fas fa-keyboard"></i>
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

              {/* Active Quest Display */}
              {activeQuests.length > 0 && (
                <div className="active-quest-hud">
                  <div className="quest-hud-header">
                    <i className="fas fa-scroll"></i>
                    <span>
                      Active Quest{activeQuests.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {activeQuests.slice(0, 2).map((quest) => {
                    const completedStages =
                      quest.stages?.filter((s) => s.completed).length || 0;
                    const totalStages = quest.stages?.length || 0;
                    const progress =
                      totalStages > 0
                        ? (completedStages / totalStages) * 100
                        : 0;
                    const currentStage = quest.stages?.[quest.currentStage];

                    return (
                      <div key={quest.questId} className="quest-hud-item">
                        <div className="quest-hud-title">{quest.title}</div>
                        <div className="quest-hud-progress">
                          <div className="quest-hud-progress-bar">
                            <div
                              className="quest-hud-progress-fill"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="quest-hud-progress-text">
                            {completedStages}/{totalStages}
                          </span>
                        </div>
                        {currentStage && !currentStage.completed && (
                          <div className="quest-hud-current-task">
                            {currentStage.task}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeQuests.length > 2 && (
                    <div className="quest-hud-more">
                      +{activeQuests.length - 2} more quest
                      {activeQuests.length - 2 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
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

          {/* Display keyboard controls guide */}
          {uiState.showControlsGuide && (
            <ControlsGuide
              onClose={() => updateUIState({ showControlsGuide: false })}
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

          {/* XP Notifications */}
          {xpNotifications.map((notification) => (
            <XPNotification
              key={notification.id}
              amount={notification.amount}
              position={notification.position}
              onComplete={() => {
                setXPNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id),
                );
              }}
            />
          ))}

          {/* Level Up Modal */}
          {showLevelUpModal && (
            <LevelUpModal
              level={characterStats.level}
              stats={characterStats}
              onClose={() => setShowLevelUpModal(false)}
            />
          )}

          {/* Hamlet Finale Mini-Game */}
          {showHamletFinale && (
            <HamletFinale
              onComplete={handleHamletFinaleComplete}
              onExit={() => setShowHamletFinale(false)}
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
              onQuestUpdate={async () => {
                // Refresh quests when a quest is updated
                const questResponse = await fetchQuests();
                if (questResponse.success) {
                  setActiveQuests(questResponse.data.activeQuests || []);
                  setCompletedQuests(questResponse.data.completedQuests || []);
                }
              }}
            />
          )}

          {/* Quest Completion Celebration */}
          {questCompletionCelebration && (
            <QuestCompletionCelebration
              quest={questCompletionCelebration.quest}
              rewards={questCompletionCelebration.rewards}
              onClose={() => setQuestCompletionCelebration(null)}
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
                    Press M to view World Map | Press F for Feedback | Press T
                    to talk to NPCs
                  </span>
                )}
              </div>
            )}

          {/* Mobile touch controls - Directional pad for movement */}
          {mobileState.showTouchControls &&
            mobileState.touchControlsEnabled &&
            characterMovement.handleMove && (
              <TouchControls
                onMove={(direction) => {
                  characterMovement.handleMove(direction);
                }}
                onDrop={() => {
                  // Handle drop action if needed
                }}
              />
            )}

          {/* Mobile UI controls */}
          {mobileState.showTouchControls &&
            mobileState.touchControlsEnabled && (
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

          {/* Artifact Game Launcher */}
          {showGameLauncher && currentGameArtifact && (
            <ArtifactGameLauncher
              artifact={currentGameArtifact}
              character={character}
              onComplete={handleGameComplete}
              onExit={handleGameExit}
              onProgressUpdate={(progress) => {
                console.log("Game progress update:", progress);
              }}
            />
          )}

          {/* Active Powers Display */}
          {activePowers.length > 0 && (
            <div className="active-powers-hud">
              <div className="powers-hud-label">Active Powers:</div>
              <div className="powers-hud-list">
                {activePowers.map((powerId) => {
                  const powerDef = getPowerDefinition(powerId);
                  return (
                    <div
                      key={powerId}
                      className="power-hud-item"
                      title={powerDef.description}
                    >
                      <span className="power-hud-icon">{powerDef.icon}</span>
                      <span className="power-hud-name">{powerDef.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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

          {/* Multiplayer Chat */}
          {showChat && (
            <MultiplayerChat
              worldId={worldId}
              worldName={MAPS[currentMapIndex]?.name || "Unknown World"}
              onPlayerClick={(player) => {
                console.log("Player clicked:", player);
                // Handle player interaction
              }}
            />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
});

GameWorld.displayName = "GameWorld";

export default GameWorld;
