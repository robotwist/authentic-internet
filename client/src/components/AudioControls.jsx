import React, { useState, useEffect, useCallback } from "react";
import {
  setMasterVolume,
  toggleMusic,
  getMusicConfig,
} from "../utils/musicMixer";
import "../styles/AudioControls.css";

/**
 * AudioControls Component
 *
 * Provides a user interface for controlling game audio settings:
 * - Music volume
 * - Sound effects volume
 * - Music on/off
 * - Sound effects on/off
 */
const AudioControls = ({ className = "", setEffectsVolume }) => {
  // Get initial music config
  const initialMusicConfig = getMusicConfig();

  // State for audio settings
  const [musicVolume, setMusicVolume] = useState(
    initialMusicConfig.masterVolume,
  );
  const [sfxVolume, setSfxVolume] = useState(0.5); // Default sound effects volume
  const [musicEnabled, setMusicEnabled] = useState(
    initialMusicConfig.musicEnabled,
  );
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Handle music volume change
  const handleMusicVolumeChange = useCallback((e) => {
    const volume = parseFloat(e.target.value);
    setMusicVolume(volume);
    setMasterVolume(volume);
  }, []);

  // Handle sound effects volume change
  const handleSfxVolumeChange = useCallback(
    (e) => {
      const volume = parseFloat(e.target.value);
      setSfxVolume(volume);

      // Update sound effects volume if callback provided
      if (setEffectsVolume) {
        setEffectsVolume(volume);
      }
    },
    [setEffectsVolume],
  );

  // Toggle music on/off
  const handleMusicToggle = useCallback(() => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    toggleMusic(newState);
  }, [musicEnabled]);

  // Toggle sound effects on/off
  const handleSfxToggle = useCallback(() => {
    const newState = !sfxEnabled;
    setSfxEnabled(newState);

    // Update sound effects enabled state if callback provided
    if (setEffectsVolume) {
      setEffectsVolume(newState ? sfxVolume : 0);
    }
  }, [sfxEnabled, sfxVolume, setEffectsVolume]);

  // Toggle control panel open/closed
  const toggleControls = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div
      className={`audio-controls ${className} ${isOpen ? "open" : "closed"}`}
    >
      <button
        className="audio-controls-toggle"
        onClick={toggleControls}
        aria-label={isOpen ? "Close audio controls" : "Open audio controls"}
      >
        <span className="icon">🔊</span>
      </button>

      <div className="audio-controls-panel">
        <h3>Audio Settings</h3>

        <div className="audio-control-group">
          <div className="audio-control-header">
            <label htmlFor="music-volume">Music</label>
            <button
              className={`toggle-button ${musicEnabled ? "on" : "off"}`}
              onClick={handleMusicToggle}
              aria-label={musicEnabled ? "Turn music off" : "Turn music on"}
            >
              {musicEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={handleMusicVolumeChange}
            disabled={!musicEnabled}
          />
          <div className="volume-indicators">
            <span>🔈</span>
            <span>🔊</span>
          </div>
        </div>

        <div className="audio-control-group">
          <div className="audio-control-header">
            <label htmlFor="sfx-volume">Sound Effects</label>
            <button
              className={`toggle-button ${sfxEnabled ? "on" : "off"}`}
              onClick={handleSfxToggle}
              aria-label={
                sfxEnabled ? "Turn sound effects off" : "Turn sound effects on"
              }
            >
              {sfxEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={handleSfxVolumeChange}
            disabled={!sfxEnabled}
          />
          <div className="volume-indicators">
            <span>🔈</span>
            <span>🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
