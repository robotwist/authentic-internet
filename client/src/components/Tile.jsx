import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TILE_TYPES } from './Constants';
import './Tile.css';

const Tile = ({ type, x, y, size = 64, onClick, className = '', mapName = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imagePath, setImagePath] = useState('');

  // Function to get the appropriate image path based on tile type
  const getTileImage = () => {
    if (type === undefined || type === null) {
      console.error("Tile type is undefined or null");
      return '/assets/tiles/piskel_grass.png';
    }

    switch (type) {
      case 0:
        return '/assets/tiles/piskel_grass.png';
      case 1:
        return '/assets/tiles/wall.webp';
      case 2:
        return '/assets/tiles/water.webp';
      case 3:
        return '/assets/tiles/sand.png';
      case 4: // dungeon
        return '/assets/tiles/dungeon.webp';
      case 5: // portal
        return '/assets/tiles/portal.webp';
      default:
        console.warn(`Unknown tile type: ${type}, defaulting to grass`);
        return '/assets/tiles/piskel_grass.png';
    }
  };

  // Set the image path on component mount and when type changes
  useEffect(() => {
    const path = getTileImage();
    setImagePath(path);

    // Create a new image to check if it loads properly
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = (e) => {
      console.error(`Failed to load image: ${path}`, e);
      setImageLoaded(false);
    };
    img.src = path;

    // Preload image when component mounts
    return () => {
      // Clean up by removing the image when component unmounts
      img.onload = null;
      img.onerror = null;
    };
  }, [type]);

  // Determine if this portal leads to a specific area
  const getPortalDestination = () => {
    if (type !== 5) return null;
    
    // Determine where this portal leads based on map and coordinates
    if (mapName === "Overworld" && x === 8 && y === 11) {
      return "overworld2";
    } else if (mapName === "Overworld 2" && x === 8 && y === 6) {
      return "overworld3";
    } else if (mapName === "Overworld 3" && x === 8 && y === 1) {
      return "yosemite";
    }
    
    return null;
  };

  // Get portal level for styling
  const getPortalLevel = () => {
    const destination = getPortalDestination();
    if (destination === "yosemite") return 1;
    if (destination === "overworld3") return 2;
    if (destination === "desert1") return 3;
    return null;
  };

  // Generate additional classes and attributes for portals
  const portalDestination = type === 5 ? getPortalDestination() : null;
  const portalLevel = type === 5 ? getPortalLevel() : null;
  const portalClasses = portalDestination ? `portal-to-${portalDestination}` : '';
  const isYosemitePortal = portalDestination === "yosemite";

  return (
    <div
      className={`tile ${TILE_TYPES[type] || 'unknown'} ${imageLoaded ? '' : 'image-loading'} ${className} ${portalClasses} ${isYosemitePortal ? 'yosemite-portal' : ''}`}
      style={{
        left: `${x * size}px`,
        top: `${y * size}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: imageLoaded ? `url(${imagePath})` : 'none'
      }}
      onClick={onClick}
      data-coords={`${x},${y}`}
      data-tile-type={type}
      data-portal-destination={portalDestination}
      data-level={portalLevel}
    >
      {/* Inner elements for immediate portal visibility */}
      {type === 5 && (
        <>
          <div className="portal-inner-vortex"></div>
          <div className="portal-glow"></div>
        </>
      )}
    </div>
  );
};

Tile.propTypes = {
  type: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  size: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  mapName: PropTypes.string
};

export default Tile; 