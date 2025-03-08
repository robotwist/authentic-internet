import React, { useState, useEffect } from "react";
import axios from "axios";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactForm from "./ArtifactForm";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import API from "../api/api";
import "./GameWorld.css";

const TILE_SIZE = 64; // 64px tiles
const WORLD_WIDTH = 64 * TILE_SIZE; // 64 tiles wide
const WORLD_HEIGHT = 64 * TILE_SIZE; // 64 tiles high
const VIEWPORT_WIDTH = 8 * TILE_SIZE; // 8 tiles wide
const VIEWPORT_HEIGHT = 8 * TILE_SIZE; // 8 tiles high

const GameWorld = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [inventory, setInventory] = useState([]); // State to manage inventory
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [characterPosition, setCharacterPosition] = useState({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }); // Center of viewport
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false); // State to manage inventory visibility
  const [visibleArtifact, setVisibleArtifact] = useState(null); // State to manage visible artifact on collision
  const [character, setCharacter] = useState({
    name: "Adventurer",
    level: 1,
    experience: 0,
    avatar: "../assets/character.png", // path to the character's avatar image
  });

  // Load Artifacts
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const response = await API.get("/artifacts");
        if (Array.isArray(response.data)) {
          setArtifacts(response.data);
        } else {
          console.error("API did not return an array:", response.data);
        }
      } catch (error) {
        console.error("Error fetching artifacts:", error);
      }
    };

    loadArtifacts();
  }, []);

  // Check User Access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming the token is stored in localStorage
        const response = await axios.get("http://localhost:5000/api/users/me/access", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAccessGranted(response.data.accessGranted);
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Handle Artifact Creation
  const handleArtifactCreation = async (artifactData) => {
    try {
      const response = await API.post("/artifacts", artifactData);
      alert("Artifact created!");
      const updatedArtifacts = await API.get("/artifacts");
      setArtifacts(updatedArtifacts.data);
    } catch (error) {
      console.error("Error creating artifact:", error);
      alert("You need to be logged in to create artifacts.");
    }
  };

  // Handle Character Movement
  const handleKeyDown = (event) => {
    const speed = TILE_SIZE; // Movement step
    let newPosition = { ...characterPosition };
    switch (event.key) {
      case "ArrowUp":
      case "w":
      newPosition.y = Math.max(characterPosition.y - speed, 1);
      break;
      case "ArrowDown":
      case "s":
      newPosition.y = Math.min(characterPosition.y + speed, WORLD_HEIGHT - TILE_SIZE - 1);
      break;
      case "ArrowLeft":
      case "a":
      newPosition.x = Math.max(characterPosition.x - speed, 1);
      break;
      case "ArrowRight":
      case "d":
      newPosition.x = Math.min(characterPosition.x + speed, WORLD_WIDTH - TILE_SIZE - 1);
      break;
      case "e": // Interaction Key
      if (visibleArtifact) {
        setInventory((prevInventory) => [...prevInventory, visibleArtifact]);
        setArtifacts((prevArtifacts) => prevArtifacts.filter((artifact) => artifact._id !== visibleArtifact._id));
        setVisibleArtifact(null);
      } else {
        setFormPosition({ x: characterPosition.x, y: characterPosition.y });
        setShowForm(true);
      }
      return;
      case "i": // Inventory Key
      setShowInventory(!showInventory);
      return;
      default:
      return;
    }

    setCharacterPosition(newPosition);
    adjustViewport(newPosition);
    };

  // Adjust Viewport to Follow Character
  const adjustViewport = (newPosition) => {
    setViewport({
      x: Math.max(Math.min(newPosition.x - VIEWPORT_WIDTH / 2, WORLD_WIDTH - VIEWPORT_WIDTH), 0),
      y: Math.max(Math.min(newPosition.y - VIEWPORT_HEIGHT / 2, WORLD_HEIGHT - VIEWPORT_HEIGHT), 0),
    });
  };

  // Detect Collision with Artifacts
  useEffect(() => {
    const collidedArtifact = artifacts.find(
      (artifact) => artifact.location.x === characterPosition.x && artifact.location.y === characterPosition.y
    );

    if (collidedArtifact) {
      setVisibleArtifact(collidedArtifact);
    } else {
      setVisibleArtifact(null);
    }
  }, [characterPosition, artifacts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [characterPosition, visibleArtifact]);

  const handleUpdateArtifact = (updatedArtifact) => {
    setInventory((prevInventory) =>
      prevInventory.map((artifact) =>
        artifact._id === updatedArtifact._id ? updatedArtifact : artifact
      )
    );
  };

  const handleGainExperience = (points) => {
    setCharacter((prevCharacter) => ({
      ...prevCharacter,
      experience: prevCharacter.experience + points,
    }));
  };

  return (
    <div className="game-container">
      {/* Secret Area Access */}
      {accessGranted ? <div className="secret-area">🚀 Secret Friend Zone is Open!</div> : <div className="secret-area">🔒 You need at least 1 friend to enter.</div>}

      {/* Display Character */}
      <div className="viewport" style={{ left: -viewport.x, top: -viewport.y }}>
        <Character position={characterPosition} />

        {/* Display Artifacts */}
        <ErrorBoundary>
          {artifacts.map((artifact) => (
            <Artifact
              key={artifact._id}
              artifact={artifact}
              visible={artifact === visibleArtifact} // Only show artifact if it is the visible artifact
              onUnlock={(id) => console.log(`Artifact ${id} unlocked`)}
            />
          ))}
        </ErrorBoundary>
      </div>

      {/* Artifact Form (Press 'E' to Open) */}
      {showForm && (
        <ArtifactForm
          position={formPosition}
          onClose={() => setShowForm(false)}
          refreshArtifacts={() => setArtifacts([...artifacts])}
        />
      )}

      {/* Inventory (Press 'I' to Open) */}
      {showInventory && (
        <Inventory
          artifacts={inventory}
          onClose={() => setShowInventory(false)}
          onUpdateArtifact={handleUpdateArtifact}
          onGainExperience={handleGainExperience}
          character={character}
        />
      )}
    </div>
  );
};

export default GameWorld;
