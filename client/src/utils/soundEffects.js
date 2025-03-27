// Sound effects utility module - SAFE MODE
// This version prevents sound-related errors from affecting the app

// Track loaded audio elements to avoid reloading
const loadedSounds = {};
// Track if sounds are available/valid
const soundAvailability = {};
// Track background music elements
const backgroundMusic = {};
// Track current background music ID
let currentMusicId = null;

// Global flag to disable all sounds
const SOUNDS_ENABLED = false; // Set to false to completely disable sounds

/**
 * Preload a sound for later use - SAFE version
 * @param {string} soundId - Identifier for the sound
 * @param {string} path - Path to the sound file
 */
export const preloadSound = (soundId, path) => {
  // Silent return when sounds disabled - no logging
  if (!SOUNDS_ENABLED) return;
  
  try {
    if (!loadedSounds[soundId]) {
      // No need to log in safe mode
      soundAvailability[soundId] = false;
    }
  } catch (err) {
    // Silent error in safe mode
  }
};

/**
 * Preload background music for later use - SAFE version
 * @param {string} musicId - Identifier for the music
 * @param {string} path - Path to the music file
 */
export const preloadMusic = (musicId, path) => {
  // Silent return when sounds disabled - no logging
  if (!SOUNDS_ENABLED) return;
  
  try {
    if (!backgroundMusic[musicId]) {
      // No need to log in safe mode
      soundAvailability[musicId] = false;
    }
  } catch (err) {
    // Silent error in safe mode
  }
};

/**
 * Play a sound effect - SAFE version
 * @param {string} soundId - Identifier for the sound
 * @param {number} volume - Volume from 0 to 1
 * @returns {Promise} Resolves immediately in safe mode
 */
export const playSound = (soundId, volume = 1.0) => {
  return new Promise((resolve) => {
    if (!SOUNDS_ENABLED) {
      // Silent return when sounds disabled - no logging
      resolve();
      return;
    }
    
    try {
      // No need to log in safe mode
      resolve();
    } catch (err) {
      // Silent error in safe mode
      resolve();
    }
  });
};

/**
 * Play music appropriate for the current world/map
 * @param {number} worldIndex - The index of the current world
 * @returns {Promise} Resolves when music starts playing
 */
export const playMusicForCurrentWorld = (worldIndex) => {
  if (!SOUNDS_ENABLED) {
    // Silent return when sounds disabled - no logging
    return Promise.resolve();
  }
  
  // Each world would have specific music
  const worldMusicMap = {
    0: 'main-theme',    // Main world
    1: 'forest-theme',  // Forest world
    2: 'cave-theme',    // Cave world
    3: 'castle-theme',  // Castle world
    4: 'beach-theme',   // Beach world
  };
  
  const musicId = worldMusicMap[worldIndex] || 'main-theme';
  return playMusic(musicId, 0.2, true);
};

/**
 * Play background music - SAFE version
 * @param {string} musicId - Identifier for the music track
 * @param {number} volume - Volume from 0 to 1
 * @param {boolean} fadeIn - Whether to fade in the music
 * @returns {Promise} Resolves immediately in safe mode
 */
export const playMusic = (musicId, volume = 0.3, fadeIn = true) => {
  return new Promise((resolve) => {
    if (!SOUNDS_ENABLED) {
      // Silent return when sounds disabled - no logging
      resolve();
      return;
    }
    
    try {
      // No need to log in safe mode
      currentMusicId = musicId;
      resolve();
    } catch (err) {
      // Silent error in safe mode
      resolve();
    }
  });
};

/**
 * Pause currently playing background music - SAFE version
 * @param {string} musicId - Optional identifier for specific music to pause
 * @param {boolean} fadeOut - Whether to fade out before pausing
 * @returns {Promise} Resolves immediately in safe mode
 */
export const pauseMusic = (musicId = null, fadeOut = true) => {
  return new Promise((resolve) => {
    if (!SOUNDS_ENABLED) {
      resolve();
      return;
    }
    
    try {
      // No need to log in safe mode
      resolve();
    } catch (err) {
      // Silent error in safe mode
      resolve();
    }
  });
};

/**
 * Stop currently playing background music - SAFE version
 * @param {string} musicId - Optional identifier for specific music to stop
 * @param {boolean} fadeOut - Whether to fade out before stopping
 * @returns {Promise} Resolves immediately in safe mode
 */
export const stopMusic = (musicId = null, fadeOut = true) => {
  return new Promise((resolve) => {
    if (!SOUNDS_ENABLED) {
      resolve();
      return;
    }
    
    try {
      // No need to log in safe mode
      resolve();
    } catch (err) {
      // Silent error in safe mode
      resolve();
    }
  });
};

/**
 * Set the volume of currently playing music - SAFE version
 * @param {number} volume - Volume from 0 to 1
 * @param {string} musicId - Optional identifier for specific music
 * @param {boolean} fade - Whether to fade to the new volume
 */
export const setMusicVolume = (volume, musicId = null, fade = true) => {
  if (!SOUNDS_ENABLED) return;
  
  try {
    // No need to log in safe mode
  } catch (err) {
    // Silent error in safe mode
  }
};

/**
 * Play a random portal sound - SAFE version
 * @param {number} flushChance - Chance to play a flush sound
 * @returns {Promise} Resolves immediately in safe mode
 */
export const playRandomPortalSound = (flushChance = 0.3) => {
  return playSound('portal-warp');
};

/**
 * Initialize sounds - SAFE version
 * This function would normally set up all sound fallbacks
 */
export const initSounds = () => {
  // No need to log in safe mode
};

// Call init function
initSounds(); 