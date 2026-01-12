/**
 * Enhanced SoundManager.js
 * A robust utility for managing game sounds and music with fallbacks and error handling
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
    this.userInteracted = false;
    this.fallbackSounds = {};
    this.loadingPromises = new Map();
  }

  /**
   * Initialize the sound manager with user interaction detection
   * @returns {Promise} - Promise that resolves when all sounds are loaded
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Set up user interaction detection for autoplay restrictions
      this.setupUserInteractionDetection();

      // List of sounds to load with fallbacks
      const soundsToLoad = [
        // Existing sounds
        ["bump", "/assets/sounds/bump.mp3"],
        ["portal", "/assets/sounds/portal.mp3"],
        ["level_complete", "/assets/sounds/level-complete.mp3"],
        ["pickup", "/assets/sounds/artifact-pickup.mp3"], // Use existing artifact-pickup.mp3
        ["artifact_create", "/assets/sounds/artifact-pickup.mp3"],
        ["error", "/assets/sounds/bump.mp3"], // Use bump as error sound
        ["page_turn", "/assets/sounds/page-turn.mp3"],
        ["discovery", "/assets/sounds/artifact-pickup.mp3"], // Use artifact-pickup for discovery
        ["portal_standard", "/assets/sounds/portal.mp3"], // Use existing portal.mp3
        ["typing", "/assets/sounds/page-turn.mp3"], // Use page-turn for typing
        ["whisper", "/assets/sounds/whisper.mp3"],
        ["digital_transition", "/assets/sounds/digital-transition.mp3"],
        ["toilet_flush", "/assets/sounds/toilet-flush.mp3"],
        ["poof", "/assets/sounds/poof.mp3"],
        ["step", "/assets/sounds/page-turn.mp3"], // Footstep sound (use page-turn as fallback)

        // Combat sounds (Zelda-style)
        ["sword", "/assets/sounds/combat/sword.mp3"],
        ["sword_beam", "/assets/sounds/combat/sword_beam.mp3"],
        ["damage", "/assets/sounds/combat/damage.mp3"],
        ["heal", "/assets/sounds/combat/heal.mp3"],
        ["rupee", "/assets/sounds/combat/rupee.mp3"],
        ["key", "/assets/sounds/combat/key.mp3"],
        ["enemy_hit", "/assets/sounds/combat/enemy_hit.mp3"],
        ["enemy_defeat", "/assets/sounds/combat/enemy_defeat.mp3"],
        ["gameover", "/assets/sounds/combat/gameover.mp3"],
        ["heart", "/assets/sounds/combat/heart.mp3"],
      ];

      // Load sounds with fallback strategy
      const loadPromises = soundsToLoad.map(([name, path]) =>
        this.loadSoundWithFallback(name, path),
      );

      await Promise.allSettled(loadPromises);

      // Create fallback sounds for any that failed to load
      this.createFallbackSounds();

      // Load music if available
      try {
        await Promise.allSettled([
          this.loadMusicWithFallback(
            "overworld",
            "/assets/music/overworldTheme.mp3",
          ),
          this.loadMusicWithFallback(
            "yosemite",
            "/assets/music/yosemiteTheme.mp3",
          ),
          this.loadMusicWithFallback(
            "terminal",
            "/assets/music/terminalTheme.mp3",
          ),
          this.loadMusicWithFallback(
            "textAdventure",
            "/assets/music/textAdventureTheme.mp3",
          ),
          this.loadMusicWithFallback(
            "hemingway",
            "/assets/music/hemingwayTheme.mp3",
          ),
        ]);
      } catch (musicError) {
        console.warn("Some music tracks could not be loaded:", musicError);
      }

      this.initialized = true;
      console.log("✅ SoundManager initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing SoundManager:", error);
      // Still mark as initialized to prevent repeated attempts
      this.initialized = true;
    }

    return this;
  }

  /**
   * Set up user interaction detection for autoplay restrictions
   */
  setupUserInteractionDetection() {
    const interactionEvents = ["click", "touchstart", "keydown", "mousedown"];

    const handleUserInteraction = () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        console.log("🔊 User interaction detected - audio enabled");

        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }

        // Remove event listeners after first interaction
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleUserInteraction, true);
        });
      }
    };

    interactionEvents.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, true);
    });
  }

  /**
   * Load a sound with fallback strategy
   * @param {string} name - Sound identifier
   * @param {string} path - Sound file source
   * @returns {Promise} - Promise that resolves when the sound is loaded
   */
  async loadSoundWithFallback(name, path) {
    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const loadPromise = this.loadSound(name, path);
    this.loadingPromises.set(name, loadPromise);

    try {
      await loadPromise;
      console.log(`✅ Loaded sound: ${name}`);
    } catch (error) {
      console.warn(`⚠️ Failed to load sound ${name}:`, error);
      // Don't throw - let the fallback system handle it
    }

    return loadPromise;
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
    } catch (error) {
      console.error(`❌ Error loading sound ${name}:`, error);
      this.sounds[name] = null;
      throw error;
    }
  }

  /**
   * Load music with fallback strategy
   * @param {string} name - Music identifier
   * @param {string} path - Music file source
   * @returns {Promise} - Promise that resolves when the music is loaded
   */
  async loadMusicWithFallback(name, path) {
    try {
      await this.loadMusic(name, path);
    } catch (error) {
      console.warn(`⚠️ Failed to load music ${name}:`, error);
      this.music[name] = null;
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
      this.music[name] = null;
      throw error;
    }
  }

  /**
   * Create fallback sounds for missing audio files
   */
  createFallbackSounds() {
    // Create a simple beep sound as fallback
    const createBeep = (frequency = 440, duration = 0.1) => {
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(
        1,
        sampleRate * duration,
        sampleRate,
      );
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.3;
      }

      return buffer;
    };

    // Create fallbacks for missing sounds
    const missingSounds = [
      "pickup",
      "portal_standard",
      "typing",
      "whisper",
      "digital_transition",
      "toilet_flush",
      "discovery",
    ];

    missingSounds.forEach((soundName) => {
      if (!this.sounds[soundName]) {
        // Create different beep frequencies for different sounds
        let frequency = 440;
        let duration = 0.1;

        switch (soundName) {
          case "pickup":
          case "discovery":
            frequency = 800; // Higher pitch for pickup
            break;
          case "portal_standard":
          case "digital_transition":
            frequency = 200; // Lower pitch for portals
            duration = 0.3;
            break;
          case "typing":
            frequency = 600; // Medium pitch for typing
            duration = 0.05;
            break;
          case "whisper":
            frequency = 300; // Low pitch for whisper
            duration = 0.2;
            break;
          case "toilet_flush":
            frequency = 150; // Very low pitch for toilet
            duration = 0.5;
            break;
        }

        this.sounds[soundName] = createBeep(frequency, duration);
        console.log(`🔧 Created fallback sound: ${soundName}`);
      }
    });
  }

  /**
   * Play a sound effect with user interaction check
   * @param {string} name - Sound identifier
   * @param {number} volume - Optional volume override
   */
  playSound(name, volume = 1) {
    if (this.isMuted) return;

    // Check if user has interacted (required for autoplay)
    if (!this.userInteracted) {
      console.log(`🔇 Sound ${name} blocked - waiting for user interaction`);
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    try {
      // Get the sound (with intelligent fallback)
      let soundToPlay = this.sounds[name];

      // Use fallback if sound doesn't exist
      if (!soundToPlay) {
        // Smart fallbacks for combat sounds
        const fallbackMap = {
          sword: "portal",
          sword_beam: "portal",
          damage: "bump",
          enemy_hit: "bump",
          enemy_defeat: "poof",
          heal: "pickup",
          heart: "pickup",
          rupee: "pickup",
          key: "pickup",
          gameover: "bump",
        };

        const fallbackName = fallbackMap[name];
        if (fallbackName && this.sounds[fallbackName]) {
          soundToPlay = this.sounds[fallbackName];
          console.log(`🔄 Using ${fallbackName} sound as fallback for ${name}`);
        } else if (this.sounds["bump"]) {
          soundToPlay = this.sounds["bump"];
          console.log(`🔄 Using bump sound as fallback for ${name}`);
        } else {
          console.warn(`⚠️ No sound available for ${name}`);
          return;
        }
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = soundToPlay;
      gainNode.gain.value = volume * this.soundVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Clean up nodes when sound finishes to prevent memory leaks
      source.onended = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Ignore errors if already disconnected
        }
      };

      source.start(0);
      console.log(`🔊 Playing sound: ${name}`);
    } catch (error) {
      console.error(`❌ Error playing sound ${name}:`, error);
    }
  }

  /**
   * Play background music with user interaction check
   * @param {string} name - Music identifier
   * @param {boolean} loop - Whether to loop the music
   * @param {number} volume - Optional volume override
   */
  playMusic(name, loop = false, volume = 1) {
    if (this.isMuted) return;

    // Check if user has interacted (required for autoplay)
    if (!this.userInteracted) {
      console.log(`🔇 Music ${name} blocked - waiting for user interaction`);
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    try {
      // Stop current music if playing
      if (this.currentMusic) {
        this.stopMusic(false);
      }

      // Get the music (with fallback)
      let musicToPlay = this.music[name];

      // Use fallback if music doesn't exist
      if (!musicToPlay) {
        if (this.music["overworld"]) {
          musicToPlay = this.music["overworld"];
          console.log(`🔄 Using overworld music as fallback for ${name}`);
        } else {
          console.warn(`⚠️ No music available for ${name}`);
          return;
        }
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = musicToPlay;
      source.loop = loop;
      gainNode.gain.value = volume * this.musicVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Store both source and gainNode for proper cleanup
      this.currentMusic = { source, gainNode, name };

      source.start(0);
      console.log(`🎵 Playing music: ${name}${loop ? " (looped)" : ""}`);
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
      const { source, gainNode } = this.currentMusic;

      if (fadeOut) {
        // Use existing gainNode for fade-out
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(
          gainNode.gain.value,
          this.audioContext.currentTime,
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          this.audioContext.currentTime + 1,
        );

        // Stop after fade and clean up
        source.onended = () => {
          this.cleanupMusicNodes(source, gainNode);
        };

        setTimeout(() => {
          if (this.currentMusic && this.currentMusic.source === source) {
            try {
              source.stop();
            } catch (error) {
              // Source may have already stopped
            }
            this.cleanupMusicNodes(source, gainNode);
          }
        }, 1000);
      } else {
        try {
          source.stop();
        } catch (error) {
          // Source may have already stopped
        }
        this.cleanupMusicNodes(source, gainNode);
      }
      console.log("🛑 Stopped music");
    } catch (error) {
      console.error("❌ Error stopping music:", error);
      // Ensure cleanup happens even on error
      if (this.currentMusic) {
        this.currentMusic = null;
      }
    }
  }

  /**
   * Clean up music source and gain nodes
   * @private
   */
  cleanupMusicNodes(source, gainNode) {
    try {
      source.disconnect();
      gainNode.disconnect();
    } catch (error) {
      // Ignore errors if already disconnected
    }
    // Clear currentMusic if this is the active track
    if (this.currentMusic && this.currentMusic.source === source) {
      this.currentMusic = null;
    }
  }

  /**
   * Set sound effects volume
   * @param {number} volume - Volume level (0-1)
   */
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle mute state
   * @param {boolean} muted - Whether to mute
   */
  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.currentMusic) {
      this.stopMusic();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this.currentMusic) {
      try {
        this.currentMusic.source.stop();
      } catch (error) {
        // Source may have already stopped
      }
      this.cleanupMusicNodes(this.currentMusic.source, this.currentMusic.gainNode);
      this.currentMusic = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.sounds = {};
    this.music = {};
    this.initialized = false;
  }
}

export default SoundManager;
