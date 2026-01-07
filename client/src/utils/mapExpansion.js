/**
 * Map Expansion Utility
 * Intelligently expands small maps to larger dimensions
 */

/**
 * Expands a map by strategically placing content with variation
 * @param {Array<Array<number>>} originalMap - The original map data
 * @param {number} targetRows - Target number of rows
 * @param {number} targetCols - Target number of columns
 * @param {Object} options - Expansion options
 * @returns {Array<Array<number>>} Expanded map data
 */
export function expandMap(originalMap, targetRows, targetCols, options = {}) {
  const {
    fillTile = 0, // Default empty tile
    centerOriginal = true, // Center the original map in the new space
    addBorder = true, // Add natural borders
    mirrorMode = false, // Mirror content for symmetry
  } = options;

  // Create new map filled with fillTile
  const expandedMap = Array(targetRows)
    .fill(null)
    .map(() => Array(targetCols).fill(fillTile));

  const originalRows = originalMap.length;
  const originalCols = originalMap[0]?.length || 0;

  // Calculate starting position (center or top-left)
  const startRow = centerOriginal
    ? Math.floor((targetRows - originalRows) / 2)
    : 0;
  const startCol = centerOriginal
    ? Math.floor((targetCols - originalCols) / 2)
    : 0;

  // Copy original map to center
  for (let r = 0; r < originalRows; r++) {
    for (let c = 0; c < originalCols; c++) {
      const newRow = startRow + r;
      const newCol = startCol + c;
      if (
        newRow >= 0 &&
        newRow < targetRows &&
        newCol >= 0 &&
        newCol < targetCols
      ) {
        expandedMap[newRow][newCol] = originalMap[r][c];
      }
    }
  }

  return expandedMap;
}

/**
 * Creates a natural-looking border around empty areas
 * @param {Array<Array<number>>} map - The map data
 * @param {number} borderTile - Tile type to use for borders
 * @returns {Array<Array<number>>} Map with borders
 */
export function addNaturalBorders(map, borderTile = 1) {
  const rows = map.length;
  const cols = map[0]?.length || 0;

  // Add perimeter border
  for (let c = 0; c < cols; c++) {
    if (map[0][c] === 0) map[0][c] = borderTile;
    if (map[rows - 1][c] === 0) map[rows - 1][c] = borderTile;
  }
  for (let r = 0; r < rows; r++) {
    if (map[r][0] === 0) map[r][0] = borderTile;
    if (map[r][cols - 1] === 0) map[r][cols - 1] = borderTile;
  }

  return map;
}

/**
 * Adds random variation to empty tiles
 * @param {Array<Array<number>>} map - The map data
 * @param {Array<{tile: number, probability: number}>} variations - Tile variations to add
 * @returns {Array<Array<number>>} Map with variations
 */
export function addTileVariation(map, variations = []) {
  const rows = map.length;
  const cols = map[0]?.length || 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (map[r][c] === 0) {
        // Only add variation to empty tiles
        for (const { tile, probability } of variations) {
          if (Math.random() < probability) {
            map[r][c] = tile;
            break;
          }
        }
      }
    }
  }

  return map;
}

/**
 * Creates zones within a map (e.g., forest zone, lake zone)
 * @param {Array<Array<number>>} map - The map data
 * @param {Array<{x, y, width, height, tile}>} zones - Zones to create
 * @returns {Array<Array<number>>} Map with zones
 */
export function createZones(map, zones = []) {
  for (const zone of zones) {
    const { x, y, width, height, tile, fillType = "solid" } = zone;

    for (let r = y; r < y + height && r < map.length; r++) {
      for (let c = x; c < x + width && c < map[0].length; c++) {
        if (fillType === "solid") {
          map[r][c] = tile;
        } else if (fillType === "scattered") {
          if (Math.random() > 0.5) {
            map[r][c] = tile;
          }
        }
      }
    }
  }

  return map;
}

/**
 * Creates paths between two points
 * @param {Array<Array<number>>} map - The map data
 * @param {Object} start - Start position {x, y}
 * @param {Object} end - End position {x, y}
 * @param {number} pathTile - Tile to use for path
 * @returns {Array<Array<number>>} Map with path
 */
export function createPath(map, start, end, pathTile = 0) {
  let currentX = start.x;
  let currentY = start.y;

  while (currentX !== end.x || currentY !== end.y) {
    // Move horizontally
    if (currentX < end.x) {
      currentX++;
    } else if (currentX > end.x) {
      currentX--;
    }
    // Move vertically
    else if (currentY < end.y) {
      currentY++;
    } else if (currentY > end.y) {
      currentY--;
    }

    if (
      currentY >= 0 &&
      currentY < map.length &&
      currentX >= 0 &&
      currentX < map[0].length
    ) {
      map[currentY][currentX] = pathTile;
    }
  }

  return map;
}

/**
 * Prints a map as a grid (for debugging)
 */
export function printMap(map, title = "Map") {
  console.log(`\n${title} (${map.length}x${map[0]?.length || 0}):`);
  console.log(map.map((row) => row.join(",")).join("\n"));
}

/**
 * Validates map dimensions and content
 */
export function validateMap(map, expectedRows, expectedCols) {
  if (!Array.isArray(map)) {
    return { valid: false, error: "Map is not an array" };
  }
  if (map.length !== expectedRows) {
    return {
      valid: false,
      error: `Expected ${expectedRows} rows, got ${map.length}`,
    };
  }
  for (let i = 0; i < map.length; i++) {
    if (!Array.isArray(map[i])) {
      return { valid: false, error: `Row ${i} is not an array` };
    }
    if (map[i].length !== expectedCols) {
      return {
        valid: false,
        error: `Row ${i}: expected ${expectedCols} cols, got ${map[i].length}`,
      };
    }
  }
  return { valid: true };
}
