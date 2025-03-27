/**
 * Music Mixer System
 * 
 * Advanced music system for managing background music with crossfading,
 * dynamic music changes based on game state, and adaptive volume control.
 */

// Audio context for all music operations
let audioContext;
// Master volume node
let masterGainNode;
// Currently active music tracks
const activeTracks = {};
// Music configuration
const musicConfig = {
  defaultFadeTime: 2.0, // Default fade time in seconds
  masterVolume: 0.5,    // Master volume (0-1)
  musicEnabled: true,   // Whether music is enabled
  currentWorld: null,   // Current world/theme
  worldMusicMap: {      // Map of worlds to music tracks
    'Overworld': 'overworldTheme',
    'Yosemite': 'yosemiteTheme',
    'Terminal': 'terminalTheme',
    'Hemingway': 'hemingwayTheme',
    'TextAdventure': 'textAdventureTheme'
  },
  // Volume levels for different tracks
  trackVolumes: {
    'overworldTheme': 0.5,
    'yosemiteTheme': 0.6,
    'terminalTheme': 0.4,
    'hemingwayTheme': 0.5,
    'textAdventureTheme': 0.5
  }
};

// Music tracks storage
const musicTracks = {};

/**
 * Initialize the music mixer system
 */
export const initMusicMixer = () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = musicConfig.masterVolume;
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
  const tracks = Object.values(musicConfig.worldMusicMap);
  console.log(`🎵 Preloading ${tracks.length} music tracks...`);
  
  tracks.forEach(trackId => {
    preloadMusic(trackId);
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

/**
 * Play a music track with optional crossfade
 * @param {string} trackId - The ID of the track to play
 * @param {Object} options - Playback options
 */
export const playMusic = (trackId, options = {}) => {
  if (!musicConfig.musicEnabled) {
    console.log('🎵 Music is disabled, not playing:', trackId);
    return null;
  }
  
  const opts = {
    volume: musicConfig.trackVolumes[trackId] || 0.5,
    fadeIn: options.fadeIn ?? musicConfig.defaultFadeTime,
    fadeOut: options.fadeOut ?? musicConfig.defaultFadeTime,
    loop: options.loop !== undefined ? options.loop : true,
    stopOthers: options.stopOthers !== undefined ? options.stopOthers : true,
    startTime: options.startTime || 0
  };
  
  console.log(`🎵 Playing music: ${trackId} (vol: ${opts.volume}, fade: ${opts.fadeIn}s)`);
  
  try {
    // Ensure audio context is running (may be suspended due to browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Make sure the track is loaded
    if (!musicTracks[trackId] || !musicTracks[trackId].buffer) {
      console.warn(`🎵 Music track ${trackId} not loaded yet, loading now...`);
      return preloadMusic(trackId).then(track => {
        if (track) {
          return playMusic(trackId, options);
        } else {
          console.error(`🎵 Failed to load music track ${trackId}`);
          return null;
        }
      });
    }
    
    // Stop other tracks if specified
    if (opts.stopOthers) {
      stopAllMusic(opts.fadeOut);
    }
    
    // Create audio nodes
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = musicTracks[trackId].buffer;
    source.loop = opts.loop;
    
    // Connect the nodes
    source.connect(gainNode);
    gainNode.connect(masterGainNode);
    
    // Set initial gain to 0 for fade-in
    gainNode.gain.value = 0;
    
    // Start playback
    const startTime = audioContext.currentTime;
    source.start(startTime, opts.startTime);
    
    // Fade in
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(opts.volume, startTime + opts.fadeIn);
    
    // Store the active track info
    activeTracks[trackId] = {
      source,
      gainNode,
      startTime,
      trackId,
      volume: opts.volume
    };
    
    // Set up event handler for when the track ends (if not looping)
    if (!opts.loop) {
      source.onended = () => {
        console.log(`🎵 Music track ended: ${trackId}`);
        delete activeTracks[trackId];
      };
    }
    
    return activeTracks[trackId];
  } catch (error) {
    console.error(`Failed to play music track ${trackId}:`, error);
    return null;
  }
};

/**
 * Stop a specific music track with optional fade-out
 * @param {string} trackId - The ID of the track to stop
 * @param {number} fadeTime - Fade-out time in seconds
 */
export const stopMusic = (trackId, fadeTime = musicConfig.defaultFadeTime) => {
  const track = activeTracks[trackId];
  
  if (!track) {
    console.log(`🎵 No active track found for ${trackId}`);
    return;
  }
  
  console.log(`🎵 Stopping music: ${trackId} (fade: ${fadeTime}s)`);
  
  try {
    const now = audioContext.currentTime;
    const { gainNode, source } = track;
    
    // Start fade out
    gainNode.gain.setValueAtTime(track.volume, now);
    gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
    
    // Schedule the source to stop after fade
    setTimeout(() => {
      try {
        source.stop();
        // Clean up connections
        source.disconnect();
        gainNode.disconnect();
        // Remove from active tracks
        delete activeTracks[trackId];
      } catch (e) {
        console.warn(`Error cleaning up music track ${trackId}:`, e);
      }
    }, fadeTime * 1000);
  } catch (error) {
    console.error(`Error stopping music track ${trackId}:`, error);
    
    // Force cleanup in case of error
    try {
      track.source.stop();
      track.source.disconnect();
      track.gainNode.disconnect();
    } catch (e) {
      // Ignore secondary error
    }
    
    delete activeTracks[trackId];
  }
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
 * Set the master volume for all music
 * @param {number} volume - Volume level (0-1)
 */
export const setMasterVolume = (volume) => {
  // Clamp volume between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  console.log(`🎵 Setting master volume to ${clampedVolume}`);
  
  musicConfig.masterVolume = clampedVolume;
  
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
 * Change music based on the current world/theme
 * @param {string} worldName - The name of the world/theme
 */
export const playMusicForWorld = (worldName) => {
  if (worldName === musicConfig.currentWorld) {
    console.log(`🎵 Already playing music for world: ${worldName}`);
    return;
  }
  
  console.log(`🎵 Changing music for world: ${worldName}`);
  
  const trackId = musicConfig.worldMusicMap[worldName];
  
  if (!trackId) {
    console.warn(`🎵 No music defined for world: ${worldName}`);
    return;
  }
  
  musicConfig.currentWorld = worldName;
  
  // Play the new track with crossfade
  return playMusic(trackId, {
    fadeIn: 2.5,
    fadeOut: 2.0,
    loop: true
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