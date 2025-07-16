import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Tile from './Tile';
import Artifact from './Artifact';
import { TILE_SIZE } from './Constants';
import { NPC_TYPES } from './GameConstants';
import './Map.css';

// Add a default placeholder sprite as a data URI
const DEFAULT_NPC_SPRITE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="20" r="16" fill="%23ffd700"/><rect x="16" y="36" width="32" height="28" fill="%23228b22"/></svg>';

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
  mapName = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState(offset);

  useEffect(() => {
    // Set the tile size CSS variable
    document.documentElement.style.setProperty('--tile-size', `${TILE_SIZE}px`);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapOffset.x,
      y: e.clientY - mapOffset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setMapOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom + delta));
    onZoomChange?.(newZoom);
  };

  // Function to determine if a tile is part of Half Dome
  const isHalfDome = (x, y) => {
    // Half Dome coordinates from the map data (walls in the upper center-right)
    return mapName === "Yosemite" && (
      (x === 9 && y === 3) || 
      (x === 10 && y === 3) || 
      (x === 11 && y === 3) || 
      (x === 12 && y === 3) ||
      (x === 11 && y === 4) ||
      (x === 11 && y === 5)
    );
  };

  // Function to determine if a tile is part of Mist Trail
  const isMistTrail = (x, y) => {
    // Mist Trail coordinates (water tiles on the right side)
    return mapName === "Yosemite" && (
      (x === 15 && y === 9) ||
      (x === 15 && y === 10) ||
      (x === 15 && y === 11) ||
      (x === 14 && y === 15) ||
      (x === 13 && y === 16) ||
      (x === 13 && y === 17)
    );
  };

  // Function to determine whether a tile is Yosemite Falls
  const isYosemiteFalls = (x, y) => {
    // Yosemite Falls coordinates (water tiles on the left)
    return mapName === "Yosemite" && (
      (x === 3 && y === 6) ||
      (x === 3 && y === 7) ||
      (x === 2 && y === 8) ||
      (x === 2 && y === 9)
    );
  };

  // NPC sprite mapping
  const npcImages = useMemo(() => ({
    [NPC_TYPES.SHAKESPEARE]: '/assets/npcs/shakespeare.webp',
    [NPC_TYPES.ARTIST]: '/assets/npcs/artist.svg',
    [NPC_TYPES.MICHELANGELO]: '/assets/npcs/michelangelo.svg',
    [NPC_TYPES.ADA_LOVELACE]: '/assets/npcs/ada_lovelace.png',
    [NPC_TYPES.LORD_BYRON]: '/assets/npcs/lord_byron.webp',
    [NPC_TYPES.OSCAR_WILDE]: '/assets/npcs/oscar_wilde.svg',
    [NPC_TYPES.ALEXANDER_POPE]: '/assets/npcs/alexander_pope.svg',
    [NPC_TYPES.ZEUS]: '/assets/npcs/zeus.svg',
    [NPC_TYPES.JOHN_MUIR]: '/assets/npcs/john_muir.png',
    [NPC_TYPES.JESUS]: '/assets/npcs/jesus.png'
  }), []);

  const getNPCImage = useCallback((npcType) => {
    return npcImages[npcType] || `/assets/npcs/${npcType}.svg`;
  }, [npcImages]);

  // Memoize NPC rendering to avoid unnecessary re-renders
  const renderNPCs = useMemo(() => {
    if (!npcs || !Array.isArray(npcs)) return null;
    
    return npcs.map(npc => {
      if (!npc || !npc.position) return null;
      
      const actualSprite = npc.sprite || getNPCImage(npc.type) || DEFAULT_NPC_SPRITE;
      const spriteStyle = {
        position: 'absolute',
        left: `${npc.position.x * TILE_SIZE}px`,
        top: `${npc.position.y * TILE_SIZE}px`,
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
        backgroundImage: `url('${actualSprite}')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 20,
        cursor: 'pointer',
        filter: 'drop-shadow(0 0 5px rgba(255,255,100,0.5))',
        transition: 'all 0.2s ease'
      };
      
      // Create a stable, unique key with multiple fallbacks for reliability
      const npcKey = npc._id || npc.id || `npc-${npc.name || ''}-${npc.type || ''}-${npc.position.x}-${npc.position.y}`;
      
      return (
        <div 
          key={npcKey}
          className="npc-sprite"
          style={spriteStyle}
          onClick={() => onNPCClick?.(npc)}
          data-npc-type={npc.type?.toLowerCase?.() || 'generic'}
        >
          {/* Enhanced interaction indicator */}
          <div className="npc-interaction-indicator">
            <div className="npc-key-hint">Press 'T' to talk</div>
            <div className="npc-indicator-arrow"></div>
          </div>
          <div className="npc-name-label">{npc.name || 'NPC'}</div>
        </div>
      );
    });
  }, [npcs, onNPCClick, getNPCImage]);

  // Check if mapData is valid before rendering
  if (!mapData || !Array.isArray(mapData) || mapData.length === 0) {
    console.error("Invalid mapData provided to Map component:", mapData);
    return <div className="map error">Error: Invalid map data</div>;
  }

  return (
    <div 
      className={`map ${mapName === "Yosemite" ? 'yosemite-map' : ''}`}
      data-map-name={mapName}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        className="map-grid"
        style={{
          transform: `scale(${zoom}) translate(${mapOffset.x}px, ${mapOffset.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {mapData.map((row, y) => (
          row.map((cell, x) => (
            <Tile
              key={`${x}-${y}`}
              type={cell}
              x={x}
              y={y}
              size={TILE_SIZE}
              onClick={() => onTileClick?.(x, y)}
              className={`
                ${isHalfDome(x, y) ? 'half-dome' : ''} 
                ${isMistTrail(x, y) ? 'mist-trail' : ''}
                ${isYosemiteFalls(x, y) ? 'yosemite-falls' : ''}
              `}
              mapName={mapName}
            />
          ))
        ))}
        
        {/* Render artifacts */}
        {artifacts?.map(artifact => (
          <Artifact
            key={artifact.id || artifact._id || `artifact-${artifact.name || ''}-${artifact.location?.x || 0}-${artifact.location?.y || 0}-${Math.random().toString(36).substr(2, 5)}`}
            artifact={artifact}
            onInteract={() => onArtifactClick?.(artifact)}
          />
        ))}

        {/* Render NPCs with improved visibility and interaction indicators */}
        {renderNPCs}
      </div>
    </div>
  );
};

Map.propTypes = {
  mapData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  npcs: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string, // Optional
    id: PropTypes.string,  // Optional
    name: PropTypes.string,
    type: PropTypes.string,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    sprite: PropTypes.string // Optional
  })),
  artifacts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,  // Optional
    _id: PropTypes.string, // Optional
    name: PropTypes.string.isRequired,
    location: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired
  })),
  onTileClick: PropTypes.func,
  onNPCClick: PropTypes.func,
  onArtifactClick: PropTypes.func,
  zoom: PropTypes.number,
  offset: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  onZoomChange: PropTypes.func,
  mapName: PropTypes.string
};

export default Map;