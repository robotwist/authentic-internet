/**
 * Helpers for Socket.IO connection bookkeeping and world:join create policy.
 * Kept free of Socket.IO / Mongo imports so unit tests can exercise them directly.
 */

/** Built-in game map worldIds that MultiplayerChat may auto-provision on first join. */
export const BUILT_IN_WORLD_IDS = Object.freeze([
  'overworld',
  'Overworld',
  'Overworld 2',
  'Overworld 3',
  'Desert 1',
  'Desert 2',
  'Desert 3',
  'Yosemite',
  "Hemingway's Battleground",
  'Text Adventure',
  'Terminal3',
  'Level4Shooter',
  'Dungeon Level 1',
  'Dungeon Level 2',
  'Dungeon Level 3',
]);

const BUILT_IN_WORLD_ID_SET = new Set(BUILT_IN_WORLD_IDS);

export const MAX_WORLD_ID_LENGTH = 100;
export const DEFAULT_MAX_PLAYERS = 50;
export const ABSOLUTE_MAX_PLAYERS = 200;

/**
 * Validate a client-supplied worldId before any DB lookup/create.
 * @param {unknown} worldId
 * @returns {worldId is string}
 */
export function isValidWorldId(worldId) {
  if (typeof worldId !== 'string') return false;
  const trimmed = worldId.trim();
  if (!trimmed || trimmed.length > MAX_WORLD_ID_LENGTH) return false;
  // Reject path/control characters that should never appear in world keys.
  if (/[\u0000-\u001f\u007f\/\\]/.test(trimmed)) return false;
  return true;
}

/**
 * Whether socket world:join may create a missing WorldInstance for this id.
 * Custom worlds must be created via REST first; only built-in maps auto-create.
 * @param {string} worldId
 * @returns {boolean}
 */
export function canAutoCreateWorldInstance(worldId) {
  if (!isValidWorldId(worldId)) return false;
  return BUILT_IN_WORLD_ID_SET.has(worldId.trim());
}

/**
 * Clamp client-supplied maxPlayers for auto-created built-in worlds.
 * @param {unknown} maxPlayers
 * @returns {number}
 */
export function clampMaxPlayers(maxPlayers) {
  const parsed = Number(maxPlayers);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_PLAYERS;
  return Math.min(ABSOLUTE_MAX_PLAYERS, Math.max(1, Math.floor(parsed)));
}

/**
 * Register the latest socket for a user. Overwrites prior tabs intentionally
 * (delivery targets the newest connection) but must pair with safe unregister.
 * @param {Map<string, object>} connections
 * @param {string|object} userId
 * @param {object} socket
 */
export function registerActiveConnection(connections, userId, socket) {
  connections.set(String(userId), socket);
}

/**
 * Remove a user mapping only when the disconnecting socket still owns the slot.
 * Prevents multi-tab eviction: closing tab A must not drop tab B's connection.
 * @param {Map<string, object>} connections
 * @param {string|object} userId
 * @param {object} socket
 * @returns {boolean} true when the mapping was removed
 */
export function unregisterActiveConnection(connections, userId, socket) {
  const key = String(userId);
  if (connections.get(key) !== socket) {
    return false;
  }
  connections.delete(key);
  return true;
}
