import React from "react";
import "./Artifact.css";

const Artifact = ({ artifact }) => {
  const artifactClass = artifact.name.toLowerCase().replace(" ", "-");

  return (
    <div
      className={`artifact ${artifactClass}`}
      style={{
        position: "absolute",
        top: artifact.y * 64,
        left: artifact.x * 64,
        width: 64,
        height: 64,
        backgroundSize: "cover",
        imageRendering: "pixelated",
      }}
    />
  );
};

export default Artifact;

