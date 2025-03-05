import React, { useState, useEffect } from "react";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactForm from "./ArtifactForm";
import { fetchArtifacts } from "../api/api";
import axios from "axios";

const GameWorld = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [accessGranted, setAccessGranted] = useState(false);

  // Fetch artifacts from the database
  const loadArtifacts = async () => {
    try {
      const data = await fetchArtifacts();
      console.log("🔍 Loaded Artifacts:", data); // Debugging line
      setArtifacts(data);
    } catch (error) {
      console.error("❌ Error fetching artifacts:", error);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, []);

  // Check if the user has access to the restricted area
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/YOUR_USER_ID/check-access`);
        setAccessGranted(res.data.accessGranted);
      } catch (error) {
        console.error("Error checking access:", error);
      }
    };

    checkAccess();
  }, []);

  // Handle key press events (e.g., opening artifact creation form)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "E") {
        setFormPosition({ x: 150, y: 150 }); // Adjust position dynamically if needed
        setShowForm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#linear-gradient(to bottom, #1e1e1e, #2a2a2a)", position: "relative" }}>
      {/* Secret Area Access Message */}
      {accessGranted ? (
        <div>🚀 Secret Friend Zone is Open!</div>
      ) : (
        <div>🔒 You need at least 1 friend to enter.</div>
      )}

      {/* Player Character */}
      <Character />

      {/* Display Artifacts */}
      {artifacts.map((artifact) => (
        <Artifact key={artifact._id} artifact={artifact} />
      ))}

      {/* Artifact Form - Appears when user presses 'E' */}
      {showForm && (
        <ArtifactForm
          position={formPosition}
          onClose={() => setShowForm(false)}
          refreshArtifacts={loadArtifacts} // ✅ Corrected: Now properly refreshes from the backend
        />
      )}
    </div>
  );
};

export default GameWorld;
