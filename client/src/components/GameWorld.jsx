import React, { useState, useEffect } from "react";
import { fetchArtifacts, createArtifact, updateCharacter } from "../api/api"; // Import fetch and create artifacts
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
import { v4 as uuidv4 } from 'uuid';

const TILE_SIZE = 64;
const MAP_ROWS = 20;
const MAP_COLS = 20;

// Tile Classes
const TILE_TYPES = {
  0: "grass",
  1: "wall",
  2: "water",
  3: "sand",
  4: "dungeon",
  5: "portal",
};

const isWalkable = (x, y, map) => {
  const row = Math.floor(y / TILE_SIZE);
  const col = Math.floor(x / TILE_SIZE);
  return map?.[row]?.[col] === 0 || map?.[row]?.[col] === 5 || map?.[row]?.[col] === 3; 
};

const MAPS = [
  {
    name: "Overworld",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 0, 5, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    artifacts: [
      { _id: uuidv4(), name: "Ancient Sword", description: "A sword from ancient times", content: "This is an ancient sword.", x: 3, y: 2, exp: 10, visible: true, area: "Overworld" },
      { _id: uuidv4(),
        name: "Mystic Orb",
        description: "A glowing orb filled with swirling energy.",
        content: "It hums with an ancient power.",
        riddle: "What has roots as nobody sees, is taller than trees?",
        unlockAnswer: "mountain",
        area: "Overworld",
        isExclusive: false,
        creator: uuidv4(), 
        type: "artifact",
        messageText: "",
        sender: null,
        recipient: null,
        isRead: false,
        unlockCondition: "Solve the riddle.",
        location: { x: 4, y: 4 } 
      },
    ],
  },
  {
    name: "Overworld 2",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
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
      // Similar artifacts structure as Overworld 1
    ],
  },
  {
    name: "Overworld 3",
    data: [
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
      // Similar artifacts structure as Overworld 1
    ],
  },
  // Desert Maps
  {
    name: "Desert 1",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 1, 1, 1, 5, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [{ _id: 3, name: "Golden Idol", description: "A golden idol", content: "This is a golden idol.", x: 4, y: 6, exp: 20, visible: true, area: "Desert" }],
  },
  {
    name: "Desert 2",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 5, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      // Similar artifacts structure as Desert 1
    ],
  },
  {
    name: "Desert 3",
    data: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 5, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    artifacts: [
      // Similar artifacts structure as Desert 1
    ],
  },
  // Dungeon Maps
  {
    name: "Dungeon 1",
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
    artifacts: [{ _id: 4, name: "Dungeon Key", description: "A key to the dungeon", content: "This is a dungeon key.", x: 5, y: 5, exp: 25, visible: true, area: "Dungeon" }],
  },
  {
    name: "Dungeon 2",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 5, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      // Similar artifacts structure as Dungeon 1
    ],
  },
  {
    name: "Dungeon 3",
    data: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 4, 0, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4, 0, 4],
      [4, 4, 4, 4, 5, 4, 4, 4, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 4, 4, 4, 4, 4, 4, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    artifacts: [
      // Similar artifacts structure as Dungeon 1
    ],
  },
];

