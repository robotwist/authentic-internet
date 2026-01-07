import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Map from "../components/Map";
import "../styles/World.css";

const World = () => {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [interactionPrompt, setInteractionPrompt] = useState("");
  const [interactionResult, setInteractionResult] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchWorld = async () => {
      try {
        const response = await axios.get(`/api/worlds/${worldId}`);
        setWorld(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load world data");
        setLoading(false);
      }
    };

    fetchWorld();
  }, [worldId]);

  const handleTileClick = (x, y) => {
    // Handle tile interaction (e.g., movement, examining)
    console.log(`Clicked tile at (${x}, ${y})`);
  };

  const handleNPCClick = (npc) => {
    setSelectedNPC(npc);
    setInteractionPrompt("");
    setInteractionResult(null);
  };

  const handleArtifactClick = async (artifact) => {
    try {
      const response = await axios.post(
        `/api/artifacts/${artifact._id}/interact`,
      );
      setInteractionResult(response.data);
    } catch (err) {
      setError("Failed to interact with artifact");
    }
  };

  const handleInteractionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNPC || !interactionPrompt) return;

    try {
      const response = await axios.post(
        `/api/npcs/${selectedNPC._id}/interact`,
        {
          prompt: interactionPrompt,
        },
      );
      setInteractionResult(response.data);
    } catch (err) {
      setError("Failed to interact with NPC");
    }
  };

  const handlePortalClick = (portal) => {
    navigate(`/world/${portal.targetWorldId}`);
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  if (loading) return <div className="loading">Loading world...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!world) return <div className="error">World not found</div>;

  return (
    <div className="world-container">
      <div className="world-header">
        <h1>{world.name}</h1>
        <div className="world-weather">
          {world.weather && (
            <>
              <span className="temperature">{world.weather.temperature}°C</span>
              <span className="condition">{world.weather.condition}</span>
            </>
          )}
        </div>
      </div>

      <div className="world-content">
        <div className="world-map">
          <Map
            mapData={world.mapData}
            npcs={world.npcs}
            artifacts={world.artifacts}
            onTileClick={handleTileClick}
            onNPCClick={handleNPCClick}
            onArtifactClick={handleArtifactClick}
            zoom={zoom}
            offset={mapOffset}
            onZoomChange={handleZoomChange}
          />
        </div>

        <div className="world-sidebar">
          <div className="npcs-list">
            <h2>NPCs</h2>
            {world.npcs.map((npc) => (
              <div
                key={npc._id}
                className="npc-item"
                onClick={() => handleNPCClick(npc)}
              >
                <img src={npc.sprite} alt={npc.name} />
                <span>{npc.name}</span>
              </div>
            ))}
          </div>

          <div className="portals-list">
            <h2>Portals</h2>
            {world.portals.map((portal) => (
              <div
                key={portal._id}
                className="portal-item"
                onClick={() => handlePortalClick(portal)}
              >
                <span>{portal.name}</span>
                <span className="portal-target">
                  → {portal.targetWorldName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNPC && (
        <div className="interaction-modal">
          <div className="modal-content">
            <h2>Interact with {selectedNPC.name}</h2>
            <form onSubmit={handleInteractionSubmit}>
              <textarea
                value={interactionPrompt}
                onChange={(e) => setInteractionPrompt(e.target.value)}
                placeholder="What would you like to say?"
                rows={4}
              />
              <button type="submit">Send</button>
            </form>
            {interactionResult && (
              <div className="interaction-result">
                <h3>Response:</h3>
                <p>{interactionResult.response}</p>
              </div>
            )}
            <button
              className="close-button"
              onClick={() => setSelectedNPC(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default World;
