import { useMemo } from "react";

/**
 * Custom hook for viewport culling optimization
 * Only returns tiles/entities that are visible in the current viewport
 *
 * @param {Object} viewport - Current viewport position {x, y}
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} mapRows - Total number of rows in the map
 * @param {number} mapCols - Total number of columns in the map
 * @param {number} bufferTiles - Number of extra tiles to render beyond viewport (default: 2)
 * @returns {Object} Visible tile range {startX, endX, startY, endY, visibleTiles}
 */
export function useViewportCulling(
  viewport,
  tileSize = 64,
  mapRows = 40,
  mapCols = 40,
  bufferTiles = 2,
) {
  const visibleRange = useMemo(() => {
    // Get window dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate which tiles are visible based on viewport position
    // viewport.x and viewport.y are negative when scrolled, so we need absolute values
    const startX = Math.max(
      0,
      Math.floor(-viewport.x / tileSize) - bufferTiles,
    );
    const startY = Math.max(
      0,
      Math.floor(-viewport.y / tileSize) - bufferTiles,
    );

    // Calculate end positions with buffer
    const tilesInViewWidth = Math.ceil(viewportWidth / tileSize);
    const tilesInViewHeight = Math.ceil(viewportHeight / tileSize);

    const endX = Math.min(mapCols, startX + tilesInViewWidth + bufferTiles * 2);
    const endY = Math.min(
      mapRows,
      startY + tilesInViewHeight + bufferTiles * 2,
    );

    // Calculate total visible tiles for performance monitoring
    const visibleTiles = (endX - startX) * (endY - startY);

    return {
      startX,
      endX,
      startY,
      endY,
      visibleTiles,
      totalTiles: mapRows * mapCols,
      cullingRatio: ((visibleTiles / (mapRows * mapCols)) * 100).toFixed(1),
    };
  }, [viewport, tileSize, mapRows, mapCols, bufferTiles]);

  return visibleRange;
}

/**
 * Helper function to determine if an entity (NPC, artifact) is in the visible range
 *
 * @param {Object} position - Entity position {x, y} in tile coordinates
 * @param {Object} visibleRange - Visible range from useViewportCulling
 * @returns {boolean} True if entity is visible
 */
export function isEntityVisible(position, visibleRange) {
  if (!position || !visibleRange) return false;

  const { startX, endX, startY, endY } = visibleRange;

  return (
    position.x >= startX &&
    position.x < endX &&
    position.y >= startY &&
    position.y < endY
  );
}

/**
 * Performance monitoring helper
 * Logs viewport culling stats in development mode
 */
export function logCullingStats(visibleRange, componentName = "Component") {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${componentName}] Viewport Culling Stats:`, {
      visibleTiles: visibleRange.visibleTiles,
      totalTiles: visibleRange.totalTiles,
      cullingRatio: `${visibleRange.cullingRatio}%`,
      range: `(${visibleRange.startX},${visibleRange.startY}) to (${visibleRange.endX},${visibleRange.endY})`,
    });
  }
}
