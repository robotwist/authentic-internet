import { useReducer, useCallback } from "react";

// Initial state constants
const INITIAL_CHARACTER_POSITION = { x: 64, y: 64 };
const INITIAL_VIEWPORT = { x: 0, y: 0 };
const INITIAL_LEVEL_COMPLETION = {
  level1: false,
  level2: false,
  level3: false,
  level4: false,
};

// Action types
const ACTIONS = {
  // Core game actions
  SET_CURRENT_MAP_INDEX: "SET_CURRENT_MAP_INDEX",
  SET_INVENTORY: "SET_INVENTORY",
  SET_CHARACTER_POSITION: "SET_CHARACTER_POSITION",
  SET_CHARACTER: "SET_CHARACTER",
  SET_CHARACTER_STATE: "SET_CHARACTER_STATE",
  SET_VIEWPORT: "SET_VIEWPORT",
  SET_EXPLORED_TILES: "SET_EXPLORED_TILES",
  SET_FORM_POSITION: "SET_FORM_POSITION",

  // UI state actions
  UPDATE_UI_STATE: "UPDATE_UI_STATE",

  // Dungeon actions
  SET_DUNGEON_STATE: "SET_DUNGEON_STATE",

  // Game data actions
  SET_GAME_DATA: "SET_GAME_DATA",

  // Portal actions
  SET_PORTAL_STATE: "SET_PORTAL_STATE",

  // Special world actions
  SET_CURRENT_SPECIAL_WORLD: "SET_CURRENT_SPECIAL_WORLD",
  SET_ACTIVE_NPC: "SET_ACTIVE_NPC",
  SET_SOUND_MANAGER: "SET_SOUND_MANAGER",
  SET_SELECTED_USER_ARTIFACT: "SET_SELECTED_USER_ARTIFACT",
  SET_VISIBLE_ARTIFACT: "SET_VISIBLE_ARTIFACT",
  SET_MAP_ZOOM: "SET_MAP_ZOOM",
  SET_MAP_OFFSET: "SET_MAP_OFFSET",
  SET_IS_LOGGED_IN: "SET_IS_LOGGED_IN",

  // Combat actions
  SET_PLAYER_HEALTH: "SET_PLAYER_HEALTH",
  SET_MAX_PLAYER_HEALTH: "SET_MAX_PLAYER_HEALTH",
  SET_RUPEES: "SET_RUPEES",
  SET_KEYS: "SET_KEYS",
  SET_IS_ATTACKING: "SET_IS_ATTACKING",
  SET_SWORD_TYPE: "SET_SWORD_TYPE",
  SET_EQUIPPED_ITEM: "SET_EQUIPPED_ITEM",
  SET_IS_INVINCIBLE: "SET_IS_INVINCIBLE",

  // XP/Leveling actions
  SET_CHARACTER_STATS: "SET_CHARACTER_STATS",
  SET_MOVEMENT_TRANSITION: "SET_MOVEMENT_TRANSITION",
  SET_VERTICAL_DIRECTION: "SET_VERTICAL_DIRECTION",
  SET_HORIZONTAL_DIRECTION: "SET_HORIZONTAL_DIRECTION",

  // Mobile actions
  SET_MOBILE_STATE: "SET_MOBILE_STATE",

  // Artifact game actions
  SET_CURRENT_GAME_ARTIFACT: "SET_CURRENT_GAME_ARTIFACT",
  SET_SHOW_GAME_LAUNCHER: "SET_SHOW_GAME_LAUNCHER",

  // Quest actions
  SET_ACTIVE_QUESTS: "SET_ACTIVE_QUESTS",
  SET_COMPLETED_QUESTS: "SET_COMPLETED_QUESTS",
  SET_QUEST_STATUS_MAP: "SET_QUEST_STATUS_MAP",
  SET_QUEST_COMPLETION_CELEBRATION: "SET_QUEST_COMPLETION_CELEBRATION",
  SET_SHOW_HAMLET_FINALE: "SET_SHOW_HAMLET_FINALE",

  // Map transition actions
  TRANSITION_TO_NEIGHBOR: "TRANSITION_TO_NEIGHBOR",
};

