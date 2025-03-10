import React, { useState, useEffect } from "react";
import axios from "axios";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactForm from "./ArtifactForm";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import API from "../api/api";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";

const TILE_SIZE = 64;
const MAP_ROWS = 200;  
const MAP_COLS = 200;  

// Tile Classes
const TILE_TYPES = {
  0: "grass", // Walkable tile
  1: "wall",  // No-walk tile
  2: "water", // No-walk tile
  3: "sand",  // walkable tile
};


const MAPS = [
  {
    name: "Overworld",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 , 0 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    artifacts: [
      { id: 1, name: "Ancient Sword", x: 3, y: 2, exp: 10, visible: true },
      { id: 2, name: "Mystic Orb", x: 7, y: 5, exp: 15, visible: true },
    ],
  },
  {
    name: "Desert",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [{ id: 3, name: "Golden Idol", x: 4, y: 6, exp: 20, visible: true }],
  },
];
const isWalkable = (x, y, map) => {
  const row = Math.floor(y / TILE_SIZE);
  const col = Math.floor(x / TILE_SIZE);
  const tile = map?.[row]?.[col];
  return tile === 0 || tile === 3;
};

const GameWorld = () => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState({
    x: 4 * TILE_SIZE,
    y: 4 * TILE_SIZE,
  });
  const [character, setCharacter] = useState({
    name: "Adventurer",
    level: 1,
    experience: 0,
  });

  useEffect(() => {
    if (character.experience >= character.level * 10) {
      setCharacter(prevChar => ({
        ...prevChar,
        level: prevChar.level + 1,
        experience: prevChar.experience - (prevChar.level * 10)
      }));
      alert("You have leveled up mighty warrior! You now have 2 adoring fans.");
    }
  }, [character.experience, character.level]);
  

  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  const [artifacts, setArtifacts] = useState(MAPS[currentMapIndex].artifacts);

  // Check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [characterPosition, currentMapIndex, isLoggedIn, visibleArtifact]);

  
  useEffect(() => {
    const collided = MAPS[currentMapIndex].artifacts.find(
      (art) => art.x === characterPosition.x / TILE_SIZE && art.y === characterPosition.y / TILE_SIZE
    );
    if (collided) {
      setVisibleArtifact(collided);
    } else {
      setVisibleArtifact(null);
    }
  }, [characterPosition, currentMapIndex]);

  const handleKeyDown = (event) => {
    const speed = TILE_SIZE;
    let newPosition = { ...characterPosition };

    switch (event.key) {
      case "ArrowUp":
      case "w":
        if (isWalkable(newPosition.x, newPosition.y - speed, MAPS[currentMapIndex].data)) {
          newPosition.y -= speed;
        }
        break;
      case "ArrowDown":
      case "s":
        if (isWalkable(newPosition.x, newPosition.y + speed, MAPS[currentMapIndex].data)) {
          newPosition.y += speed;
        }
        break;
      case "ArrowLeft":
      case "a":
        // Move to the previous map if at the left edge
        if (characterPosition.x - speed < 0 && currentMapIndex > 0) {
          setCurrentMapIndex((prev) => prev - 1);
          newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
        } else if (isWalkable(newPosition.x - speed, newPosition.y, MAPS[currentMapIndex].data)) {
          newPosition.x -= speed;
        }
        break;
      case "ArrowRight":
      case "d":
        // Move to the next map if at the right edge
        if (characterPosition.x + speed >= MAP_COLS * TILE_SIZE && currentMapIndex < MAPS.length - 1) {
          setCurrentMapIndex((prev) => prev + 1);
          newPosition.x = 0;
        } else if (isWalkable(newPosition.x + speed, newPosition.y, MAPS[currentMapIndex].data)) {
          newPosition.x += speed;
        }
        break;
      case "e":
        // If there's a visible artifact, pick it up
        if (visibleArtifact) {
          handleArtifactPickup();
        } else {
          // Otherwise, try to open the artifact form if logged in
          if (isLoggedIn) {
            setFormPosition({ x: newPosition.x, y: newPosition.y });
            setShowForm(true);
          } else {
            alert("You need to be logged in to create artifacts.");
          }
        }
        return; // stop here
      case "i":
        // Toggle inventory
        setShowInventory(!showInventory);
        return;
      default:
        return;
    }

    setCharacterPosition(newPosition);
    adjustViewport(newPosition);
  };

  // Center the viewport around the character (within map bounds)
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

  // Picking up an artifact at the character's position
  const handleArtifactPickup = () => {
    const currentMap = MAPS[currentMapIndex];
    const artifact = currentMap.artifacts.find(
      (a) => a.x === characterPosition.x / TILE_SIZE && a.y === characterPosition.y / TILE_SIZE
    );
    if (artifact) {
      // Add to inventory
      setInventory((prev) => [...prev, artifact]);
      // Gain experience
      setCharacter((prev) => ({
        ...prev,
        experience: prev.experience + artifact.exp,
      }));
      // Remove from map
      MAPS[currentMapIndex].artifacts = currentMap.artifacts.filter(
        (a) => a.id !== artifact.id
      );
      // Update local artifacts state
      setArtifacts([...MAPS[currentMapIndex].artifacts]);
      setVisibleArtifact(null);
    }
  };

  // Refresh artifacts after creating a new one
  const refreshArtifacts = () => {
    // If you have an API call, do it here; otherwise just read from MAPS
    setArtifacts([...MAPS[currentMapIndex].artifacts]);
  };

  const handleUpdateArtifact = (updatedArtifact) => {
    setInventory((prevInventory) =>
      prevInventory.map((artifact) =>
        artifact.id === updatedArtifact.id ? updatedArtifact : artifact
      )
    );
  };

  const handleGainExperience = (points) => {
    setCharacter((prev) => ({
      ...prev,
      experience: prev.experience + points,
    }));
  };

  return (
    <div className="game-container">
      <div className="viewport" style={{ width: "100%", height: "100%" }}>
        <div className="game-world">
          {/* Render the tile-based map */}
          {MAPS[currentMapIndex].data.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`tile ${TILE_TYPES[tile]}`}
                style={{
                  position: "absolute",
                  top: rowIndex * TILE_SIZE - viewport.y,
                  left: colIndex * TILE_SIZE - viewport.x,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            ))
          )}

          {/* Character */}
          <Character position={characterPosition} />

          {/* Artifacts */}
          <ErrorBoundary>
            {artifacts.map(
              (artifact) =>
                artifact.visible && (
                  <Artifact
                    key={artifact.id}
                    artifact={artifact}
                    visible={artifact === visibleArtifact}
                  />
                )
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Artifact Form (Press 'E' if no visible artifact) */}
      {showForm && (
        <ArtifactForm
          position={formPosition}
          onClose={() => setShowForm(false)}
          refreshArtifacts={refreshArtifacts}
        />
      )}

      {/* Inventory (Press 'I') */}
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
