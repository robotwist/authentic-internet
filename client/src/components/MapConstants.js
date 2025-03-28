// Map-related constants
export const TILE_SIZE = 64;
export const MAP_ROWS = 20;
export const MAP_COLS = 20;

// Tile Classes
export const TILE_TYPES = {
  0: "empty",
  1: "wall",
  2: "tree",
  3: "sand",
  4: "dungeon",
  5: "portal",
  6: "terminal-portal",
  7: "shooter-portal",
  8: "text-portal"
};

// Map validation helper
export const isValidMapSize = (mapData) => {
  if (!Array.isArray(mapData) || mapData.length === 0) return false;
  
  // Check if all rows are arrays and have the same length
  const rowLength = mapData[0].length;
  return mapData.every(row => 
    Array.isArray(row) && 
    row.length === rowLength &&
    row.every(cell => typeof cell === 'number' && cell >= 0 && cell <= 8)
  );
};

// Map helper functions
export const isWalkable = (x, y, mapData) => {
  if (!mapData || !Array.isArray(mapData)) return false;
  
  // Convert pixel coordinates to tile coordinates
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  
  // Check map boundaries
  if (tileX < 0 || tileX >= mapData[0].length || tileY < 0 || tileY >= mapData.length) {
    return false;
  }
  
  // Check tile type
  const tileType = mapData[tileY][tileX];
  if (typeof tileType !== 'number') return false;
  
  switch (tileType) {
    case 0: // Empty
    case 3: // Sand
    case 5: // Portal
    case 6: // Terminal portal
    case 7: // Shooter portal
    case 8: // Text portal
      return true;
    default:
      return false;
  }
}; 