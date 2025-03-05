import React, { useEffect, useState } from "react";
import axios from "axios";

const ArtifactList = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [unlockedArtifacts, setUnlockedArtifacts] = useState({});
  const [passwordInputs, setPasswordInputs] = useState({});

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/artifacts");
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
    if (passwordInputs[id] === correctPassword) {
      setUnlockedArtifacts((prev) => ({ ...prev, [id]: true }));
    } else {
      alert("Incorrect password! Try again.");
    }
  };

  return (
    <div>
      <h2>Artifacts</h2>
      <ul>
        {artifacts.map((artifact) => (
          <li key={artifact._id}>
            <strong>
              {artifact.visibility === "hidden" && !unlockedArtifacts[artifact._id]
                ? "[Hidden Artifact] 🔍"
                : artifact.visibility === "locked" && !unlockedArtifacts[artifact._id]
                ? "[Locked Artifact] 🔒"
                : artifact.content}
            </strong>
            {artifact.visibility === "hidden" && !unlockedArtifacts[artifact._id] && (
              <button onClick={() => unlockArtifact(artifact._id)}>🔓 Unlock</button>
            )}
            {artifact.visibility === "locked" && !unlockedArtifacts[artifact._id] && (
              <div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInputs[artifact._id] || ""}
                  onChange={(e) => handlePasswordInput(e, artifact._id)}
                />
                <button onClick={() => submitPassword(artifact._id, artifact.unlockKey)}>
                  🔑 Submit
                </button>
              </div>
            )}
            {artifact.location.latitude && artifact.location.longitude && (
              <p>🌍 Location: {artifact.location.latitude}, {artifact.location.longitude}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArtifactList;
