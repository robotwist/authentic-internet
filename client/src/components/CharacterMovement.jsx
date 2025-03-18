import { useEffect } from "react";
import { TILE_SIZE, MAP_COLS, MAPS, isWalkable } from "./Constants";

export const useCharacterMovement = (characterPosition, setCharacterPosition, currentMapIndex, setCurrentMapIndex, isLoggedIn, visibleArtifact, handleArtifactPickup, setShowForm, setFormPosition, setShowInventory, adjustViewport) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      
      // Get current position in tile coordinates
      const currentX = Math.floor(characterPosition.x / TILE_SIZE);
      const currentY = Math.floor(characterPosition.y / TILE_SIZE);

      // Calculate new position based on key press
      let newX = characterPosition.x;
      let newY = characterPosition.y;

      switch (key) {
        case 'arrowup':
          newY = characterPosition.y - TILE_SIZE;
          break;
        case 'arrowdown':
          newY = characterPosition.y + TILE_SIZE;
          break;
        case 'arrowleft':
          newX = characterPosition.x - TILE_SIZE;
          break;
        case 'arrowright':
          newX = characterPosition.x + TILE_SIZE;
          break;
        case 'p':
          if (visibleArtifact) {
            handleArtifactPickup();
          }
          break;
        case 'c':
          if (isLoggedIn) {
            setShowForm(true);
            setFormPosition({ x: currentX, y: currentY });
          } else {
            alert('You need to be logged in to create artifacts!');
          }
          break;
        case 'i':
          setShowInventory(prev => !prev);
          break;
        default:
          break;
      }

      // Convert new position to tile coordinates
      const newTileX = Math.floor(newX / TILE_SIZE);
      const newTileY = Math.floor(newY / TILE_SIZE);

      // Check if the new position is within bounds and not a wall
      if (
        newTileX >= 0 &&
        newTileX < MAPS[currentMapIndex].data[0].length &&
        newTileY >= 0 &&
        newTileY < MAPS[currentMapIndex].data.length &&
        MAPS[currentMapIndex].data[newTileY][newTileX] !== 1 // 1 represents a wall
      ) {
        setCharacterPosition({ x: newX, y: newY });
        adjustViewport({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
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
  ]);
};