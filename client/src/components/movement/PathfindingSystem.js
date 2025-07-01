import { TILE_SIZE, isWalkable } from '../Constants';

/**
 * A* Pathfinding implementation for NPCs and enemies
 */
export class PathfindingSystem {
  constructor() {
    this.openSet = [];
    this.closedSet = [];
  }

  /**
   * Find path from start to goal using A* algorithm
   * @param {Object} start - Starting position {x, y}
   * @param {Object} goal - Goal position {x, y}
   * @param {Array} mapData - Map data for collision checking
   * @returns {Array} - Array of positions forming the path
   */
  findPath(start, goal, mapData) {
    // Convert pixel coordinates to tile coordinates
    const startTile = {
      x: Math.floor(start.x / TILE_SIZE),
      y: Math.floor(start.y / TILE_SIZE)
    };
    
    const goalTile = {
      x: Math.floor(goal.x / TILE_SIZE),
      y: Math.floor(goal.y / TILE_SIZE)
    };

    // Initialize pathfinding data structures
    this.openSet = [this.createNode(startTile, null, 0, this.heuristic(startTile, goalTile))];
    this.closedSet = [];

    while (this.openSet.length > 0) {
      // Get node with lowest f cost
      const currentIndex = this.getLowestFCostIndex();
      const current = this.openSet[currentIndex];

      // Remove current from open set and add to closed set
      this.openSet.splice(currentIndex, 1);
      this.closedSet.push(current);

      // Check if we've reached the goal
      if (current.x === goalTile.x && current.y === goalTile.y) {
        return this.reconstructPath(current);
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(current, mapData);
      
      for (const neighbor of neighbors) {
        // Skip if neighbor is in closed set
        if (this.isInClosedSet(neighbor)) continue;

        const gCost = current.g + 1; // Cost from start to neighbor
        const hCost = this.heuristic(neighbor, goalTile);
        const fCost = gCost + hCost;

        // Check if this path to neighbor is better
        const existingNode = this.findInOpenSet(neighbor);
        
        if (!existingNode) {
          this.openSet.push(this.createNode(neighbor, current, gCost, fCost));
        } else if (gCost < existingNode.g) {
          existingNode.parent = current;
          existingNode.g = gCost;
          existingNode.f = fCost;
        }
      }
    }

    // No path found
    return [];
  }

  /**
   * Simple flood fill for area exploration
   * @param {Object} start - Starting position {x, y}  
   * @param {number} maxDistance - Maximum distance to explore
   * @param {Array} mapData - Map data for collision checking
   * @returns {Array} - Array of reachable positions
   */
  floodFill(start, maxDistance, mapData) {
    const startTile = {
      x: Math.floor(start.x / TILE_SIZE),
      y: Math.floor(start.y / TILE_SIZE)
    };

    const visited = new Set();
    const queue = [{ ...startTile, distance: 0 }];
    const reachable = [];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;

      if (visited.has(key) || current.distance > maxDistance) continue;

      visited.add(key);
      reachable.push({
        x: current.x * TILE_SIZE,
        y: current.y * TILE_SIZE
      });

      // Add walkable neighbors
      const neighbors = this.getNeighbors(current, mapData);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          queue.push({ ...neighbor, distance: current.distance + 1 });
        }
      }
    }

    return reachable;
  }

  /**
   * Get valid neighbors for a tile position
   * @private
   */
  getNeighbors(node, mapData) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 }   // Right
    ];

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      // Check bounds and walkability
      if (newX >= 0 && newX < mapData[0].length && 
          newY >= 0 && newY < mapData.length &&
          isWalkable(newX * TILE_SIZE, newY * TILE_SIZE, mapData)) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  /**
   * Create a pathfinding node
   * @private
   */
  createNode(position, parent, g, f) {
    return {
      x: position.x,
      y: position.y,
      parent: parent,
      g: g, // Cost from start
      f: f  // Total cost (g + h)
    };
  }

  /**
   * Heuristic function (Manhattan distance)
   * @private
   */
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Get index of node with lowest f cost
   * @private
   */
  getLowestFCostIndex() {
    let lowestIndex = 0;
    for (let i = 1; i < this.openSet.length; i++) {
      if (this.openSet[i].f < this.openSet[lowestIndex].f) {
        lowestIndex = i;
      }
    }
    return lowestIndex;
  }

  /**
   * Check if node is in closed set
   * @private
   */
  isInClosedSet(node) {
    return this.closedSet.some(n => n.x === node.x && n.y === node.y);
  }

  /**
   * Find node in open set
   * @private
   */
  findInOpenSet(node) {
    return this.openSet.find(n => n.x === node.x && n.y === node.y);
  }

  /**
   * Reconstruct path from goal to start
   * @private
   */
  reconstructPath(goalNode) {
    const path = [];
    let current = goalNode;

    while (current) {
      path.unshift({
        x: current.x * TILE_SIZE,
        y: current.y * TILE_SIZE
      });
      current = current.parent;
    }

    return path;
  }
}

// Convenience functions for common pathfinding scenarios
export const PathfindingHelpers = {
  /**
   * Find the shortest path for NPC movement
   */
  findNPCPath: (start, goal, mapData) => {
    const pathfinder = new PathfindingSystem();
    return pathfinder.findPath(start, goal, mapData);
  },

  /**
   * Get all positions within movement range
   */
  getMovementRange: (start, range, mapData) => {
    const pathfinder = new PathfindingSystem();
    return pathfinder.floodFill(start, range, mapData);
  },

  /**
   * Check if two positions are connected
   */
  arePositionsConnected: (start, goal, mapData) => {
    const pathfinder = new PathfindingSystem();
    const path = pathfinder.findPath(start, goal, mapData);
    return path.length > 0;
  }
};