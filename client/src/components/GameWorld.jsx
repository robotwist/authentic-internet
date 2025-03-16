import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchArtifacts,
  createArtifact,
  fetchCharacter,
  updateCharacter,
  updateArtifact
} from "../api/api";
import Character from "./Character";
import Artifact from "./Artifact";
import ArtifactCreation from "./ArtifactCreation";
import Inventory from "./Inventory";
import ErrorBoundary from "./ErrorBoundary";
import Map from "./Map";
import useCharacterMovement from "./CharacterMovement";
import { TILE_SIZE, MAPS, MAP_COLS, MAP_ROWS, isWalkable, canInteract, getInteractionResult, isNearConditionMet } from "./Constants";
import "./GameWorld.css";
import "./Character.css";
import "./Artifact.css";
import "./Inventory.css";
import { saveGameState, loadGameState, mergeArtifacts, createUserArtifact } from '../utils/gameState';

const GameWorld = ({ mapIndex, onMapChange }) => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0 });
  const [character, setCharacter] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [visibleArtifact, setVisibleArtifact] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [mapArtifacts, setMapArtifacts] = useState(MAPS.map(map => [...map.artifacts]));
  const [pickedUpArtifacts] = useState(new Set());
  const [isPortalTransition, setIsPortalTransition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [userArtifacts, setUserArtifacts] = useState([]);
  const [modifiedArtifacts, setModifiedArtifacts] = useState([]);
  const [exp, setExp] = useState(0);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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

  const adjustViewport = (pos) => {
    const newViewport = {
      x: Math.max(
        0,
        Math.min(pos.x - 8 * TILE_SIZE, MAP_COLS * TILE_SIZE - 16 * TILE_SIZE)
      ),
      y: Math.max(
        0,
        Math.min(pos.y - 6 * TILE_SIZE, MAP_ROWS * TILE_SIZE - 12 * TILE_SIZE)
      ),
    };
    setViewport(newViewport);
    
    // Update CSS variables for viewport position
    const gameWorld = document.querySelector('.game-world');
    if (gameWorld) {
      gameWorld.style.setProperty('--viewport-x', `${newViewport.x}px`);
      gameWorld.style.setProperty('--viewport-y', `${newViewport.y}px`);
    }
  };

  const handlePortalTransition = () => {
    setIsPortalTransition(true);
    const portalSound = new Audio('/assets/sounds/portal.mp3');
    portalSound.play().catch(err => console.warn('Audio not supported:', err));

    setTimeout(() => {
      if (currentMapIndex < MAPS.length - 1) {
        setCurrentMapIndex((prev) => prev + 1);
        setCharacterPosition({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE });
      }
      setTimeout(() => setIsPortalTransition(false), 500);
    }, 1000);
  };

  const handleCreateArtifact = async (artifactData) => {
    if (!isLoggedIn) {
      setError("You need to be logged in to create artifacts.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the artifact data with proper structure
      const newArtifact = {
        ...artifactData,
        location: { 
          x: Math.floor(characterPosition.x / TILE_SIZE), 
          y: Math.floor(characterPosition.y / TILE_SIZE) 
        },
        creator: uuidv4(),
        visible: true,
      };

      // First create in backend
      const savedArtifact = await createArtifact(newArtifact);
      
      // Then create local user artifact
      const userArtifact = createUserArtifact({
        ...newArtifact,
        _id: savedArtifact._id // Keep track of backend ID
      });

      // Update both states
      updateArtifactsState(savedArtifact);
      setUserArtifacts(prev => [...prev, userArtifact]);

      console.log("✨ Created artifact:", savedArtifact);
    } catch (error) {
      setError(`Failed to create artifact: ${error.message}`);
      console.error("❌ Error creating artifact:", error);
    } finally {
      setIsLoading(false);
    }
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
    // Check database artifacts
    const dbArtifact = artifacts.find((a) => a?.location?.x === x && a?.location?.y === y);
    if (dbArtifact) return dbArtifact;

    // Check map artifacts from state
    const mapArtifact = mapArtifacts[currentMapIndex]?.find(
      (a) => a?.location?.x === x && a?.location?.y === y
    );
    if (mapArtifact) return mapArtifact;

    // Check user artifacts
    const userArtifact = userArtifacts.find(
      (a) => a?.location?.x === x && a?.location?.y === y && a.area === MAPS[currentMapIndex].name
    );
    
    return userArtifact;
  };

  const handleArtifactPickup = () => {
    if (!characterPosition) {
      console.error("🚨 Character position is undefined!");
      return;
    }

    const { x, y } = {
      x: Math.floor(characterPosition.x / TILE_SIZE),
      y: Math.floor(characterPosition.y / TILE_SIZE),
    };

    console.log("📍 Checking for artifact at:", { x, y });

    const artifact = findArtifactAtLocation(x, y);

    if (!artifact) {
      console.warn("⚠️ No artifact found at this location.");
      return;
    }

    const artifactId = artifact.id || artifact._id;
    if (pickedUpArtifacts.has(artifactId)) {
      console.warn("⚠️ Artifact already picked up:", artifact.name);
      return;
    }

    console.log("✅ Picking Up Artifact:", artifact);
    setInventory((prev) => [...prev, artifact]);
    handleGainExperience(artifact.exp || 0);
    pickedUpArtifacts.add(artifactId);
    
    // Remove from appropriate array based on artifact type
    if (artifact._id) {
      removeArtifactFromMap(artifact._id);
    } else if (artifact.id) {
      // Remove from map artifacts state
      setMapArtifacts(prevMapArtifacts => {
        const newMapArtifacts = [...prevMapArtifacts];
        newMapArtifacts[currentMapIndex] = newMapArtifacts[currentMapIndex].filter(
          a => a.id !== artifact.id
        );
        return newMapArtifacts;
      });
    }
  };

  const removeArtifactFromMap = (artifactId) => {
    setArtifacts((prev) => prev.filter((a) => a._id !== artifactId));
  };

  const handleUpdateArtifact = async (artifactId, updates) => {
    if (!artifactId) {
      setError("Invalid artifact: Missing ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await updateArtifact(artifactId, updates);
      
      setArtifacts(prevArtifacts => {
        const updatedArtifacts = prevArtifacts.map(artifact => 
          artifact._id === artifactId ? { ...artifact, ...updates } : artifact
        );
        return updatedArtifacts;
      });

      if (updates.status === 'dropped') {
        setInventory(prevInventory => 
          prevInventory.filter(artifact => artifact._id !== artifactId)
        );
      }

      await refreshArtifacts();
    } catch (error) {
      setError(`Failed to update artifact: ${error.message}`);
      console.error("❌ Error updating artifact:", error);
    } finally {
      setIsLoading(false);
    }
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
    const currentX = characterPosition.x / TILE_SIZE;
    const currentY = characterPosition.y / TILE_SIZE;

    const collidedMapArtifact = MAPS[currentMapIndex].artifacts.find(
      (artifact) => artifact.location && 
                   artifact.location.x === currentX && 
                   artifact.location.y === currentY
    );

    const collidedDbArtifact = artifacts.find(
      (artifact) => artifact.location && 
                   artifact.location.x === currentX && 
                   artifact.location.y === currentY
    );

    if (collidedDbArtifact) {
      setVisibleArtifact(collidedDbArtifact);
    } else if (collidedMapArtifact) {
      setVisibleArtifact(collidedMapArtifact);
    } else {
      setVisibleArtifact(null);
    }
  }, [characterPosition, currentMapIndex, artifacts]);

  useEffect(() => {
    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);
    if (MAPS[currentMapIndex].data[row][col] === 5 && !isPortalTransition) {
      handlePortalTransition();
    }
  }, [characterPosition, currentMapIndex]);

  const handlePauseGame = () => {
    setIsPaused(prev => !prev);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handlePauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Determine map size class
  const mapSizeClass = MAPS[currentMapIndex].width === 10 ? 'small-map' : '';

  // Load saved game on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setCharacterPosition(savedState.characterPosition);
      setCurrentMapIndex(savedState.currentMapIndex);
      setInventory(savedState.inventory);
      setUserArtifacts(savedState.userArtifacts);
      setModifiedArtifacts(savedState.modifiedArtifacts);
      setExp(savedState.exp);
    }
  }, []);

  const handleSaveGame = () => {
    const success = saveGameState({
      characterPosition,
      currentMapIndex,
      inventory,
      userArtifacts,
      modifiedArtifacts,
      exp
    });

    if (success) {
      alert('Game saved successfully!');
    } else {
      alert('Failed to save game. Please try again.');
    }
    setIsPaused(false);
  };

  const handleLoadGame = () => {
    const savedState = loadGameState();
    if (savedState) {
      setCharacterPosition(savedState.characterPosition);
      setCurrentMapIndex(savedState.currentMapIndex);
      setInventory(savedState.inventory);
      setUserArtifacts(savedState.userArtifacts);
      setModifiedArtifacts(savedState.modifiedArtifacts);
      setExp(savedState.exp);
      alert('Game loaded successfully!');
    } else {
      alert('No saved game found or failed to load.');
    }
    setIsPaused(false);
  };

  const handleArtifactInteraction = (artifact1, artifact2) => {
    if (canInteract(artifact1, artifact2)) {
      const result = getInteractionResult(artifact1, artifact2);
      if (result) {
        // Remove the original artifacts
        setInventory(prev => prev.filter(a => 
          a.id !== artifact1.id && a.id !== artifact2.id
        ));

        // Create the new combined artifact
        const combinedArtifact = createUserArtifact({
          name: result,
          description: `Created by combining ${artifact1.name} and ${artifact2.name}`,
          type: artifact1.type,
          properties: {
            ...artifact1.properties,
            ...artifact2.properties
          }
        });

        setUserArtifacts(prev => [...prev, combinedArtifact]);
        setInventory(prev => [...prev, combinedArtifact]);
        setExp(prev => prev + 10); // Bonus exp for combining artifacts
      }
    }
  };

  const handleEditArtifact = (artifact) => {
    setSelectedArtifact(artifact);
    setEditForm({
      description: artifact.description,
      content: artifact.content,
      properties: { ...artifact.properties }
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedArtifact) return;

    handleUpdateArtifact(selectedArtifact.id, editForm);
    setIsEditing(false);
    setSelectedArtifact(null);
    setEditForm({});
  };

  // Get all artifacts for the current map
  const currentArtifacts = mergeArtifacts(
    mapArtifacts[currentMapIndex] || [],
    userArtifacts.filter(a => a.area === MAPS[currentMapIndex].name),
    modifiedArtifacts
  );

  console.log('Current Map Artifacts:', {
    mapArtifacts: mapArtifacts[currentMapIndex] || [],
    userArtifacts: userArtifacts.filter(a => a.area === MAPS[currentMapIndex].name),
    modifiedArtifacts,
    merged: currentArtifacts
  });

  return (
    <div className={`game-container ${isPortalTransition ? 'portal-transition' : ''} ${mapSizeClass}`}>
      {isPortalTransition && <div className="portal-flash" />}
      
      {isPaused && (
        <div className="pause-menu">
          <h2>Game Paused</h2>
          <button onClick={handlePauseGame}>Resume</button>
          <button onClick={handleSaveGame}>Save Game</button>
          <button onClick={handleLoadGame}>Load Game</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {isLoading && (
        <div className="loading-spinner">
          Loading...
        </div>
      )}

      <div className="viewport">
        <div 
          className="game-world"
          style={{
            '--viewport-x': `${viewport.x}px`,
            '--viewport-y': `${viewport.y}px`,
          }}
        >
          <Map mapData={MAPS[currentMapIndex].data} viewport={viewport} />
          <Character position={characterPosition} />
          <ErrorBoundary>
            {currentArtifacts.map((artifact) => {
              console.log('Rendering artifact:', artifact);
              return (
                <Artifact
                  key={artifact.id || artifact._id}
                  artifact={artifact}
                  visible={true}
                  onInteract={() => handleEditArtifact(artifact)}
                />
              );
            })}
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
          characterPosition={characterPosition}
        />      
      )}

      {isEditing && (
        <div className="edit-menu">
          <h3>Edit {selectedArtifact?.name}</h3>
          {selectedArtifact?.userModifiable?.description && (
            <textarea
              value={editForm.description}
              onChange={e => setEditForm(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
          )}
          {selectedArtifact?.userModifiable?.content && (
            <textarea
              value={editForm.content}
              onChange={e => setEditForm(prev => ({
                ...prev,
                content: e.target.value
              }))}
            />
          )}
          {selectedArtifact?.userModifiable?.properties?.map(prop => (
            <input
              key={prop}
              type="number"
              value={editForm.properties[prop]}
              onChange={e => setEditForm(prev => ({
                ...prev,
                properties: {
                  ...prev.properties,
                  [prop]: Number(e.target.value)
                }
              }))}
            />
          ))}
          <button onClick={handleSaveEdit}>Save Changes</button>
          <button onClick={() => {
            setIsEditing(false);
            setSelectedArtifact(null);
            setEditForm({});
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default GameWorld;