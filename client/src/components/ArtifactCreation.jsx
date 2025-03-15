import React, { useState } from "react";
import API from "../api/api"; // Centralized API calls
import "./ArtifactCreation.css";

const ArtifactCreation = ({ position, onClose, refreshArtifacts }) => {
  const [artifactData, setArtifactData] = useState({
    name: "",
    description: "",
    content: "",
    riddle: "",
    unlockAnswer: "",
    area: "Overworld", // Default area
    isExclusive: false,
    location: { x: position.x / 64, y: position.y / 64 }, // Set location
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setArtifactData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!artifactData.name || !artifactData.description || !artifactData.content) {
      alert("Please fill in all required fields.");
      return;
    }

    console.log("🛠️ Submitting Artifact:", artifactData);

    try {
      const response = await API.post("/artifacts", artifactData);

      if (response && response.data) {
        console.log("Artifact created successfully:", response.data);
        refreshArtifacts(); // Update artifact list
        onClose(); // Close the form
      } else {
        alert("❌ Failed to create artifact.");
      }
    } catch (error) {
      console.error("Error creating artifact:", error);
      alert("Failed to create artifact. Check console for details.");
    }
  };

  return (
    <div className="artifact-creation-overlay">
      <div className="artifact-creation-container">
        <h2>Create an Artifact</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            value={artifactData.name}
            onChange={handleChange}
            placeholder="Artifact name"
            required
          />
          <input
            name="description"
            value={artifactData.description}
            onChange={handleChange}
            placeholder="Artifact description"
            required
          />
          <input
            name="content"
            value={artifactData.content}
            onChange={handleChange}
            placeholder="Artifact content"
            required
          />
          <input
            name="riddle"
            value={artifactData.riddle}
            onChange={handleChange}
            placeholder="Riddle (Optional)"
          />
          <input
            name="unlockAnswer"
            value={artifactData.unlockAnswer}
            onChange={handleChange}
            placeholder="Answer (If Riddle)"
          />
          <select name="area" value={artifactData.area} onChange={handleChange}>
            <option value="Overworld">Overworld</option>
            <option value="Desert">Desert</option>
            <option value="Dungeon">Dungeon</option>
          </select>
          <label>
            Exclusive:
            <input
              name="isExclusive"
              type="checkbox"
              checked={artifactData.isExclusive}
              onChange={handleChange}
            />
          </label>
          <button type="submit">Place Artifact</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default ArtifactCreation;
