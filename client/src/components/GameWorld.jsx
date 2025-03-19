import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter
} from "../api/api";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import Map from "./Map";
import useCharacterMovement from "./CharacterMovement";
import { TILE_SIZE, MAPS, MAP_COLS, MAP_ROWS } from "./Constants";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";

const GameWorld = () => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0 });
  const [character, setCharacter] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    fetchArtifacts()
      .then((data) => {
        console.log("📦 Loaded Artifacts:", data);
        setArtifacts(data);
      })
      .catch((error) => console.error("❌ Error fetching artifacts:", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.id) {
          console.warn("🚨 No user found in localStorage. Cannot fetch character.");
          return;
        }

        const characterData = await fetchCharacter(storedUser.id);
        console.log("✅ Character Loaded:", characterData);
        setCharacter(characterData);
      } catch (err) {
        console.error("❌ Failed to load character:", err);
      }
    };

    loadCharacter();
  }, []);

  useEffect(() => {
    if (character && character.experience >= character.level * 10) {
      setCharacter((prevChar) => {
        const updatedCharacter = {
          ...prevChar,
          level: prevChar.level + 1,
          experience: prevChar.experience - prevChar.level * 10,
        };

        if (updatedCharacter.id) {
          updateCharacter(updatedCharacter)
            .then(() => console.log("✅ Character leveled up in backend"))
            .catch((err) => console.error("❌ Failed to update character:", err));
        } else {
          console.warn("🚨 Character ID missing. Cannot update backend.");
        }

        alert("You have leveled up, mighty warrior! You now have 2 adoring fans.");
        return updatedCharacter;
      });
    }
  }, [character?.experience, character?.level]);

  useEffect(() => {
    // Setup event listeners for navbar button actions
    const handleShowInventory = () => {
      setShowInventory(true);
    };

    const handleShowQuotes = () => {
      setShowQuotes(true);
    };

    // Add event listeners
    window.addEventListener('showInventory', handleShowInventory);
    window.addEventListener('showQuotes', handleShowQuotes);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('showInventory', handleShowInventory);
      window.removeEventListener('showQuotes', handleShowQuotes);
    };
  }, []);

  const adjustViewport = (pos) => {
    setViewport({
      x: Math.max(
        0,
        Math.min(pos.x - 8 * TILE_SIZE, MAP_COLS * TILE_SIZE - 16 * TILE_SIZE)
      ),
      y: Math.max(
        0,
        Math.min(pos.y - 6 * TILE_SIZE, MAP_ROWS * TILE_SIZE - 12 * TILE_SIZE)
      ),
    });
  };

  const handleCreateArtifact = (name, description, messageText) => {
    if (!isLoggedIn) {
      alert("You need to be logged in to create artifacts.");
      return;
    }

    const newArtifact = {
      name,
      description,
      messageText,
      location: { x: characterPosition.x / TILE_SIZE, y: characterPosition.y / TILE_SIZE },
      creator: uuidv4(),
      visible: true,
    };

    console.log("✨ Creating artifact at:", newArtifact.location);

    createArtifact(newArtifact)
      .then((data) => {
        console.log("✅ Artifact Created:", data);
        updateArtifactsState(data);
      })
      .catch((error) => console.error("❌ Error creating artifact:", error));
  };

  const updateArtifactsState = (newArtifact) => {
    setArtifacts((prev) => [...prev, newArtifact]);
  };

  const refreshArtifacts = async () => {
    try {
      const updatedArtifacts = await fetchArtifacts();
      setArtifacts(updatedArtifacts);
    } catch (error) {
      console.error("❌ Error refreshing artifacts:", error);
    }
  };

  const findArtifactAtLocation = (x, y) => {
    return artifacts.find((a) => a?.location?.x === x && a?.location?.y === y);
  };

  const handleArtifactPickup = () => {
    if (!characterPosition) {
      console.error("🚨 Character position is undefined!");
      return;
    }

    const { x, y } = {
      x: characterPosition.x / TILE_SIZE,
      y: characterPosition.y / TILE_SIZE,
    };

    console.log("📍 Checking for artifact at:", { x, y });

    const artifact = findArtifactAtLocation(x, y);

    if (artifact) {
      console.log("✅ Picking Up Artifact:", artifact);
      setInventory((prev) => [...prev, artifact]);
      handleGainExperience(artifact.exp || 0);
      removeArtifactFromMap(artifact.id);
    } else {
      console.warn("⚠️ No artifact found at this location.");
    }
  };

  const removeArtifactFromMap = (artifactId) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
  };

  const handleUpdateArtifact = (updatedArtifact) => {
    if (!updatedArtifact || !updatedArtifact.id) {
      console.error("🚨 Invalid artifact update: Missing id!", updatedArtifact);
      return;
    }

    setInventory((prevInventory) => {
      const exists = prevInventory.some((artifact) => artifact.id === updatedArtifact.id);
      if (!exists) {
        console.warn("⚠️ Artifact not found in inventory:", updatedArtifact.id);
      } else {
        console.log("🔄 Updating artifact in inventory:", updatedArtifact);
      }

      return prevInventory.map((artifact) =>
        artifact.id === updatedArtifact.id ? updatedArtifact : artifact
      );
    });
  };

  const handleGainExperience = async (points) => {
    setCharacter((prev) => {
      if (!prev.id) {
        console.error("🚨 Character ID is missing!", prev);
        return prev;
      }

      const updatedCharacter = { ...prev, experience: prev.experience + points };
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ XP Updated on Backend"))
        .catch((err) => console.error("❌ Failed to update XP:", err));

      return updatedCharacter;
    });
  };

  useCharacterMovement(characterPosition, setCharacterPosition, currentMapIndex, setCurrentMapIndex, isLoggedIn, visibleArtifact, handleArtifactPickup, setShowForm, setFormPosition, setShowInventory, adjustViewport);

  useEffect(() => {
    const collidedArtifact = MAPS[currentMapIndex].artifacts.find(
      (artifact) => artifact.location && artifact.location.x === characterPosition.x / TILE_SIZE && artifact.location.y === characterPosition.y / TILE_SIZE
    );

    if (collidedArtifact) {
      setVisibleArtifact(collidedArtifact);
    } else {
      setVisibleArtifact(null);
    }
  }, [characterPosition, currentMapIndex]);

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    if (MAPS[currentMapIndex].data[row][col] === 5) {
      if (currentMapIndex < MAPS.length - 1) {
        setCurrentMapIndex((prev) => prev + 1);
        setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
      }
    }
  }, [characterPosition, currentMapIndex]);

  const handleDeleteQuote = (index) => {
    if (character && character.savedQuotes) {
      const updatedQuotes = [...character.savedQuotes];
      updatedQuotes.splice(index, 1);
      
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes
      };
      
      setCharacter(updatedCharacter);
      
      if (updatedCharacter.id) {
        updateCharacter(updatedCharacter)
          .then(() => console.log("✅ Quote deleted successfully"))
          .catch(err => console.error("❌ Failed to update character after quote deletion:", err));
      }
    }
  };

  return (
    <div className="game-container">
      <div className="viewport" style={{ width: "100%", height: "100%" }}>
        <div className="game-world">
          <Map mapData={MAPS[currentMapIndex].data} viewport={viewport} />
          <Character position={characterPosition} />
          <ErrorBoundary>
            {MAPS[currentMapIndex].artifacts.map((artifact) =>
              artifact.visible && artifact.location ? (
                <Artifact
                  key={`artifact-${artifact.id}`}
                  src={artifact.image}
                  artifact={artifact}
                  visible={artifact.id === visibleArtifact?.id}
                  style={{
                    position: "absolute",
                    left: `${artifact.location.x * TILE_SIZE}px`,
                    top: `${artifact.location.y * TILE_SIZE}px`,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    zIndex: 10000
                  }}
                />
              ) : null
            )}
          </ErrorBoundary>
        </div>
      </div>

      {showForm && (
        <ArtifactCreation
          position={formPosition}
          onClose={() => setShowForm(false)}
          refreshArtifacts={refreshArtifacts}
        />
      )}

      {showInventory && (
        <Inventory 
          artifacts={inventory}
          onClose={() => setShowInventory(false)}
          onUpdateArtifact={handleUpdateArtifact}
          onGainExperience={handleGainExperience}
          refreshArtifacts={refreshArtifacts}
        />      
      )}

      {showQuotes && character && (
        <SavedQuotes 
          quotes={character.savedQuotes || []}
          onClose={() => setShowQuotes(false)}
          onDeleteQuote={handleDeleteQuote}
        />      
      )}
    </div>
  );
};

export default GameWorld;