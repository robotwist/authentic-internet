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
  
  // Add useEffect for initialization
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);

  // Trigger a bumping animation
  const triggerBump = useCallback((direction) => {
    if (isBumping) return; // Don't trigger if already bumping
    
    setBumpDirection(direction);
    setIsBumping(true);
    
    // Update sound playing
    if (soundManager) soundManager.playSound('bump', 0.3);
    
    // Reset after animation completes
    setTimeout(() => {
      setIsBumping(false);
      setBumpDirection(null);
    }, 200); // Reduced from 400ms for more responsive feel
  }, [isBumping, soundManager]);

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

    // Calculate time since last move for smoother movement
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime.current;
    if (timeSinceLastMove < 100) { // Minimum time between moves
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

    // Calculate new position based on direction and diagonal movement
    switch (direction) {
      case "up":
        newPosition.y -= TILE_SIZE;
        // Remove diagonal offset to prevent double movement
        // We'll still show diagonal animation but only move one tile
        break;
      case "down":
        newPosition.y += TILE_SIZE;
        // Remove diagonal offset to prevent double movement
        break;
      case "left":
        newPosition.x -= TILE_SIZE;
        // Remove diagonal offset to prevent double movement
        break;
      case "right":
        newPosition.x += TILE_SIZE;
        // Remove diagonal offset to prevent double movement
        break;
      default:
        return;
    }

    // Boundary checks with smooth edge handling
    if (newPosition.x < 0) {
      // Check for map transition to the left
      if (direction === "left") {
        const currentMapName = MAPS[currentMapIndex].name;
        if (currentMapName === "Overworld 2") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld");
          if (targetMapIndex !== -1) {
            newPosition.x = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
          } else {
            canMove = false;
          }
        } else if (currentMapName === "Overworld 3") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 2");
          if (targetMapIndex !== -1) {
            newPosition.x = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
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
            newPosition.x = 0;
          } else {
            canMove = false;
          }
        } else if (currentMapName === "Overworld 2") {
          targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 3");
          if (targetMapIndex !== -1) {
            newPosition.x = 0;
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

    // Vertical boundary checks
    if (newPosition.y < 0) {
      newPosition.y = 0;
      canMove = false;
    } else if (newPosition.y >= mapHeight) {
      newPosition.y = mapHeight - TILE_SIZE;
      canMove = false;
    }

    // Check if the new position is walkable
    if (canMove) {
      const tileX = Math.floor(newPosition.x / TILE_SIZE);
      const tileY = Math.floor(newPosition.y / TILE_SIZE);
      
      // Safety check for array bounds
      if (tileY >= 0 && tileY < currentMapData.length && 
          tileX >= 0 && tileX < currentMapData[0].length) {
        if (!isWalkable(newPosition.x, newPosition.y, currentMapData)) {
          canMove = false;
          triggerBump(direction);
        }
      } else {
        canMove = false;
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
    
    // Set movement cooldown
    setMovementCooldown(true);
    setTimeout(() => {
      setMovementCooldown(false);
    }, 150); // Slightly faster movement cooldown for more responsive feel
  }, [characterPosition, currentMapIndex, handleCharacterMove, movementCooldown, triggerBump, diagonalMovement]);

  // Process multiple key presses for diagonal movement
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
    
    // Apply movement inertia
    if (dirX !== 0 || dirY !== 0) {
      movementInertia.current = { x: dirX * 0.8, y: dirY * 0.8 };
    } else {
      // Gradually decrease inertia when no keys are pressed
      movementInertia.current.x *= 0.7;
      movementInertia.current.y *= 0.7;
      
      // Reset inertia if it's very small
      if (Math.abs(movementInertia.current.x) < 0.1) movementInertia.current.x = 0;
      if (Math.abs(movementInertia.current.y) < 0.1) movementInertia.current.y = 0;
    }
    
    // Determine direction for animation
    if (dirX !== 0 || dirY !== 0) {
      // Prioritize horizontal direction for diagonal movement
      let direction;
      if (Math.abs(dirX) > Math.abs(dirY)) {
        direction = dirX > 0 ? 'right' : 'left';
      } else {
        direction = dirY > 0 ? 'down' : 'up';
      }
      
      // Set diagonal movement state
      setDiagonalMovement({ x: dirX, y: dirY });
      handleMove(direction);
    } else if (movementInertia.current.x !== 0 || movementInertia.current.y !== 0) {
      // Handle inertial movement
      let direction;
      if (Math.abs(movementInertia.current.x) > Math.abs(movementInertia.current.y)) {
        direction = movementInertia.current.x > 0 ? 'right' : 'left';
      } else {
        direction = movementInertia.current.y > 0 ? 'down' : 'up';
      }
      
      setDiagonalMovement({ 
        x: movementInertia.current.x, 
        y: movementInertia.current.y 
      });
      
      // Only move if inertia is significant
      if (Math.abs(movementInertia.current.x) > 0.3 || 
          Math.abs(movementInertia.current.y) > 0.3) {
        handleMove(direction);
      }
    }
  }, [handleMove]);

  // Create continuous movement interval
  useEffect(() => {
    moveInterval.current = setInterval(() => {
      processKeyPresses();
    }, 100); // Check for key presses every 100ms
    
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

      // Handle non-movement keys immediately
      switch (event.key) {
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
  }, [handleMove, visibleArtifact, handleArtifactPickup, characterPosition, setShowForm, setFormPosition, setShowInventory]);

  return {
    isBumping,
    bumpDirection,
    movementDirection,
    diagonalMovement
  };
};

export { useCharacterMovement };