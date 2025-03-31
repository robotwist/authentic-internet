/**
 * Game State Manager
 * Handles game state persistence, recovery, and error handling
 */

const STORAGE_KEY = 'game_state';
const BACKUP_KEY = 'game_state_backup';

class GameStateManager {
  constructor() {
    this.state = null;
    this.lastSavedState = null;
    this.saveInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      // Try to load the main state
      this.state = this.loadState();
      
      // Set up automatic saving
      this.saveInterval = setInterval(() => this.saveState(), 30000); // Save every 30 seconds
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize game state:', error);
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
      }
    } catch (error) {
      console.error('Error saving game state:', error);
      // Try to restore last known good state
      if (this.lastSavedState) {
        this.state = {...this.lastSavedState};
      }
    }
  }

  recoverFromBackup() {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        this.state = JSON.parse(backup);
        console.log('Recovered from backup state');
      } else {
        this.state = this.getInitialState();
      }
    } catch (error) {
      console.error('Failed to recover from backup:', error);
      this.state = this.getInitialState();
    }
  }

  validateState(state) {
    // Add validation logic here
    return state && 
           typeof state === 'object' && 
           'player' in state &&
           'inventory' in state &&
           'progress' in state;
  }

  getInitialState() {
    return {
      player: {
        position: { x: 0, y: 0 },
        inventory: [],
        health: 100,
        experience: 0
      },
      inventory: [],
      progress: {
        level: 1,
        questsCompleted: [],
        areasUnlocked: ['Overworld']
      },
      settings: {
        sound: true,
        music: true,
        notifications: true
      }
    };
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
      // Revert to last known good state
      if (this.lastSavedState) {
        this.state = {...this.lastSavedState};
      }
    }
  }

  clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      this.state = this.getInitialState();
    } catch (error) {
      console.error('Error clearing game state:', error);
    }
  }
}

export const gameStateManager = new GameStateManager();
export default gameStateManager; 