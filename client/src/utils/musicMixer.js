/**
 * Music Mixer System
 * 
 * Advanced music system for managing background music with crossfading,
 * dynamic music changes based on game state, and adaptive volume control.
 */

import SoundManager from '../components/utils/SoundManager';

// Audio context for all music operations
let audioContext;
// Master volume node
let masterGainNode;
// Currently active music tracks
const activeTracks = {};
// Music configuration
const musicConfig = {
  defaultFadeTime: 1.0,
  defaultVolume: 0.3,
  tracks: {
    'overworld': {
      path: '/assets/music/overworldTheme.mp3',
      volume: 0.3
    },
    'yosemite': {
      path: '/assets/music/yosemiteTheme.mp3',
      volume: 0.3
    },
    'terminal': {
      path: '/assets/music/terminalTheme.mp3',
      volume: 0.3
    },
    'textAdventure': {
      path: '/assets/music/textAdventureTheme.mp3',
      volume: 0.3
    },
    'hemingway': {
      path: '/assets/music/hemingwayTheme.mp3',
      volume: 0.3
    }
  }
};

// Music tracks storage
const musicTracks = {};

// Initialize SoundManager
let soundManager = null;

const initSoundManager = async () => {
  if (!soundManager) {
    soundManager = SoundManager.getInstance();
    await soundManager.initialize();
  }
  return soundManager;
};

/**
 * Initialize the music mixer system
 */
export const initMusicMixer = () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = musicConfig.defaultVolume;
    masterGainNode.connect(audioContext.destination);
    
    console.log('🎵 Music mixer initialized successfully');
    
    // Load all music tracks in the background
    preloadAllMusic();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize music mixer:', error);
    return false;
  }
};

/**
 * Preload all music tracks for faster playback
 */
const preloadAllMusic = () => {
  const tracks = Object.values(musicConfig.tracks);
  console.log(`🎵 Preloading ${tracks.length} music tracks...`);
  
  tracks.forEach(track => {
    preloadMusic(track.path);
  });
};

/**
 * Preload a specific music track
 * @param {string} trackId - The ID of the track to preload
 * @param {string} path - Optional path override
 */
export const preloadMusic = (trackId, path) => {
  const trackPath = path || `/assets/music/${trackId}.mp3`;
  
  // Skip if already preloaded
  if (musicTracks[trackId] && musicTracks[trackId].buffer) {
    console.log(`🎵 Music track ${trackId} already preloaded`);
    return Promise.resolve(musicTracks[trackId]);
  }
  
  console.log(`🎵 Preloading music track: ${trackId} from ${trackPath}`);
  
  // Initialize the track object
  musicTracks[trackId] = {
    id: trackId,
    path: trackPath,
    loaded: false,
    error: null,
    buffer: null
  };
  
  // Fetch and decode the audio data
  return fetch(trackPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load music track ${trackId}: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      musicTracks[trackId].buffer = audioBuffer;
      musicTracks[trackId].loaded = true;
      musicTracks[trackId].duration = audioBuffer.duration;
      console.log(`🎵 Music track loaded: ${trackId} (${audioBuffer.duration.toFixed(1)}s)`);
      return musicTracks[trackId];
    })
    .catch(error => {
      console.error(`Failed to load music track ${trackId}:`, error);
      musicTracks[trackId].error = error.message;
      return null;
    });
};

// Play music with options
export const playMusic = async (trackId, options = {}) => {
  const manager = await initSoundManager();
  const track = musicConfig.tracks[trackId];
  
  if (!track) {
    console.error(`Track not found: ${trackId}`);
    return;
  }

  const volume = options.volume || track.volume || musicConfig.defaultVolume;
  const loop = options.loop !== undefined ? options.loop : true;
  
  manager.playMusic(trackId, loop, volume);
};

// Stop music with fade out
export const stopMusic = async (trackId, fadeTime = musicConfig.defaultFadeTime) => {
  const manager = await initSoundManager();
  manager.stopMusic(true);
};

/**
 * Play music for specific world
 * @param {string} worldName - The name of the world/theme
 */
export const playMusicForWorld = async (worldName) => {
  const trackId = worldName.toLowerCase().replace(/\s+/g, '');
  const track = musicConfig.tracks[trackId];
  
  if (!track) {
    console.error(`No music track found for world: ${worldName}`);
    return;
  }

  return playMusic(trackId, {
    volume: track.volume,
    loop: true
  });
};