// Initial state
const initialState = {
  // Core game state
  currentMapIndex: 0,
  inventory: [],
  characterPosition: INITIAL_CHARACTER_POSITION,
  character: null,
  characterState: {
    direction: "down",
    style: {
      left: 64,
      top: 64,
      width: 32,
      height: 32,
      transition: "left 0.2s, top 0.2s",
    },
    movementTransition: null,
    verticalDirection: null,
    horizontalDirection: null,
    isHit: false,
    // Physics state
    physicsState: {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      isGrounded: true,
      canJump: true,
      jumpCount: 0,
      maxJumps: 1,
      friction: 0.8,
      gravity: 0.5,
      maxSpeed: 2,
    },
  },
  viewport: INITIAL_VIEWPORT,
  exploredTiles: new Set(),
  formPosition: null,

  // UI state
  uiState: {
    showInventory: false,
    showForm: false,
    showQuotes: false,
    showWorldMap: false,
    showFeedback: false,
    showControlsGuide: false,
    showWinNotification: false,
    winMessage: "",
    showLevel4: false,
    showRewardModal: false,
    currentAchievement: "",
    showNPCDialog: false,
    /** Bottom dock: collapsed strip vs expanded sheet */
    dockExpanded: false,
    /** Active tab when expanded: status | talk | bag | chat */
    dockTab: "status",
    showWorldGuide: false,
    isPlacingArtifact: false,
    showArtifactsOnMap: true,
    isMoving: false,
    isDarkMode: false,
    inDungeon: false,
    isTransitioning: false,
  },

  // Dungeon state
  dungeonState: {
    currentDungeon: null,
    smallKeys: 0,
    hasBossKey: false,
    dungeonEntryPosition: null,
    /** Hydrates <Dungeon /> once per run (from localStorage). Cleared on exit. */
    activeRunProgress: null,
  },

  // Game data state
  gameData: {
    artifacts: [],
    levelCompletion: INITIAL_LEVEL_COMPLETION,
    achievements: [],
    viewedArtifacts: [],
    databaseNPCs: [],
  },

  // Portal state
  portalState: {
    isTransitioning: false,
    portalNotificationActive: false,
    activePortal: null,
  },

  // Special world state
  currentSpecialWorld: null,
  activeNPC: null,
  soundManager: null,
  selectedUserArtifact: null,
  visibleArtifact: null,
  mapZoom: 1,
  mapOffset: { x: 0, y: 0 },
  isLoggedIn: false,

  // Combat state
  playerHealth: 6,
  maxPlayerHealth: 6,
  rupees: 0,
  keys: 0,
  isAttacking: false,
  swordType: "wooden",
  equippedItem: null,
  isInvincible: false,

  // XP/Leveling state
  characterStats: {
    experience: 0,
    level: 1,
    attack: 1,
    defense: 0,
  },
  movementTransition: null,
  verticalDirection: null,
  horizontalDirection: null,

  // Mobile state
  mobileState: {
    isMobile: false,
    showTouchControls: false,
    touchControlsEnabled: false,
    screenReaderMode: false,
    reducedMotionMode: false,
    highContrastMode: false,
  },

  // Artifact game state
  currentGameArtifact: null,
  showGameLauncher: false,

  // Quest state
  activeQuests: [],
  completedQuests: [],
  questStatusMap: new Map(),
  questCompletionCelebration: null,
  showHamletFinale: false,
};

const resolvePayload = (payload, currentValue) =>
  typeof payload === "function" ? payload(currentValue) : payload;

const mergePayload = (payload, currentValue) => ({
  ...currentValue,
  ...resolvePayload(payload, currentValue),
});

