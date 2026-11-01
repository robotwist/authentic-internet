const DUNGEON_TILE_SIZE = 64;

/**
 * Room data stores tile coordinates. Enemy reads pixel `position` and `health`.
 * Passing `initialPosition` leaves `position` undefined and the next render throws.
 */
export function propsForDungeonEnemy(enemy) {
  const tile = enemy?.position || { x: 0, y: 0 };
  return {
    type: enemy?.type,
    position: {
      x: Number(tile.x) * DUNGEON_TILE_SIZE,
      y: Number(tile.y) * DUNGEON_TILE_SIZE,
    },
    health: enemy?.health,
  };
}
