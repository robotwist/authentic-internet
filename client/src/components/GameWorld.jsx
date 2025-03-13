import React, { useState, useEffect } from "react";
import axios from "axios";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation"; // Updated import
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
  0: "grass",
  1: "wall",
  2: "water",
  3: "sand",
  4: "dungeon",
};

const MAPS = [
  {
    name: "Overworld",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
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
  {
    name: "Dungeon",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [{ id: 4, name: "Dungeon Key", x: 5, y: 5, exp: 25, visible: true }],
  },
];

const isWalkable = (x, y, map) => {
  const row = Math.floor(y / TILE_SIZE);
  const col = Math.floor(x / TILE_SIZE);
  return map?.[row]?.[col] === 0;
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
      setCharacter((prevChar) => ({
        ...prevChar,
        level: prevChar.level + 1,
        experience: prevChar.experience - prevChar.level * 10,
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }

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
          if (characterPosition.x - speed < 0 && currentMapIndex > 0) {
            setCurrentMapIndex((prev) => prev - 1);
            newPosition.x = (MAP_COLS - 1) * TILE_SIZE;
          } else if (isWalkable(newPosition.x - speed, newPosition.y, MAPS[currentMapIndex].data)) {
            newPosition.x -= speed;
          }
          break;
        case "ArrowRight":
        case "d":
          if (characterPosition.x + speed >= MAP_COLS * TILE_SIZE && currentMapIndex < MAPS.length - 1) {
            setCurrentMapIndex((prev) => prev + 1);
            newPosition.x = 0;
          } else if (isWalkable(newPosition.x + speed, newPosition.y, MAPS[currentMapIndex].data)) {
            newPosition.x += speed;
          }
          break;
        case "e":
          if (visibleArtifact) {
            handleArtifactPickup();
          } else {
            if (isLoggedIn) {
              setFormPosition({ x: newPosition.x, y: newPosition.y });
              setShowForm(true);
            } else {
              alert("You need to be logged in to create artifacts.");
            }
          }
          return;
        case "i":
          setShowInventory(!showInventory);
          return;
        default:
          return;
      }

      setCharacterPosition(newPosition);
      adjustViewport(newPosition);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [characterPosition, currentMapIndex, isLoggedIn, visibleArtifact]);

  useEffect(() => {
    const collidedArtifact = MAPS[currentMapIndex].artifacts.find(
      (artifact) => artifact.x === characterPosition.x / TILE_SIZE && artifact.y === characterPosition.y / TILE_SIZE
    );

    if (collidedArtifact) {
      setVisibleArtifact(collidedArtifact);
    } else {
      setVisibleArtifact(null);
    }
  }, [characterPosition, currentMapIndex]);

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

  const handleArtifactPickup = () => {
    const currentMap = MAPS[currentMapIndex];
    const artifact = currentMap.artifacts.find(
      (a) => a.x === characterPosition.x / TILE_SIZE && a.y === characterPosition.y / TILE_SIZE
    );
    if (artifact) {
      setInventory((prev) => [...prev, artifact]);
      setCharacter((prev) => ({
        ...prev,
        experience: prev.experience + artifact.exp,
      }));
      MAPS[currentMapIndex].artifacts = currentMap.artifacts.filter(
        (a) => a.id !== artifact.id
      );
      setArtifacts([...MAPS[currentMapIndex].artifacts]);
      setVisibleArtifact(null);
    }
  };

  const refreshArtifacts = () => {
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
          {MAPS[currentMapIndex].data.slice(viewport.y / TILE_SIZE, (viewport.y + 12 * TILE_SIZE) / TILE_SIZE).map((row, rowIndex) =>
            row.slice(viewport.x / TILE_SIZE, (viewport.x + 16 * TILE_SIZE) / TILE_SIZE).map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`tile ${TILE_TYPES[tile]}`}
                style={{
                  position: "absolute",
                  top: (rowIndex + viewport.y / TILE_SIZE) * TILE_SIZE - viewport.y,
                  left: (colIndex + viewport.x / TILE_SIZE) * TILE_SIZE - viewport.x,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            ))
          )}

          <Character position={characterPosition} />

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
          character={character}
        />
      )}
    </div>
  );
};

export default GameWorld;