const GameWorld = () => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  
  const [inventory, setInventory] = useState([
    {
      _id: uuidv4(),
      name: "Mystic Orb",
      description: "A glowing orb filled with swirling energy.",
      content: "It hums with an ancient power.",
      riddle: "What has roots as nobody sees, is taller than trees?",
      unlockAnswer: "mountain",
      area: "Overworld",
      isExclusive: false,
      creator: uuidv4(),
      type: "artifact",
      messageText: "",
      sender: null,
      recipient: null,
      isRead: false,
      unlockCondition: "Solve the riddle.",
      location: { x: 4, y: 4 }
    }
  ]);

  const [characterPosition, setCharacterPosition] = useState({
    x: 0,
    y: 0,
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
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    fetchArtifacts()
      .then((data) => {
        console.log("📦 Loaded Artifacts:", data);  // ✅ Debug log
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
              handleArtifactPickup(); // ✅ Move to "P" instead
            } else {
              if (isLoggedIn) {
                setFormPosition({ x: newPosition.x, y: newPosition.y });
                setShowForm(true);
              } else {
                alert("You need to be logged in to create artifacts.");
              }
            }
            return;
          
          // 🔹 "P" PICKS UP ARTIFACTS
          case "p":
            handleArtifactPickup();
            return;
      
          // 🔹 "I" OPENS INVENTORY
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

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    if (MAPS[currentMapIndex].data[row][col] === 5) {
      // Handle portal transition
      if (currentMapIndex < MAPS.length - 1) {
        setCurrentMapIndex((prev) => prev + 1);
        setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE }); // Reset position
      }
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
  
  const handleCreateArtifact = (name, description, messageText) => {
    if (!isLoggedIn) {
      alert("You need to be logged in to create artifacts.");
      return;
    }
  
    const newArtifact = {
      name,
      description,
      messageText,
      location: { x: characterPosition.x / TILE_SIZE, y: characterPosition.y / TILE_SIZE }, // ✅ Store as object
      creator: user._id,
      visible: true,
    };
  
    console.log("✨ Creating artifact at:", newArtifact.location);
  
    createArtifact(newArtifact)
      .then((data) => {
        console.log("✅ Artifact Created:", data);
        updateArtifactsState(data); // ✅ Uses helper function to update artifacts
      })
      .catch((error) => console.error("❌ Error creating artifact:", error));
  };
  
  // 🔄 **Helper Function for Updating Artifacts State**
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
  
  // 🔄 **Helper Function for Finding Artifact**
  const findArtifactAtLocation = (x, y) => {
    return artifacts.find((a) => a?.location?.x === x && a?.location?.y === y);
  };
  
  // 🎒 **Pickup Artifact**
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
      setInventory((prev) => [...prev, artifact]); // Add to inventory
      handleGainExperience(artifact.exp || 0); // Gain XP
      removeArtifactFromMap(artifact._id); // Remove from map
    } else {
      console.warn("⚠️ No artifact found at this location.");
    }
  };
  
  // 🔄 **Helper Function to Remove Artifact From Map**
  const removeArtifactFromMap = (artifactId) => {
    setArtifacts((prev) => prev.filter((a) => a._id !== artifactId));
  };
  
  // 🔄 **Update Artifact in Inventory**
  const handleUpdateArtifact = (updatedArtifact) => {
    if (!updatedArtifact || !updatedArtifact._id) {
      console.error("🚨 Invalid artifact update: Missing _id!", updatedArtifact);
      return;
    }
  
    setInventory((prevInventory) => {
      const exists = prevInventory.some((artifact) => artifact._id === updatedArtifact._id);
      if (!exists) {
        console.warn("⚠️ Artifact not found in inventory:", updatedArtifact._id);
      } else {
        console.log("🔄 Updating artifact in inventory:", updatedArtifact);
      }
  
      return prevInventory.map((artifact) =>
        artifact._id === updatedArtifact._id ? updatedArtifact : artifact
      );
    });
  };
  
  // 🔄 **Gain Experience**
  const handleGainExperience = async (points) => {
    setCharacter((prev) => {
      const updatedCharacter = { ...prev, experience: prev.experience + points };
  
      updateCharacter(updatedCharacter)
        .then(() => console.log("✅ XP Updated on Backend"))
        .catch((err) => console.error("❌ Failed to update XP:", err));
  
      return updatedCharacter;
    });
  };
  
  
  // ✅ **Debug: Log Loaded Artifacts**
  console.log("📦 Loaded Artifacts:", artifacts);
  artifacts.forEach((a) => console.log(`Artifact: ${a.name} at (${a.location?.x}, ${a.location?.y})`));
  
  return (
    <div className="game-container">
      <div className="viewport" style={{ width: "100%", height: "100%" }}>
        <div className="game-world">
          {MAPS[currentMapIndex].data
            .slice(viewport.y / TILE_SIZE, (viewport.y + 12 * TILE_SIZE) / TILE_SIZE)
            .map((row, rowIndex) =>
              row
                .slice(viewport.x / TILE_SIZE, (viewport.x + 16 * TILE_SIZE) / TILE_SIZE)
                .map((tile, colIndex) => (
                  <div
                    key={`tile-${rowIndex}-${colIndex}`}
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
            {artifacts.map((artifact) =>
              artifact.visible ? (
                <Artifact
                  key={`artifact-${artifact._id}`}
                  src={artifact.image}
                  artifact={artifact}
                  visible={artifact._id === visibleArtifact?._id}
                  style={{
                    position: "absolute",
                    left: `${artifact.location.x * TILE_SIZE}px`,
                    top: `${artifact.location.y * TILE_SIZE}px`,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    zIndex: 10
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
    </div>
  );
};

export default GameWorld;