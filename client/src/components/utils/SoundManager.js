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
  }

  /**
   * Initialize the sound manager
   * @returns {Promise} - Promise that resolves when all sounds are loaded
   */
  initialize() {
    if (this.initialized) return Promise.resolve();
    
    const soundsToLoad = [
      // Shooter game sounds
      { id: 'player_shoot', src: '/assets/sounds/player_shoot.mp3' },
      { id: 'player_jump', src: '/assets/sounds/player_jump.mp3' },
      { id: 'player_hit', src: '/assets/sounds/player_hit.mp3' },
      { id: 'player_death', src: '/assets/sounds/player_death.mp3' },
      { id: 'enemy_hit', src: '/assets/sounds/enemy_hit.mp3' },
      { id: 'enemy_death', src: '/assets/sounds/enemy_death.mp3' },
      { id: 'boss_hit', src: '/assets/sounds/boss_hit.mp3' },
      { id: 'boss_death', src: '/assets/sounds/boss_death.mp3' },
      { id: 'item_pickup', src: '/assets/sounds/item_pickup.mp3' },
      { id: 'level_up', src: '/assets/sounds/level_up.mp3' },
      { id: 'game_over', src: '/assets/sounds/game_over.mp3' },
      { id: 'victory', src: '/assets/sounds/victory.mp3' },
      
      // Overworld sounds
      { id: 'portal', src: '/assets/sounds/portal.mp3' },
      { id: 'npc_talk', src: '/assets/sounds/npc_talk.mp3' },
      { id: 'footstep', src: '/assets/sounds/footstep.mp3' },
      { id: 'bump', src: '/assets/sounds/bump.mp3' },
      { id: 'collect', src: '/assets/sounds/collect.mp3' },
      { id: 'error', src: '/assets/sounds/error.mp3' },
      { id: 'unlock', src: '/assets/sounds/unlock.mp3' },
      { id: 'water_splash', src: '/assets/sounds/water_splash.mp3' }
    ];
    
    const musicToLoad = [
      { id: 'shooter_paris', src: '/assets/music/paris_theme.mp3' },
      { id: 'shooter_spain', src: '/assets/music/spain_theme.mp3' },
      { id: 'shooter_africa', src: '/assets/music/africa_theme.mp3' },
      { id: 'overworld_1', src: '/assets/music/overworld_theme.mp3' },
      { id: 'overworld_2', src: '/assets/music/overworld_2_theme.mp3' },
      { id: 'desert', src: '/assets/music/desert_theme.mp3' },
      { id: 'dungeon', src: '/assets/music/dungeon_theme.mp3' },
      { id: 'yosemite', src: '/assets/music/yosemite_theme.mp3' }
    ];
    
    const soundPromises = soundsToLoad.map(sound => this.loadSound(sound.id, sound.src));
    const musicPromises = musicToLoad.map(music => this.loadMusic(music.id, music.src));
    
    return Promise.all([...soundPromises, ...musicPromises])
      .then(() => {
        this.initialized = true;
        console.log('Sound manager initialized successfully');
        return true;
      })
      .catch(error => {
        console.error('Failed to initialize sound manager:', error);
        return false;
      });
  }
  
  /**
   * Load a sound effect
   * @param {string} id - Sound identifier
   * @param {string} src - Sound file source
   * @returns {Promise} - Promise that resolves when the sound is loaded
   */
  loadSound(id, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      
      audio.oncanplaythrough = () => {
        this.sounds[id] = audio;
        resolve();
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${src}`);
        // Resolve anyway to prevent blocking other sounds
        resolve();
      };
      
      // Force load
      audio.load();
    });
  }
  
  /**
   * Load music track
   * @param {string} id - Music identifier
   * @param {string} src - Music file source
   * @returns {Promise} - Promise that resolves when the music is loaded
   */
  loadMusic(id, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      audio.loop = true;
      
      audio.oncanplaythrough = () => {
        this.music[id] = audio;
        resolve();
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load music: ${src}`);
        // Resolve anyway to prevent blocking
        resolve();
      };
      
      // Force load
      audio.load();
    });
  }
  
  /**
   * Play a sound effect
   * @param {string} id - Sound identifier
   * @param {number} volume - Optional volume override (0.0 to 1.0)
   * @returns {HTMLAudioElement|null} - The audio element or null if sound not found
   */
  playSound(id, volume = null) {
    if (this.isMuted) return null;
    if (!this.sounds[id]) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }
    
    try {
      // Clone the audio to allow overlapping sounds
      const sound = this.sounds[id].cloneNode();
      sound.volume = volume !== null ? volume : this.soundVolume;
      
      // Handle playback promise (for browsers that return a promise)
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Error playing sound ${id}:`, error);
        });
      }
      
      return sound;
    } catch (error) {
      console.error(`Error playing sound ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Play a music track
   * @param {string} id - Music identifier
   * @param {boolean} fadeIn - Whether to fade in the music
   * @param {number} fadeInDuration - Fade in duration in milliseconds
   */
  playMusic(id, fadeIn = false, fadeInDuration = 1000) {
    if (!this.music[id]) {
      console.warn(`Music not found: ${id}`);
      return;
    }
    
    // Stop current music if playing
    this.stopMusic();
    
    try {
      const music = this.music[id];
      this.currentMusic = music;
      
      if (this.isMuted) {
        music.volume = 0;
      } else if (fadeIn) {
        music.volume = 0;
        music.play();
        
        // Fade in the volume
        let startTime = Date.now();
        const fadeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const ratio = Math.min(elapsed / fadeInDuration, 1);
          music.volume = this.musicVolume * ratio;
          
          if (ratio >= 1) {
            clearInterval(fadeInterval);
          }
        }, 50);
      } else {
        music.volume = this.musicVolume;
        music.play();
      }
    } catch (error) {
      console.error(`Error playing music ${id}:`, error);
    }
  }
  
  /**
   * Stop the currently playing music
   * @param {boolean} fadeOut - Whether to fade out the music
   * @param {number} fadeOutDuration - Fade out duration in milliseconds
   */
  stopMusic(fadeOut = false, fadeOutDuration = 1000) {
    if (!this.currentMusic) return;
    
    try {
      if (fadeOut) {
        const music = this.currentMusic;
        const startVolume = music.volume;
        const startTime = Date.now();
        
        const fadeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const ratio = Math.min(elapsed / fadeOutDuration, 1);
          music.volume = startVolume * (1 - ratio);
          
          if (ratio >= 1) {
            clearInterval(fadeInterval);
            music.pause();
            music.currentTime = 0;
          }
        }, 50);
      } else {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }
    } catch (error) {
      console.error('Error stopping music:', error);
    }
    
    this.currentMusic = null;
  }
  
  /**
   * Set the master volume for all sounds
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Set the master volume for music
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.currentMusic && !this.isMuted) {
      this.currentMusic.volume = this.musicVolume;
    }
  }
  
  /**
   * Mute or unmute all sounds
   * @param {boolean} muted - True to mute, false to unmute
   */
  setMuted(muted) {
    this.isMuted = muted;
    
    if (this.currentMusic) {
      this.currentMusic.volume = muted ? 0 : this.musicVolume;
    }
  }
  
  /**
   * Toggle mute state
   * @returns {boolean} - The new mute state
   */
  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
  
  /**
   * Create a singleton instance
   * @returns {SoundManager} - Singleton sound manager instance
   */
  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
}

// Create a singleton instance
const soundManager = SoundManager.getInstance();

export default soundManager; 