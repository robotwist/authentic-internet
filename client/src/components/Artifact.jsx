import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import "./Artifact.css";

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
  isPickedUp = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showAspirations, setShowAspirations] = useState(false);
  const [interactionLevel, setInteractionLevel] = useState(0);

  useEffect(() => {
    if (isPickedUp) {
      handlePickupAnimation();
    }
  }, [isPickedUp]);
  
  // Calculate and set interaction level based on total interactions
  useEffect(() => {
    if (artifact.interactions) {
      const views = artifact.interactions.views || 0;
      const saves = artifact.interactions.saves || 0;
      const shares = artifact.interactions.shares || 0;
      const totalInteractions = views + saves + shares;
      
      // Determine level based on interactions
      let level = 0;
      if (totalInteractions >= 5 && saves >= 2) {
        level = 3; // Level 3 requirement - opens path to terminal
      } else if (totalInteractions >= 3) {
        level = 2; // Level 2 requirement - opens path to Yosemite
      } else if (totalInteractions >= 1) {
        level = 1; // Has some interaction
      }
      
      setInteractionLevel(level);
    }
  }, [artifact.interactions]);
  
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
        } catch (error) {
          console.error("Failed to track view interaction:", error);
        }
      }
    };
    
    trackViewInteraction();
  }, [characterPosition, artifact, hasTrackedView]);
  
  // Get creator name if available
  useEffect(() => {
    if (artifact.creator && typeof artifact.creator === 'object') {
      setCreatorName(artifact.creator.username || 'Unknown Creator');
    } else if (typeof artifact.creator === 'string') {
      setCreatorName(artifact.creator || 'Unknown Creator');
    }
  }, [artifact]);

  const handlePickupAnimation = async () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);

    // Track save interaction
    if (artifact._id) {
      try {
        await trackArtifactInteraction(artifact._id, 'save');
        
        // Update the artifact's interaction count locally
        if (artifact.interactions) {
          artifact.interactions.saves = (artifact.interactions.saves || 0) + 1;
        } else {
          artifact.interactions = { saves: 1 };
        }
      } catch (error) {
        console.error("Failed to track save interaction:", error);
      }
    }
  };

  const isNearCharacter = () => {
    if (!characterPosition || !artifact?.location) return false;
    
    const dx = Math.abs(artifact.location.x - Math.floor(characterPosition.x / TILE_SIZE));
    const dy = Math.abs(artifact.location.y - Math.floor(characterPosition.y / TILE_SIZE));
    return dx <= 1 && dy <= 1;
  };

  const isUserCreated = () => {
    // Check if the artifact was created by a user
    return Boolean(artifact.creator && artifact.placeWithCare);
  };

  if (!isVisible) return null;

  // Get the appropriate CSS class and image based on artifact type
  const getArtifactClass = (artifact) => {
    // Base class
    let baseClass = "default-artifact";
    
    // Special artifact classes based on name
    if (artifact.name) {
      const name = artifact.name.toLowerCase();
      if (name.includes("sword")) baseClass = "ancient-sword";
      if (name.includes("orb")) baseClass = "mystic-orb";
      if (name.includes("idol")) baseClass = "golden-idol";
      if (name.includes("key")) baseClass = "dungeon-key";
    }
    
    // Theme-based classes for user artifacts
    if (isUserCreated() && artifact.theme) {
      return `${baseClass} user-artifact theme-${artifact.theme}`;
    }
    
    return baseClass;
  };

  /**
   * Gets the appropriate image for the artifact
   * Uses a safe approach with fallbacks
   */
  const getArtifactImage = (artifact) => {
    if (!artifact) return IMAGE_PATHS.default;
    
    // Use type to determine image, defaulting to the basic artifact image
    switch(artifact.type) {
      case 'sword':
        return IMAGE_PATHS.sword;
      case 'orb':
        return IMAGE_PATHS.orb;
      case 'golden_idol':
        return IMAGE_PATHS.goldenIdol;
      case 'key':
        return IMAGE_PATHS.dungeonKey;
      default:
        return IMAGE_PATHS.default;
    }
  };

  const calculatePosition = (artifact) => {
    if (!artifact || !artifact.location) return { x: 0, y: 0, tileSize: TILE_SIZE };
    
    // Convert tile coordinates to pixel positions
    const x = artifact.location.x * TILE_SIZE;
    const y = artifact.location.y * TILE_SIZE;
    
    return { x, y, tileSize: TILE_SIZE };
  };

  const handleInteraction = async () => {
    if (artifact.isCollectable && isNearCharacter() && !isAnimating) {
      // Track save interaction and handle pickup
      if (onPickup) {
        onPickup(artifact);
      }
    } else if (isNearCharacter()) {
      // Toggle artifact details for non-collectable artifacts
      setShowDetails(!showDetails);
      
      // Update share interaction if details are shown
      if (!showDetails && artifact._id) {
        try {
          await trackArtifactInteraction(artifact._id, 'share');
          
          // Update the artifact's interaction count locally
          if (artifact.interactions) {
            artifact.interactions.shares = (artifact.interactions.shares || 0) + 1;
          } else {
            artifact.interactions = { shares: 1 };
          }
        } catch (error) {
          console.error("Failed to track share interaction:", error);
        }
      }
    }
  };

  const { x, y, tileSize } = calculatePosition(artifact);

  // Build classes for artifact
  const artifactClasses = [
    'artifact',
    getArtifactClass(artifact),
    isAnimating ? 'pickup-animation' : '',
    isNearCharacter() ? 'highlight' : '',
    isUserCreated() ? 'user-created' : 'system-artifact',
    showDetails ? 'show-details' : '',
    isUserCreated() && interactionLevel > 0 ? `interaction-level-${interactionLevel}` : ''
  ].filter(Boolean).join(' ');

  const artifactStyle = {
    position: "absolute",
    top: `${y}px`,
    left: `${x}px`,
    width: `${tileSize}px`,
    height: `${tileSize}px`,
    backgroundImage: `url(${getArtifactImage(artifact)})`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 1000,
  };

  return (
    <div
      className={artifactClasses}
      style={artifactStyle}
      title={artifact.name}
      onClick={handleInteraction}
    >
      <div className="artifact-glow"></div>
      
      {isUserCreated() && (
        <div className="artifact-indicator">
          <span className="artifact-creator-badge" title={`Created by ${creatorName}`}>✦</span>
        </div>
      )}
      
      {isUserCreated() && interactionLevel > 0 && (
        <div className={`level-indicator level-${interactionLevel}`}>
          {interactionLevel}
        </div>
      )}
      
      {showDetails && isNearCharacter() && (
        <div className="artifact-details">
          <h3>{artifact.name}</h3>
          {artifact.description && <p className="artifact-description">{artifact.description}</p>}
          {isUserCreated() && creatorName && (
            <p className="artifact-creator">Created by {creatorName}</p>
          )}
          {isUserCreated() && artifact.dedication && (
            <p className="artifact-dedication">"{artifact.dedication}"</p>
          )}
          {isUserCreated() && artifact.theme && (
            <p className="artifact-theme">{getThemeDisplay(artifact.theme)}</p>
          )}
          {isUserCreated() && artifact.significance && !showAspirations && (
            <button 
              className="aspirations-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAspirations(true);
              }}
            >
              Show Creator's Aspirations
            </button>
          )}
          {isUserCreated() && showAspirations && (
            <div className="creator-aspirations">
              <h4>Creator's Aspiration</h4>
              <p>{artifact.significance}</p>
              {artifact.dedication && (
                <p className="dedication">Dedicated to: {artifact.dedication}</p>
              )}
            </div>
          )}
          {interactionLevel > 0 && isUserCreated() && (
            <div className="interaction-status">
              <span>✓ Views: {artifact.interactions?.views || 0}</span>
              <span>✓ Saves: {artifact.interactions?.saves || 0}</span>
              <span>✓ Shares: {artifact.interactions?.shares || 0}</span>
            </div>
          )}
          {isNearCharacter() && (
            <div className="artifact-interaction-hint">
              Press E to {artifact.messageText ? "read message" : "pick up"}
            </div>
          )}
        </div>
      )}
      
      {/* Creative Aspirations Popup */}
      {showAspirations && isUserCreated() && (
        <div className="artifact-aspirations" onClick={(e) => { e.stopPropagation(); setShowAspirations(false); }}>
          <div className="aspirations-content">
            <h4>Creator's Inspiration</h4>
            <p className="aspiration-question">
              What did {creatorName} want to create?
            </p>
            <p className="aspiration-answer">
              "{artifact.significance || "Something meaningful for others to discover"}"
            </p>
            <p className="aspiration-question">
              What might you create in this world?
            </p>
            <div className="aspirations-close">Click to close</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get theme display name
const getThemeDisplay = (theme) => {
  const themes = {
    wisdom: 'Wisdom & Philosophy',
    inspiration: 'Inspiration & Motivation',
    nature: 'Nature & Exploration',
    literature: 'Literature & Poetry',
    history: 'History & Legacy',
    personal: 'Personal Reflection'
  };
  
  return themes[theme] || theme;
};

Artifact.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    content: PropTypes.string,
    messageText: PropTypes.string,
    location: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    theme: PropTypes.string,
    dedication: PropTypes.string,
    significance: PropTypes.string,
    placeWithCare: PropTypes.bool,
    creator: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    x: PropTypes.number,
    y: PropTypes.number,
    image: PropTypes.string,
    onInteract: PropTypes.func,
  }).isRequired,
  onPickup: PropTypes.func,
  characterPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  isPickedUp: PropTypes.bool,
};

export default Artifact;

