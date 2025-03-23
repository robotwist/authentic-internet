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
  if (!SOUNDS_ENABLED) return;
  
  try {
    if (!loadedSounds[soundId]) {
      console.log(`Skipping preload of sound in safe mode: ${soundId}`);
      soundAvailability[soundId] = false;
    }
  } catch (err) {
    console.warn("Error in preloadSound (safe mode active):", err);
  }
};

/**
 * Preload background music for later use - SAFE version
 * @param {string} musicId - Identifier for the music
 * @param {string} path - Path to the music file
 */
export const preloadMusic = (musicId, path) => {
  if (!SOUNDS_ENABLED) return;
  
  try {
    if (!backgroundMusic[musicId]) {
      console.log(`Skipping preload of music in safe mode: ${musicId}`);
      soundAvailability[musicId] = false;
    }
  } catch (err) {
    console.warn("Error in preloadMusic (safe mode active):", err);
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
      console.log(`Sound playback skipped in safe mode: ${soundId}`);
      resolve();
      return;
    }
    
    try {
      console.log(`Would play sound: ${soundId} at volume ${volume}`);
      resolve();
    } catch (err) {
      console.warn("Error in playSound (safe mode active):", err);
      resolve();
    }
  });
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
      console.log(`Music playback skipped in safe mode: ${musicId}`);
      resolve();
      return;
    }
    
    try {
      console.log(`Would play music: ${musicId} at volume ${volume}`);
      currentMusicId = musicId;
      resolve();
    } catch (err) {
      console.warn("Error in playMusic (safe mode active):", err);
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
      console.log(`Would pause music: ${musicId || currentMusicId}`);
      resolve();
    } catch (err) {
      console.warn("Error in pauseMusic (safe mode active):", err);
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
      console.log(`Would stop music: ${musicId || currentMusicId}`);
      resolve();
    } catch (err) {
      console.warn("Error in stopMusic (safe mode active):", err);
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
    console.log(`Would set music volume to ${volume} for ${musicId || currentMusicId}`);
  } catch (err) {
    console.warn("Error in setMusicVolume (safe mode active):", err);
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
  console.log("Sound system initialized in SAFE MODE - sounds disabled");
};

// Call init function
initSounds(); 