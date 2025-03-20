import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { WORLD_MAP } from './Constants';
import './WorldMap.css';

const WorldMap = ({ currentWorld, onClose }) => {
  const [hoveredWorld, setHoveredWorld] = useState(null);

  // Get the ID of the current world
  const currentWorldId = WORLD_MAP.mapToId[currentWorld] || 'overworld';

  return (
    <div className="world-map-overlay">
      <div className="world-map-container">
        <h2>World Map</h2>
        <p className="map-subtitle">You are currently in <span className="current-world">{currentWorld}</span></p>
        
        <div className="world-map-canvas">
          {/* Draw connection lines between worlds */}
          <svg className="connection-lines" width="100%" height="100%">
            {WORLD_MAP.structure.map(world => (
              world.connections.map(connectionId => {
                const targetWorld = WORLD_MAP.structure.find(w => w.id === connectionId);
                if (!targetWorld) return null;
                
                return (
                  <line 
                    key={`${world.id}-${connectionId}`}
                    x1={world.x} 
                    y1={world.y} 
                    x2={targetWorld.x} 
                    y2={targetWorld.y}
                    className={`connection-line ${
                      (world.id === currentWorldId || connectionId === currentWorldId) 
                      ? 'current-connection' : ''
                    }`}
                  />
                );
              })
            ))}
          </svg>
          
          {/* Draw the world nodes */}
          {WORLD_MAP.structure.map(world => (
            <div 
              key={world.id}
              className={`world-node ${world.id === currentWorldId ? 'current-world-node' : ''}`}
              style={{ left: world.x, top: world.y }}
              onMouseEnter={() => setHoveredWorld(world)}
              onMouseLeave={() => setHoveredWorld(null)}
            >
              <div className="world-icon"></div>
              <div className="world-name">{world.name}</div>
            </div>
          ))}
        </div>
        
        {/* Show details about hovered world */}
        {hoveredWorld && (
          <div className="world-details">
            <h3>{hoveredWorld.name}</h3>
            <p>
              {hoveredWorld.id === currentWorldId 
                ? 'You are here' 
                : hoveredWorld.connections.includes(currentWorldId)
                  ? 'Connected to your current world'
                  : 'To reach this world, you must travel through other portals'
              }
            </p>
          </div>
        )}

        <button className="close-map-btn" onClick={onClose}>Close Map</button>
      </div>
    </div>
  );
};

WorldMap.propTypes = {
  currentWorld: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default WorldMap; 