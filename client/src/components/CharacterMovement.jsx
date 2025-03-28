import { useEffect, useState, useCallback } from "react";
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
    }, 400); // Match the animation duration in CSS
  }, [isBumping, soundManager]);

  const handleMove = useCallback((direction, event) => {
    // Skip movement during cooldown
    if (movementCooldown) {
      event.preventDefault();
      return;
    }

    // Validate characterPosition to prevent NaN issues
    if (!characterPosition || typeof characterPosition !== 'object' || 
        typeof characterPosition.x !== 'number' || typeof characterPosition.y !== 'number') {
      console.error("Invalid character position:", characterPosition);
      return;
    }

    const speed = TILE_SIZE;
    let newPosition = { ...characterPosition };
    let canMove = true;
    let targetMapIndex = currentMapIndex;

    // Get current map data with safety check
    const currentMapData = MAPS[currentMapIndex]?.data;
    if (!currentMapData) {
      console.error("Map data not found for index:", currentMapIndex);
      return;
    }

    // Current map name for special logic
    const currentMapName = MAPS[currentMapIndex].name;

    switch (direction) {
      case "up":
        if (isWalkable(newPosition.x, newPosition.y - speed, currentMapData)) {
          newPosition.y -= speed;
        } else {
          triggerBump("up");
          canMove = false;
        }
        break;
      case "down":
        if (isWalkable(newPosition.x, newPosition.y + speed, currentMapData)) {
          newPosition.y += speed;
        } else {
          triggerBump("down");
          canMove = false;
        }
        break;
      case "left":
        // World wrapping logic - moves to previous map if available
        if (newPosition.x - speed < 0) {
          if (currentMapName === "Overworld 2") {
            targetMapIndex = MAPS.findIndex(map => map.name === "Overworld");
            if (targetMapIndex !== -1) {
              newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
            } else {
              triggerBump("left");
              canMove = false;
            }
          } else if (currentMapName === "Overworld 3") {
            targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 2");
            if (targetMapIndex !== -1) {
              newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
            } else {
              triggerBump("left");
              canMove = false;
            }
          } else {
            triggerBump("left");
            canMove = false;
          }
        } else if (isWalkable(newPosition.x - speed, newPosition.y, currentMapData)) {
          newPosition.x -= speed;
        } else {
          triggerBump("left");
          canMove = false;
        }
        break;
      case "right":
        // World wrapping logic - moves to next map if available
        if (newPosition.x + speed >= MAP_COLS * TILE_SIZE) {
          if (currentMapName === "Overworld") {
            targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 2");
            if (targetMapIndex !== -1) {
              newPosition.x = 0;
            } else {
              triggerBump("right");
              canMove = false;
            }
          } else if (currentMapName === "Overworld 2") {
            targetMapIndex = MAPS.findIndex(map => map.name === "Overworld 3");
            if (targetMapIndex !== -1) {
              newPosition.x = 0;
            } else {
              triggerBump("right");
              canMove = false;
            }
          } else {
            triggerBump("right");
            canMove = false;
          }
        } else if (isWalkable(newPosition.x + speed, newPosition.y, currentMapData)) {
          newPosition.x += speed;
        } else {
          triggerBump("right");
          canMove = false;
        }
        break;
    }

    if (canMove) {
      setMovementDirection(direction);
      handleCharacterMove(newPosition, targetMapIndex);
      
      // Set movement cooldown
      setMovementCooldown(true);
      setTimeout(() => {
        setMovementCooldown(false);
      }, 200); // Adjust this value to control movement speed
    }
  }, [characterPosition, currentMapIndex, handleCharacterMove, movementCooldown, triggerBump]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          handleMove("up", event);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          handleMove("down", event);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          handleMove("left", event);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          handleMove("right", event);
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, visibleArtifact, handleArtifactPickup, characterPosition, setShowForm, setFormPosition, setShowInventory]);

  return {
    isBumping,
    bumpDirection,
    movementDirection
  };
};

export default useCharacterMovement;