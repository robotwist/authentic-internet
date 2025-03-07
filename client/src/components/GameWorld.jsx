import React, { useState, useEffect } from "react";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactForm from "./ArtifactForm";
import ErrorBoundary from "./ErrorBoundary";
import API from "../api/api";
import "./GameWorld.css";

const GameWorld = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Artifacts
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const response = await API.get("/artifacts");
        if (Array.isArray(response.data)) {
          setArtifacts(response.data);
        } else {
          console.error("🚨 API did not return an array:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching artifacts:", error);
      }
    };

    loadArtifacts();
  }, []);

  // Check User Access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await API.get("/users/me/access");
        setAccessGranted(response.data.accessGranted);
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  return (
    <div className="game-container">
      <img src="/assets/world-map.webp" alt="Game World Map" className="map-image" />

      {/* Secret Area Access */}
      {accessGranted ? <div className="secret-area">🚀 Secret Friend Zone is Open!</div> : <div className="locked-area">🔒 You need at least 1 friend to enter.</div>}

      {/* Player Character */}
      <Character />

      {/* Display Artifacts */}
      <ErrorBoundary>
        {artifacts.length > 0 ? (
          artifacts
            .filter((artifact) => artifact.visibility !== "hidden") // ✅ Exclude hidden artifacts
            .map((artifact) => (
              <Artifact key={artifact._id} artifact={artifact} onUnlock={(id) => console.log(`Artifact ${id} unlocked`)} />
            ))
        ) : (
          <p>No artifacts found.</p>
        )}
      </ErrorBoundary>

      {/* Artifact Form (Press 'E' to open) */}
      {showForm && <ArtifactForm position={formPosition} onClose={() => setShowForm(false)} refreshArtifacts={() => setArtifacts([...artifacts])} />}
    </div>
  );
};

export default GameWorld;
