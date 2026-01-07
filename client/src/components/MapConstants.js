// Map-related constants
export const TILE_SIZE = 64;
export const MAP_ROWS = 40; // Doubled from 20 for better exploration
export const MAP_COLS = 40; // Doubled from 20 for better exploration

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
  8: "text-portal",
  9: "water",
  10: "bridge",
  11: "tall-grass",
  12: "flower",
  13: "rock",
  14: "path",
  15: "snow",
  16: "ice",
  17: "mountain",
  18: "stone-floor",
};

// Map validation helper
export const isValidMapSize = (mapData) => {
  if (!Array.isArray(mapData) || mapData.length === 0) return false;

  // Check if all rows are arrays and have the same length
  const rowLength = mapData[0].length;
  return mapData.every(
    (row) =>
      Array.isArray(row) &&
      row.length === rowLength &&
      row.every((cell) => typeof cell === "number" && cell >= 0 && cell <= 18),
  );
};

// Map helper functions
export const isWalkable = (x, y, mapData) => {
  if (!mapData || !Array.isArray(mapData)) return false;

  // Convert pixel coordinates to tile coordinates
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  // Check map boundaries
  if (
    tileX < 0 ||
    tileX >= mapData[0].length ||
    tileY < 0 ||
    tileY >= mapData.length
  ) {
    return false;
  }

  // Check tile type
  const tileType = mapData[tileY][tileX];
  if (typeof tileType !== "number") return false;

  switch (tileType) {
    case 0: // Empty
    case 3: // Sand
    case 5: // Portal
    case 6: // Terminal portal
    case 7: // Shooter portal
    case 8: // Text portal
    case 10: // Bridge
    case 11: // Tall grass (walkable but slows movement)
    case 12: // Flower
    case 14: // Path
    case 18: // Stone floor
      return true;
    case 1: // Wall
    case 2: // Tree
    case 4: // Dungeon wall
    case 9: // Water (not walkable without bridge)
    case 13: // Rock
    case 15: // Snow (could be walkable with slow movement)
    case 16: // Ice (walkable but slippery)
    case 17: // Mountain
      return false;
    default:
      return false;
  }
};
