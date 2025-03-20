import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { WORLD_MAP } from './Constants';
import './WorldMap.css';

const WorldMap = ({ currentWorld, onClose, onNodeClick }) => {
  const [hoveredWorld, setHoveredWorld] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Get the ID of the current world
  const currentWorldId = WORLD_MAP.mapToId[currentWorld] || 'overworld';

  // Set up a repeating animation trigger every 30 seconds
  useEffect(() => {
    const portalAnimationInterval = setInterval(() => {
      triggerPortalAnimation();
    }, 30000); // Every 30 seconds

    return () => clearInterval(portalAnimationInterval);
  }, []);

  // Function to trigger the portal animation
  const triggerPortalAnimation = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000); // Animation lasts 3 seconds
  };

  // Get node color based on type
  const getNodeColorClass = (world) => {
    switch(world.type) {
      case 'dungeon':
        return 'dungeon-node';
      case 'special':
        return 'special-node';
      case 'text':
        return 'text-node';
      default:
        return '';
    }
  };

  // Handle node click
  const handleNodeClick = (world) => {
    // If we click a node, trigger the portal animation
    if (world.id !== currentWorldId) {
      triggerPortalAnimation();
      
      // Call the onNodeClick prop with the world ID
      if (onNodeClick) {
        onNodeClick(world.id);
      }
    }
  };

  return (
    <div className={`world-map-overlay ${isSpinning ? 'spinning' : ''}`}>
      <div className={`world-map-container ${isSpinning ? 'spinning-content' : ''}`}>
        <h2>World Map</h2>
        <p className="map-subtitle">You are currently in <span className="current-world">{currentWorld}</span></p>
        
        <div className="world-map-canvas">
          {/* Draw connection lines between worlds */}
          <svg className="connection-lines" width="100%" height="100%">
            {WORLD_MAP.structure.map(world => (
              world.connections.map(connectionId => {
                const targetWorld = WORLD_MAP.structure.find(w => w.id === connectionId);
                if (!targetWorld) return null;
                
                // Determine if this is a special connection type
                const connectionType = 
                  (world.type === 'dungeon' || targetWorld.type === 'dungeon') ? 'dungeon-connection' :
                  (world.type === 'special' || targetWorld.type === 'special') ? 'special-connection' :
                  (world.type === 'text' || targetWorld.type === 'text') ? 'text-connection' : '';
                
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
                    } ${connectionType}`}
                  />
                );
              })
            ))}
          </svg>
          
          {/* Draw the world nodes */}
          {WORLD_MAP.structure.map(world => (
            <div 
              key={world.id}
              className={`world-node ${world.id === currentWorldId ? 'current-world-node' : ''} ${getNodeColorClass(world)}`}
              style={{ left: world.x, top: world.y }}
              onMouseEnter={() => setHoveredWorld(world)}
              onMouseLeave={() => setHoveredWorld(null)}
              onClick={() => handleNodeClick(world)}
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
            {hoveredWorld.type && (
              <p className="world-type">
                {hoveredWorld.type === 'dungeon' && '🔥 Dangerous dungeon area with monsters and treasures'}
                {hoveredWorld.type === 'special' && '📚 Hemingway\'s literary adventure awaits'}
                {hoveredWorld.type === 'text' && '💬 Text-based interactive adventure'}
              </p>
            )}
          </div>
        )}

        <button className="close-map-btn" onClick={onClose}>Close Map</button>
        <button className="portal-animation-btn" onClick={triggerPortalAnimation}>
          Activate Portal
        </button>
      </div>
    </div>
  );
};

WorldMap.propTypes = {
  currentWorld: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func
};

export default WorldMap; 