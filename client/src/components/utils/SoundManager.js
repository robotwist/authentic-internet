/**
 * SoundManager.js
 * A utility for managing game sounds and music
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = {};
    this.currentMusic = null;
    this.isMuted = false;
    this.soundVolume = 0.5;
    this.musicVolume = 0.3;
    this.initialized = false;
    this.audioContext = null;
  }

  /**
   * Initialize the sound manager
   * @returns {Promise} - Promise that resolves when all sounds are loaded
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // List of sounds to load
      const soundsToLoad = [
        ['bump', '/assets/sounds/bump.mp3'],
        ['portal', '/assets/sounds/portal.mp3'],
        ['level_complete', '/assets/sounds/level-complete.mp3'],
        ['pickup', '/assets/sounds/pickup.mp3'],
        ['artifact_create', '/assets/sounds/artifact-pickup.mp3'], // Map to existing sound
        ['error', '/assets/sounds/bump.mp3'], // Map to existing sound
        ['page_turn', '/assets/sounds/page-turn.mp3']
      ];

      // Only try to load sounds that exist
      const promises = soundsToLoad.map(([name, path]) => this.loadSound(name, path));
      await Promise.all(promises.filter(p => p)); // Filter out any null promises

      // Initialize with default sounds for any that are missing
      if (!this.sounds['error']) {
        console.log('Creating fallback for error sound');
        this.sounds['error'] = this.sounds['bump'];
      }

      if (!this.sounds['artifact_create']) {
        console.log('Creating fallback for artifact_create sound');
        this.sounds['artifact_create'] = this.sounds['pickup'] || this.sounds['bump'];
      }

      // Load music if available
      try {
        await Promise.all([
          this.loadMusic('overworld', '/assets/music/overworldTheme.mp3'),
          this.loadMusic('yosemite', '/assets/music/yosemiteTheme.mp3')
        ]);
      } catch (musicError) {
        console.warn('Some music tracks could not be loaded:', musicError);
      }

      this.initialized = true;
      console.log('✅ SoundManager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SoundManager:', error);
      // Still mark as initialized to prevent repeated attempts
      this.initialized = true;
    }

    return this;
  }
  
  /**
   * Load a sound effect
   * @param {string} name - Sound identifier
   * @param {string} path - Sound file source
   * @returns {Promise} - Promise that resolves when the sound is loaded
   */
  async loadSound(name, path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds[name] = audioBuffer;
      console.log(`✅ Loaded sound: ${name}`);
    } catch (error) {
      console.error(`❌ Error loading sound ${name}:`, error);
      // Resolve the promise even if the sound fails to load
      this.sounds[name] = null;
    }
  }
  
  /**
   * Load background music
   * @param {string} name - Music identifier
   * @param {string} path - Music file source
   * @returns {Promise} - Promise that resolves when the music is loaded
   */
  async loadMusic(name, path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load music: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.music[name] = audioBuffer;
      console.log(`✅ Loaded music: ${name}`);
    } catch (error) {
      console.error(`❌ Error loading music ${name}:`, error);
      // Resolve the promise even if the music fails to load
      this.music[name] = null;
    }
  }
  
  /**
   * Play a sound effect
   * @param {string} name - Sound identifier
   * @param {number} volume - Optional volume override
   */
  playSound(name, volume = 1) {
    if (this.isMuted || !this.sounds[name]) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds[name];
      gainNode.gain.value = volume * this.soundVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      console.log(`🔊 Playing sound: ${name}`);
    } catch (error) {
      console.error(`❌ Error playing sound ${name}:`, error);
    }
  }
  
  /**
   * Play background music
   * @param {string} name - Music identifier
   * @param {boolean} loop - Whether to loop the music
   * @param {number} volume - Optional volume override
   */
  playMusic(name, loop = false, volume = 1) {
    if (this.isMuted || !this.music[name]) return;

    try {
      // Stop current music if playing
      if (this.currentMusic) {
        this.currentMusic.stop();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.music[name];
      source.loop = loop;
      gainNode.gain.value = volume * this.musicVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      this.currentMusic = source;
      console.log(`🎵 Playing music: ${name}${loop ? ' (looped)' : ''}`);
    } catch (error) {
      console.error(`❌ Error playing music ${name}:`, error);
    }
  }
  
  /**
   * Stop current background music
   * @param {boolean} fadeOut - Whether to fade out the music
   */
  stopMusic(fadeOut = false) {
    if (!this.currentMusic) return;

    try {
      if (fadeOut) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        this.currentMusic.connect(gainNode);
      }
      
      this.currentMusic.stop();
      this.currentMusic = null;
      console.log('🛑 Stopped music');
    } catch (error) {
      console.error('❌ Error stopping music:', error);
    }
  }
  
  /**
   * Set sound effect volume
   * @param {number} volume - Volume level (0-1)
   */
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Sound volume set to: ${this.soundVolume}`);
  }
  
  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.musicVolume;
      this.currentMusic.connect(gainNode);
    }
    console.log(`🎵 Music volume set to: ${this.musicVolume}`);
  }
  
  /**
   * Set muted state
   * @param {boolean} muted - Whether to mute all sounds
   */
  setMute(muted) {
    this.isMuted = muted;
    if (muted && this.currentMusic) {
      this.stopMusic();
    }
    console.log(`🔇 Sound ${muted ? 'muted' : 'unmuted'}`);
  }
  
  /**
   * Toggle muted state
   */
  toggleMute() {
    this.setMute(!this.isMuted);
  }
  
  /**
   * Get singleton instance
   * @returns {SoundManager} - Sound manager instance
   */
  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
}

export default SoundManager; 