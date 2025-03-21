// Sound effects utility module

// Track loaded audio elements to avoid reloading
const loadedSounds = {};
// Track if sounds are available/valid
const soundAvailability = {};
// Track background music elements
const backgroundMusic = {};
// Track current background music ID
let currentMusicId = null;

// Single AudioContext instance for all fallback sounds
let fallbackAudioContext = null;

// Define SOUNDS object to store sound configurations
const SOUNDS = {};

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
 * Preload background music for later use
 * @param {string} musicId - Identifier for the music
 * @param {string} path - Path to the music file
 */
export const preloadMusic = (musicId, path) => {
  if (!backgroundMusic[musicId]) {
    const audio = new Audio();
    
    // Set up error handling before setting src
    audio.onerror = () => {
      console.warn(`Music file not available or invalid: ${path}`);
      soundAvailability[musicId] = false;
    };
    
    audio.onloadeddata = () => {
      console.log(`Music loaded successfully: ${musicId}`);
      soundAvailability[musicId] = true;
    };
    
    // Set music to loop by default
    audio.loop = true;
    audio.volume = 0.3; // Default lower volume for background music
    audio.preload = 'auto';
    audio.src = path;
    backgroundMusic[musicId] = audio;
    
    // Force load
    audio.load();
    console.log(`Attempting to preload music: ${musicId}`);
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
 * Play background music
 * @param {string} musicId - Identifier for the music track
 * @param {number} volume - Volume from 0 to 1
 * @param {boolean} fadeIn - Whether to fade in the music
 * @returns {Promise} Resolves when music starts playing
 */
export const playMusic = (musicId, volume = 0.3, fadeIn = true) => {
  return new Promise((resolve, reject) => {
    // Stop current music if different from requested music
    if (currentMusicId && currentMusicId !== musicId) {
      stopMusic(currentMusicId, true);
    }
    
    // Skip playing if we know the music isn't available
    if (soundAvailability[musicId] === false) {
      console.log(`Music not available: ${musicId}`);
      resolve();
      return;
    }
    
    const music = backgroundMusic[musicId];
    if (!music) {
      console.error(`Music not loaded: ${musicId}`);
      resolve();
      return;
    }
    
    // Set as current music track
    currentMusicId = musicId;
    
    // If music is already playing, just adjust volume
    if (!music.paused) {
      if (fadeIn) {
        fadeVolume(music, music.volume, volume, 1000);
      } else {
        music.volume = volume;
      }
      resolve();
      return;
    }
    
    // Set initial volume for fade-in
    if (fadeIn) {
      music.volume = 0;
    } else {
      music.volume = volume;
    }
    
    // Start playing
    music.play().then(() => {
      console.log(`Now playing music: ${musicId}`);
      
      // Fade in if requested
      if (fadeIn) {
        fadeVolume(music, 0, volume, 1000);
      }
      
      resolve();
    }).catch(err => {
      console.warn(`Failed to play music ${musicId}:`, err);
      soundAvailability[musicId] = false;
      resolve(); // Still resolve to prevent game disruption
    });
  });
};

/**
 * Pause currently playing background music
 * @param {string} musicId - Optional identifier for specific music to pause
 * @param {boolean} fadeOut - Whether to fade out before pausing
 * @returns {Promise} Resolves when music is paused
 */
export const pauseMusic = (musicId = null, fadeOut = true) => {
  return new Promise((resolve) => {
    // If musicId is not provided, use current music
    const targetMusicId = musicId || currentMusicId;
    
    if (!targetMusicId) {
      resolve();
      return;
    }
    
    const music = backgroundMusic[targetMusicId];
    if (!music || music.paused) {
      resolve();
      return;
    }
    
    if (fadeOut) {
      fadeVolume(music, music.volume, 0, 500).then(() => {
        music.pause();
        resolve();
      });
    } else {
      music.pause();
      resolve();
    }
  });
};

/**
 * Stop background music and reset it to the beginning
 * @param {string} musicId - Optional identifier for specific music to stop
 * @param {boolean} fadeOut - Whether to fade out before stopping
 * @returns {Promise} Resolves when music is stopped
 */
export const stopMusic = (musicId = null, fadeOut = true) => {
  return new Promise((resolve) => {
    // If musicId is not provided, use current music
    const targetMusicId = musicId || currentMusicId;
    
    if (!targetMusicId) {
      resolve();
      return;
    }
    
    const music = backgroundMusic[targetMusicId];
    if (!music) {
      resolve();
      return;
    }
    
    if (fadeOut && !music.paused) {
      fadeVolume(music, music.volume, 0, 500).then(() => {
        music.pause();
        music.currentTime = 0;
        resolve();
      });
    } else {
      music.pause();
      music.currentTime = 0;
      resolve();
    }
    
    // Clear current music if stopping the active track
    if (targetMusicId === currentMusicId) {
      currentMusicId = null;
    }
  });
};

/**
 * Set the volume of background music
 * @param {string} musicId - Optional identifier for specific music
 * @param {number} volume - Volume from 0 to 1
 * @param {boolean} fade - Whether to fade to the new volume
 */
export const setMusicVolume = (volume, musicId = null, fade = true) => {
  // If musicId is not provided, use current music
  const targetMusicId = musicId || currentMusicId;
  
  if (!targetMusicId) return;
  
  const music = backgroundMusic[targetMusicId];
  if (!music) return;
  
  if (fade) {
    fadeVolume(music, music.volume, volume, 500);
  } else {
    music.volume = volume;
  }
};

/**
 * Helper function to fade volume over time
 * @private
 * @param {HTMLAudioElement} audio - Audio element to fade
 * @param {number} startVolume - Starting volume (0-1)
 * @param {number} endVolume - Target volume (0-1)
 * @param {number} duration - Duration of fade in ms
 * @returns {Promise} Resolves when fade is complete
 */
const fadeVolume = (audio, startVolume, endVolume, duration) => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const volumeDiff = endVolume - startVolume;
    
    // Set initial volume
    audio.volume = startVolume;
    
    const updateVolume = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      audio.volume = startVolume + volumeDiff * progress;
      
      if (progress < 1) {
        requestAnimationFrame(updateVolume);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(updateVolume);
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

// If the bump sound file doesn't exist, we'll create a programmatic bump sound using the Web Audio API
const createBumpSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Function to create a short "bump" sound programmatically
    return () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // Low frequency for "bump"
      oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      
      return new Promise(resolve => {
        setTimeout(resolve, 200);
      });
    };
  } catch (error) {
    console.error("Error creating bump sound:", error);
    return () => Promise.resolve(); // Fallback to silent function
  }
};

// Add the new bump sound to the SOUNDS object
SOUNDS.bump = {
  src: '/assets/sounds/bump.mp3',
  volume: 0.4,
  fallback: createBumpSound()
}; 