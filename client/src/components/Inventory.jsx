import React from "react";
import "./Inventory.css";

const Inventory = ({ artifacts, onClose, onUpdateArtifact, onGainExperience, character }) => {
  const handleUseArtifact = (artifact) => {
    // Implement the logic to use the artifact
    console.log(`Using artifact: ${artifact.name}`);
    alert(`You used the artifact: ${artifact.name}`);
    
    // Gain 1 experience point
    onGainExperience(1);

    // Update the artifact with a comment and increase its value
    const updatedArtifact = {
      ...artifact,
      comment: "Used by a previous adventurer",
      value: artifact.value + 1,
      glow: true, // Artifact glows brighter
    };

    // Call the onUpdateArtifact function to update the artifact
    onUpdateArtifact(updatedArtifact);
  };

  return (
    <div className="inventory-overlay">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>🎒 Inventory</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="character-info">
          <img src={character.avatar} alt="Character Avatar" />
          <h3>{character.name}</h3>
          <p>Level: {character.level}</p>
          <p>Experience: {character.experience}</p>
        </div>
        {artifacts.length > 0 ? (
          <ul className="inventory-list">
            {artifacts.map((artifact, index) => (
              <li key={index}>
                <img src={artifact.icon} alt={artifact.iconDescription} />
                <div>
                  <strong>{artifact.name}</strong> - {artifact.iconDescription}
                </div>
                <button onClick={() => handleUseArtifact(artifact)}>Use</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Empty</p>
        )}
      </div>
    </div>
  );
};

export default Inventory;
