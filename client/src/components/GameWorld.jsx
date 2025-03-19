import React, { useState, useEffect, useRef } from 'react';
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
import { initSounds, playRandomPortalSound, playSound } from "../utils/soundEffects";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import SavedQuotes from "./SavedQuotes";
import Level4Shooter from "./Level4Shooter";

const GameWorld = () => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState({ x: 64, y: 64 });
  const [character, setCharacter] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [levelCompletion, setLevelCompletion] = useState({
    level1: false,
    level2: false,
    level3: false,
    level4: false
  });
  const [showWinNotification, setShowWinNotification] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [showLevel4, setShowLevel4] = useState(false);

  useEffect(() => {
    // Load and apply saved artifact visibility state
    applyMapArtifactVisibilityFromStorage();
    
    fetchArtifacts()
      .then((data) => {
        console.log("📦 Loaded Artifacts:", data);
        // Filter out any server artifacts that duplicate artifacts already defined in MAPS
        const mapArtifacts = MAPS.flatMap(map => map.artifacts.map(art => art.name));
        const filteredServerArtifacts = data.filter(serverArt => 
          !mapArtifacts.includes(serverArt.name) || 
          !serverArt.location // Include artifacts without location (inventory items)
        );
        setArtifacts(filteredServerArtifacts);
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

  useEffect(() => {
    // Initialize sound effects when component mounts
    initSounds();
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

    // Check server artifacts first
    const serverArtifact = findArtifactAtLocation(x, y);

    // Check map artifacts
    const mapArtifactIndex = MAPS[currentMapIndex].artifacts.findIndex(
      a => a?.location?.x === x && a?.location?.y === y && a.visible
    );
    
    // Prioritize server artifacts for pickup
    if (serverArtifact) {
      // Play pickup sound
      playSound('pickup', 0.5).catch(err => console.error("Error playing pickup sound:", err));
      
      console.log("✅ Picking Up Server Artifact:", serverArtifact);
      setInventory((prev) => [...prev, serverArtifact]);
      handleGainExperience(serverArtifact.exp || 0);
      removeArtifactFromMap(serverArtifact.id);
    } else if (mapArtifactIndex !== -1) {
      // Handle map-defined artifact
      const mapArtifact = MAPS[currentMapIndex].artifacts[mapArtifactIndex];
      
      // Play pickup sound
      playSound('pickup', 0.5).catch(err => console.error("Error playing pickup sound:", err));
      
      console.log("✅ Picking Up Map Artifact:", mapArtifact);
      setInventory((prev) => [...prev, mapArtifact]);
      handleGainExperience(mapArtifact.exp || 0);
      
      // Update the map artifact to be non-visible
      MAPS[currentMapIndex].artifacts[mapArtifactIndex].visible = false;
      
      // Persist this change to localStorage
      saveMapArtifactVisibilityToStorage(mapArtifact.id);
      
      // Force a re-render
      setCharacterPosition({...characterPosition});
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
    // Check for both map artifacts and server artifacts at the player's position
    const checkBothArtifactSources = () => {
      if (!characterPosition) return;
      
      const playerX = characterPosition.x / TILE_SIZE;
      const playerY = characterPosition.y / TILE_SIZE;
      
      // Check map artifacts
      const mapArtifact = MAPS[currentMapIndex].artifacts.find(
        artifact => artifact.location && 
        artifact.visible && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY
      );
      
      // Check server artifacts
      const serverArtifact = artifacts.find(
        artifact => artifact.location && 
        artifact.location.x === playerX && 
        artifact.location.y === playerY &&
        (!artifact.area || artifact.area === MAPS[currentMapIndex].name)
      );
      
      // Prioritize server artifacts (they might be more up-to-date)
      if (serverArtifact) {
        setVisibleArtifact(serverArtifact);
      } else if (mapArtifact) {
        setVisibleArtifact(mapArtifact);
      } else {
        setVisibleArtifact(null);
      }
    };
    
    checkBothArtifactSources();
  }, [characterPosition, currentMapIndex, artifacts]);

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    
    if (MAPS[currentMapIndex].data[row][col] === 5) {
      if (currentMapIndex < MAPS.length - 1) {
        // Play random portal sound (30% chance of toilet flush)
        playRandomPortalSound(0.3).catch(err => console.error("Error playing portal sound:", err));
        
        // Change map
        setCurrentMapIndex((prev) => prev + 1);
        setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
      }
    }
    
    if (MAPS[currentMapIndex].data[row][col] === 6) {
      if (levelCompletion.level3) {
        // Play random portal sound with higher chance of toilet flush for special portal
        playRandomPortalSound(0.5).catch(err => console.error("Error playing portal sound:", err));
        setShowLevel4(true);
      } else {
        alert("You must complete Level 3 first to access this portal.");
      }
    }
    
    if (currentMapIndex === 0 && row === 17 && col === 19) {
      handleLevelCompletion('level1');
    } else if (currentMapIndex === 1 && row === 0 && col === 19) {
      handleLevelCompletion('level2');
    } else if (currentMapIndex === 2 && !levelCompletion.level3 && character?.qualifyingArtifacts?.level3) {
      handleLevelCompletion('level3');
    }
  }, [characterPosition, currentMapIndex, character, levelCompletion]);

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

  const handleLevelCompletion = (level) => {
    if (levelCompletion[level]) return;
    
    setLevelCompletion(prev => ({
      ...prev,
      [level]: true
    }));
    
    let message = '';
    switch(level) {
      case 'level1':
        message = 'Congratulations! You have completed Level 1 - The Digital Wilderness!';
        break;
      case 'level2':
        message = 'Magnificent! You have completed Level 2 - The Realm of Shadows!';
        break;
      case 'level3':
        message = 'Extraordinary! You have completed Level 3 - The Terminal Void!';
        setTimeout(() => {
          const goToLevel4 = window.confirm('You have unlocked Level 4: The Hemingway Challenge! Ready to enter?');
          if (goToLevel4) {
            // Play random portal sound with higher chance of toilet flush for special portal
            playRandomPortalSound(0.6).catch(err => console.error("Error playing portal sound:", err));
            setShowLevel4(true);
          }
        }, 3000);
        break;
      case 'level4':
        message = 'Amazing! You have completed Level 4 - The Hemingway Challenge!';
        break;
      default:
        message = 'Level completed!';
    }
    
    // Play level complete sound
    playSound('levelComplete').catch(err => console.error("Error playing level complete sound:", err));
    
    handleGainExperience(level === 'level3' ? 20 : level === 'level4' ? 30 : 10);
    
    setWinMessage(message);
    setShowWinNotification(true);
    
    setTimeout(() => {
      setShowWinNotification(false);
    }, 5000);
  };

  const handleLevel4Complete = (score) => {
    handleLevelCompletion('level4');
    setShowLevel4(false);
    
    const bonusExp = Math.floor(score / 100);
    if (bonusExp > 0) {
      handleGainExperience(bonusExp);
      alert(`You earned ${bonusExp} bonus experience points from your score!`);
    }
  };

  const handleLevel4Exit = () => {
    setShowLevel4(false);
  };

  // Utilities for persisting map artifact visibility
  const applyMapArtifactVisibilityFromStorage = () => {
    try {
      const savedState = localStorage.getItem('collectedMapArtifacts');
      if (!savedState) return;
      
      const collectedIds = JSON.parse(savedState);
      
      // Apply to all maps
      MAPS.forEach((map, mapIndex) => {
        map.artifacts.forEach((artifact, artifactIndex) => {
          if (collectedIds.includes(artifact.id)) {
            MAPS[mapIndex].artifacts[artifactIndex].visible = false;
          }
        });
      });
      
      console.log("🔍 Restored artifact visibility state from localStorage");
    } catch (error) {
      console.error("❌ Error restoring artifact visibility:", error);
    }
  };
  
  const saveMapArtifactVisibilityToStorage = (artifactId) => {
    try {
      const savedState = localStorage.getItem('collectedMapArtifacts');
      let collectedIds = savedState ? JSON.parse(savedState) : [];
      
      if (!collectedIds.includes(artifactId)) {
        collectedIds.push(artifactId);
        localStorage.setItem('collectedMapArtifacts', JSON.stringify(collectedIds));
        console.log("💾 Saved artifact collection state to localStorage");
      }
    } catch (error) {
      console.error("❌ Error saving artifact collection state:", error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="game-container">
        {showLevel4 && (
          <Level4Shooter 
            onComplete={handleLevel4Complete}
            onExit={handleLevel4Exit}
          />
        )}
        <div className="viewport" style={{ width: "100%", height: "100%" }}>
          <div
            className={`game-world ${currentMapIndex === 2 ? 'level-3' : currentMapIndex === 1 ? 'level-2' : 'level-1'}`}
            style={{
              transform: `translate(${-viewport.x}px, ${-viewport.y}px)`,
            }}
          >
            <Map 
              mapData={MAPS[currentMapIndex].data} 
              viewport={viewport} 
              npcs={MAPS[currentMapIndex].npcs}
              onNPCClick={(npc) => {
                console.log("🎭 Clicked on NPC:", npc.name);
                // Here you could add logic to interact with the NPC
                // For example, display a dialogue box or trigger some interaction
                alert(`You clicked on ${npc.name}. Interaction will be implemented soon.`);
              }}
            />
            <Character 
              x={characterPosition.x} 
              y={characterPosition.y} 
              exp={character?.experience || 0}
              level={character?.level || 1}
              avatar={character?.avatar}
            />
            <ErrorBoundary>
              {/* Render map-defined artifacts */}
              {MAPS[currentMapIndex].artifacts.map((artifact) =>
                artifact.visible && artifact.location ? (
                  <Artifact
                    key={`map-artifact-${artifact.id}`}
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
              
              {/* Render server-defined artifacts */}
              {artifacts
                .filter(artifact => artifact.location && 
                  // Only show server artifacts on the current map
                  (!artifact.area || artifact.area === MAPS[currentMapIndex].name))
                .map((artifact) => (
                  <Artifact
                    key={`server-artifact-${artifact.id}`}
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
                ))}
            </ErrorBoundary>
          </div>
        </div>
        
        {showWinNotification && (
          <div className="win-notification">
            <div className="win-content">
              <h2>Level Complete!</h2>
              <p>{winMessage}</p>
              <div className="win-stars">★★★</div>
              <button onClick={() => setShowWinNotification(false)}>Continue</button>
            </div>
          </div>
        )}

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
    </ErrorBoundary>
  );
};

export default GameWorld;