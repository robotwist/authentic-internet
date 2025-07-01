import { useState, useCallback } from 'react';

/**
 * Core game state hook - handles only fundamental game position and map state
 * Extracted from GameWorld.jsx to reduce complexity
 */
export const useGameState = () => {
  const [characterPosition, setCharacterPosition] = useState({ x: 64, y: 64 });
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });

  const updateCharacterPosition = useCallback((newPosition) => {
    setCharacterPosition(newPosition);
  }, []);

  const updateMapIndex = useCallback((mapIndex) => {
    setCurrentMapIndex(mapIndex);
  }, []);

  const updateViewport = useCallback((newViewport) => {
    setViewport(newViewport);
  }, []);

  return {
    // State
    characterPosition,
    currentMapIndex,
    viewport,
    
    // Actions
    updateCharacterPosition,
    updateMapIndex,
    updateViewport,
    setCharacterPosition,
    setCurrentMapIndex,
    setViewport
  };
};