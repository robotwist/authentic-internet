import { useEffect } from "react";
import { TILE_SIZE, MAP_COLS, MAPS, isWalkable } from "./Constants";

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

      // Get current map data with safety check
      const currentMapData = MAPS[currentMapIndex]?.data;
      if (!currentMapData) {
        console.error("Map data not found for index:", currentMapIndex);
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
          if (isWalkable(newPosition.x, newPosition.y - speed, currentMapData)) {
            newPosition.y -= speed;
          }
          break;
        case "ArrowDown":
        case "s":
          if (isWalkable(newPosition.x, newPosition.y + speed, currentMapData)) {
            newPosition.y += speed;
          }
          break;
        case "ArrowLeft":
        case "a":
          if (characterPosition.x - speed < 0 && currentMapIndex > 0) {
            setCurrentMapIndex((prev) => prev - 1);
            newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
          } else if (isWalkable(newPosition.x - speed, newPosition.y, currentMapData)) {
            newPosition.x -= speed;
          }
          break;
        case "ArrowRight":
        case "d":
          if (characterPosition.x + speed >= MAP_COLS * TILE_SIZE && currentMapIndex < MAPS.length - 1) {
            setCurrentMapIndex((prev) => prev + 1);
            newPosition.x = 0;
          } else if (isWalkable(newPosition.x + speed, newPosition.y, currentMapData)) {
            newPosition.x += speed;
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

      // Only update if position has changed
      if (newPosition.x !== characterPosition.x || newPosition.y !== characterPosition.y) {
        console.log("Moving character to:", newPosition);
        setCharacterPosition(newPosition);
        adjustViewport(newPosition);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [characterPosition, currentMapIndex, isLoggedIn, visibleArtifact, 
      handleArtifactPickup, setShowForm, setFormPosition, setShowInventory, adjustViewport, setCharacterPosition, setCurrentMapIndex]);
};

export default useCharacterMovement;