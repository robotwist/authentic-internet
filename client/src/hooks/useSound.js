import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing sounds in the application
 * Provides functions to play, pause, and control sounds
 * with volume control and caching capabilities
 * 
 * @param {string} src - The source URL of the sound file
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoPlay - Whether to play the sound when loaded
 * @param {number} options.volume - Initial volume (0-1)
 * @param {boolean} options.loop - Whether to loop the sound
 * @returns {Object} Sound control functions and state
 */
const useSound = (src, { autoPlay = false, volume = 1, loop = false } = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  
  // Use refs to maintain instance across renders
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Check if the Web Audio API is available
  const isAudioSupported = typeof window !== 'undefined' && 'Audio' in window;
  
  const initAudio = useCallback(() => {
    if (!isAudioSupported) {
      setError('Audio is not supported in this browser.');
      return;
    }
    
    if (!src) {
      setError('No audio source provided.');
      return;
    }
    
    // Clean up previous instance if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    
    // Create new audio instance
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.loop = loop;
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        setIsLoaded(true);
        setDuration(audio.duration || 0);
        
        if (autoPlay) {
          play();
        }
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        setError(`Failed to load audio: ${e.message || 'Unknown error'}`);
      });
      
      audio.addEventListener('ended', () => {
        if (!loop) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
        }
      });
      
      // Store the audio instance
      audioRef.current = audio;
      
      // Start loading
      audio.load();
      
    } catch (err) {
      console.error('Error initializing audio:', err);
      setError(`Failed to initialize audio: ${err.message || 'Unknown error'}`);
    }
  }, [src, volume, loop, autoPlay, isAudioSupported]);
  
  // Initialize audio when component mounts or source changes
  useEffect(() => {
    initAudio();
    
    // Cleanup when unmounting
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initAudio]);
  
  // Play the sound
  const play = useCallback(() => {
    if (!audioRef.current || !isLoaded) return false;
    
    try {
      // Create a playback promise
      const playPromise = audioRef.current.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            
            // Track current time
            intervalRef.current = setInterval(() => {
              setCurrentTime(audioRef.current?.currentTime || 0);
            }, 100);
          })
          .catch(err => {
            console.error('Playback prevented:', err);
            setError(`Playback was prevented: ${err.message || 'Unknown error'}`);
            setIsPlaying(false);
          });
      } else {
        // Older browsers don't return a promise
        setIsPlaying(true);
      }
      
      return true;
    } catch (err) {
      console.error('Error playing audio:', err);
      setError(`Failed to play audio: ${err.message || 'Unknown error'}`);
      return false;
    }
  }, [isLoaded]);
  
  // Pause the sound
  const pause = useCallback(() => {
    if (!audioRef.current || !isPlaying) return false;
    
    try {
      audioRef.current.pause();
      setIsPlaying(false);
      
      // Stop tracking current time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      return true;
    } catch (err) {
      console.error('Error pausing audio:', err);
      return false;
    }
  }, [isPlaying]);
  
  // Toggle play/pause
  const toggle = useCallback(() => {
    return isPlaying ? pause() : play();
  }, [isPlaying, pause, play]);
  
  // Stop the sound (pause and reset position)
  const stop = useCallback(() => {
    if (!audioRef.current) return false;
    
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Stop tracking current time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      return true;
    } catch (err) {
      console.error('Error stopping audio:', err);
      return false;
    }
  }, []);
  
  // Set volume
  const setVolume = useCallback((newVolume) => {
    if (!audioRef.current) return false;
    
    try {
      // Ensure volume is between 0 and 1
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      audioRef.current.volume = clampedVolume;
      return true;
    } catch (err) {
      console.error('Error setting volume:', err);
      return false;
    }
  }, []);
  
  // Seek to a specific time
  const seek = useCallback((time) => {
    if (!audioRef.current || !isLoaded) return false;
    
    try {
      // Ensure time is within the duration
      const clampedTime = Math.max(0, Math.min(duration, time));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      return true;
    } catch (err) {
      console.error('Error seeking audio:', err);
      return false;
    }
  }, [isLoaded, duration]);
  
  return {
    play,
    pause,
    toggle,
    stop,
    setVolume,
    seek,
    isPlaying,
    isLoaded,
    duration,
    currentTime,
    error
  };
};

export default useSound; 