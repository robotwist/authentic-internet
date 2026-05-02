import { LIBRARY_OF_ALEXANDRIA } from "./DungeonData";

/** Display names from map `specialPortals[].destination` → dungeon definition */
const DUNGEON_BY_DESTINATION = {
  "Library of Alexandria": LIBRARY_OF_ALEXANDRIA,
};

export function getDungeonByDestination(destinationName) {
  return DUNGEON_BY_DESTINATION[destinationName] ?? null;
}

const STORAGE_PREFIX = "ai_dungeon_v1";

export function getDungeonStorageKey(dungeonId, userId) {
  const who = userId && String(userId).trim() ? String(userId) : "guest";
  return `${STORAGE_PREFIX}_${dungeonId}_${who}`;
}

export function loadDungeonRun(dungeonId, userId) {
  if (!dungeonId) return null;
  try {
    const raw = localStorage.getItem(getDungeonStorageKey(dungeonId, userId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || data.dungeonId !== dungeonId)
      return null;
    return data;
  } catch {
    return null;
  }
}

export function saveDungeonRun(dungeonId, userId, payload) {
  if (!dungeonId) return;
  try {
    localStorage.setItem(
      getDungeonStorageKey(dungeonId, userId),
      JSON.stringify({ version: 1, dungeonId, ...payload }),
    );
  } catch (e) {
    console.warn("Dungeon progress save failed:", e);
  }
}

export function clearDungeonProgress(dungeonId, userId) {
  if (!dungeonId) return;
  try {
    localStorage.removeItem(getDungeonStorageKey(dungeonId, userId));
  } catch {
    /* ignore */
  }
}
