import { TILE_SIZE, isWalkable } from '../Constants';
import { MOVEMENT_CONSTANTS, DIRECTION_VECTORS, MAP_TRANSITIONS } from './MovementConstants';

export class CollisionSystem {
  constructor(maps) {
    this.maps = maps;
  }

  /**
   * Check if a position is within map boundaries
   * @param {Object} position - Position to check
   * @param {Array} mapData - Current map data
   * @returns {boolean}
   */
  isWithinBounds(position, mapData) {
    const { x, y } = position;
    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    
    return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
  }

  /**
   * Check if a position is walkable
   * @param {Object} position - Position to check
   * @param {Array} mapData - Current map data
   * @returns {boolean}
   */
  isPositionWalkable(position, mapData) {
    if (!this.isWithinBounds(position, mapData)) return false;
    
    const tileX = Math.floor(position.x / TILE_SIZE);
    const tileY = Math.floor(position.y / TILE_SIZE);
    
    // Safety check for array bounds
    if (tileY >= 0 && tileY < mapData.length && 
        tileX >= 0 && tileX < mapData[0].length) {
      return isWalkable(position.x, position.y, mapData);
    }
    
    return false;
  }

  /**
   * Handle map transition logic
   * @param {Object} newPosition - New position to check
   * @param {string} direction - Movement direction
   * @param {number} currentMapIndex - Current map index
   * @returns {Object} - { canMove, newPosition, targetMapIndex }
   */
  handleMapTransition(newPosition, direction, currentMapIndex) {
    const currentMapName = this.maps[currentMapIndex]?.name;
    const currentMapData = this.maps[currentMapIndex]?.data;
    
    if (!currentMapData || !currentMapName) {
      return { canMove: false, newPosition, targetMapIndex: currentMapIndex };
    }

    const mapWidth = currentMapData[0].length * TILE_SIZE;
    const mapHeight = currentMapData.length * TILE_SIZE;

    // Check for horizontal map transitions
    if (newPosition.x < 0 && direction === 'left') {
      return this.handleHorizontalTransition(newPosition, currentMapName, 'left', currentMapIndex);
    } else if (newPosition.x >= mapWidth && direction === 'right') {
      return this.handleHorizontalTransition(newPosition, currentMapName, 'right', currentMapIndex);
    }

    // Handle vertical boundaries (no transitions currently)
    if (newPosition.y < 0) {
      newPosition.y = 0;
      return { canMove: false, newPosition, targetMapIndex: currentMapIndex };
    } else if (newPosition.y >= mapHeight) {
      newPosition.y = mapHeight - TILE_SIZE;
      return { canMove: false, newPosition, targetMapIndex: currentMapIndex };
    }

    return { canMove: true, newPosition, targetMapIndex: currentMapIndex };
  }

  /**
   * Handle horizontal map transitions
   * @private
   */
  handleHorizontalTransition(newPosition, currentMapName, direction, currentMapIndex) {
    const transitions = MAP_TRANSITIONS[currentMapName];
    
    if (!transitions || !transitions[direction]) {
      // No transition available, clamp to boundary
      if (direction === 'left') {
        newPosition.x = 0;
      } else {
        const mapWidth = this.maps[currentMapIndex].data[0].length * TILE_SIZE;
        newPosition.x = mapWidth - TILE_SIZE;
      }
      return { canMove: false, newPosition, targetMapIndex: currentMapIndex };
    }

    const targetMapName = transitions[direction];
    const targetMapIndex = this.maps.findIndex(map => map.name === targetMapName);
    
    if (targetMapIndex === -1) {
      // Target map not found, clamp to boundary
      if (direction === 'left') {
        newPosition.x = 0;
      } else {
        const mapWidth = this.maps[currentMapIndex].data[0].length * TILE_SIZE;
        newPosition.x = mapWidth - TILE_SIZE;
      }
      return { canMove: false, newPosition, targetMapIndex: currentMapIndex };
    }

    // Set position for target map
    if (direction === 'left') {
      newPosition.x = (this.maps[targetMapIndex].data[0].length - 1) * TILE_SIZE;
    } else {
      newPosition.x = 0;
    }

    return { canMove: true, newPosition, targetMapIndex };
  }

  /**
   * Perform complete collision check
   * @param {Object} currentPosition - Current player position
   * @param {string} direction - Movement direction
   * @param {number} currentMapIndex - Current map index
   * @returns {Object} - Complete collision result
   */
  checkCollision(currentPosition, direction, currentMapIndex) {
    const directionVector = DIRECTION_VECTORS[direction];
    if (!directionVector) {
      return { canMove: false, newPosition: currentPosition, targetMapIndex: currentMapIndex };
    }

    // Calculate new position
    let newPosition = {
      x: currentPosition.x + (directionVector.x * TILE_SIZE),
      y: currentPosition.y + (directionVector.y * TILE_SIZE)
    };

    const currentMapData = this.maps[currentMapIndex]?.data;
    if (!currentMapData) {
      return { canMove: false, newPosition: currentPosition, targetMapIndex: currentMapIndex };
    }

    // Handle map transitions first
    const transitionResult = this.handleMapTransition(newPosition, direction, currentMapIndex);
    newPosition = transitionResult.newPosition;
    
    if (!transitionResult.canMove) {
      return transitionResult;
    }

    // Check walkability for the final position
    const targetMapData = this.maps[transitionResult.targetMapIndex]?.data || currentMapData;
    const canMove = this.isPositionWalkable(newPosition, targetMapData);

    return {
      canMove,
      newPosition,
      targetMapIndex: transitionResult.targetMapIndex
    };
  }
}