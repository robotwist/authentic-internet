import { useEffect, useState, useCallback, useRef } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAPS, isWalkable } from "./Constants";
import SoundManager from "./utils/SoundManager";

// Movement step size - half tile per button press for precise grid movement
const MOVEMENT_STEP_SIZE = TILE_SIZE / 2; // 32px - half tile per move

const useCharacterMovement = (
  characterPosition,
  characterState,
  handleCharacterMove,
  currentMapIndex,
  setCurrentMapIndex,
  isLoggedIn,
  visibleArtifact,
  handleArtifactPickup,
  setShowForm,
  setFormPosition,
  setShowInventory,
  adjustViewport,
  activePowers = [], // Array of active power IDs
) => {
  const [isBumping, setIsBumping] = useState(false);
  const [bumpDirection, setBumpDirection] = useState(null);
  const [movementDirection, setMovementDirection] = useState(null);
  const [movementCooldown, setMovementCooldown] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  const [diagonalMovement, setDiagonalMovement] = useState({ x: 0, y: 0 });
  const lastMoveTime = useRef(Date.now());
  const processedKeys = useRef(new Set()); // Track keys that have been processed
  const jumpCount = useRef(0); // Track jumps for double jump power
  const lastJumpTime = useRef(0);

  // Calculate power effects for discrete movement
  const hasSpeedBoost = activePowers.includes("speed_boost");
  const hasFlight = activePowers.includes("flight");

  // Movement constants - discrete movement per key press
  const movementConstants = {
    stepSize: hasSpeedBoost ? MOVEMENT_STEP_SIZE * 1.5 : MOVEMENT_STEP_SIZE, // Speed boost gives 1.5x movement
  };

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
  const triggerBump = useCallback(
    (direction) => {
      if (isBumping) return; // Don't trigger if already bumping

      setBumpDirection(direction);
      setIsBumping(true);

      // Update sound playing
      if (soundManager) soundManager.playSound("bump", 0.3);

      // Reset after animation completes
      setTimeout(() => {
        setIsBumping(false);
        setBumpDirection(null);
      }, 200); // Reduced from 400ms for more responsive feel
    },
    [isBumping, soundManager],
  );

  // Discrete movement system - move exactly one step per key press
  const moveCharacter = useCallback((direction) => {
    const currentMapData = MAPS[currentMapIndex]?.data;
    if (!currentMapData) return characterPosition;

    let newPosition = { ...characterPosition };
    let targetMapIndex = currentMapIndex;

    // Calculate movement based on direction
    switch (direction) {
      case "left":
        newPosition.x -= movementConstants.stepSize;
        break;
      case "right":
        newPosition.x += movementConstants.stepSize;
        break;
      case "up":
        newPosition.y -= movementConstants.stepSize;
        break;
      case "down":
        newPosition.y += movementConstants.stepSize;
        break;
    }

    const mapWidth = currentMapData[0].length * TILE_SIZE;
    const mapHeight = currentMapData.length * TILE_SIZE;

    // Check collision at new position
    const canMove = isWalkable(newPosition.x, newPosition.y, currentMapData) &&
                    isWalkable(newPosition.x + TILE_SIZE - 1, newPosition.y, currentMapData) &&
                    isWalkable(newPosition.x, newPosition.y + TILE_SIZE - 1, currentMapData) &&
                    isWalkable(newPosition.x + TILE_SIZE - 1, newPosition.y + TILE_SIZE - 1, currentMapData);

    if (!canMove) {
      // Trigger bump animation based on direction
      triggerBump(direction);
      return characterPosition; // Return original position if can't move
    }

    // Boundary checks with map transitions
    if (newPosition.x < 0) {
      const currentMapName = MAPS[currentMapIndex].name;
      if (currentMapName === "Overworld 2") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld");
        if (targetMapIndex !== -1) {
          newPosition.x = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
        } else {
          newPosition.x = 0;
          triggerBump("left");
          return characterPosition;
        }
      } else if (currentMapName === "Overworld 3") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 2");
        if (targetMapIndex !== -1) {
          newPosition.x = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
        } else {
          newPosition.x = 0;
          triggerBump("left");
          return characterPosition;
        }
      } else {
        newPosition.x = 0;
        triggerBump("left");
        return characterPosition;
      }
    } else if (newPosition.x >= mapWidth) {
      const currentMapName = MAPS[currentMapIndex].name;
      if (currentMapName === "Overworld") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 2");
        if (targetMapIndex !== -1) {
          newPosition.x = 0;
        } else {
          newPosition.x = mapWidth - TILE_SIZE;
          triggerBump("right");
          return characterPosition;
        }
      } else if (currentMapName === "Overworld 2") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 3");
        if (targetMapIndex !== -1) {
          newPosition.x = 0;
        } else {
          newPosition.x = mapWidth - TILE_SIZE;
          triggerBump("right");
          return characterPosition;
        }
      } else {
        newPosition.x = mapWidth - TILE_SIZE;
        triggerBump("right");
        return characterPosition;
      }
    }

    // Vertical boundaries (no map transitions for vertical movement)
    if (newPosition.y < 0) {
      newPosition.y = 0;
      triggerBump("up");
      return characterPosition;
    } else if (newPosition.y >= mapHeight) {
      newPosition.y = mapHeight - TILE_SIZE;
      triggerBump("down");
      return characterPosition;
    }

    // Handle map transitions
    if (targetMapIndex !== currentMapIndex) {
      setCurrentMapIndex(targetMapIndex);
    }

    return newPosition;
  }, [characterPosition, currentMapIndex, setCurrentMapIndex, movementConstants.stepSize, triggerBump]);

  // Discrete movement handling - one move per key press
  const handleDiscreteMove = useCallback((direction) => {
    // Prevent rapid successive moves
    const now = Date.now();
    if (now - lastMoveTime.current < 150) return; // Minimum 150ms between moves
    lastMoveTime.current = now;

    const newPosition = moveCharacter(direction);

    // Only update if position actually changed
    if (newPosition.x !== characterPosition.x || newPosition.y !== characterPosition.y) {
      handleCharacterMove(newPosition, currentMapIndex);

      // Update viewport
      if (adjustViewport) {
        adjustViewport(newPosition);
      }

      // Play movement sound
      if (soundManager) {
        soundManager.playSound("step", 0.2);
      }
    }
  }, [moveCharacter, characterPosition, handleCharacterMove, currentMapIndex, adjustViewport, soundManager]);

  // Handle key input for discrete movement
  const handleMove = useCallback((direction, pressed) => {
    if (pressed) {
      handleDiscreteMove(direction);
    }
  }, [handleDiscreteMove]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          // Prevent key repeat for movement keys
          if (processedKeys.current.has(event.key)) return;
          processedKeys.current.add(event.key);
          handleMove("up", true);
          event.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          // Prevent key repeat for movement keys
          if (processedKeys.current.has(event.key)) return;
          processedKeys.current.add(event.key);
          handleMove("down", true);
          event.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          // Prevent key repeat for movement keys
          if (processedKeys.current.has(event.key)) return;
          processedKeys.current.add(event.key);
          handleMove("left", true);
          event.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          // Prevent key repeat for movement keys
          if (processedKeys.current.has(event.key)) return;
          processedKeys.current.add(event.key);
          handleMove("right", true);
          event.preventDefault();
          break;
        case "e":
        case "E":
        case "p":
        case "P":
          processedKeys.current.add(event.key);
          if (visibleArtifact) {
            handleArtifactPickup(visibleArtifact);
          }
          break;
        case "i":
        case "I":
          processedKeys.current.add(event.key);
          setShowInventory(true);
          break;
        case "f":
        case "F":
          processedKeys.current.add(event.key);
          setShowForm(true);
          setFormPosition({ x: characterPosition.x, y: characterPosition.y });
          break;
      }
    };

    const handleKeyUp = (event) => {
      // Clear processed keys for all keys (including movement keys)
      processedKeys.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handleMove,
    visibleArtifact,
    handleArtifactPickup,
    characterPosition,
    setShowForm,
    setFormPosition,
    setShowInventory,
  ]);

  return {
    isBumping,
    bumpDirection,
    movementDirection,
    diagonalMovement,
    handleMove, // Export handleMove for use in TouchControls
  };
};

export { useCharacterMovement };
