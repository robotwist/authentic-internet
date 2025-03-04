import React from "react";

const Artifact = ({ artifact }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: artifact.location.y,
        left: artifact.location.x,
        background: "yellow",
        padding: "5px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={() => alert(`Artifact: ${artifact.content}`)}
    >
      📝
    </div>
  );
};

export default Artifact;
