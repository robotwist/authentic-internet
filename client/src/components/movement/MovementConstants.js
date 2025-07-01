// Movement & Physics Constants
export const MOVEMENT_CONSTANTS = {
  // Timing Constants
  MIN_MOVE_INTERVAL: 100,           // Minimum time between moves (ms)
  MOVEMENT_COOLDOWN: 150,           // Movement cooldown duration (ms)
  BUMP_ANIMATION_DURATION: 200,     // Bump animation length (ms)
  KEY_PROCESS_INTERVAL: 100,        // Key processing interval (ms)
  
  // Physics Constants
  MOVEMENT_INERTIA_FACTOR: 0.8,     // Initial inertia multiplier
  INERTIA_DECAY_RATE: 0.7,          // Rate of inertia decay
  INERTIA_RESET_THRESHOLD: 0.1,     // Threshold to reset inertia
  INERTIA_MOVEMENT_THRESHOLD: 0.3,  // Minimum inertia for movement
  
  // Audio Constants
  BUMP_SOUND_VOLUME: 0.3,           // Volume for bump sound effects
  
  // Interaction Constants
  NPC_INTERACTION_RANGE: 1.5,       // NPC interaction range multiplier
  ARTIFACT_PICKUP_RANGE: 2,         // Artifact pickup range multiplier
};

// Direction Constants
export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
};

// Direction Vectors for easier calculations
export const DIRECTION_VECTORS = {
  [DIRECTIONS.UP]: { x: 0, y: -1 },
  [DIRECTIONS.DOWN]: { x: 0, y: 1 },
  [DIRECTIONS.LEFT]: { x: -1, y: 0 },
  [DIRECTIONS.RIGHT]: { x: 1, y: 0 }
};

// Map Transition Configuration
export const MAP_TRANSITIONS = {
  "Overworld": {
    right: "Overworld 2"
  },
  "Overworld 2": {
    left: "Overworld",
    right: "Overworld 3"
  },
  "Overworld 3": {
    left: "Overworld 2"
  }
};