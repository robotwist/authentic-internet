import React from 'react';
import PropTypes from 'prop-types';
import { TILE_TYPES } from './Constants';
import './Tile.css';

const Tile = ({ type, x, y, size = 64, onClick, className = '' }) => {
  const getTileImage = () => {
    if (!type || type === 0) {
      return '/assets/tiles/piskel_grass.png';
    }

    switch (type) {
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
        return '/assets/tiles/piskel_grass.png';
    }
  };

  const getTileClass = () => {
    switch (type) {
      case 2: // water
        return 'tile-water';
      case 5: // portal
        return 'tile-portal';
      default:
        return `tile-${TILE_TYPES[type]}`;
    }
  };

  return (
    <div
      className={`tile ${getTileClass()} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${getTileImage()})`,
        backgroundSize: 'cover',
        position: 'absolute',
        left: `${x * size}px`,
        top: `${y * size}px`,
        zIndex: type === 5 ? 2 : 1, // portal has higher z-index
      }}
      onClick={onClick}
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