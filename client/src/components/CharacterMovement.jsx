import { useEffect, useState } from "react";
import { TILE_SIZE, MAP_COLS, MAPS, isWalkable } from "./Constants";
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

  // Trigger a bumping animation
  const triggerBump = (direction) => {
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
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip if input is focused
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
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
      let direction = null;
      let canMove = true;

      // Get current map data with safety check
      const currentMapData = MAPS[currentMapIndex]?.data;
      if (!currentMapData) {
        console.error("Map data not found for index:", currentMapIndex);
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
          direction = "up";
          if (isWalkable(newPosition.x, newPosition.y - speed, currentMapData)) {
            newPosition.y -= speed;
          } else {
            triggerBump("up");
            canMove = false;
          }
          break;
        case "ArrowDown":
        case "s":
          direction = "down";
          if (isWalkable(newPosition.x, newPosition.y + speed, currentMapData)) {
            newPosition.y += speed;
          } else {
            triggerBump("down");
            canMove = false;
          }
          break;
        case "ArrowLeft":
        case "a":
          direction = "left";
          if (characterPosition.x - speed < 0 && currentMapIndex > 0) {
            setCurrentMapIndex((prev) => prev - 1);
            newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
          } else if (isWalkable(newPosition.x - speed, newPosition.y, currentMapData)) {
            newPosition.x -= speed;
          } else {
            triggerBump("left");
            canMove = false;
          }
          break;
        case "ArrowRight":
        case "d":
          direction = "right";
          if (characterPosition.x + speed >= MAP_COLS * TILE_SIZE && currentMapIndex < MAPS.length - 1) {
            setCurrentMapIndex((prev) => prev + 1);
            newPosition.x = 0;
          } else if (isWalkable(newPosition.x + speed, newPosition.y, currentMapData)) {
            newPosition.x += speed;
          } else {
            triggerBump("right");
            canMove = false;
          }
          break;
        case "e":
          if (visibleArtifact) {
            handleArtifactPickup();
          } else {
            if (isLoggedIn) {
              setFormPosition({ x: newPosition.x, y: newPosition.y });
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

      // Set the direction even if can't move for animation
      setMovementDirection(direction);
      
      // Clear movement direction after a brief delay
      setTimeout(() => {
        setMovementDirection(null);
      }, 200);

      // Only update if position has changed and can move
      if (canMove && (newPosition.x !== characterPosition.x || newPosition.y !== characterPosition.y)) {
        console.log("Moving character to:", newPosition);
        setCharacterPosition(newPosition);
        adjustViewport(newPosition);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [characterPosition, currentMapIndex, isLoggedIn, visibleArtifact, 
      handleArtifactPickup, setShowForm, setFormPosition, setShowInventory, 
      adjustViewport, setCharacterPosition, setCurrentMapIndex, isBumping]);

  return { isBumping, bumpDirection, movementDirection };
};

export default useCharacterMovement;