import React from "react";
import "./Artifact.css";

const Artifact = ({ artifact, visible }) => {
  if (!artifact) return null;

  const { location = { x: 0, y: 0 }, content = "No content available" } = artifact;

  return (
    visible && (
      <div
        className="artifact"
        style={{ left: `${location.x}px`, top: `${location.y}px`, position: "absolute" }}
      >
        🏺 {content}
      </div>
    )
  );
};

export default Artifact;
