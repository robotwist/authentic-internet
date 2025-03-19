// Sound effects utility module

// Track loaded audio elements to avoid reloading
const loadedSounds = {};

/**
 * Preload a sound for later use
 * @param {string} soundId - Identifier for the sound
 * @param {string} path - Path to the sound file
 */
export const preloadSound = (soundId, path) => {
  if (!loadedSounds[soundId]) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    loadedSounds[soundId] = audio;
    
    // Force load
    audio.load();
    console.log(`Preloaded sound: ${soundId}`);
  }
};

/**
 * Play a sound effect
 * @param {string} soundId - Identifier for the sound
 * @param {number} volume - Volume from 0 to 1
 * @returns {Promise} Resolves when sound ends or rejects on error
 */
export const playSound = (soundId, volume = 1.0) => {
  return new Promise((resolve, reject) => {
    const sound = loadedSounds[soundId];
    if (!sound) {
      console.error(`Sound not loaded: ${soundId}`);
      reject(new Error(`Sound not loaded: ${soundId}`));
      return;
    }
    
    // Create a clone to allow multiple simultaneous plays
    const soundClone = sound.cloneNode();
    soundClone.volume = volume;
    
    soundClone.onended = () => {
      resolve();
    };
    
    soundClone.onerror = (err) => {
      console.error(`Error playing sound ${soundId}:`, err);
      reject(err);
    };
    
    soundClone.play().catch(err => {
      console.error(`Failed to play sound ${soundId}:`, err);
      reject(err);
    });
  });
};

/**
 * Play a random portal sound with a chance of playing a toilet flush
 * @param {number} flushChance - Chance from 0 to 1 of playing the toilet sound
 */
export const playRandomPortalSound = (flushChance = 0.3) => {
  const shouldPlayFlush = Math.random() < flushChance;
  
  if (shouldPlayFlush) {
    console.log('🚽 Playing toilet flush sound for portal');
    return playSound('toiletFlush', 0.7);
  } else {
    console.log('🌀 Playing standard portal sound');
    return playSound('portalStandard', 0.5);
  }
};

// Preload sounds
export const initSounds = () => {
  preloadSound('portalStandard', '/assets/sounds/portal-standard.mp3');
  preloadSound('toiletFlush', '/assets/sounds/toilet-flush.mp3');
  preloadSound('pickup', '/assets/sounds/pickup.mp3');
  preloadSound('levelComplete', '/assets/sounds/level-complete.mp3');
}; 