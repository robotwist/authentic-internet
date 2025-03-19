import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Tile from './Tile';
import Artifact from './Artifact';
import { TILE_SIZE } from './Constants';
import './Map.css';

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

  // Check if mapData is valid before rendering
  if (!mapData || !Array.isArray(mapData) || mapData.length === 0) {
    console.error("Invalid mapData provided to Map component:", mapData);
    return <div className="map error">Error: Invalid map data</div>;
  }

  return (
    <div 
      className={`map ${mapName === "Yosemite" ? 'yosemite-map' : ''}`}
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
            />
          ))
        ))}
        
        {/* Render artifacts */}
        {artifacts?.map(artifact => (
          <Artifact
            key={artifact.id || artifact._id}
            artifact={artifact}
            onInteract={() => onArtifactClick?.(artifact)}
          />
        ))}

        {/* Render NPCs with improved visibility */}
        {npcs?.map(npc => {
          // Extract the correct position values
          const posX = npc.position.x !== undefined ? npc.position.x : 
                      (npc.position ? parseInt(npc.position.x, 10) : 0);
          const posY = npc.position.y !== undefined ? npc.position.y : 
                      (npc.position ? parseInt(npc.position.y, 10) : 0);
          
          // Determine sprite URL
          let spriteUrl = npc.sprite;
          if (!spriteUrl) {
            // Fallback to determine sprite based on NPC type
            if (npc.type === 1) spriteUrl = '/assets/npcs/shakespeare.webp'; // Shakespeare
            else if (npc.type === 2) spriteUrl = '/assets/npcs/artist.svg'; // Artist
            else if (npc.type === 3) spriteUrl = '/assets/npcs/ada_lovelace.png'; // Ada Lovelace
            else if (npc.type === 4) spriteUrl = '/assets/npcs/lord_byron.webp'; // Lord Byron
            else if (npc.type === 5) spriteUrl = '/assets/npcs/oscar_wilde.svg'; // Oscar Wilde
            else if (npc.type === 6) spriteUrl = '/assets/npcs/alexander_pope.svg'; // Alexander Pope
            else if (npc.type === 7) spriteUrl = '/assets/npcs/zeus.svg'; // Zeus
            else if (npc.type === 8) spriteUrl = '/assets/npcs/john_muir.png'; // John Muir
            else if (npc.type === 9) spriteUrl = '/assets/npcs/jesus.png'; // Jesus
            else spriteUrl = '/assets/npcs/guide.png'; // Default Guide
          }
          
          return (
            <div
              key={npc._id || npc.id}
              className={`npc-sprite npc-type-${npc.type || 'unknown'}`}
              style={{
                position: 'absolute',
                left: `${posX}px`,
                top: `${posY}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE * 1.5}px`, // Make NPCs slightly taller for better visibility
                backgroundImage: `url(${spriteUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat',
                cursor: 'pointer',
                zIndex: 500, // Higher z-index to ensure visibility
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))', // Add glow effect
                transition: 'transform 0.3s ease, filter 0.3s ease',
              }}
              onClick={() => onNPCClick?.(npc)}
              title={npc.name}
            >
              {/* Add hover indicator */}
              <div className="npc-indicator">
                <span>Talk</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Map.propTypes = {
  mapData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  npcs: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    sprite: PropTypes.string.isRequired
  })),
  artifacts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
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