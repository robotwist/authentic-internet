import React, { useState, useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { NPC_TYPES } from "./GameConstants";
import Tile from "./Tile";
import Artifact from "./Artifact";
import {
  useViewportCulling,
  isEntityVisible,
} from "../hooks/useViewportCulling";
import "./Map.css";

// Constants
const TILE_SIZE = 64;
const DEFAULT_NPC_SPRITE = "/assets/npcs/guide.png";

const Map = ({
  mapData,
  npcs,
  artifacts,
  onTileClick,
  onNPCClick,
  onArtifactClick,
  zoom = 1,
  offset = { x: 0, y: 0 },
  onZoomChange,
  mapName = "",
  questStatusMap = new globalThis.Map(),
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState(offset);

  // Mouse event handlers for map dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapOffset.x,
      y: e.clientY - mapOffset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setMapOffset(newOffset);
      if (onZoomChange) {
        onZoomChange(newOffset);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    // Zoom functionality can be added here
  }, []);

  // Function to determine if a tile is part of Half Dome
  const isHalfDome = (x, y) => {
    // Half Dome coordinates from the map data (walls in the upper center-right)
    return (
      mapName === "Yosemite" &&
      ((x === 9 && y === 3) ||
        (x === 10 && y === 3) ||
        (x === 11 && y === 3) ||
        (x === 12 && y === 3) ||
        (x === 11 && y === 4) ||
        (x === 11 && y === 5))
    );
  };

  // Function to determine if a tile is part of Mist Trail
  const isMistTrail = (x, y) => {
    // Mist Trail coordinates (water tiles on the right side)
    return (
      mapName === "Yosemite" &&
      ((x === 15 && y === 9) ||
        (x === 15 && y === 10) ||
        (x === 15 && y === 11) ||
        (x === 14 && y === 15) ||
        (x === 13 && y === 16) ||
        (x === 13 && y === 17))
    );
  };

  // Function to determine whether a tile is Yosemite Falls
  const isYosemiteFalls = (x, y) => {
    // Yosemite Falls coordinates (water tiles on the left)
    return (
      mapName === "Yosemite" &&
      ((x === 3 && y === 6) ||
        (x === 3 && y === 7) ||
        (x === 2 && y === 8) ||
        (x === 2 && y === 9))
    );
  };

  // Enhanced NPC sprite mapping with fallbacks
  const npcImages = useMemo(
    () => ({
      [NPC_TYPES.SHAKESPEARE]: "/assets/npcs/shakespeare.webp",
      [NPC_TYPES.ARTIST]: "/assets/npcs/artist.svg",
      [NPC_TYPES.MICHELANGELO]: "/assets/npcs/michelangelo.svg",
      [NPC_TYPES.ADA_LOVELACE]: "/assets/npcs/ada_lovelace.png",
      [NPC_TYPES.LORD_BYRON]: "/assets/npcs/lord_byron.webp",
      [NPC_TYPES.OSCAR_WILDE]: "/assets/npcs/oscar_wilde.svg",
      [NPC_TYPES.ALEXANDER_POPE]: "/assets/npcs/alexander_pope.svg",
      [NPC_TYPES.ZEUS]: "/assets/npcs/zeus.svg",
      [NPC_TYPES.JOHN_MUIR]: "/assets/npcs/john_muir.png",
      [NPC_TYPES.JESUS]: "/assets/npcs/jesus.png",
      [NPC_TYPES.GUIDE]: "/assets/npcs/guide.png",
      [NPC_TYPES.WRITER]: "/assets/npcs/shakespeare.webp", // Fallback for writers
      [NPC_TYPES.PHILOSOPHER]: "/assets/npcs/alexander_pope.svg", // Fallback for philosophers
      [NPC_TYPES.SCIENTIST]: "/assets/npcs/ada_lovelace.png", // Fallback for scientists
      [NPC_TYPES.EXPLORER]: "/assets/npcs/john_muir.png", // Fallback for explorers
      [NPC_TYPES.MENTOR]: "/assets/npcs/guide.png", // Fallback for mentors
      [NPC_TYPES.SAGE]: "/assets/npcs/zeus.svg", // Fallback for sages
      [NPC_TYPES.POET]: "/assets/npcs/lord_byron.webp", // Fallback for poets
      [NPC_TYPES.NATURALIST]: "/assets/npcs/john_muir.png", // Fallback for naturalists
    }),
    [],
  );

  const getNPCImage = useCallback(
    (npcType) => {
      if (!npcType) return DEFAULT_NPC_SPRITE;

      // First try exact match
      if (npcImages[npcType]) {
        return npcImages[npcType];
      }

      // Try lowercase match
      const lowerType = npcType.toLowerCase();
      if (npcImages[lowerType]) {
        return npcImages[lowerType];
      }

      // Try to find a partial match
      const matchingKey = Object.keys(npcImages).find(
        (key) =>
          key.toLowerCase().includes(lowerType) ||
          lowerType.includes(key.toLowerCase()),
      );

      if (matchingKey) {
        return npcImages[matchingKey];
      }

      // Final fallback
      return DEFAULT_NPC_SPRITE;
    },
    [npcImages],
  );

  // Calculate viewport culling info early - MUST be before any conditional returns (Rules of Hooks)
  const mapRows = mapData?.length || 0;
  const mapCols = mapData?.[0]?.length || 0;
  const visibleRange = useViewportCulling(
    mapOffset,
    TILE_SIZE,
    mapRows,
    mapCols,
    2,
  );

  // Check if mapData is valid before any rendering logic
  if (!mapData || !Array.isArray(mapData) || mapData.length === 0) {
    console.error("Invalid mapData provided to Map component:", mapData);
    return <div className="map error">Error: Invalid map data</div>;
  }

  // Enhanced NPC rendering with better error handling and viewport culling
  const renderNPCs = useMemo(() => {
    if (!npcs || !Array.isArray(npcs)) {
      console.log("No NPCs provided or invalid format:", npcs);
      return null;
    }

    // Filter NPCs to only render visible ones
    // NPCs use pixel coordinates, so convert to tile coordinates for culling
    const visibleNPCs = npcs.filter((npc) => {
      if (!npc || !npc.position) return false;
      const tilePos = {
        x: Math.floor(npc.position.x / TILE_SIZE),
        y: Math.floor(npc.position.y / TILE_SIZE),
      };
      return isEntityVisible(tilePos, visibleRange);
    });

    // Only log NPC rendering in development and reduce frequency
    if (process.env.NODE_ENV === "development" && Math.random() < 0.01) {
      console.log(
        `Rendering ${visibleNPCs.length}/${npcs.length} visible NPCs for map: ${mapName}`,
      );
    }

    return visibleNPCs
      .map((npc, index) => {
        if (!npc) {
          console.warn(`NPC at index ${index} is null or undefined`);
          return null;
        }

        if (!npc.position) {
          console.warn(`NPC ${npc.name || "Unknown"} missing position:`, npc);
          return null;
        }

        // Get the sprite with fallback logic
        const actualSprite =
          npc.sprite || getNPCImage(npc.type) || DEFAULT_NPC_SPRITE;

        const spriteStyle = {
          position: "absolute",
          left: `${npc.position.x * TILE_SIZE}px`,
          top: `${npc.position.y * TILE_SIZE}px`,
          width: `${TILE_SIZE}px`,
          height: `${TILE_SIZE}px`,
          backgroundImage: `url('${actualSprite}')`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 20,
          cursor: "pointer",
          filter: "drop-shadow(0 0 5px rgba(255,255,100,0.5))",
          transition: "all 0.2s ease",
          // Add debugging styles in development
          ...(process.env.NODE_ENV === "development" && {
            border: "2px solid red",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
          }),
        };

        // Create a stable, unique key with multiple fallbacks for reliability
        const npcKey =
          npc._id ||
          npc.id ||
          `npc-${npc.name || ""}-${npc.type || ""}-${npc.position.x}-${npc.position.y}-${index}`;

        // Get quest status for this NPC
        const npcId = npc._id || npc.id;
        const questStatus = npcId ? questStatusMap.get(npcId) : null;

        return (
          <div
            key={npcKey}
            className="npc-sprite"
            style={spriteStyle}
            onClick={() => onNPCClick?.(npc)}
            data-npc-type={npc.type?.toLowerCase?.() || "generic"}
            data-has-quests={!!questStatus}
            data-quest-status={questStatus?.status || "none"}
            data-npc-name={npc.name || "Unknown"}
            title={`${npc.name || "NPC"} - Press 'T' to talk${questStatus ? ` (${questStatus.title})` : ""}`}
          >
            {/* Enhanced quest indicator with status-based styling */}
            {questStatus && (
              <div
                className={`npc-quest-indicator quest-status-${questStatus.status}`}
                style={{
                  backgroundColor: questStatus.color,
                  borderColor: questStatus.color,
                }}
                title={questStatus.title}
              >
                {questStatus.icon}
              </div>
            )}
            {/* Enhanced interaction indicator */}
            <div className="npc-interaction-indicator">
              <div className="npc-key-hint">Press 'T' to talk</div>
              <div className="npc-indicator-arrow"></div>
            </div>
            <div className="npc-name-label">{npc.name || "NPC"}</div>
          </div>
        );
      })
      .filter(Boolean); // Remove any null entries
  }, [npcs, onNPCClick, getNPCImage, mapName, visibleRange, questStatusMap]);

  // Setup wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const mapElement = document.querySelector(`[data-map-name="${mapName}"]`);
    if (mapElement) {
      mapElement.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        mapElement.removeEventListener("wheel", handleWheel, {
          passive: false,
        });
      };
    }
  }, [mapName, handleWheel]);

  // Log culling stats in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Map ${mapName}] Rendering ${visibleRange.visibleTiles}/${visibleRange.totalTiles} tiles (${visibleRange.cullingRatio}%)`,
      );
    }
  }, [visibleRange, mapName]);

  // Render only visible tiles for performance
  const renderVisibleTiles = useMemo(() => {
    const tiles = [];
    for (let y = visibleRange.startY; y < visibleRange.endY; y++) {
      if (!mapData[y]) continue;
      for (let x = visibleRange.startX; x < visibleRange.endX; x++) {
        const cell = mapData[y][x];
        if (cell === undefined) continue;

        tiles.push(
          <Tile
            key={`${x}-${y}`}
            type={cell}
            x={x}
            y={y}
            size={TILE_SIZE}
            onClick={() => onTileClick?.(x, y)}
            className={`
              ${isHalfDome(x, y) ? "half-dome" : ""} 
              ${isMistTrail(x, y) ? "mist-trail" : ""}
              ${isYosemiteFalls(x, y) ? "yosemite-falls" : ""}
            `}
            mapName={mapName}
          />,
        );
      }
    }
    return tiles;
  }, [mapData, visibleRange, onTileClick, mapName]);

  return (
    <div
      className={`map ${mapName === "Yosemite" ? "yosemite-map" : ""}`}
      data-map-name={mapName}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="map-grid"
        style={{
          transform: `scale(${zoom}) translate(${mapOffset.x}px, ${mapOffset.y}px)`,
          transformOrigin: "0 0",
        }}
      >
        {/* Render only visible tiles for performance */}
        {renderVisibleTiles}

        {/* Render visible artifacts only */}
        {artifacts
          ?.filter((artifact) => {
            const pos = artifact.location || { x: artifact.x, y: artifact.y };
            return isEntityVisible(pos, visibleRange);
          })
          .map((artifact) => {
            // Support both unified model location and legacy x/y coordinates
            const artifactKey =
              artifact.id ||
              artifact._id ||
              `artifact-${artifact.name || ""}-${artifact.location?.x || artifact.x || 0}-${artifact.location?.y || artifact.y || 0}-${Math.random().toString(36).substr(2, 5)}`;

            return (
              <Artifact
                key={artifactKey}
                artifact={artifact}
                onInteract={() => onArtifactClick?.(artifact)}
              />
            );
          })}

        {/* Render NPCs with improved visibility and interaction indicators */}
        {renderNPCs}
      </div>
    </div>
  );
};

Map.propTypes = {
  mapData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  npcs: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string, // Optional
      id: PropTypes.string, // Optional
      name: PropTypes.string,
      type: PropTypes.string,
      position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
      }).isRequired,
      sprite: PropTypes.string, // Optional
    }),
  ),
  artifacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string, // Optional
      _id: PropTypes.string, // Optional
      name: PropTypes.string.isRequired,
      location: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
      }).isRequired,
    }),
  ),
  onTileClick: PropTypes.func,
  onNPCClick: PropTypes.func,
  onArtifactClick: PropTypes.func,
  zoom: PropTypes.number,
  offset: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  onZoomChange: PropTypes.func,
  mapName: PropTypes.string,
  questStatusMap: PropTypes.instanceOf(globalThis.Map),
};

export default Map;
