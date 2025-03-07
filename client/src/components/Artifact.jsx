import React from "react";
import "./Artifact.css";

const Artifact = ({ artifact }) => {
  if (!artifact) return null;

  return (
    <div
      className="artifact"
      style={{ left: `${artifact.location.x}px`, top: `${artifact.location.y}px`, position: "absolute" }}
    >
      🏺 {artifact.content}
    </div>
  );
};

export default Artifact;
