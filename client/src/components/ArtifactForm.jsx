import React, { useState } from "react";
import axios from "axios";

const ArtifactForm = ({ position, onClose, refreshArtifacts }) => {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    await axios.post("http://localhost:5000/api/artifacts", {
      content,
      type: "text", // Later, allow different types
      location: position,
    });

    refreshArtifacts();
    onClose();
  };

  return (
    <div style={{ position: "absolute", top: position.y, left: position.x, background: "white", padding: "10px", borderRadius: "5px" }}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something..." />
      <button onClick={handleSubmit}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default ArtifactForm;
