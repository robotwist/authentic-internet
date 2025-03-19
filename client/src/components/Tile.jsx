import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TILE_TYPES } from './Constants';
import './Tile.css';

const Tile = ({ type, x, y, size = 64, onClick, className = '' }) => {
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
        return '/assets/tiles/wall_new.png';
      case 2:
        return '/assets/tiles/water_new.png';
      case 3:
        return '/assets/tiles/sand_new.png';
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
    img.onerror = () => {
      console.error(`Failed to load image: ${path}`);
      setImageLoaded(false);
    };
    img.src = path;
  }, [type]);

  const getTileClass = () => {
    switch (type) {
      case 0: // grass
        return 'grass';
      case 1: // wall
        return 'wall';
      case 2: // water
        return 'water';
      case 3: // sand
        return 'sand';
      case 4: // dungeon
        return 'dungeon';
      case 5: // portal
        return 'portal';
      default:
        return `tile-${TILE_TYPES[type] || 'unknown'}`;
    }
  };

  return (
    <div
      className={`tile ${getTileClass()} ${className} ${!imageLoaded ? 'image-loading' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${imagePath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'absolute',
        left: `${x * size}px`,
        top: `${y * size}px`,
        zIndex: type === 5 ? 2 : 1, // portal has higher z-index
      }}
      onClick={onClick}
      data-tile-type={type}
    />
  );
};

Tile.propTypes = {
  type: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  size: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Tile; 