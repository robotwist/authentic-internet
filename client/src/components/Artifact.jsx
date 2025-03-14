import React from "react";
import PropTypes from "prop-types";
import "./Artifact.css";
import defaultArtifactImage from "/assets/artifact.webp"; // Ensure you have a default image in your assets
import swordImage from "/assets/ancient_sword.png"; // Specific image for the sword
import orbImage from "/assets/mystic_orb.png"; // Specific image for the orb

const TILE_SIZE = 64;

const Artifact = ({ artifact, visible }) => {
  if (!visible) return null;

  let artifactImage;

  switch (artifact.name) {
    case "Ancient Sword":
      artifactImage = swordImage;
      break;
    case "Mystic Orb":
      artifactImage = orbImage;
      break;
    default:
      artifactImage = artifact.image || defaultArtifactImage;
  }

  const artifactStyle = {
    position: "absolute",
    top: (artifact.y || 0) * TILE_SIZE, // Added default value to prevent NaN
    left: (artifact.x || 0) * TILE_SIZE, // Added default value to prevent NaN
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundImage: `url(${artifactImage})`,
    backgroundSize: "cover",
    border: visible ? "2px solid yellow" : "none",
  };
  return <div className="artifact" style={artifactStyle}></div>;
};

Artifact.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    image: PropTypes.string,
  }).isRequired,
  visible: PropTypes.bool.isRequired,
};

export default Artifact;

