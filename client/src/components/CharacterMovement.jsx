import { useEffect, useState, useCallback, useRef } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAPS, isWalkable } from "./Constants";
import SoundManager from "./utils/SoundManager";

const useCharacterMovement = (
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
  const [isBumping, setIsBumping] = useState(false);
  const [bumpDirection, setBumpDirection] = useState(null);
  const [movementDirection, setMovementDirection] = useState(null);
  const [movementCooldown, setMovementCooldown] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  const [diagonalMovement, setDiagonalMovement] = useState({ x: 0, y: 0 });
  const keysPressed = useRef(new Set());
  const lastMoveTime = useRef(Date.now());
  const moveInterval = useRef(null);
  const movementInertia = useRef({ x: 0, y: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  
  // Add useEffect for initialization
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);

  // Show feedback message temporarily
  const showFeedback = useCallback((message) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(""), 2000);
  }, []);

  // Trigger a bumping animation
  const triggerBump = useCallback((direction) => {
    if (isBumping) return; // Don't trigger if already bumping
    
    setBumpDirection(direction);
    setIsBumping(true);
    
    // Update sound playing
    if (soundManager) soundManager.playSound('bump', 0.3);
    
    // Reset after animation completes - reduced for better responsiveness
    setTimeout(() => {
      setIsBumping(false);
      setBumpDirection(null);
    }, 100); // Reduced from 200ms for more responsive feel
  }, [isBumping, soundManager]);

  // Validate portal destination position
  const validatePortalDestination = useCallback((targetMapIndex, newPosition) => {
    if (targetMapIndex < 0 || targetMapIndex >= MAPS.length) return false;
    
    const targetMapData = MAPS[targetMapIndex]?.data;
    if (!targetMapData) return false;
    
    // Check if the destination position is walkable
    return isWalkable(newPosition.x, newPosition.y, targetMapData);
  }, []);

  // Define handleMove before processKeyPresses since it's used there
  const handleMove = useCallback((direction, event) => {
    // Skip movement during cooldown
    if (movementCooldown) {
      event?.preventDefault();
      return;
    }

    // Validate characterPosition to prevent NaN issues
    if (!characterPosition || typeof characterPosition !== 'object' || 
        typeof characterPosition.x !== 'number' || typeof characterPosition.y !== 'number') {
      console.error("Invalid character position:", characterPosition);
      return;
    }

    // Calculate time since last move for smoother movement - synced with cooldown
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime.current;
    if (timeSinceLastMove < 150) { // Synced with movement cooldown
      return;
    }
    lastMoveTime.current = now;

    let newPosition = { ...characterPosition };
    let canMove = true;
    let targetMapIndex = currentMapIndex;

    // Get current map data with safety check
    const currentMapData = MAPS[currentMapIndex]?.data;
    if (!currentMapData) {
      console.error("Map data not found for index:", currentMapIndex);
      return;
    }

    // Get map dimensions
    const mapWidth = currentMapData[0].length * TILE_SIZE;
    const mapHeight = currentMapData.length * TILE_SIZE;

    // Calculate new position based on direction
    switch (direction) {
      case "up":
        newPosition.y -= TILE_SIZE;
        break;
      case "down":
        newPosition.y += TILE_SIZE;
        break;
      case "left":
        newPosition.x -= TILE_SIZE;
        break;
      case "right":
        newPosition.x += TILE_SIZE;
        break;
      default:
        return;
    }

    // Boundary checks with improved portal validation
    if (newPosition.x < 0) {
      // Check for map transition to the left
      if (direction === "left") {
        const currentMapName = MAPS[currentMapIndex].name;
        if (currentMapName === "Overworld 2") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld");
          if (targetMapIndex !== -1) {
            const proposedX = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
            const testPosition = { x: proposedX, y: newPosition.y };
            if (validatePortalDestination(targetMapIndex, testPosition)) {
              newPosition.x = proposedX;
            } else {
              canMove = false;
            }
          } else {
            canMove = false;
          }
        } else if (currentMapName === "Overworld 3") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 2");
          if (targetMapIndex !== -1) {
            const proposedX = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
            const testPosition = { x: proposedX, y: newPosition.y };
            if (validatePortalDestination(targetMapIndex, testPosition)) {
              newPosition.x = proposedX;
            } else {
              canMove = false;
            }
          } else {
            canMove = false;
          }
        } else {
          newPosition.x = 0; // Smooth edge stop
          canMove = false;
        }
      } else {
        newPosition.x = 0; // Smooth edge stop
        canMove = false;
      }
    } else if (newPosition.x >= mapWidth) {
      // Check for map transition to the right
      if (direction === "right") {
        const currentMapName = MAPS[currentMapIndex].name;
        if (currentMapName === "Overworld") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 2");
          if (targetMapIndex !== -1) {
            const testPosition = { x: 0, y: newPosition.y };
            if (validatePortalDestination(targetMapIndex, testPosition)) {
              newPosition.x = 0;
            } else {
              canMove = false;
            }
          } else {
            canMove = false;
          }
        } else if (currentMapName === "Overworld 2") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 3");
          if (targetMapIndex !== -1) {
            const testPosition = { x: 0, y: newPosition.y };
            if (validatePortalDestination(targetMapIndex, testPosition)) {
              newPosition.x = 0;
            } else {
              canMove = false;
            }
          } else {
            canMove = false;
          }
        } else {
          newPosition.x = mapWidth - TILE_SIZE; // Smooth edge stop
          canMove = false;
        }
      } else {
        newPosition.x = mapWidth - TILE_SIZE; // Smooth edge stop
        canMove = false;
      }
    }

    // Vertical boundary checks with improved validation
    if (newPosition.y < 0) {
      newPosition.y = 0;
      canMove = false;
    } else if (newPosition.y >= mapHeight) {
      newPosition.y = mapHeight - TILE_SIZE;
      canMove = false;
    }

    // Check if the new position is walkable with improved bounds checking
    if (canMove) {
      const tileX = Math.floor(newPosition.x / TILE_SIZE);
      const tileY = Math.floor(newPosition.y / TILE_SIZE);
      
      // Enhanced safety check for array bounds
      if (tileY >= 0 && tileY < currentMapData.length && 
          tileX >= 0 && tileX < currentMapData[tileY].length) {
        if (!isWalkable(newPosition.x, newPosition.y, currentMapData)) {
          canMove = false;
          triggerBump(direction);
        }
      } else {
        canMove = false;
        triggerBump(direction);
      }
    }

    if (!canMove) {
      triggerBump(direction);
      return;
    }

    // Update movement direction for animation
    setMovementDirection(direction);

    // Move character
    handleCharacterMove(newPosition, targetMapIndex);
    
    // Set movement cooldown - synced with movement interval
    setMovementCooldown(true);
    setTimeout(() => {
      setMovementCooldown(false);
    }, 150); // Synced with processKeyPresses interval
  }, [characterPosition, currentMapIndex, handleCharacterMove, movementCooldown, triggerBump, validatePortalDestination]);

  // Improved diagonal movement processing
  const processKeyPresses = useCallback(() => {
    const keys = Array.from(keysPressed.current);
    let dirX = 0;
    let dirY = 0;
    
    // Process vertical movement
    if (keys.includes('ArrowUp') || keys.includes('w') || keys.includes('W')) {
      dirY = -1;
    } else if (keys.includes('ArrowDown') || keys.includes('s') || keys.includes('S')) {
      dirY = 1;
    }
    
    // Process horizontal movement
    if (keys.includes('ArrowLeft') || keys.includes('a') || keys.includes('A')) {
      dirX = -1;
    } else if (keys.includes('ArrowRight') || keys.includes('d') || keys.includes('D')) {
      dirX = 1;
    }
    
    // Simplified diagonal movement - only move once per interval
    if (dirX !== 0 || dirY !== 0) {
      // For true diagonal movement, prioritize based on last key pressed
      let direction;
      if (dirX !== 0 && dirY !== 0) {
        // Diagonal movement - alternate between horizontal and vertical
        const alternateHorizontal = Date.now() % 300 < 150;
        if (alternateHorizontal) {
          direction = dirX > 0 ? 'right' : 'left';
        } else {
          direction = dirY > 0 ? 'down' : 'up';
        }
      } else if (dirX !== 0) {
        direction = dirX > 0 ? 'right' : 'left';
      } else {
        direction = dirY > 0 ? 'down' : 'up';
      }
      
      // Set diagonal movement state for animation
      setDiagonalMovement({ x: dirX, y: dirY });
      handleMove(direction);
    } else {
      // Reset diagonal movement when no keys are pressed
      setDiagonalMovement({ x: 0, y: 0 });
    }
  }, [handleMove]);

  // Create movement interval - synced with cooldown
  useEffect(() => {
    moveInterval.current = setInterval(() => {
      processKeyPresses();
    }, 150); // Synced with movement cooldown
    
    return () => {
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
      }
    };
  }, [processKeyPresses]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }

      // Add key to pressed keys
      keysPressed.current.add(event.key);

      // Handle non-movement keys immediately with improved feedback
      switch (event.key) {
        case "e":
        case "E":
        case "p":
        case "P":
          if (visibleArtifact) {
            handleArtifactPickup(visibleArtifact);
          } else {
            showFeedback("No artifact nearby to pick up");
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
    };

    const handleKeyUp = (event) => {
      // Remove key from pressed keys
      keysPressed.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleMove, visibleArtifact, handleArtifactPickup, characterPosition, setShowForm, setFormPosition, setShowInventory, showFeedback]);

  return {
    isBumping,
    bumpDirection,
    movementDirection,
    diagonalMovement,
    feedbackMessage
  };
};

export { useCharacterMovement };