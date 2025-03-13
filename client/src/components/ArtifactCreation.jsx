import { useState } from "react";
import "./ArtifactCreation.css";
import { createArtifact } from "../api/api";  // ✅ Ensure this is imported

const ArtifactCreation = ({ position, onClose, refreshArtifacts }) => {
  const [artifactData, setArtifactData] = useState({
    name: "",
    description: "",
    content: "",
    riddle: "",
    unlockAnswer: "",
    area: "Overworld",  // Default area
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

    console.log("Submitting artifact data:", artifactData); // ✅ Debugging

    try {
      const response = await createArtifact(artifactData);
      console.log("Artifact created successfully:", response);

      alert("Artifact created!");
      refreshArtifacts(); // ✅ Update artifact list
      onClose(); // ✅ Close form
    } catch (error) {
      console.error("Error placing artifact:", error);
      alert("Failed to create artifact. Check console for details.");
    }
  };

  return (
    <div className="artifact-creation-overlay">
      <div className="artifact-creation-container">
        <h2>Create an Artifact</h2>
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
        <button onClick={handleSubmit}>Place Artifact</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ArtifactCreation;
