import { useEffect, useState, useCallback, useRef } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAPS, isWalkable } from "./Constants";
import SoundManager from "./utils/SoundManager";

// Movement step size - one full tile per button press
const MOVEMENT_STEP_SIZE = TILE_SIZE; // 64px - one tile per move for grid-based movement

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

  // Calculate power effects
  const hasSpeedBoost = activePowers.includes("speed_boost");
  const hasDoubleJump = activePowers.includes("double_jump");
  const hasFlight = activePowers.includes("flight");

  // Movement cooldown based on speed boost (50% faster = 50% less cooldown)
  const BASE_MOVEMENT_COOLDOWN = 150; // ms
  const movementCooldownTime = hasSpeedBoost
    ? BASE_MOVEMENT_COOLDOWN * 0.5
    : BASE_MOVEMENT_COOLDOWN;

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

  // Define handleMove before processKeyPresses since it's used there
  const handleMove = useCallback(
    (direction, event) => {
      // Skip movement during cooldown
      if (movementCooldown) {
        event?.preventDefault();
        return;
      }

      // Validate characterPosition to prevent NaN issues
      if (
        !characterPosition ||
        typeof characterPosition !== "object" ||
        typeof characterPosition.x !== "number" ||
        typeof characterPosition.y !== "number"
      ) {
        console.error("Invalid character position:", characterPosition);
        return;
      }

      // Calculate time since last move for discrete grid-based movement
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTime.current;
      if (timeSinceLastMove < movementCooldownTime) {
        return;
      }
      lastMoveTime.current = now;

      // Reset jump count if enough time has passed (landed on ground)
      if (now - lastJumpTime.current > 500) {
        jumpCount.current = 0;
      }

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

      // Calculate movement step size based on powers
      let stepSize = MOVEMENT_STEP_SIZE;
      let canJump = false;

      // Flight power allows moving over obstacles and 2x movement
      if (hasFlight && (direction === "up" || direction === "down")) {
        stepSize = MOVEMENT_STEP_SIZE * 2; // Fly faster vertically
      }

      // Double jump power - allow jumping up twice
      if (hasDoubleJump && direction === "up") {
        if (jumpCount.current < 2) {
          canJump = true;
          jumpCount.current += 1;
          lastJumpTime.current = now;
        } else {
          // Check if we can jump (need to be on ground or recently jumped)
          const timeSinceLastJump = now - lastJumpTime.current;
          if (timeSinceLastJump > 1000) {
            // Reset if enough time passed (landed)
            jumpCount.current = 1;
            lastJumpTime.current = now;
            canJump = true;
          } else {
            return; // Can't jump yet
          }
        }
      }

      // Calculate new position based on direction
      switch (direction) {
        case "up":
          newPosition.y -= stepSize;
          break;
        case "down":
          newPosition.y += stepSize;
          break;
        case "left":
          newPosition.x -= stepSize;
          break;
        case "right":
          newPosition.x += stepSize;
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
            targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld");
            if (targetMapIndex !== -1) {
              newPosition.x =
                (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
            } else {
              canMove = false;
            }
          } else if (currentMapName === "Overworld 3") {
            targetMapIndex = MAPS.findIndex(
              (map) => map.name === "Overworld 2",
            );
            if (targetMapIndex !== -1) {
              newPosition.x =
                (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
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
            targetMapIndex = MAPS.findIndex(
              (map) => map.name === "Overworld 2",
            );
            if (targetMapIndex !== -1) {
              newPosition.x = 0;
            } else {
              canMove = false;
            }
          } else if (currentMapName === "Overworld 2") {
            targetMapIndex = MAPS.findIndex(
              (map) => map.name === "Overworld 3",
            );
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

      // Check if the new position is walkable (flight power can pass over obstacles)
      if (canMove && !hasFlight) {
        const tileX = Math.floor(newPosition.x / TILE_SIZE);
        const tileY = Math.floor(newPosition.y / TILE_SIZE);

        // Safety check for array bounds
        if (
          tileY >= 0 &&
          tileY < currentMapData.length &&
          tileX >= 0 &&
          tileX < currentMapData[0].length
        ) {
          if (!isWalkable(newPosition.x, newPosition.y, currentMapData)) {
            canMove = false;
            triggerBump(direction);
          }
        } else {
          canMove = false;
        }
      }

      // Flight power: allow movement over obstacles, but still check boundaries
      if (canMove && hasFlight) {
        const tileX = Math.floor(newPosition.x / TILE_SIZE);
        const tileY = Math.floor(newPosition.y / TILE_SIZE);

        // Only check boundaries, not walkability
        if (
          tileY < 0 ||
          tileY >= currentMapData.length ||
          tileX < 0 ||
          tileX >= currentMapData[0].length
        ) {
          canMove = false;
        }
      }

      if (!canMove) {
        triggerBump(direction);
        return;
      }

      // If we can move, update position and handle map transitions
      handleCharacterMove(newPosition, targetMapIndex);

      // Update viewport
      if (adjustViewport) {
        adjustViewport(newPosition);
      }

      // Play movement sound
      if (soundManager) {
        soundManager.playSound("step", 0.2);
      }

      // Check for portal collision after movement (automatic portal activation)
      const finalMapData = MAPS[targetMapIndex]?.data;
      if (finalMapData) {
        const finalTileX = Math.floor(newPosition.x / TILE_SIZE);
        const finalTileY = Math.floor(newPosition.y / TILE_SIZE);

        if (
          finalTileY >= 0 &&
          finalTileY < finalMapData.length &&
          finalTileX >= 0 &&
          finalTileX < finalMapData[0].length
        ) {
          const tileType = finalMapData[finalTileY][finalTileX];

          // Trigger portal activation for portal tiles (5-8)
          if (tileType >= 5 && tileType <= 8) {
            // Dispatch a custom event that GameWorld can listen to
            const portalEvent = new CustomEvent("portalCollision", {
              detail: {
                tileX: finalTileX,
                tileY: finalTileY,
                tileType: tileType,
              },
            });
            window.dispatchEvent(portalEvent);
          }
        }
      }
    },
    [
      characterPosition,
      currentMapIndex,
      movementCooldown,
      handleCharacterMove,
      adjustViewport,
      soundManager,
      triggerBump,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Prevent key repeat for movement - only allow one move per key press
      if (processedKeys.current.has(event.key)) {
        return;
      }
      processedKeys.current.add(event.key);

      // Handle movement keys immediately with discrete movement
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          handleMove("up");
          event.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          handleMove("down");
          event.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          handleMove("left");
          event.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          handleMove("right");
          event.preventDefault();
          break;
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
      // Remove key from processed keys to allow next press
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
