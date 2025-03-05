import React, { useState } from "react";
import "./Artifact.css";

const Artifact = ({ artifact, onUnlock }) => {
  const { content, location, type, visibility, unlockMethod, unlockKey } = artifact;
  const [isRevealed, setIsRevealed] = useState(visibility === "open");
  const [isAttemptingUnlock, setIsAttemptingUnlock] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");

  const handleClick = () => {
    if (visibility === "open") {
      setIsRevealed(!isRevealed);
    } else if (visibility === "locked") {
      setIsAttemptingUnlock(true);
    }
  };

  const handleUnlock = () => {
    if (userAnswer.toLowerCase() === unlockKey.toLowerCase()) {
      setIsRevealed(true);
      setIsAttemptingUnlock(false);
      onUnlock(artifact._id); // Tell the server it's unlocked
    }
  };

  return (
    <div
      className={`artifact artifact-${type}`}
      style={{ left: `${location.x}px`, top: `${location.y}px` }}
      onClick={handleClick}
    >
      <span className="artifact-icon">📜</span> {/* This icon changes per type */}

      {isRevealed && (
        <div className="artifact-content">
          {content}
        </div>
      )}

      {isAttemptingUnlock && (
        <div className="artifact-unlock">
          <p>🔒 {artifact.riddle}</p>
          <input
            type="text"
            placeholder="Enter answer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
          <button onClick={handleUnlock}>Unlock</button>
        </div>
      )}
    </div>
  );
};

export default Artifact;