// Reducer function
function gameStateReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_MAP_INDEX:
      return {
        ...state,
        currentMapIndex: resolvePayload(action.payload, state.currentMapIndex),
      };
    case ACTIONS.SET_INVENTORY:
      return {
        ...state,
        inventory: resolvePayload(action.payload, state.inventory),
      };
    case ACTIONS.SET_CHARACTER_POSITION:
      return {
        ...state,
        characterPosition: resolvePayload(action.payload, state.characterPosition),
      };
    case ACTIONS.SET_CHARACTER:
      return {
        ...state,
        character: resolvePayload(action.payload, state.character),
      };
    case ACTIONS.SET_CHARACTER_STATE:
      return {
        ...state,
        characterState: resolvePayload(action.payload, state.characterState),
      };
    case ACTIONS.SET_VIEWPORT:
      return {
        ...state,
        viewport: resolvePayload(action.payload, state.viewport),
      };
    case ACTIONS.SET_EXPLORED_TILES:
      return {
        ...state,
        exploredTiles: resolvePayload(action.payload, state.exploredTiles),
      };
    case ACTIONS.SET_FORM_POSITION:
      return {
        ...state,
        formPosition: resolvePayload(action.payload, state.formPosition),
      };
    case ACTIONS.UPDATE_UI_STATE:
      return { ...state, uiState: mergePayload(action.payload, state.uiState) };
    case ACTIONS.SET_DUNGEON_STATE:
      return {
        ...state,
        dungeonState: mergePayload(action.payload, state.dungeonState),
      };
    case ACTIONS.SET_GAME_DATA:
      return { ...state, gameData: mergePayload(action.payload, state.gameData) };
    case ACTIONS.SET_PORTAL_STATE:
      return {
        ...state,
        portalState: mergePayload(action.payload, state.portalState),
      };
    case ACTIONS.SET_CURRENT_SPECIAL_WORLD:
      return {
        ...state,
        currentSpecialWorld: resolvePayload(
          action.payload,
          state.currentSpecialWorld,
        ),
      };
    case ACTIONS.SET_ACTIVE_NPC:
      return {
        ...state,
        activeNPC: resolvePayload(action.payload, state.activeNPC),
      };
    case ACTIONS.SET_SOUND_MANAGER:
      return {
        ...state,
        soundManager: resolvePayload(action.payload, state.soundManager),
      };
    case ACTIONS.SET_SELECTED_USER_ARTIFACT:
      return {
        ...state,
        selectedUserArtifact: resolvePayload(
          action.payload,
          state.selectedUserArtifact,
        ),
      };
    case ACTIONS.SET_VISIBLE_ARTIFACT:
      return {
        ...state,
        visibleArtifact: resolvePayload(action.payload, state.visibleArtifact),
      };
    case ACTIONS.SET_MAP_ZOOM:
      return { ...state, mapZoom: resolvePayload(action.payload, state.mapZoom) };
    case ACTIONS.SET_MAP_OFFSET:
      return {
        ...state,
        mapOffset: resolvePayload(action.payload, state.mapOffset),
      };
    case ACTIONS.SET_IS_LOGGED_IN:
      return {
        ...state,
        isLoggedIn: resolvePayload(action.payload, state.isLoggedIn),
      };
    case ACTIONS.SET_PLAYER_HEALTH:
      return {
        ...state,
        playerHealth: resolvePayload(action.payload, state.playerHealth),
      };
    case ACTIONS.SET_MAX_PLAYER_HEALTH:
      return {
        ...state,
        maxPlayerHealth: resolvePayload(action.payload, state.maxPlayerHealth),
      };
    case ACTIONS.SET_RUPEES:
      return { ...state, rupees: resolvePayload(action.payload, state.rupees) };
    case ACTIONS.SET_KEYS:
      return { ...state, keys: resolvePayload(action.payload, state.keys) };
    case ACTIONS.SET_IS_ATTACKING:
      return {
        ...state,
        isAttacking: resolvePayload(action.payload, state.isAttacking),
      };
    case ACTIONS.SET_SWORD_TYPE:
      return {
        ...state,
        swordType: resolvePayload(action.payload, state.swordType),
      };
    case ACTIONS.SET_EQUIPPED_ITEM:
      return {
        ...state,
        equippedItem: resolvePayload(action.payload, state.equippedItem),
      };
    case ACTIONS.SET_IS_INVINCIBLE:
      return {
        ...state,
        isInvincible: resolvePayload(action.payload, state.isInvincible),
      };
    case ACTIONS.SET_CHARACTER_STATS:
      return {
        ...state,
        characterStats: mergePayload(action.payload, state.characterStats),
      };
    case ACTIONS.SET_MOVEMENT_TRANSITION:
      return {
        ...state,
        movementTransition: resolvePayload(
          action.payload,
          state.movementTransition,
        ),
      };
    case ACTIONS.SET_VERTICAL_DIRECTION:
      return {
        ...state,
        verticalDirection: resolvePayload(
          action.payload,
          state.verticalDirection,
        ),
      };
    case ACTIONS.SET_HORIZONTAL_DIRECTION:
      return {
        ...state,
        horizontalDirection: resolvePayload(
          action.payload,
          state.horizontalDirection,
        ),
      };
    case ACTIONS.SET_MOBILE_STATE:
      return {
        ...state,
        mobileState: mergePayload(action.payload, state.mobileState),
      };
    case ACTIONS.SET_CURRENT_GAME_ARTIFACT:
      return {
        ...state,
        currentGameArtifact: resolvePayload(
          action.payload,
          state.currentGameArtifact,
        ),
      };
    case ACTIONS.SET_SHOW_GAME_LAUNCHER:
      return {
        ...state,
        showGameLauncher: resolvePayload(
          action.payload,
          state.showGameLauncher,
        ),
      };
    case ACTIONS.SET_ACTIVE_QUESTS:
      return {
        ...state,
        activeQuests: resolvePayload(action.payload, state.activeQuests),
      };
    case ACTIONS.SET_COMPLETED_QUESTS:
      return {
        ...state,
        completedQuests: resolvePayload(action.payload, state.completedQuests),
      };
    case ACTIONS.SET_QUEST_STATUS_MAP:
      return {
        ...state,
        questStatusMap: resolvePayload(action.payload, state.questStatusMap),
      };
    case ACTIONS.SET_QUEST_COMPLETION_CELEBRATION:
      return {
        ...state,
        questCompletionCelebration: resolvePayload(
          action.payload,
          state.questCompletionCelebration,
        ),
      };
    case ACTIONS.SET_SHOW_HAMLET_FINALE:
      return {
        ...state,
        showHamletFinale: resolvePayload(
          action.payload,
          state.showHamletFinale,
        ),
      };
    case ACTIONS.TRANSITION_TO_NEIGHBOR:
      // This action is handled by the GameWorld component to trigger map transitions
      return state;
    default:
      return state;
  }
}

