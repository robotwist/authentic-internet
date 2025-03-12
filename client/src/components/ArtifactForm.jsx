import React, { useState } from "react";
import API from "../api/api";

const ArtifactForm = ({ position, onClose, refreshArtifacts }) => {
  const [artifactData, setArtifactData] = useState({
    name: "",
    description: "",
    content: "",
    riddle: "",
    unlockAnswer: "",
    area: "Overworld",  // Set default area
    isExclusive: false,
    x: position.x / 64, // Set x position
    y: position.y / 64, // Set y position
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
    try {
      await API.post("/artifacts", artifactData);
      refreshArtifacts();
      onClose();
    } catch (error) {
      console.error("Error creating artifact:", error);
    }
  };

  return (
    <div className="artifact-form">
      <h2>Create Artifact</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" name="name" value={artifactData.name} onChange={handleChange} required />
        </label>
        <label>
          Description:
          <textarea name="description" value={artifactData.description} onChange={handleChange} required />
        </label>
        <label>
          Content:
          <textarea name="content" value={artifactData.content} onChange={handleChange} required />
        </label>
        <label>
          Riddle:
          <textarea name="riddle" value={artifactData.riddle} onChange={handleChange} />
        </label>
        <label>
          Unlock Answer:
          <input type="text" name="unlockAnswer" value={artifactData.unlockAnswer} onChange={handleChange} />
        </label>
        <label>
          Area:
          <select name="area" value={artifactData.area} onChange={handleChange}>
            <option value="Overworld">Overworld</option>
            <option value="Desert">Desert</option>
            <option value="Dungeon">Dungeon</option>
          </select>
        </label>
        <label>
          Exclusive:
          <input type="checkbox" name="isExclusive" checked={artifactData.isExclusive} onChange={handleChange} />
        </label>
        <button type="submit">Create</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default ArtifactForm;
