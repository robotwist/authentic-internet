import { useEffect, useState, useCallback } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, MAPS, isWalkable } from "./Constants";
import { playSound } from "../utils/soundEffects";

const useCharacterMovement = (
  characterPosition, 
  setCharacterPosition, 
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

  // Trigger a bumping animation
  const triggerBump = useCallback((direction) => {
    if (isBumping) return; // Don't trigger if already bumping
    
    setBumpDirection(direction);
    setIsBumping(true);
    
    // Play a bump sound effect
    playSound('bump', 0.3).catch(err => {
      // Silently fail if bump sound not available
      console.log("No bump sound available:", err);
    });
    
    // Reset after animation completes
    setTimeout(() => {
      setIsBumping(false);
      setBumpDirection(null);
    }, 400); // Match the animation duration in CSS
  }, [isBumping]);

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
            // Can't go further left on other maps
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
            // Can't go further right on other maps
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
      default:
        return;
    }

    // Set the active movement direction for animation
    setMovementDirection(direction);
    
    // Clear movement direction after a brief delay
    setTimeout(() => {
      setMovementDirection(null);
    }, 200);

    // Only update if position has changed and can move
    if (canMove && (newPosition.x !== characterPosition.x || newPosition.y !== characterPosition.y || targetMapIndex !== currentMapIndex)) {
      // If map changed, update map index
      if (targetMapIndex !== currentMapIndex) {
        setCurrentMapIndex(targetMapIndex);
      }
      
      console.log("Moving character to:", newPosition);
      setCharacterPosition(newPosition);
      adjustViewport(newPosition);
      
      // Set brief cooldown to prevent rapid movement
      setMovementCooldown(true);
      setTimeout(() => {
        setMovementCooldown(false);
      }, 150); // Short cooldown to avoid too rapid movement
    }
  }, [characterPosition, currentMapIndex, triggerBump, setCharacterPosition, adjustViewport, setCurrentMapIndex, movementCooldown]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
          handleMove("up", event);
          break;
        case "ArrowDown":
        case "s":
          handleMove("down", event);
          break;
        case "ArrowLeft":
        case "a":
          handleMove("left", event);
          break;
        case "ArrowRight":
        case "d":
          handleMove("right", event);
          break;
        case "e":
          if (visibleArtifact) {
            handleArtifactPickup();
          } else {
            if (isLoggedIn) {
              setFormPosition({ x: characterPosition.x, y: characterPosition.y });
              setShowForm(true);
            } else {
              alert("You need to be logged in to create artifacts.");
            }
          }
          return;
        case "p":
          handleArtifactPickup();
          return;
        case "i":
          setShowInventory((prev) => !prev);
          return;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, characterPosition, isLoggedIn, visibleArtifact, 
      handleArtifactPickup, setShowForm, setFormPosition, setShowInventory]);

  return { isBumping, bumpDirection, movementDirection };
};

export default useCharacterMovement;