/**
 * Enhanced Game State Manager
 * Handles game state persistence, recovery, error handling, and user feedback
 */

const STORAGE_KEY = 'game_state';
const BACKUP_KEY = 'game_state_backup';
const CHECKPOINT_KEY = 'last_checkpoint';

class GameStateManager {
  constructor() {
    this.state = null;
    this.lastSavedState = null;
    this.saveInterval = null;
    this.initialized = false;
    this.lastCheckpoint = null;
    this.toastCallback = null; // Callback for showing toast notifications
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  // Set toast callback for user feedback
  setToastCallback(callback) {
    this.toastCallback = callback;
  }

  // Show toast notification
  showToast(message, type = 'info', duration = 5000) {
    if (this.toastCallback) {
      this.toastCallback(message, type, duration);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  init() {
    if (this.initialized) return;
    
    try {
      // Try to load the main state
      this.state = this.loadState();
      
      // Load last checkpoint
      this.lastCheckpoint = this.loadCheckpoint();
      
      // Set up automatic saving
      this.saveInterval = setInterval(() => this.saveState(), 300000); // Save every 5 minutes
      
      this.initialized = true;
      this.showToast('Game state loaded successfully', 'success', 3000);
    } catch (error) {
      console.error('Failed to initialize game state:', error);
      this.showToast('Failed to load game state', 'error', 5000);
      // Try to recover from backup
      this.recoverFromBackup();
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return this.getInitialState();
      
      const parsedState = JSON.parse(savedState);
      return this.validateState(parsedState) ? parsedState : this.getInitialState();
    } catch (error) {
      console.error('Error loading game state:', error);
      this.showToast('Error loading game state', 'error', 5000);
      return this.getInitialState();
    }
  }

  saveState() {
    try {
      // Create backup of current state before saving new state
      if (this.state) {
        localStorage.setItem(BACKUP_KEY, localStorage.getItem(STORAGE_KEY));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.lastSavedState = {...this.state};
        
        // Show success message only if this was a manual save
        if (this.retryAttempts === 0) {
          this.showToast('Game progress saved', 'success', 2000);
        }
      }
    } catch (error) {
      console.error('Error saving game state:', error);
      this.showToast('Failed to save game progress', 'error', 5000);
      
      // Try to restore last known good state
      if (this.lastSavedState) {
        this.state = {...this.lastSavedState};
      }
      
      // Retry save if we haven't exceeded max attempts
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        this.showToast(`Retrying save... (${this.retryAttempts}/${this.maxRetries})`, 'warning', 3000);
        setTimeout(() => this.saveState(), 2000);
      } else {
        this.showToast('Save failed after multiple attempts', 'error', 5000);
        this.retryAttempts = 0;
      }
    }
  }

  // Force save with user feedback
  forceSave() {
    this.retryAttempts = 0;
    this.saveState();
  }

  // Load saved checkpoint
  loadCheckpoint() {
    try {
      const savedCheckpoint = localStorage.getItem(CHECKPOINT_KEY);
      if (!savedCheckpoint) return null;
      
      return JSON.parse(savedCheckpoint);
    } catch (error) {
      console.error('Error loading checkpoint:', error);
      this.showToast('Error loading checkpoint', 'error', 5000);
      return null;
    }
  }

  // Save checkpoint
  saveCheckpoint() {
    try {
      if (this.state) {
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(this.state));
        this.lastCheckpoint = {...this.state};
        this.showToast('Checkpoint saved', 'success', 2000);
      }
    } catch (error) {
      console.error('Error saving checkpoint:', error);
      this.showToast('Failed to save checkpoint', 'error', 5000);
    }
  }

  recoverFromBackup() {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        this.state = JSON.parse(backup);
        console.log('Recovered from backup state');
        this.showToast('Recovered from backup', 'warning', 4000);
      } else {
        this.state = this.getInitialState();
        this.showToast('Starting with fresh game state', 'info', 4000);
      }
    } catch (error) {
      console.error('Failed to recover from backup:', error);
      this.state = this.getInitialState();
      this.showToast('Failed to recover, starting fresh', 'error', 5000);
    }
  }

  getInitialState() {
    return {
      characterPosition: { x: 64, y: 64 },
      currentMapIndex: 0,
      inventory: [],
      userArtifacts: [],
      modifiedArtifacts: [],
      exp: 0,
      lastSaved: new Date().toISOString()
    };
  }

  validateState(state) {
    if (!state) return false;

    const requiredFields = [
      'characterPosition',
      'currentMapIndex',
      'inventory',
      'userArtifacts',
      'modifiedArtifacts',
      'exp'
    ];

    const hasAllFields = requiredFields.every(field => state.hasOwnProperty(field));
    if (!hasAllFields) return false;

    // Validate character position
    if (!state.characterPosition?.x || !state.characterPosition?.y) return false;

    return true;
  }

  getState() {
    return this.state;
  }

  updateState(newState) {
    try {
      this.state = {
        ...this.state,
        ...newState
      };
      this.saveState();
    } catch (error) {
      console.error('Error updating game state:', error);
      this.showToast('Error updating game state', 'error', 5000);
      // Revert to last known good state
      if (this.lastSavedState) {
        this.state = {...this.lastSavedState};
      }
    }
  }

  // Cleanup method
  cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const gameStateManager = new GameStateManager();
export default gameStateManager; 