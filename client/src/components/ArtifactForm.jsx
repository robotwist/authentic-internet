import React, { useState } from "react";
import axios from "axios";

const ArtifactForm = ({ position, onClose, refreshArtifacts }) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("open");
  const [unlockMethod, setUnlockMethod] = useState("none");
  const [unlockKey, setUnlockKey] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newArtifact = {
        content,
        type: "text",
        visibility,
        unlockMethod,
        unlockKey: unlockMethod !== "none" ? unlockKey : null,  // Only store key if needed
        location: {
          x: position.x,
          y: position.y,
          scene: "Overworld",
          latitude: latitude || null,
          longitude: longitude || null,
        },
      };

      await axios.post("http://localhost:5000/api/artifacts", newArtifact);
      refreshArtifacts();
      onClose();
    } catch (error) {
      console.error("Error saving artifact:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Enter artifact content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <label>Visibility:</label>
      <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
        <option value="open">Open (Visible to all)</option>
        <option value="hidden">Hidden (Must be discovered)</option>
        <option value="locked">Locked (Requires a key)</option>
      </select>

      {visibility === "locked" && (
        <>
          <label>Unlock Method:</label>
          <select value={unlockMethod} onChange={(e) => setUnlockMethod(e.target.value)}>
            <option value="password">Password</option>
            <option value="location">Visit Location</option>
            <option value="puzzle">Solve a Puzzle</option>
          </select>
          <input
            type="text"
            placeholder="Enter unlock key"
            value={unlockKey}
            onChange={(e) => setUnlockKey(e.target.value)}
            required
          />
        </>
      )}

      <input
        type="text"
        placeholder="Latitude (optional)"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
      />
      <input
        type="text"
        placeholder="Longitude (optional)"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
      />

      <button type="submit">Save Artifact</button>
    </form>
  );
};

export default ArtifactForm;
