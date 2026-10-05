/**
 * Auto-entry tiles (dungeon portals, Yosemite sigils) fire once per visit.
 * Dismissing the destination must keep the guard while the player is still
 * standing on the tile. Clearing it on exit makes the next check re-enter.
 */

export function dungeonStepKey(mapIndex, tileX, tileY) {
  return `${mapIndex}:${tileX}:${tileY}`;
}

export function yosemiteSigilStepKey(mapIndex, tileX, tileY, tileType) {
  return `${mapIndex}:${tileX}:${tileY}:${tileType}`;
}

export function isYosemiteSigilTile(tileType) {
  return tileType >= 6 && tileType <= 8;
}

export function stepKeyFromPixel(mapIndex, pixelX, pixelY, tileSize, tileType) {
  const tileX = Math.floor(pixelX / tileSize);
  const tileY = Math.floor(pixelY / tileSize);
  if (tileType == null) return dungeonStepKey(mapIndex, tileX, tileY);
  return yosemiteSigilStepKey(mapIndex, tileX, tileY, tileType);
}

/**
 * @param {string} consumedKey
 * @param {string} stepKey
 * @param {{ blocked?: boolean, onTriggerTile?: boolean }} options
 * @returns {{ fire: boolean, consumedKey: string }}
 */
export function resolveStepTrigger(
  consumedKey,
  stepKey,
  { blocked = false, onTriggerTile = true } = {},
) {
  if (blocked) {
    return { fire: false, consumedKey };
  }
  if (!onTriggerTile) {
    return { fire: false, consumedKey: "" };
  }
  if (consumedKey === stepKey) {
    return { fire: false, consumedKey };
  }
  return { fire: true, consumedKey: stepKey };
}

/**
 * Remember the tile the player is still occupying after they leave a
 * dungeon or close a mini-game. An empty occupying key leaves the guard
 * unchanged (walking off the tile is what clears it).
 */
export function consumedKeyAfterDismiss(consumedKey, occupyingStepKey) {
  if (occupyingStepKey) return occupyingStepKey;
  return consumedKey;
}
