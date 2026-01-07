import React, { useEffect, useState } from "react";
import API from "../api/api"; // Centralized API calls
import "./ArtifactList.css"; // Import the new CSS file

const ArtifactList = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [unlockedArtifacts, setUnlockedArtifacts] = useState({});
  const [passwordInputs, setPasswordInputs] = useState({});

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await API.get("/artifacts");
        setArtifacts(res.data);
      } catch (error) {
        console.error("Error fetching artifacts:", error);
      }
    };

    fetchArtifacts();
  }, []);

  const unlockArtifact = (id) => {
    setUnlockedArtifacts((prev) => ({ ...prev, [id]: true }));
  };

  const handlePasswordInput = (e, id) => {
    setPasswordInputs({ ...passwordInputs, [id]: e.target.value });
  };

  const submitPassword = (id, correctPassword) => {
    if (
      passwordInputs[id]?.trim().toLowerCase() ===
      correctPassword?.trim().toLowerCase()
    ) {
      setUnlockedArtifacts((prev) => ({ ...prev, [id]: true }));
      alert("✅ Correct password! Artifact unlocked.");
    } else {
      alert("❌ Incorrect password! Try again.");
    }
  };

  return (
    <div className="artifact-list-container">
      <h2>📜 Artifacts</h2>
      <ul className="artifact-list">
        {artifacts.map((artifact) => (
          <li key={artifact._id} className="artifact-item">
            <strong>
              {artifact.visibility === "hidden" &&
              !unlockedArtifacts[artifact._id]
                ? "🔍 [Hidden Artifact]"
                : artifact.visibility === "locked" &&
                    !unlockedArtifacts[artifact._id]
                  ? "🔒 [Locked Artifact]"
                  : `📜 ${artifact.name || "Unnamed Artifact"}`}
            </strong>

            {artifact.visibility === "hidden" &&
              !unlockedArtifacts[artifact._id] && (
                <button
                  onClick={() => unlockArtifact(artifact._id)}
                  className="unlock-button"
                >
                  🔓 Unlock
                </button>
              )}

            {artifact.visibility === "locked" &&
              !unlockedArtifacts[artifact._id] && (
                <div className="password-container">
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInputs[artifact._id] || ""}
                    onChange={(e) => handlePasswordInput(e, artifact._id)}
                    className="password-input"
                  />
                  <button
                    onClick={() =>
                      submitPassword(artifact._id, artifact.unlockAnswer)
                    }
                    className="submit-button"
                  >
                    🔑 Submit
                  </button>
                </div>
              )}

            {unlockedArtifacts[artifact._id] && (
              <p className="artifact-content">{artifact.content}</p>
            )}

            {artifact.location?.x !== undefined &&
              artifact.location?.y !== undefined && (
                <p className="artifact-location">
                  🌍 Location: {artifact.location.x}, {artifact.location.y}
                </p>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArtifactList;
