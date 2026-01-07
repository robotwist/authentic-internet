import { v4 as uuidv4 } from "uuid";
import { MAPS, WORLD_MAP } from "./GameData";
import {
  TILE_SIZE,
  MAP_ROWS,
  MAP_COLS,
  TILE_TYPES,
  isWalkable,
} from "./MapConstants";
import {
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
} from "./GameConstants";

// Re-export all constants from their respective files
export {
  TILE_SIZE,
  MAP_ROWS,
  MAP_COLS,
  TILE_TYPES,
  isWalkable,
} from "./MapConstants";
export {
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
} from "./GameConstants";
export { MAPS, WORLD_MAP } from "./GameData";

// Helper functions
export const canInteract = (tileType) => {
  if (typeof tileType !== "number") return false;
  switch (tileType) {
    case 5: // Portal
    case 6: // Terminal portal
    case 7: // Shooter portal
    case 8: // Text portal
      return true;
    default:
      return false;
  }
};

export const getInteractionResult = (tileType) => {
  if (typeof tileType !== "number") return null;
  switch (tileType) {
    case 5: // Portal
      return { type: "portal" };
    case 6: // Terminal portal
      return { type: "terminal" };
    case 7: // Shooter portal
      return { type: "shooter" };
    case 8: // Text portal
      return { type: "text" };
    default:
      return null;
  }
};

export const isNearConditionMet = (playerPos, targetPos, distance = 1) => {
  if (!playerPos || !targetPos) return false;
  const dx = Math.abs(playerPos.x - targetPos.x);
  const dy = Math.abs(playerPos.y - targetPos.y);
  return dx <= distance && dy <= distance;
};

export const canInteractWithNPC = (npc, playerPos) => {
  if (!npc || !playerPos) return false;
  return isNearConditionMet(playerPos, npc.position);
};

// Default export for backward compatibility
export default {
  TILE_SIZE,
  MAP_ROWS,
  MAP_COLS,
  TILE_TYPES,
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
  MAPS,
  WORLD_MAP,
  isWalkable,
  canInteract,
  getInteractionResult,
  isNearConditionMet,
  canInteractWithNPC,
};