/**
 * Set the master volume for all music
 * @param {number} volume - Volume level (0-1)
 */
export const setMasterVolume = (volume) => {
  // Clamp volume between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  console.log(`🎵 Setting master volume to ${clampedVolume}`);
  
  musicConfig.defaultVolume = clampedVolume;
  
  if (masterGainNode) {
    masterGainNode.gain.value = clampedVolume;
  }
};

/**
 * Toggle music on/off
 * @param {boolean} enabled - Whether music should be enabled
 */
export const toggleMusic = (enabled) => {
  const newState = enabled !== undefined ? enabled : !musicConfig.musicEnabled;
  
  console.log(`🎵 ${newState ? 'Enabling' : 'Disabling'} music`);
  
  musicConfig.musicEnabled = newState;
  
  if (!newState) {
    stopAllMusic(1.0); // Quick fade out when disabling
  }
  
  return newState;
};

/**
 * Stop all currently playing music tracks
 * @param {number} fadeTime - Fade-out time in seconds
 */
export const stopAllMusic = (fadeTime = musicConfig.defaultFadeTime) => {
  const trackIds = Object.keys(activeTracks);
  
  if (trackIds.length === 0) {
    return;
  }
  
  console.log(`🎵 Stopping all music (${trackIds.length} tracks, fade: ${fadeTime}s)`);
  
  trackIds.forEach(trackId => {
    stopMusic(trackId, fadeTime);
  });
};

/**
 * Apply a filter effect to currently playing music
 * @param {string} filterType - Type of filter ('lowpass', 'highpass', etc.)
 * @param {Object} options - Filter options
 */
export const applyMusicFilter = (filterType, options = {}) => {
  const trackIds = Object.keys(activeTracks);
  
  if (trackIds.length === 0) {
    console.log('🎵 No active tracks to apply filter to');
    return;
  }
  
  console.log(`🎵 Applying ${filterType} filter to music`);
  
  trackIds.forEach(trackId => {
    const track = activeTracks[trackId];
    
    try {
      // Create filter if it doesn't exist
      if (!track.filter) {
        track.filter = audioContext.createBiquadFilter();
        
        // Reconnect nodes with filter in the chain
        track.source.disconnect();
        track.source.connect(track.filter);
        track.filter.connect(track.gainNode);
      }
      
      // Set filter properties
      track.filter.type = filterType;
      
      if (options.frequency !== undefined) {
        track.filter.frequency.value = options.frequency;
      }
      
      if (options.Q !== undefined) {
        track.filter.Q.value = options.Q;
      }
      
      if (options.gain !== undefined) {
        track.filter.gain.value = options.gain;
      }
    } catch (error) {
      console.error(`Error applying filter to track ${trackId}:`, error);
    }
  });
};

/**
 * Remove filter effects from music
 */
export const removeMusicFilter = () => {
  const trackIds = Object.keys(activeTracks);
  
  if (trackIds.length === 0) {
    return;
  }
  
  console.log('🎵 Removing filters from music');
  
  trackIds.forEach(trackId => {
    const track = activeTracks[trackId];
    
    if (track.filter) {
      try {
        // Reconnect without the filter
        track.source.disconnect();
        track.filter.disconnect();
        track.source.connect(track.gainNode);
        track.filter = null;
      } catch (error) {
        console.error(`Error removing filter from track ${trackId}:`, error);
      }
    }
  });
};

/**
 * Create an audio analyzer for visualizations
 * @returns {Object} The analyzer node and methods for accessing data
 */
export const createMusicAnalyzer = () => {
  if (!audioContext) {
    console.warn('🎵 Cannot create analyzer - audio context not initialized');
    return null;
  }
  
  try {
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    
    // Connect the analyzer to the master output
    masterGainNode.connect(analyzer);
    
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    return {
      analyzer,
      getFrequencyData: () => {
        analyzer.getByteFrequencyData(dataArray);
        return dataArray;
      },
      getTimeData: () => {
        analyzer.getByteTimeDomainData(dataArray);
        return dataArray;
      },
      bufferLength
    };
  } catch (error) {
    console.error('Error creating music analyzer:', error);
    return null;
  }
};

// Export the music config for reference
export const getMusicConfig = () => ({...musicConfig}); 