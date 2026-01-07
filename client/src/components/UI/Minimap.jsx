import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./Minimap.css";

/**
 * Minimap - Shows player position, NPCs, portals, and explored areas
 * @param {Object} props
 * @param {Object} props.mapData - Current map tile data
 * @param {Object} props.playerPosition - Player position in pixels {x, y}
 * @param {Array} props.npcs - Array of NPC objects with positions
 * @param {Array} props.portals - Array of portal positions
 * @param {number} props.tileSize - Size of a tile in pixels
 * @param {Set} props.exploredTiles - Set of explored tile coordinates "x,y"
 * @param {string} props.currentArea - Current area name
 */
const Minimap = ({
  mapData,
  playerPosition,
  npcs = [],
  portals = [],
  tileSize = 64,
  exploredTiles = new Set(),
  currentArea = "Overworld",
}) => {
  // Minimap dimensions
  const MINIMAP_SIZE = 160; // pixels
  const MINIMAP_TILE_SIZE = 4; // pixels per tile on minimap

  // Calculate map dimensions
  const mapRows = mapData?.length || 0;
  const mapCols = mapData?.[0]?.length || 0;

  // Convert player position to tile coordinates
  const playerTileX = Math.floor(playerPosition.x / tileSize);
  const playerTileY = Math.floor(playerPosition.y / tileSize);

  // Calculate minimap scale
  const minimapScale = MINIMAP_TILE_SIZE / tileSize;

  // Render minimap tiles with fog of war
  const renderMinimapTiles = useMemo(() => {
    if (!mapData || mapData.length === 0) return null;

    const tiles = [];
    for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
        const tileKey = `${x},${y}`;
        const isExplored = exploredTiles.has(tileKey);
        const isPlayerTile = x === playerTileX && y === playerTileY;

        // Get tile type
        const tileType = mapData[y]?.[x];

        // Determine tile class based on type
        let tileClass = "minimap-tile";
        if (!isExplored && !isPlayerTile) {
          tileClass += " unexplored";
        } else {
          // Tile type classes
          if (tileType === 1 || tileType === 4) {
            // wall or dungeon
            tileClass += " wall";
          } else if (tileType === 2) {
            // tree
            tileClass += " tree";
          } else if (tileType === 3) {
            // sand
            tileClass += " sand";
          } else if (
            tileType === 5 ||
            tileType === 6 ||
            tileType === 7 ||
            tileType === 8
          ) {
            // portals
            tileClass += " portal";
          } else if (tileType === 9) {
            // water
            tileClass += " water";
          } else {
            tileClass += " walkable";
          }
        }

        tiles.push(
          <div
            key={tileKey}
            className={tileClass}
            style={{
              left: `${x * MINIMAP_TILE_SIZE}px`,
              top: `${y * MINIMAP_TILE_SIZE}px`,
              width: `${MINIMAP_TILE_SIZE}px`,
              height: `${MINIMAP_TILE_SIZE}px`,
            }}
          />,
        );
      }
    }
    return tiles;
  }, [mapData, exploredTiles, playerTileX, playerTileY, mapRows, mapCols]);

  // Render NPCs on minimap
  const renderNPCs = useMemo(() => {
    return npcs.map((npc, index) => {
      if (!npc.position) return null;

      const npcTileX = Math.floor(npc.position.x / tileSize);
      const npcTileY = Math.floor(npc.position.y / tileSize);
      const npcKey = `${npcTileX},${npcTileY}`;

      // Only show if tile is explored
      if (!exploredTiles.has(npcKey)) return null;

      return (
        <div
          key={`npc-${npc.id || index}`}
          className="minimap-npc"
          style={{
            left: `${npcTileX * MINIMAP_TILE_SIZE}px`,
            top: `${npcTileY * MINIMAP_TILE_SIZE}px`,
          }}
          title={npc.name || "NPC"}
        />
      );
    });
  }, [npcs, tileSize, exploredTiles]);

  // Render portals on minimap
  const renderPortals = useMemo(() => {
    return portals.map((portal, index) => {
      if (!portal.position) return null;

      const portalX = portal.position.x;
      const portalY = portal.position.y;
      const portalKey = `${portalX},${portalY}`;

      // Only show if tile is explored
      if (!exploredTiles.has(portalKey)) return null;

      return (
        <div
          key={`portal-${index}`}
          className="minimap-portal"
          style={{
            left: `${portalX * MINIMAP_TILE_SIZE}px`,
            top: `${portalY * MINIMAP_TILE_SIZE}px`,
          }}
          title={portal.destination || "Portal"}
        />
      );
    });
  }, [portals, exploredTiles]);

  // Compass directions
  const renderCompass = () => (
    <div className="minimap-compass">
      <div className="compass-n">N</div>
      <div className="compass-s">S</div>
      <div className="compass-e">E</div>
      <div className="compass-w">W</div>
    </div>
  );

  return (
    <div className="minimap-container">
      <div className="minimap-header">
        <span className="minimap-title">{currentArea}</span>
      </div>

      <div
        className="minimap"
        style={{
          width: `${MINIMAP_SIZE}px`,
          height: `${MINIMAP_SIZE}px`,
        }}
      >
        {/* Map tiles with fog of war */}
        <div className="minimap-tiles">{renderMinimapTiles}</div>

        {/* NPCs */}
        <div className="minimap-entities">{renderNPCs}</div>

        {/* Portals */}
        <div className="minimap-entities">{renderPortals}</div>

        {/* Player marker */}
        <div
          className="minimap-player"
          style={{
            left: `${playerTileX * MINIMAP_TILE_SIZE - 2}px`,
            top: `${playerTileY * MINIMAP_TILE_SIZE - 2}px`,
          }}
        />

        {/* Compass */}
        {renderCompass()}
      </div>

      {/* Legend */}
      <div className="minimap-legend">
        <div className="legend-item">
          <div className="legend-icon player-icon"></div>
          <span>You</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon npc-icon"></div>
          <span>NPC</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon portal-icon"></div>
          <span>Portal</span>
        </div>
      </div>
    </div>
  );
};

Minimap.propTypes = {
  mapData: PropTypes.array.isRequired,
  playerPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  npcs: PropTypes.array,
  portals: PropTypes.array,
  tileSize: PropTypes.number,
  exploredTiles: PropTypes.instanceOf(Set),
  currentArea: PropTypes.string,
};

export default Minimap;
