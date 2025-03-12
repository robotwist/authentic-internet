import { useState } from "react";
import API from "../api/api";

const ArtifactCreation = ({ position, onClose, refreshArtifacts }) => {
  const [content, setContent] = useState("");
  const [riddle, setRiddle] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    const artifactData = {
      content,
      riddle,
      answer,
      location: { x: position.x / 64, y: position.y / 64 }, // Use the provided position
    };
    try {
      await API.post("/artifacts", artifactData);
      alert("Artifact placed in the world!");
      refreshArtifacts();
      onClose();
    } catch (error) {
      console.error("Error placing artifact:", error);
      alert("Failed to place artifact. Please try again.");
    }
  };

  return (
    <div className="artifact-creation">
      <h2>Create an Artifact</h2>
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Artifact content"
      />
      <input
        value={riddle}
        onChange={(e) => setRiddle(e.target.value)}
        placeholder="Riddle (Optional)"
      />
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer (If Riddle)"
      />
      <button onClick={handleSubmit}>Place Artifact</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default ArtifactCreation;
