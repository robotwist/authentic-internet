import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import "./Artifact.css";
import defaultArtifactImage from "/assets/artifact.webp";
import swordImage from "/assets/ancient_sword.png";
import orbImage from "/assets/mystic_orb.png";
import goldenIdolImage from "/assets/golden_idol.webp";
import dungeonKeyImage from "/assets/dungeon_key.webp";
import { TILE_SIZE } from './Constants';

const Artifact = ({ 
  artifact, 
  onPickup, 
  characterPosition,
  isPickedUp = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isPickedUp) {
      handlePickupAnimation();
    }
  }, [isPickedUp]);

  const handlePickupAnimation = () => {
    setIsAnimating(true);
    // Start disappearing animation
    setTimeout(() => {
      setIsVisible(false);
      // Notify parent after animation completes
      if (onPickup) {
        onPickup(artifact);
      }
    }, 500); // Match this with CSS animation duration
  };

  const isNearCharacter = () => {
    if (!characterPosition || !artifact?.location) return false;
    
    const dx = Math.abs(artifact.location.x - Math.floor(characterPosition.x / TILE_SIZE));
    const dy = Math.abs(artifact.location.y - Math.floor(characterPosition.y / TILE_SIZE));
    return dx <= 1 && dy <= 1;
  };

  if (!isVisible) return null;

  // Get the appropriate CSS class and image based on artifact type
  const getArtifactClass = (name) => {
    switch (name?.toLowerCase()) {
      case "ancient sword": return "ancient-sword";
      case "mystic orb": return "mystic-orb";
      case "golden idol": return "golden-idol";
      case "dungeon key": return "dungeon-key";
      default: return "default-artifact";
    }
  };

  const getArtifactImage = (name) => {
    switch (name?.toLowerCase()) {
      case "ancient sword": return swordImage;
      case "mystic orb": return orbImage;
      case "golden idol": return goldenIdolImage;
      case "dungeon key": return dungeonKeyImage;
      default: return artifact.image || defaultArtifactImage;
    }
  };

  const calculatePosition = (artifact) => {
    if (!artifact || !artifact.location) return { x: 0, y: 0, tileSize: TILE_SIZE };
    
    // Convert tile coordinates to pixel positions
    const x = artifact.location.x * TILE_SIZE;
    const y = artifact.location.y * TILE_SIZE;
    
    console.log("📍 Artifact position calculation:", {
      location: artifact.location,
      result: { x, y, tileSize: TILE_SIZE }
    });
    
    return { x, y, tileSize: TILE_SIZE };
  };

  const { x, y, tileSize } = calculatePosition(artifact);

  const artifactStyle = {
    position: "absolute",
    top: `${y}px`,
    left: `${x}px`,
    width: `${tileSize}px`,
    height: `${tileSize}px`,
    backgroundImage: `url(${getArtifactImage(artifact.name)})`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 1000,
  };

  return (
    <div
      className={`artifact ${getArtifactClass(artifact.name)} ${isAnimating ? 'pickup-animation' : ''} ${isNearCharacter() ? 'highlight' : ''}`}
      style={artifactStyle}
      title={artifact.name}
      onClick={(e) => {
        e.stopPropagation();
        if (artifact.onInteract) {
          artifact.onInteract();
        }
      }}
    >
      <div className="artifact-glow"></div>
    </div>
  );
};

Artifact.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    location: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
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

