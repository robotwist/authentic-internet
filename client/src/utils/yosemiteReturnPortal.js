/**
 * Yosemite return portal helpers.
 * Tile 5 on Yosemite should return the player to Overworld 3.
 */

export const YOSEMITE_RETURN_SPAWN_TILE = { x: 8, y: 2 };

/**
 * Resolve a Yosemite → Overworld 3 transition when standing on portal tile 5.
 * @returns {null|{destinationIndex:number,destinationName:string,spawnPosition:{x:number,y:number}}}
 */
export function resolveYosemiteReturnTransition({
  currentMapName,
  tileType,
  tileSize,
  getMapIndexByKey,
}) {
  if (currentMapName !== "Yosemite" || tileType !== 5) {
    return null;
  }

  if (typeof getMapIndexByKey !== "function" || !Number.isFinite(tileSize)) {
    return null;
  }

  const destinationIndex = getMapIndexByKey("Overworld 3");
  if (destinationIndex === -1 || destinationIndex == null) {
    return null;
  }

  return {
    destinationIndex,
    destinationName: "Overworld 3",
    spawnPosition: {
      x: YOSEMITE_RETURN_SPAWN_TILE.x * tileSize,
      y: YOSEMITE_RETURN_SPAWN_TILE.y * tileSize,
    },
  };
}
