import { useEffect, useState, useCallback, useRef } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAPS, isWalkable } from "./Constants";
import SoundManager from "./utils/SoundManager";

// Movement step size - one full tile per button press
const MOVEMENT_STEP_SIZE = TILE_SIZE; // 64px - one tile per move for grid-based movement

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

  // Calculate power effects
  const hasSpeedBoost = activePowers.includes("speed_boost");
  const hasDoubleJump = activePowers.includes("double_jump");
  const hasFlight = activePowers.includes("flight");

  // Physics constants based on powers
  const physicsConstants = {
    acceleration: 0.3,
    friction: 0.85,
    maxSpeed: hasSpeedBoost ? 3.5 : 2.5,
    jumpForce: -8,
    gravity: hasFlight ? 0.2 : 0.5, // Reduced gravity for flight
    maxJumps: hasDoubleJump ? 2 : 1,
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

  // Continuous physics-based movement system
  const updatePhysics = useCallback((inputDirection, deltaTime = 16) => {
    if (!characterState?.physicsState) return characterPosition;

    const physics = characterState.physicsState;
    let newVelocity = { ...physics.velocity };
    let newPosition = { ...characterPosition };
    let targetMapIndex = currentMapIndex;

    // Apply gravity (unless flying)
    if (!hasFlight) {
      newVelocity.y += physicsConstants.gravity;
      // Cap falling speed
      newVelocity.y = Math.min(newVelocity.y, 8);
    }

    // Apply acceleration based on input
    if (inputDirection.left) {
      newVelocity.x = Math.max(newVelocity.x - physicsConstants.acceleration, -physicsConstants.maxSpeed);
    } else if (inputDirection.right) {
      newVelocity.x = Math.min(newVelocity.x + physicsConstants.acceleration, physicsConstants.maxSpeed);
    } else {
      // Apply friction when no horizontal input
      newVelocity.x *= physicsConstants.friction;
      // Stop completely when velocity is very small
      if (Math.abs(newVelocity.x) < 0.1) newVelocity.x = 0;
    }

    // Handle jumping
    if (inputDirection.up && physics.canJump && physics.jumpCount < physicsConstants.maxJumps) {
      newVelocity.y = physicsConstants.jumpForce;
      physics.jumpCount += 1;
      lastJumpTime.current = Date.now();
      // Play jump sound
      if (soundManager) soundManager.playSound("jump", 0.3);
    }

    // Flight controls (vertical movement)
    if (hasFlight) {
      if (inputDirection.up) {
        newVelocity.y = Math.max(newVelocity.y - physicsConstants.acceleration, -physicsConstants.maxSpeed);
      } else if (inputDirection.down) {
        newVelocity.y = Math.min(newVelocity.y + physicsConstants.acceleration, physicsConstants.maxSpeed);
      } else {
        newVelocity.y *= physicsConstants.friction;
        if (Math.abs(newVelocity.y) < 0.1) newVelocity.y = 0;
      }
    }

    // Update position based on velocity
    newPosition.x += newVelocity.x;
    newPosition.y += newVelocity.y;

    // Get current map data
    const currentMapData = MAPS[currentMapIndex]?.data;
    if (!currentMapData) return characterPosition;

    const mapWidth = currentMapData[0].length * TILE_SIZE;
    const mapHeight = currentMapData.length * TILE_SIZE;

    // Ground collision and landing detection
    if (!hasFlight) {
      const groundY = Math.floor((newPosition.y + TILE_SIZE) / TILE_SIZE) * TILE_SIZE;
      const tileX = Math.floor(newPosition.x / TILE_SIZE);
      const tileY = Math.floor(groundY / TILE_SIZE);

      if (tileY >= 0 && tileY < currentMapData.length && tileX >= 0 && tileX < currentMapData[0].length) {
        if (isWalkable(newPosition.x, groundY, currentMapData)) {
          // Check if we're on ground
          if (newVelocity.y >= 0 && newPosition.y + TILE_SIZE >= groundY - 1) {
            newPosition.y = groundY - TILE_SIZE;
            newVelocity.y = 0;
            physics.isGrounded = true;
            physics.canJump = true;
            physics.jumpCount = 0;
          }
        }
      }
    }

    // Horizontal collision detection
    if (!hasFlight) {
      const tileX = Math.floor(newPosition.x / TILE_SIZE);
      const tileY = Math.floor(newPosition.y / TILE_SIZE);

      // Check left collision
      if (newVelocity.x < 0 && tileX >= 0 && tileY >= 0 && tileY < currentMapData.length) {
        if (!isWalkable(newPosition.x, newPosition.y, currentMapData)) {
          newPosition.x = (tileX + 1) * TILE_SIZE;
          newVelocity.x = 0;
          triggerBump("left");
        }
      }

      // Check right collision
      if (newVelocity.x > 0 && tileX < currentMapData[0].length && tileY >= 0 && tileY < currentMapData.length) {
        if (!isWalkable(newPosition.x + TILE_SIZE - 1, newPosition.y, currentMapData)) {
          newPosition.x = tileX * TILE_SIZE;
          newVelocity.x = 0;
          triggerBump("right");
        }
      }

      // Check ceiling collision (for jumping)
      if (newVelocity.y < 0 && tileY >= 0 && tileX >= 0 && tileX < currentMapData[0].length) {
        if (!isWalkable(newPosition.x, newPosition.y, currentMapData)) {
          newPosition.y = (tileY + 1) * TILE_SIZE;
          newVelocity.y = 0;
        }
      }
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
          newVelocity.x = 0;
        }
      } else if (currentMapName === "Overworld 3") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 2");
        if (targetMapIndex !== -1) {
          newPosition.x = (MAPS[targetMapIndex].data[0].length - 1) * TILE_SIZE;
        } else {
          newPosition.x = 0;
          newVelocity.x = 0;
        }
      } else {
        newPosition.x = 0;
        newVelocity.x = 0;
      }
    } else if (newPosition.x >= mapWidth) {
      const currentMapName = MAPS[currentMapIndex].name;
      if (currentMapName === "Overworld") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 2");
        if (targetMapIndex !== -1) {
          newPosition.x = 0;
        } else {
          newPosition.x = mapWidth - TILE_SIZE;
          newVelocity.x = 0;
        }
      } else if (currentMapName === "Overworld 2") {
        targetMapIndex = MAPS.findIndex((map) => map.name === "Overworld 3");
        if (targetMapIndex !== -1) {
          newPosition.x = 0;
        } else {
          newPosition.x = mapWidth - TILE_SIZE;
          newVelocity.x = 0;
        }
      } else {
        newPosition.x = mapWidth - TILE_SIZE;
        newVelocity.x = 0;
      }
    }

    // Vertical boundaries
    if (newPosition.y < 0) {
      newPosition.y = 0;
      newVelocity.y = 0;
    } else if (newPosition.y >= mapHeight) {
      newPosition.y = mapHeight - TILE_SIZE;
      newVelocity.y = 0;
      physics.isGrounded = true;
      physics.canJump = true;
      physics.jumpCount = 0;
    }

    // Update physics state
    physics.velocity = newVelocity;

    // Handle map transitions
    if (targetMapIndex !== currentMapIndex) {
      setCurrentMapIndex(targetMapIndex);
    }

    return newPosition;
  }, [characterPosition, characterState, currentMapIndex, setCurrentMapIndex, hasFlight, physicsConstants, soundManager, triggerBump]);

  // Input handling for continuous movement
  const inputDirection = useRef({ left: false, right: false, up: false, down: false });
  const lastPhysicsUpdate = useRef(Date.now());

  // Physics update loop
  const updateMovement = useCallback(() => {
    const now = Date.now();
    const deltaTime = now - lastPhysicsUpdate.current;
    lastPhysicsUpdate.current = now;

    if (deltaTime > 50) return; // Skip large time jumps

    const newPosition = updatePhysics(inputDirection.current, deltaTime);

    // Only update if position actually changed
    if (newPosition.x !== characterPosition.x || newPosition.y !== characterPosition.y) {
      handleCharacterMove(newPosition, currentMapIndex);

      // Update viewport
      if (adjustViewport) {
        adjustViewport(newPosition);
      }

      // Play movement sound occasionally (not every frame)
      if (soundManager && Math.random() < 0.1 && (Math.abs(characterState?.physicsState?.velocity?.x || 0) > 1)) {
        soundManager.playSound("step", 0.15);
      }
    }
  }, [updatePhysics, characterPosition, handleCharacterMove, currentMapIndex, adjustViewport, soundManager, characterState]);

  // Set up physics loop
  useEffect(() => {
    const physicsInterval = setInterval(updateMovement, 16); // ~60fps
    return () => clearInterval(physicsInterval);
  }, [updateMovement]);

  // Handle key input for continuous movement
  const handleMove = useCallback((direction, pressed) => {
    switch (direction) {
      case "left":
        inputDirection.current.left = pressed;
        break;
      case "right":
        inputDirection.current.right = pressed;
        break;
      case "up":
        inputDirection.current.up = pressed;
        break;
      case "down":
        inputDirection.current.down = pressed;
        break;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Prevent key repeat for non-movement keys
      if (processedKeys.current.has(event.key)) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          handleMove("up", true);
          event.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          handleMove("down", true);
          event.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          handleMove("left", true);
          event.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
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
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          handleMove("up", false);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          handleMove("down", false);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          handleMove("left", false);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          handleMove("right", false);
          break;
        default:
          // Remove from processed keys for non-movement keys
          processedKeys.current.delete(event.key);
          break;
      }
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
