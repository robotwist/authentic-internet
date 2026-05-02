import { useEffect, useState, useCallback, useRef } from "react";
import { TILE_SIZE, MAPS, isWalkable } from "./Constants";
import SoundManager from "./utils/SoundManager";
import { isTextEntryFocused } from "../utils/textFieldFocus";

// Movement step size - half tile per button press for precise grid movement
const MOVEMENT_STEP_SIZE = TILE_SIZE / 2; // 32px - half tile per move

const useCharacterMovement = (
  characterPositionRef,
  characterState,
  handleCharacterMove,
  currentMapIndex,
  setCurrentMapIndex,
  isLoggedIn,
  visibleArtifact,
  handleArtifactPickup,
  setFormPosition,
  setShowInventory,
  adjustViewport,
  activePowers = [], // Array of active power IDs
  transitionToNeighbor, // New callback for neighbor transitions
) => {
  const [isBumping, setIsBumping] = useState(false);
  const [bumpDirection, setBumpDirection] = useState(null);
  const [movementDirection, setMovementDirection] = useState(null);
  const [movementCooldown, setMovementCooldown] = useState(false);
  const [diagonalMovement, setDiagonalMovement] = useState({ x: 0, y: 0 });
  const lastMoveTime = useRef(Date.now());
  const processedKeys = useRef(new Set()); // Track keys that have been processed
  const jumpCount = useRef(0); // Track jumps for double jump power
  const lastJumpTime = useRef(0);

  // Calculate power effects for discrete movement
  const safeActivePowers = Array.isArray(activePowers) ? activePowers : [];
  const hasSpeedBoost = safeActivePowers.includes("speed_boost");
  const hasFlight = safeActivePowers.includes("flight");

  // Movement constants - discrete movement per key press
  const movementConstants = {
    stepSize: hasSpeedBoost ? MOVEMENT_STEP_SIZE * 1.5 : MOVEMENT_STEP_SIZE, // Speed boost gives 1.5x movement
  };

  // Trigger a bumping animation
  const triggerBump = useCallback(
    (direction) => {
      if (isBumping) return; // Don't trigger if already bumping

      setBumpDirection(direction);
      setIsBumping(true);

      SoundManager.getInstance().playSound("bump", 0.3);

      // Reset after animation completes
      setTimeout(() => {
        setIsBumping(false);
        setBumpDirection(null);
      }, 200); // Reduced from 400ms for more responsive feel
    },
    [isBumping],
  );

  // Discrete movement system - move exactly one step per key press
  const moveCharacter = useCallback(
    (direction) => {
      const characterPosition = characterPositionRef.current;
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
      const canMove =
        isWalkable(newPosition.x, newPosition.y, currentMapData) &&
        isWalkable(
          newPosition.x + TILE_SIZE - 1,
          newPosition.y,
          currentMapData,
        ) &&
        isWalkable(
          newPosition.x,
          newPosition.y + TILE_SIZE - 1,
          currentMapData,
        ) &&
        isWalkable(
          newPosition.x + TILE_SIZE - 1,
          newPosition.y + TILE_SIZE - 1,
          currentMapData,
        );

      if (!canMove) {
        // Trigger bump animation based on direction
        triggerBump(direction);
        return characterPosition; // Return original position if can't move
      }

      // Edge detection for map transitions
      const currentMap = MAPS[currentMapIndex];
      const neighbors = currentMap?.neighbors || {};

      // Check if movement would go out of bounds
      if (newPosition.x < 0) {
        // Would go left off the map
        if (neighbors.left) {
          // Dispatch transition to neighbor instead of moving
          if (transitionToNeighbor) {
            transitionToNeighbor("left");
          }
          return characterPosition; // Don't move the character
        } else {
          // No neighbor - treat as wall
          triggerBump("left");
          return characterPosition;
        }
      } else if (newPosition.x >= mapWidth) {
        // Would go right off the map
        if (neighbors.right) {
          // Dispatch transition to neighbor instead of moving
          if (transitionToNeighbor) {
            transitionToNeighbor("right");
          }
          return characterPosition; // Don't move the character
        } else {
          // No neighbor - treat as wall
          triggerBump("right");
          return characterPosition;
        }
      }

      // Vertical edge detection for map transitions
      if (newPosition.y < 0) {
        // Would go up off the map
        if (neighbors.up) {
          // Dispatch transition to neighbor instead of moving
          if (transitionToNeighbor) {
            transitionToNeighbor("up");
          }
          return characterPosition; // Don't move the character
        } else {
          // No neighbor - treat as wall
          triggerBump("up");
          return characterPosition;
        }
      } else if (newPosition.y >= mapHeight) {
        // Would go down off the map
        if (neighbors.down) {
          // Dispatch transition to neighbor instead of moving
          if (transitionToNeighbor) {
            transitionToNeighbor("down");
          }
          return characterPosition; // Don't move the character
        } else {
          // No neighbor - treat as wall
          triggerBump("down");
          return characterPosition;
        }
      }

      // Handle map transitions
      if (targetMapIndex !== currentMapIndex) {
        setCurrentMapIndex(targetMapIndex);
      }

      return newPosition;
    },
    [
      characterPositionRef,
      currentMapIndex,
      setCurrentMapIndex,
      movementConstants.stepSize,
      triggerBump,
      transitionToNeighbor,
    ],
  );

  // Discrete movement handling - one move per key press
  const handleDiscreteMove = useCallback(
    (direction) => {
      // Prevent rapid successive moves
      const now = Date.now();
      if (now - lastMoveTime.current < 150) return; // Minimum 150ms between moves
      lastMoveTime.current = now;

      const newPosition = moveCharacter(direction);
      const characterPosition = characterPositionRef.current;

      // Only update if position actually changed
      if (
        newPosition.x !== characterPosition.x ||
        newPosition.y !== characterPosition.y
      ) {
        handleCharacterMove(newPosition, currentMapIndex);

        // Update viewport - ensure it's a function before calling
        if (adjustViewport && typeof adjustViewport === "function") {
          adjustViewport(newPosition);
        }
      }
    },
    [
      moveCharacter,
      characterPositionRef,
      handleCharacterMove,
      currentMapIndex,
      adjustViewport,
    ],
  );

  // Handle key input for discrete movement
  const handleMove = useCallback(
    (direction, pressed) => {
      if (pressed) {
        handleDiscreteMove(direction);
      }
    },
    [handleDiscreteMove],
  );

  useEffect(() => {
    processedKeys.current.clear();
  }, [currentMapIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTextEntryFocused()) {
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
      }
    };

    const handleKeyUp = (event) => {
      // Clear processed keys for all keys (including movement keys)
      processedKeys.current.delete(event.key);
    };

    const clearProcessedKeys = () => {
      processedKeys.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearProcessedKeys);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearProcessedKeys);
    };
  }, [
    handleMove,
    visibleArtifact,
    handleArtifactPickup,
    characterPositionRef,
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
