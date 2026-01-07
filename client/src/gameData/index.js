// Game data exports
export * from './constants';
export { OVERWORLD_MAPS } from './maps/overworld';
export { DUNGEON_MAPS } from './maps/dungeons';
export { NPCs, MAP_NPCS } from './npcs';
export { QUESTS } from './quests';

// Combined maps array for backward compatibility
import { OVERWORLD_MAPS } from './maps/overworld';
import { DUNGEON_MAPS } from './maps/dungeons';

export const MAPS = [...OVERWORLD_MAPS, ...DUNGEON_MAPS];