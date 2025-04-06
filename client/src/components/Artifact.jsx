import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from "prop-types";
import "./Artifact.css";
import SoundManager from './utils/SoundManager';

// Use a single default image to avoid multiple failed requests
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23555'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='white' text-anchor='middle' dominant-baseline='middle'%3EArtifact%3C/text%3E%3C/svg%3E";

// Image paths (which will fallback to default if they fail to load)
const IMAGE_PATHS = {
  default: DEFAULT_IMAGE,
  sword: DEFAULT_IMAGE,
  orb: DEFAULT_IMAGE,
  goldenIdol: DEFAULT_IMAGE,
  dungeonKey: DEFAULT_IMAGE
};

import { TILE_SIZE } from './Constants';
import { trackArtifactInteraction } from '../utils/apiService';

const Artifact = ({ 
  artifact, 
  onPickup, 
  characterPosition,
  isPickedUp = false,
  currentArea = 'overworld',
  onAreaChange,
  onPortalEnter
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showAspirations, setShowAspirations] = useState(false);
  const [interactionLevel, setInteractionLevel] = useState(0);
  const [soundManager, setSoundManager] = useState(null);
  const [areaLevel, setAreaLevel] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Define isNearCharacter function first before using it in any hooks
  const isNearCharacter = () => {
    if (!characterPosition || !artifact) return false;
    
    const characterX = characterPosition.x;
    const characterY = characterPosition.y;
    const artifactX = artifact.x * TILE_SIZE;
    const artifactY = artifact.y * TILE_SIZE;
    
    // Check if character is within 2 tiles of the artifact
    const distanceX = Math.abs(characterX - artifactX);
    const distanceY = Math.abs(characterY - artifactY);
    
    return distanceX <= TILE_SIZE * 2 && distanceY <= TILE_SIZE * 2;
  };

  // Initialize sound manager
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
      
      // Start playing overworld theme when artifact is visible
      if (manager) {
        manager.playMusic('overworld', true);
      }
    };
    initSoundManager();

    // Cleanup music when component unmounts
    return () => {
      if (soundManager) {
        soundManager.stopMusic(true);
      }
    };
  }, []);

  // Define handlePickup and handlePickupAnimation with useCallback
  const handlePickup = useCallback(async () => {
    if (!isNearCharacter() || isAnimating) return;
    
    try {
      // Track save interaction
      await trackArtifactInteraction(artifact._id, 'save');
      
      // Update local interaction count
      if (artifact.interactions) {
        artifact.interactions.saves = (artifact.interactions.saves || 0) + 1;
      } else {
        artifact.interactions = { saves: 1 };
      }
      
      // Play pickup sound and start animation
      if (soundManager) {
        soundManager.playSound('artifact_pickup');
        // Play level complete sound if this is the first save
        if (artifact.interactions.saves === 1) {
          soundManager.playSound('level_complete');
        }
      }
      handlePickupAnimation();
    } catch (error) {
      console.error("Failed to track pickup:", error);
      if (soundManager) soundManager.playSound('error');
    }
  }, [artifact, isAnimating, soundManager, isNearCharacter]);

  const handlePickupAnimation = useCallback(async () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onPickup) onPickup(artifact);
    }, 500);
  }, [artifact, onPickup]);

  // Handle area progression
  useEffect(() => {
    if (artifact.area && artifact.area !== currentArea) {
      // Update area level based on progression
      const areaOrder = ['overworld', 'desert', 'dungeon', 'yosemite'];
      const currentIndex = areaOrder.indexOf(currentArea);
      const targetIndex = areaOrder.indexOf(artifact.area);
      
      if (targetIndex > currentIndex) {
        setAreaLevel(targetIndex + 1);
        if (soundManager) {
          // Play appropriate sound based on area transition
          if (artifact.area === 'yosemite') {
            soundManager.playSound('level_complete');
            soundManager.playMusic('yosemite', true);
          } else {
            soundManager.playSound('portal');
            soundManager.playMusic(artifact.area, true);
          }
        }
        // Notify parent of area change
        if (onAreaChange) {
          onAreaChange(artifact.area);
        }
      }
    }
  }, [artifact.area, currentArea, soundManager, onAreaChange]);
  
  // Calculate and set interaction level based on total interactions
  useEffect(() => {
    if (artifact.interactions) {
      const views = artifact.interactions.views || 0;
      const saves = artifact.interactions.saves || 0;
      const shares = artifact.interactions.shares || 0;
      const totalInteractions = views + saves + shares;
      
      let level = 0;
      if (totalInteractions >= 5 && saves >= 2) {
        level = 3;
      } else if (totalInteractions >= 3) {
        level = 2;
      } else if (totalInteractions >= 1) {
        level = 1;
        if (soundManager && !hasTrackedView) {
          soundManager.playSound('bump');
        }
      }
      
      setInteractionLevel(level);
    }
  }, [artifact.interactions, soundManager, hasTrackedView]);
  
  // Track view interaction when artifact becomes visible to user
  useEffect(() => {
    const trackViewInteraction = async () => {
      if (isNearCharacter() && !hasTrackedView && artifact._id) {
        // Track view interaction when character gets close to artifact
        try {
          await trackArtifactInteraction(artifact._id, 'view');
          setHasTrackedView(true);
          
          // Update the artifact's interaction count locally
          if (artifact.interactions) {
            artifact.interactions.views = (artifact.interactions.views || 0) + 1;
          } else {
            artifact.interactions = { views: 1 };
          }

          // Play view sound
          if (soundManager) soundManager.playSound('page_turn');
        } catch (error) {
          console.error("Failed to track view interaction:", error);
          if (soundManager) soundManager.playSound('error');
        }
      }
    };
    
    trackViewInteraction();
  }, [characterPosition, artifact, hasTrackedView, soundManager, isNearCharacter]);
  
  // Get creator name if available
  useEffect(() => {
    if (artifact.creator && typeof artifact.creator === 'object') {
      setCreatorName(artifact.creator.username || 'Unknown Creator');
    } else if (typeof artifact.creator === 'string') {
      setCreatorName(artifact.creator || 'Unknown Creator');
    }
  }, [artifact]);

  // Update the useEffect for handleKeyPress to depend on handlePickup
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'p' && isNearCharacter() && !isAnimating) {
        handlePickup();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePickup, isNearCharacter]);

  // Update the useEffect for isPickedUp to use the memoized handlePickupAnimation
  useEffect(() => {
    if (isPickedUp) {
      handlePickupAnimation();
    }
  }, [isPickedUp, handlePickupAnimation]);
  
  const isUserCreated = () => {
    return artifact.creator && artifact.creator === localStorage.getItem('userId');
  };

  const getArtifactClass = (artifact) => {
    const baseClass = 'artifact';
    const typeClass = artifact.type ? `artifact-${artifact.type}` : '';
    const levelClass = interactionLevel > 0 ? `artifact-level-${interactionLevel}` : '';
    const areaClass = artifact.area ? `artifact-area-${artifact.area}` : '';
    const animationClass = isAnimating ? 'artifact-pickup-animation' : '';
    const nearClass = isNearCharacter() ? 'artifact-near' : '';
    const portalClass = artifact.portalType ? `artifact-portal artifact-portal-${artifact.portalType}` : '';
    
    return `${baseClass} ${typeClass} ${levelClass} ${areaClass} ${animationClass} ${nearClass} ${portalClass}`.trim();
  };

  const getArtifactImage = (artifact) => {
    if (!artifact || !artifact.type) return IMAGE_PATHS.default;
    return IMAGE_PATHS[artifact.type] || IMAGE_PATHS.default;
  };

  const calculatePosition = (artifact) => {
    if (!artifact) return {};
    
    return {
      left: `${artifact.x * TILE_SIZE}px`,
      top: `${artifact.y * TILE_SIZE}px`,
      transform: `translate(${TILE_SIZE/2}px, ${TILE_SIZE/2}px)`
    };
  };

  // Update handlePortalInteraction to keep all its original functionality
  const handlePortalInteraction = useCallback(() => {
    if (!isNearCharacter() || isAnimating) return;

    const portalType = artifact.portalType;
    if (portalType) {
      if (soundManager) {
        // Always play portal sound
        soundManager.playSound('portal');
        
        // Handle warp portals in Yosemite
        if (artifact.area === 'yosemite') {
          // Notify parent of portal entry
          if (onPortalEnter) {
            onPortalEnter(portalType);
          }
          // Play appropriate theme music
          switch (portalType) {
            case 'textAdventure':
              soundManager.playMusic('textAdventure', true);
              break;
            case 'terminal':
              soundManager.playMusic('terminal', true);
              break;
            case 'hemingway':
              soundManager.playMusic('hemingway', true);
              break;
          }
        }
        // Handle progress portals within Level 1
        else if (artifact.area) {
          soundManager.playMusic(artifact.area, true);
          // Notify parent of area change
          if (onAreaChange) {
            onAreaChange(artifact.area);
          }
        }
      }
    }
  }, [artifact, isAnimating, soundManager, onPortalEnter, onAreaChange, isNearCharacter]);

  const handleInteraction = async () => {
    if (!isNearCharacter()) return;
    
    try {
      // Handle portal interaction if this is a portal artifact
      if (artifact.portalType) {
        handlePortalInteraction();
        return;
      }

      // Track regular artifact interaction
      await trackArtifactInteraction(artifact._id, 'view');
      
      // Update local interaction count
      if (artifact.interactions) {
        artifact.interactions.views = (artifact.interactions.views || 0) + 1;
      } else {
        artifact.interactions = { views: 1 };
      }
      
      // Show details
      setShowDetails(true);
      if (soundManager) {
        // Play bump sound on first interaction
        if (artifact.interactions.views === 1) {
          soundManager.playSound('bump');
        } else {
          soundManager.playSound('page_turn');
        }
      }
      
      // Auto-hide details after 5 seconds
      setTimeout(() => {
        setShowDetails(false);
      }, 5000);
    } catch (error) {
      console.error("Failed to track interaction:", error);
      if (soundManager) soundManager.playSound('error');
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (handleInteraction) {
      handleInteraction();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`${getArtifactClass(artifact)} ${isHovered ? 'hovered' : ''}`}
      style={calculatePosition(artifact)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <img 
        src={getArtifactImage(artifact)} 
        alt={artifact.name || 'Artifact'} 
        className="artifact-image"
      />
      
      {isNearCharacter() && (
        <div className="artifact-prompt">
          {artifact.portalType ? (
            artifact.area === 'yosemite' ? 
              `Enter ${getPortalDisplay(artifact.portalType)}` : 
              `Enter ${getAreaDisplay(artifact.area)}`
          ) : 'Press P to pick up'}
        </div>
      )}
      
      {showDetails && (
        <div className="artifact-details">
          <h3>{artifact.name}</h3>
          <p>{artifact.description}</p>
          <p className="creator">Created by: {creatorName}</p>
          {artifact.messageText && (
            <p className="message">{artifact.messageText}</p>
          )}
          {artifact.theme && (
            <p className="theme">Theme: {getThemeDisplay(artifact.theme)}</p>
          )}
          {artifact.dedication && (
            <p className="dedication">Dedicated to: {artifact.dedication}</p>
          )}
          {isUserCreated() && artifact.significance && (
            <p className="significance">Your note: {artifact.significance}</p>
          )}
          {artifact.portalType && (
            <p className="portal-info">Portal to: {getPortalDisplay(artifact.portalType)}</p>
          )}
        </div>
      )}
    </div>
  );
};

const getThemeDisplay = (theme) => {
  const themeMap = {
    wisdom: 'Wisdom & Philosophy',
    inspiration: 'Inspiration & Motivation',
    nature: 'Nature & Exploration',
    literature: 'Literature & Poetry',
    history: 'History & Legacy',
    personal: 'Personal Reflection'
  };
  return themeMap[theme] || theme;
};

const getPortalDisplay = (portalType) => {
  const portalMap = {
    textAdventure: 'Text Adventure',
    terminal: 'Terminal Adventure',
    hemingway: 'Hemingway Shooter'
  };
  return portalMap[portalType] || portalType;
};

const getAreaDisplay = (area) => {
  const areaMap = {
    overworld: 'Overworld',
    desert: 'Desert',
    dungeon: 'Dungeon',
    yosemite: 'Yosemite'
  };
  return areaMap[area] || area;
};

Artifact.propTypes = {
  artifact: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    x: PropTypes.number,
    y: PropTypes.number,
    creator: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    messageText: PropTypes.string,
    theme: PropTypes.string,
    dedication: PropTypes.string,
    significance: PropTypes.string,
    portalType: PropTypes.oneOf(['textAdventure', 'terminal', 'hemingway']),
    interactions: PropTypes.shape({
      views: PropTypes.number,
      saves: PropTypes.number,
      shares: PropTypes.number
    }),
    area: PropTypes.oneOf(['overworld', 'desert', 'dungeon', 'yosemite'])
  }).isRequired,
  onPickup: PropTypes.func,
  characterPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  isPickedUp: PropTypes.bool,
  currentArea: PropTypes.oneOf(['overworld', 'desert', 'dungeon', 'yosemite']),
  onAreaChange: PropTypes.func,
  onPortalEnter: PropTypes.func
};

export default Artifact;

