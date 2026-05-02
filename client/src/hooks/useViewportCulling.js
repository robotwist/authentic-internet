import { useMemo } from "react";

/**
 * Custom hook for viewport culling optimization
 * Only returns tiles/entities that are visible in the current viewport
 *
 * @param {Object|null} scrollOffset - World scroll in pixels {x, y}, same convention as GameWorld
 *   viewport (top-left of the visible rectangle into the world). Pass `null` to disable culling
 *   and use the full map (small maps / overlays).
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} mapRows - Total number of rows in the map
 * @param {number} mapCols - Total number of columns in the map
 * @param {number} bufferTiles - Number of extra tiles to render beyond viewport (default: 2)
 * @returns {Object} Visible tile range {startX, endX, startY, endY, visibleTiles}
 */
export function useViewportCulling(
  scrollOffset,
  tileSize = 64,
  mapRows = 40,
  mapCols = 40,
  bufferTiles = 2,
) {
  const visibleRange = useMemo(() => {
    if (scrollOffset == null) {
      const visibleTiles = mapRows * mapCols;
      return {
        startX: 0,
        endX: mapCols,
        startY: 0,
        endY: mapRows,
        visibleTiles,
        totalTiles: visibleTiles,
        cullingRatio: "100.0",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const sx = scrollOffset.x ?? 0;
    const sy = scrollOffset.y ?? 0;

    const leftTile = Math.floor(sx / tileSize);
    const topTile = Math.floor(sy / tileSize);
    const rightTile = Math.ceil((sx + viewportWidth) / tileSize);
    const bottomTile = Math.ceil((sy + viewportHeight) / tileSize);

    const startX = Math.max(0, leftTile - bufferTiles);
    const startY = Math.max(0, topTile - bufferTiles);
    let endX = Math.min(mapCols, rightTile + bufferTiles);
    let endY = Math.min(mapRows, bottomTile + bufferTiles);

    // Camera scroll larger than map (e.g. after changing areas) → invalid range; render whole map
    if (endX <= startX || endY <= startY) {
      const visibleTiles = mapRows * mapCols;
      return {
        startX: 0,
        endX: mapCols,
        startY: 0,
        endY: mapRows,
        visibleTiles,
        totalTiles: visibleTiles,
        cullingRatio: "100.0",
      };
    }

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
  }, [scrollOffset, tileSize, mapRows, mapCols, bufferTiles]);

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
