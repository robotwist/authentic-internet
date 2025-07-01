import { useState, useCallback, useRef } from 'react';
import { TILE_SIZE } from '../components/Constants';
import { MAPS } from '../components/GameData';

/**
 * Portal system hook - handles all portal collision detection and interactions
 * Extracted from the massive nested logic in GameWorld.jsx
 */
export const usePortalSystem = (characterPosition, currentMapIndex, soundManager) => {
  const [portalNotificationActive, setPortalNotificationActive] = useState(false);
  const [currentSpecialWorld, setCurrentSpecialWorld] = useState(null);
  const notificationTimeoutRef = useRef(null);

  // Portal type handlers
  const portalHandlers = {
    terminal: (artifact, currentMapName) => {
      if (currentMapName === "Level3_DungeonHeart" && !portalNotificationActive) {
        return {
          title: "Terminal Discovered!",
          message: "Press SPACE to enter the command line challenge!",
          action: 'terminal'
        };
      }
      return null;
    },

    shooter: (artifact, currentMapName) => {
      if (currentMapName === "Level3_DungeonHeart" && !portalNotificationActive) {
        return {
          title: "Shooter Portal Discovered!",
          message: "Press SPACE to enter the Hemingway Challenge!",
          action: 'shooter'
        };
      }
      return null;
    },

    text: (artifact, currentMapName) => {
      if (currentMapName === "Level3_DungeonHeart" && !portalNotificationActive) {
        return {
          title: "Text Adventure Portal Discovered!",
          message: "Press SPACE to enter the literary adventure!",
          action: 'text'
        };
      }
      return null;
    },

    regular: (tileType, currentMapName) => {
      // Handle type 5 portals (regular map transitions)
      if (tileType === 5) {
        return {
          title: "Portal Discovered!",
          message: "Press SPACE to travel to the next area!",
          action: 'regular'
        };
      }
      return null;
    }
  };

  const checkPortalCollisions = useCallback(() => {
    if (currentMapIndex < 0 || currentMapIndex >= MAPS.length) return null;
    
    const currentMapName = MAPS[currentMapIndex]?.name;
    const playerTileX = Math.floor(characterPosition.x / TILE_SIZE);
    const playerTileY = Math.floor(characterPosition.y / TILE_SIZE);

    // Check special portal artifacts first
    const mapArtifacts = MAPS[currentMapIndex]?.artifacts || [];
    
    for (const artifact of mapArtifacts) {
      if (!artifact?.location || !artifact.visible) continue;
      
      const { x: artifactX, y: artifactY } = artifact.location;
      
      if (artifactX === playerTileX && artifactY === playerTileY) {
        const handler = portalHandlers[artifact.type];
        if (handler) {
          return handler(artifact, currentMapName);
        }
      }
    }

    // Check regular tile-based portals
    const mapData = MAPS[currentMapIndex];
    if (mapData?.data && mapData.data[playerTileY] && mapData.data[playerTileY][playerTileX]) {
      const tileType = mapData.data[playerTileY][playerTileX];
      const handler = portalHandlers.regular;
      if (handler) {
        return handler(tileType, currentMapName);
      }
    }

    return null;
  }, [characterPosition, currentMapIndex, portalNotificationActive]);

  const showPortalNotification = useCallback((title, message) => {
    setPortalNotificationActive(true);
    
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Auto-hide after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setPortalNotificationActive(false);
    }, 5000);

    return { title, message };
  }, []);

  const hidePortalNotification = useCallback(() => {
    setPortalNotificationActive(false);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  const enterPortal = useCallback((portalType, onLevelComplete, setShowLevel4, setCurrentSpecialWorld) => {
    hidePortalNotification();
    
    // Play portal sound
    if (soundManager) {
      const shouldPlayToiletFlush = Math.random() < 0.6;
      soundManager.playSound(shouldPlayToiletFlush ? 'toilet_flush' : 'portal', 0.5);
    }

    switch (portalType) {
      case 'terminal':
        setCurrentSpecialWorld('terminal');
        break;
      case 'shooter':
        setShowLevel4(true);
        break;
      case 'text':
        setCurrentSpecialWorld('text-adventure');
        break;
      case 'regular':
        // Handle map transition logic here
        handleMapTransition();
        break;
      default:
        console.warn('Unknown portal type:', portalType);
    }
  }, [soundManager, hidePortalNotification]);

  const handleMapTransition = useCallback(() => {
    // This would contain the map transition logic
    // Extracted from the original nested conditional logic
    console.log('Handling map transition...');
  }, []);

  return {
    // State
    portalNotificationActive,
    currentSpecialWorld,
    
    // Actions
    checkPortalCollisions,
    showPortalNotification,
    hidePortalNotification,
    enterPortal,
    setCurrentSpecialWorld,
    setPortalNotificationActive
  };
};