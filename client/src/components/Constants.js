import { v4 as uuidv4 } from 'uuid';
import { MAPS } from './GameData';
import { TILE_SIZE, MAP_ROWS, MAP_COLS, TILE_TYPES, isWalkable } from './MapConstants';

// Re-export MAPS and map constants
export { MAPS, TILE_SIZE, MAP_ROWS, MAP_COLS, TILE_TYPES, isWalkable };

// Artifact Types and Interactions
export const ARTIFACT_TYPES = {
  WEAPON: 'weapon',
  SCROLL: 'scroll',
  RELIC: 'relic',
  KEY: 'key',
  CONTAINER: 'container',
  PORTAL: 'portal'
};

export const ARTIFACT_INTERACTIONS = {
  COMBINE: 'combine',
  UNLOCK: 'unlock',
  REVEAL: 'reveal',
  TRANSFORM: 'transform'
};

// NPC Types and Config
export const NPC_TYPES = {
  GUIDE: 'guide',
  MERCHANT: 'merchant',
  SCHOLAR: 'scholar',
  WARRIOR: 'warrior',
  MYSTIC: 'mystic',
  POET: 'scholar',    // For Shakespeare
  PHILOSOPHER: 'mystic',  // For Socrates
  WEATHERMAN: 'guide',  // For Zeus
  ARTIST: 'artist',
  CODER: 'coder',
  SHAKESPEARE: 'shakespeare',
  SOCRATES: 'socrates',
  AUGUSTINE: 'augustine',
  MICHELANGELO: 'artist',
  ZORK: 'zork',
  ADA_LOVELACE: 'ada_lovelace',
  LORD_BYRON: 'lord_byron',
  OSCAR_WILDE: 'oscar_wilde',
  ALEXANDER_POPE: 'alexander_pope',
  ZEUS: 'zeus',
  JOHN_MUIR: 'john_muir',
  JESUS: 'jesus'
};

// Helper functions
export const canInteract = (artifact1, artifact2) => {
  if (!artifact1?.interactions || !artifact2?.name) return false;
  return artifact1.interactions.some(interaction => 
    interaction.type === ARTIFACT_INTERACTIONS.COMBINE && 
    interaction.targetArtifact === artifact2.name
  );
};

export const getInteractionResult = (artifact1, artifact2) => {
  if (!artifact1?.interactions || !artifact2?.name) return null;
  const interaction = artifact1.interactions.find(i => 
    i.type === ARTIFACT_INTERACTIONS.COMBINE && 
    i.targetArtifact === artifact2.name
  );
  return interaction?.result;
};

export const isNearConditionMet = (artifact, characterPosition, mapData) => {
  if (!artifact?.interactions || !characterPosition || !mapData) return false;
  
  const interaction = artifact.interactions.find(i => i.type === ARTIFACT_INTERACTIONS.REVEAL);
  if (!interaction) return false;

  const { x, y } = characterPosition;
  const tileType = mapData[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)];
  if (typeof tileType !== 'number') return false;
  
  switch (interaction.condition) {
    case 'nearWater':
      return tileType === 2; // Water tile
    case 'nearPortal':
      return tileType === 5; // Portal tile
    default:
      return false;
  }
};

export const canInteractWithNPC = (characterPosition, npcPosition) => {
  if (!characterPosition || !npcPosition) return false;
  
  const charX = Math.floor(characterPosition.x / TILE_SIZE);
  const charY = Math.floor(characterPosition.y / TILE_SIZE);
  const npcX = Math.floor(npcPosition.x / TILE_SIZE);
  const npcY = Math.floor(npcPosition.y / TILE_SIZE);

  return Math.abs(charX - npcX) <= 1 && Math.abs(charY - npcY) <= 1;
};

// Export default object with all constants and functions
export default {
  TILE_SIZE,
  MAP_ROWS,
  MAP_COLS,
  TILE_TYPES,
  ARTIFACT_TYPES,
  ARTIFACT_INTERACTIONS,
  NPC_TYPES,
  MAPS,
  isWalkable,
  canInteract,
  getInteractionResult,
  isNearConditionMet,
  canInteractWithNPC
}; 