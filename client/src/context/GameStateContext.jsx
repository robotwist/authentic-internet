import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useState,
} from "react";
import PropTypes from "prop-types";

// Create the context
const GameStateContext = createContext();

// Initial state
const initialState = {
  experience: 0,
  level: 1,
  inventory: [],
  equippedItem: null, // Currently equipped weapon/tool
  powers: [], // Unlocked powers/abilities
  achievements: [],
  quests: [],
  currentWorld: "default",
  gameProgress: {},
  loading: false,
  error: null,
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  UPDATE_EXPERIENCE: "UPDATE_EXPERIENCE",
  ADD_INVENTORY_ITEM: "ADD_INVENTORY_ITEM",
  REMOVE_INVENTORY_ITEM: "REMOVE_INVENTORY_ITEM",
  EQUIP_ITEM: "EQUIP_ITEM",
  UNEQUIP_ITEM: "UNEQUIP_ITEM",
  UNLOCK_POWER: "UNLOCK_POWER",
  ADD_ACHIEVEMENT: "ADD_ACHIEVEMENT",
  SET_CURRENT_WORLD: "SET_CURRENT_WORLD",
  UPDATE_GAME_PROGRESS: "UPDATE_GAME_PROGRESS",
  LOAD_GAME_STATE: "LOAD_GAME_STATE",
};

// Reducer function
const gameStateReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTION_TYPES.UPDATE_EXPERIENCE:
      // Calculate new level based on experience
      const newExperience = action.payload;
      const newLevel = Math.floor(Math.sqrt(newExperience / 100)) + 1;

      return {
        ...state,
        experience: newExperience,
        level: newLevel,
      };

    case ACTION_TYPES.ADD_INVENTORY_ITEM:
      return {
        ...state,
        inventory: [...state.inventory, action.payload],
      };

    case ACTION_TYPES.REMOVE_INVENTORY_ITEM:
      return {
        ...state,
        inventory: state.inventory.filter((item) => item.id !== action.payload),
      };

    case ACTION_TYPES.EQUIP_ITEM:
      return {
        ...state,
        equippedItem: action.payload,
      };

    case ACTION_TYPES.UNEQUIP_ITEM:
      return {
        ...state,
        equippedItem: null,
      };

    case ACTION_TYPES.UNLOCK_POWER:
      // Only add power if it doesn't already exist
      if (state.powers.some((p) => p.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        powers: [...state.powers, action.payload],
      };

    case ACTION_TYPES.ADD_ACHIEVEMENT:
      // Only add achievement if it doesn't already exist
      if (state.achievements.some((a) => a.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
      };

    case ACTION_TYPES.SET_CURRENT_WORLD:
      return {
        ...state,
        currentWorld: action.payload,
      };

    case ACTION_TYPES.UPDATE_GAME_PROGRESS:
      return {
        ...state,
        gameProgress: {
          ...state.gameProgress,
          ...action.payload,
        },
      };

    case ACTION_TYPES.LOAD_GAME_STATE:
      return {
        ...state,
        ...action.payload,
        loading: false,
      };

    default:
      return state;
  }
};

// Provider component
export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameStateReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("gameState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({
          type: ACTION_TYPES.LOAD_GAME_STATE,
          payload: parsedState,
        });
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!hasHydrated) return;

    try {
      localStorage.setItem(
        "gameState",
        JSON.stringify({
          experience: state.experience,
          inventory: state.inventory,
          equippedItem: state.equippedItem,
          powers: state.powers,
          achievements: state.achievements,
          quests: state.quests,
          currentWorld: state.currentWorld,
          gameProgress: state.gameProgress,
        }),
      );
    } catch (error) {
      console.error("Failed to save game state:", error);
    }
  }, [
    state.experience,
    state.inventory,
    state.equippedItem,
    state.powers,
    state.achievements,
    state.quests,
    state.currentWorld,
    state.gameProgress,
    hasHydrated,
  ]);

  // Action creators
  const updateExperience = (amount) => {
    dispatch({ type: ACTION_TYPES.UPDATE_EXPERIENCE, payload: amount });
  };

  const addInventoryItem = (item) => {
    dispatch({ type: ACTION_TYPES.ADD_INVENTORY_ITEM, payload: item });
  };

  const removeInventoryItem = (itemId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_INVENTORY_ITEM, payload: itemId });
  };

  const equipItem = (item) => {
    dispatch({ type: ACTION_TYPES.EQUIP_ITEM, payload: item });
  };

  const unequipItem = () => {
    dispatch({ type: ACTION_TYPES.UNEQUIP_ITEM });
  };

  const unlockPower = (power) => {
    dispatch({ type: ACTION_TYPES.UNLOCK_POWER, payload: power });
  };

  const addAchievement = (achievement) => {
    dispatch({ type: ACTION_TYPES.ADD_ACHIEVEMENT, payload: achievement });
  };

  const setCurrentWorld = (worldId) => {
    dispatch({ type: ACTION_TYPES.SET_CURRENT_WORLD, payload: worldId });
  };

  const updateGameProgress = (progressData) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_GAME_PROGRESS,
      payload: progressData,
    });
  };

  // Value object to be provided
  const value = {
    ...state,
    updateExperience,
    addInventoryItem,
    removeInventoryItem,
    equipItem,
    unequipItem,
    unlockPower,
    addAchievement,
    setCurrentWorld,
    updateGameProgress,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// PropTypes
GameStateProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook for accessing the context
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
};

export default GameStateContext;
