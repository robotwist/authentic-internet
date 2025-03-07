import React, { useEffect, useState } from "react";
import API from "../api/api"; // Centralized API calls

const ArtifactList = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [unlockedArtifacts, setUnlockedArtifacts] = useState({});
  const [passwordInputs, setPasswordInputs] = useState({});

  // Fetch Artifacts
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

  // Unlock a Hidden Artifact
  const unlockArtifact = (id) => {
    setUnlockedArtifacts((prev) => ({ ...prev, [id]: true }));
  };

  // Handle Password Input Changes
  const handlePasswordInput = (e, id) => {
    setPasswordInputs({ ...passwordInputs, [id]: e.target.value });
  };

  // Submit Password to Unlock a Locked Artifact
  const submitPassword = (id, correctPassword) => {
    if (passwordInputs[id]?.trim().toLowerCase() === correctPassword?.trim().toLowerCase()) {
      setUnlockedArtifacts((prev) => ({ ...prev, [id]: true }));
      alert("✅ Correct password! Artifact unlocked.");
    } else {
      alert("❌ Incorrect password! Try again.");
    }
  };

  return (
    <div style={{ padding: "20px", background: "#1e1e1e", color: "#fff", borderRadius: "8px" }}>
      <h2>📜 Artifacts</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {artifacts.map((artifact) => (
          <li
            key={artifact._id}
            style={{
              marginBottom: "12px",
              padding: "10px",
              background: "#292929",
              borderRadius: "6px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <strong>
              {artifact.visibility === "hidden" && !unlockedArtifacts[artifact._id]
                ? "🔍 [Hidden Artifact]"
                : artifact.visibility === "locked" && !unlockedArtifacts[artifact._id]
                ? "🔒 [Locked Artifact]"
                : `📜 ${artifact.name || "Unnamed Artifact"}`}
            </strong>

            {/* Unlock Button for Hidden Artifacts */}
            {artifact.visibility === "hidden" && !unlockedArtifacts[artifact._id] && (
              <button
                onClick={() => unlockArtifact(artifact._id)}
                style={{
                  marginLeft: "8px",
                  padding: "5px",
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                🔓 Unlock
              </button>
            )}

            {/* Password Input for Locked Artifacts */}
            {artifact.visibility === "locked" && !unlockedArtifacts[artifact._id] && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInputs[artifact._id] || ""}
                  onChange={(e) => handlePasswordInput(e, artifact._id)}
                  style={{
                    padding: "6px",
                    marginRight: "6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
                <button
                  onClick={() => submitPassword(artifact._id, artifact.unlockKey)}
                  style={{
                    padding: "5px",
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  🔑 Submit
                </button>
              </div>
            )}

            {/* Display Artifact Content if Unlocked */}
            {unlockedArtifacts[artifact._id] && (
              <p style={{ marginTop: "8px", color: "#bbb" }}>{artifact.content}</p>
            )}

            {/* Display GPS Coordinates if Available */}
            {artifact.location?.latitude && artifact.location?.longitude && (
              <p style={{ marginTop: "8px", color: "#aaa" }}>
                🌍 Location: {artifact.location.latitude}, {artifact.location.longitude}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArtifactList;
