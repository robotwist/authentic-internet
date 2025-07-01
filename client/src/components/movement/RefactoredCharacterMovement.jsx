import { useEffect, useState, useCallback, useRef } from "react";
import { MAPS } from "../Constants";
import { MOVEMENT_CONSTANTS, DIRECTIONS } from './MovementConstants';
import { CollisionSystem } from './CollisionSystem';
import SoundManager from "../utils/SoundManager";

/**
 * Refactored Character Movement Hook
 * Now properly modularized with clean separation of concerns
 */
const useRefactoredCharacterMovement = (
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
) => {
  // State Management
  const [isBumping, setIsBumping] = useState(false);
  const [bumpDirection, setBumpDirection] = useState(null);
  const [movementDirection, setMovementDirection] = useState(null);
  const [movementCooldown, setMovementCooldown] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  const [diagonalMovement, setDiagonalMovement] = useState({ x: 0, y: 0 });
  
  // Refs for continuous input handling
  const keysPressed = useRef(new Set());
  const lastMoveTime = useRef(Date.now());
  const moveInterval = useRef(null);
  const movementInertia = useRef({ x: 0, y: 0 });
  
  // Systems
  const collisionSystem = useRef(new CollisionSystem(MAPS));

  // Initialize Sound Manager
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);

  /**
   * Trigger bump animation and sound
   */
  const triggerBump = useCallback((direction) => {
    if (isBumping) return;
    
    setBumpDirection(direction);
    setIsBumping(true);
    
    if (soundManager) {
      soundManager.playSound('bump', MOVEMENT_CONSTANTS.BUMP_SOUND_VOLUME);
    }
    
    setTimeout(() => {
      setIsBumping(false);
      setBumpDirection(null);
    }, MOVEMENT_CONSTANTS.BUMP_ANIMATION_DURATION);
  }, [isBumping, soundManager]);

  /**
   * Validate character position
   */
  const validateCharacterPosition = useCallback((position) => {
    return position && 
           typeof position === 'object' && 
           typeof position.x === 'number' && 
           typeof position.y === 'number';
  }, []);

  /**
   * Check movement timing constraints
   */
  const canMoveNow = useCallback(() => {
    if (movementCooldown) return false;
    
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime.current;
    
    return timeSinceLastMove >= MOVEMENT_CONSTANTS.MIN_MOVE_INTERVAL;
  }, [movementCooldown]);

  /**
   * Main movement handler - now much cleaner!
   */
  const handleMove = useCallback((direction, event) => {
    // Early returns for invalid states
    if (!canMoveNow()) {
      event?.preventDefault();
      return;
    }

    if (!validateCharacterPosition(characterPosition)) {
      console.error("Invalid character position:", characterPosition);
      return;
    }

    // Update timing
    lastMoveTime.current = Date.now();

    // Use collision system for clean collision checking
    const collisionResult = collisionSystem.current.checkCollision(
      characterPosition,
      direction,
      currentMapIndex
    );

    if (!collisionResult.canMove) {
      triggerBump(direction);
      return;
    }

    // Movement successful - update state
    setMovementDirection(direction);
    handleCharacterMove(collisionResult.newPosition, collisionResult.targetMapIndex);
    
    // Set cooldown
    setMovementCooldown(true);
    setTimeout(() => {
      setMovementCooldown(false);
    }, MOVEMENT_CONSTANTS.MOVEMENT_COOLDOWN);

  }, [characterPosition, currentMapIndex, handleCharacterMove, canMoveNow, validateCharacterPosition, triggerBump]);

  /**
   * Process diagonal movement and input
   */
  const processKeyPresses = useCallback(() => {
    const keys = Array.from(keysPressed.current);
    let dirX = 0;
    let dirY = 0;
    
    // Calculate movement direction from keys
    if (keys.includes('ArrowUp') || keys.includes('w') || keys.includes('W')) {
      dirY = -1;
    } else if (keys.includes('ArrowDown') || keys.includes('s') || keys.includes('S')) {
      dirY = 1;
    }
    
    if (keys.includes('ArrowLeft') || keys.includes('a') || keys.includes('A')) {
      dirX = -1;
    } else if (keys.includes('ArrowRight') || keys.includes('d') || keys.includes('D')) {
      dirX = 1;
    }
    
    // Handle movement inertia
    updateMovementInertia(dirX, dirY);
    
    // Execute movement if there's input or significant inertia
    executeMovementFromInput(dirX, dirY);
    
  }, [handleMove]);

  /**
   * Update movement inertia based on input
   */
  const updateMovementInertia = useCallback((dirX, dirY) => {
    if (dirX !== 0 || dirY !== 0) {
      movementInertia.current = { 
        x: dirX * MOVEMENT_CONSTANTS.MOVEMENT_INERTIA_FACTOR, 
        y: dirY * MOVEMENT_CONSTANTS.MOVEMENT_INERTIA_FACTOR 
      };
    } else {
      // Decay inertia
      movementInertia.current.x *= MOVEMENT_CONSTANTS.INERTIA_DECAY_RATE;
      movementInertia.current.y *= MOVEMENT_CONSTANTS.INERTIA_DECAY_RATE;
      
      // Reset small values
      if (Math.abs(movementInertia.current.x) < MOVEMENT_CONSTANTS.INERTIA_RESET_THRESHOLD) {
        movementInertia.current.x = 0;
      }
      if (Math.abs(movementInertia.current.y) < MOVEMENT_CONSTANTS.INERTIA_RESET_THRESHOLD) {
        movementInertia.current.y = 0;
      }
    }
  }, []);

  /**
   * Execute movement based on input or inertia
   */
  const executeMovementFromInput = useCallback((dirX, dirY) => {
    let effectiveX = dirX;
    let effectiveY = dirY;
    
    // Use inertia if no direct input
    if (dirX === 0 && dirY === 0) {
      if (Math.abs(movementInertia.current.x) > MOVEMENT_CONSTANTS.INERTIA_MOVEMENT_THRESHOLD || 
          Math.abs(movementInertia.current.y) > MOVEMENT_CONSTANTS.INERTIA_MOVEMENT_THRESHOLD) {
        effectiveX = movementInertia.current.x;
        effectiveY = movementInertia.current.y;
      } else {
        return; // No significant movement
      }
    }

    // Determine primary direction for movement
    const direction = getPrimaryDirection(effectiveX, effectiveY);
    if (direction) {
      setDiagonalMovement({ x: effectiveX, y: effectiveY });
      handleMove(direction);
    }
  }, [handleMove]);

  /**
   * Get primary direction from x/y components
   */
  const getPrimaryDirection = useCallback((x, y) => {
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else if (y !== 0) {
      return y > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }
    return null;
  }, []);

  /**
   * Handle non-movement key actions
   */
  const handleNonMovementKeys = useCallback((key) => {
    switch (key) {
      case "e":
      case "E":
      case "p":
      case "P":
        if (visibleArtifact) {
          handleArtifactPickup(visibleArtifact);
        }
        break;
      case "i":
      case "I":
        setShowInventory(true);
        break;
      case "f":
      case "F":
        setShowForm(true);
        setFormPosition({ x: characterPosition.x, y: characterPosition.y });
        break;
    }
  }, [visibleArtifact, handleArtifactPickup, characterPosition, setShowForm, setFormPosition, setShowInventory]);

  // Set up continuous movement processing
  useEffect(() => {
    moveInterval.current = setInterval(() => {
      processKeyPresses();
    }, MOVEMENT_CONSTANTS.KEY_PROCESS_INTERVAL);
    
    return () => {
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
      }
    };
  }, [processKeyPresses]);

  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || 
          document.activeElement.tagName === "TEXTAREA") {
        return;
      }

      keysPressed.current.add(event.key);
      handleNonMovementKeys(event.key);
    };

    const handleKeyUp = (event) => {
      keysPressed.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleNonMovementKeys]);

  return {
    isBumping,
    bumpDirection,
    movementDirection,
    diagonalMovement
  };
};

export { useRefactoredCharacterMovement };