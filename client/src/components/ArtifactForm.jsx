import React, { useState } from "react";
import API from "../api/api";

const ArtifactForm = ({ position, onClose, refreshArtifacts }) => {
  const [artifactData, setArtifactData] = useState({ content: "", location: position });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setArtifactData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/artifacts", artifactData);
      alert("Artifact created!");
      refreshArtifacts();
      onClose();
    } catch (error) {
      console.error("Error creating artifact:", error);
      alert("You need to be logged in to create artifacts.");
    }
  };

  return (
    <form style={{ position: "absolute", top: position.y, left: position.x }} onSubmit={handleSubmit}>
      <input type="text" name="content" value={artifactData.content} onChange={handleChange} placeholder="Content" required />
      <button type="submit">Create Artifact</button>
      <button type="button" onClick={onClose}>Close</button>
    </form>
  );
};

export default ArtifactForm;
