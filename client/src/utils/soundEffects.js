// Sound effects utility module

// Track loaded audio elements to avoid reloading
const loadedSounds = {};
// Track if sounds are available/valid
const soundAvailability = {};

// Single AudioContext instance for all fallback sounds
let fallbackAudioContext = null;

/**
 * Preload a sound for later use
 * @param {string} soundId - Identifier for the sound
 * @param {string} path - Path to the sound file
 */
export const preloadSound = (soundId, path) => {
  if (!loadedSounds[soundId]) {
    const audio = new Audio();
    
    // Set up error handling before setting src
    audio.onerror = () => {
      console.warn(`Sound file not available or invalid: ${path}`);
      soundAvailability[soundId] = false;
    };
    
    audio.onloadeddata = () => {
      console.log(`Sound loaded successfully: ${soundId}`);
      soundAvailability[soundId] = true;
    };
    
    audio.preload = 'auto';
    audio.src = path;
    loadedSounds[soundId] = audio;
    
    // Force load
    audio.load();
    console.log(`Attempting to preload sound: ${soundId}`);
  }
};

/**
 * Check if a sound is available and valid
 * @param {string} soundId - Identifier for the sound
 * @returns {boolean} Whether the sound is available
 */
const isSoundAvailable = (soundId) => {
  // If we haven't checked yet, assume it's true
  if (soundAvailability[soundId] === undefined) {
    return true;
  }
  return soundAvailability[soundId];
};

/**
 * Play a sound effect
 * @param {string} soundId - Identifier for the sound
 * @param {number} volume - Volume from 0 to 1
 * @returns {Promise} Resolves when sound ends or rejects on error
 */
export const playSound = (soundId, volume = 1.0) => {
  return new Promise((resolve, reject) => {
    // Skip playing if we know the sound isn't available
    if (soundAvailability[soundId] === false) {
      console.log(`Using fallback for unavailable sound: ${soundId}`);
      // Use fallback sound if available
      if (fallbackSounds[soundId]) {
        return fallbackSounds[soundId].play().then(resolve);
      } else {
        resolve(); // Resolve immediately without error
      }
      return;
    }
    
    const sound = loadedSounds[soundId];
    if (!sound) {
      console.error(`Sound not loaded: ${soundId}`);
      // Try fallback
      if (fallbackSounds[soundId]) {
        return fallbackSounds[soundId].play().then(resolve);
      } else {
        resolve(); // Still resolve to prevent game disruption
      }
      return;
    }
    
    // Create a clone to allow multiple simultaneous plays
    const soundClone = sound.cloneNode();
    soundClone.volume = volume;
    
    soundClone.onended = () => {
      resolve();
    };
    
    soundClone.onerror = (err) => {
      console.warn(`Error playing sound ${soundId} - marking as unavailable`);
      soundAvailability[soundId] = false;
      // Try fallback
      if (fallbackSounds[soundId]) {
        fallbackSounds[soundId].play().then(resolve);
      } else {
        resolve(); // Still resolve to prevent game disruption
      }
    };
    
    // Check if sound is already marked as invalid
    if (!isSoundAvailable(soundId)) {
      console.log(`Using fallback for previously failed sound: ${soundId}`);
      if (fallbackSounds[soundId]) {
        fallbackSounds[soundId].play().then(resolve);
      } else {
        resolve();
      }
      return;
    }
    
    soundClone.play().catch(err => {
      console.warn(`Failed to play sound ${soundId} - marking as unavailable`);
      soundAvailability[soundId] = false;
      // Try fallback
      if (fallbackSounds[soundId]) {
        fallbackSounds[soundId].play().then(resolve);
      } else {
        resolve(); // Still resolve to prevent game disruption
      }
    });
  });
};

/**
 * Play a random portal sound with a chance of playing a toilet flush
 * @param {number} flushChance - Chance from 0 to 1 of playing the toilet sound
 */
export const playRandomPortalSound = (flushChance = 0.3) => {
  const shouldPlayFlush = Math.random() < flushChance;
  
  if (shouldPlayFlush && isSoundAvailable('toiletFlush')) {
    console.log('🚽 Playing toilet flush sound for portal');
    return playSound('toiletFlush', 0.7);
  } else if (isSoundAvailable('portalStandard')) {
    console.log('🌀 Playing standard portal sound');
    return playSound('portalStandard', 0.5);
  } else {
    console.log('🔇 No portal sounds available, skipping');
    return Promise.resolve();
  }
};

// Create a simple beep sound if no audio files are available
const createFallbackBeep = (frequency = 440, duration = 200) => {
  try {
    // Try to create an AudioContext for a simple beep if not already created
    if (!fallbackAudioContext) {
      fallbackAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🔊 Fallback AudioContext created for sound effects');
    }
    
    return {
      play: () => {
        try {
          // Resume AudioContext if it was suspended (browser policy)
          if (fallbackAudioContext.state === 'suspended') {
            fallbackAudioContext.resume();
          }
          
          const oscillator = fallbackAudioContext.createOscillator();
          const gainNode = fallbackAudioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          gainNode.gain.value = 0.1; // Low volume
          
          oscillator.connect(gainNode);
          gainNode.connect(fallbackAudioContext.destination);
          
          console.log(`🔊 Playing fallback sound at ${frequency}Hz for ${duration}ms`);
          // Start oscillator
          oscillator.start();
          
          // Schedule stop
          setTimeout(() => {
            try {
              oscillator.stop();
              // Clean up connections
              oscillator.disconnect();
              gainNode.disconnect();
            } catch (e) {
              console.warn('Error stopping fallback sound', e);
            }
          }, duration);
          
          return Promise.resolve();
        } catch (e) {
          console.warn('Error playing fallback beep', e);
          return Promise.resolve();
        }
      }
    };
  } catch (e) {
    console.warn('Could not create fallback beep sound', e);
    return { 
      play: () => Promise.resolve() 
    };
  }
};

// Fallback beep sounds with different frequencies for different sounds
const fallbackSounds = {
  pickup: null,
  portalStandard: null,
  toiletFlush: null,
  levelComplete: null
};

// Preload sounds
export const initSounds = () => {
  // Try to preload actual sound files
  preloadSound('portalStandard', '/assets/sounds/portal-standard.mp3');
  preloadSound('toiletFlush', '/assets/sounds/toilet-flush.mp3');
  preloadSound('pickup', '/assets/sounds/pickup.mp3');
  preloadSound('levelComplete', '/assets/sounds/level-complete.mp3');
  
  // Create fallback beep sounds with different frequencies
  fallbackSounds.pickup = createFallbackBeep(660, 100); // Higher pitch, shorter
  fallbackSounds.portalStandard = createFallbackBeep(330, 300); // Lower pitch, longer
  fallbackSounds.toiletFlush = createFallbackBeep(220, 500); // Even lower, longest
  fallbackSounds.levelComplete = createFallbackBeep(880, 400); // Highest pitch for completion
  
  // Add event listener to check sound availability after a delay
  setTimeout(() => {
    console.log('Checking sound availability status:');
    for (const soundId in loadedSounds) {
      if (!isSoundAvailable(soundId)) {
        console.warn(`${soundId}: NOT AVAILABLE - will use fallback beep`);
      } else {
        console.log(`${soundId}: Available`);
      }
    }
  }, 1000);
}; 