// Custom hook
export function useGameState() {
  const [state, dispatch] = useReducer(gameStateReducer, initialState);

  // Action creators
  const setCurrentMapIndex = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CURRENT_MAP_INDEX, payload: value });
  }, []);

  const setInventory = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_INVENTORY, payload: value });
  }, []);

  const setCharacterPosition = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CHARACTER_POSITION, payload: value });
  }, []);

  const setCharacter = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CHARACTER, payload: value });
  }, []);

  const setCharacterState = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CHARACTER_STATE, payload: value });
  }, []);

  const setViewport = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_VIEWPORT, payload: value });
  }, []);

  const setExploredTiles = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_EXPLORED_TILES, payload: value });
  }, []);

  const setFormPosition = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FORM_POSITION, payload: value });
  }, []);

  const updateUIState = useCallback((updates) => {
    dispatch({ type: ACTIONS.UPDATE_UI_STATE, payload: updates });
  }, []);

  const setDungeonState = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_DUNGEON_STATE, payload: updates });
  }, []);

  const setGameData = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_GAME_DATA, payload: updates });
  }, []);

  const setPortalState = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_PORTAL_STATE, payload: updates });
  }, []);

  const setCurrentSpecialWorld = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CURRENT_SPECIAL_WORLD, payload: value });
  }, []);

  const setActiveNPC = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_NPC, payload: value });
  }, []);

  const setSoundManager = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SOUND_MANAGER, payload: value });
  }, []);

  const setSelectedUserArtifact = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SELECTED_USER_ARTIFACT, payload: value });
  }, []);

  const setVisibleArtifact = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_VISIBLE_ARTIFACT, payload: value });
  }, []);

  const setMapZoom = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_MAP_ZOOM, payload: value });
  }, []);

  const setMapOffset = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_MAP_OFFSET, payload: value });
  }, []);

  const setIsLoggedIn = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_IS_LOGGED_IN, payload: value });
  }, []);

  const setPlayerHealth = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_PLAYER_HEALTH, payload: value });
  }, []);

  const setMaxPlayerHealth = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_MAX_PLAYER_HEALTH, payload: value });
  }, []);

  const setRupees = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_RUPEES, payload: value });
  }, []);

  const setKeys = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_KEYS, payload: value });
  }, []);

  const setIsAttacking = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_IS_ATTACKING, payload: value });
  }, []);

  const setSwordType = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SWORD_TYPE, payload: value });
  }, []);

  const setEquippedItem = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_EQUIPPED_ITEM, payload: value });
  }, []);

  const setIsInvincible = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_IS_INVINCIBLE, payload: value });
  }, []);

  const setCharacterStats = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_CHARACTER_STATS, payload: updates });
  }, []);

  const setMovementTransition = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_MOVEMENT_TRANSITION, payload: value });
  }, []);

  const setVerticalDirection = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_VERTICAL_DIRECTION, payload: value });
  }, []);

  const setHorizontalDirection = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_HORIZONTAL_DIRECTION, payload: value });
  }, []);

  const setMobileState = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_MOBILE_STATE, payload: updates });
  }, []);

  const setCurrentGameArtifact = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_CURRENT_GAME_ARTIFACT, payload: value });
  }, []);

  const setShowGameLauncher = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SHOW_GAME_LAUNCHER, payload: value });
  }, []);

  const setActiveQuests = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_QUESTS, payload: value });
  }, []);

  const setCompletedQuests = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_COMPLETED_QUESTS, payload: value });
  }, []);

  const setQuestStatusMap = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_QUEST_STATUS_MAP, payload: value });
  }, []);

  const setQuestCompletionCelebration = useCallback((value) => {
    dispatch({
      type: ACTIONS.SET_QUEST_COMPLETION_CELEBRATION,
      payload: value,
    });
  }, []);

  const setShowHamletFinale = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SHOW_HAMLET_FINALE, payload: value });
  }, []);

  const transitionToNeighbor = useCallback((direction) => {
    dispatch({ type: ACTIONS.TRANSITION_TO_NEIGHBOR, payload: { direction } });
  }, []);

  return {
    // State
    ...state,

    // Actions
    setCurrentMapIndex,
    setInventory,
    setCharacterPosition,
    setCharacter,
    setCharacterState,
    setViewport,
    setExploredTiles,
    setFormPosition,
    updateUIState,
    setDungeonState,
    setGameData,
    setPortalState,
    setCurrentSpecialWorld,
    setActiveNPC,
    setSoundManager,
    setSelectedUserArtifact,
    setVisibleArtifact,
    setMapZoom,
    setMapOffset,
    setIsLoggedIn,
    setPlayerHealth,
    setMaxPlayerHealth,
    setRupees,
    setKeys,
    setIsAttacking,
    setSwordType,
    setEquippedItem,
    setIsInvincible,
    setCharacterStats,
    setMovementTransition,
    setVerticalDirection,
    setHorizontalDirection,
    setMobileState,
    setCurrentGameArtifact,
    setShowGameLauncher,
    setActiveQuests,
    setCompletedQuests,
    setQuestStatusMap,
    setQuestCompletionCelebration,
    setShowHamletFinale,
    transitionToNeighbor,
  };
}

export { ACTIONS };
