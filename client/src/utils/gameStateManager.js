/**
 * Enhanced Game State Manager
 * Handles game state persistence, recovery, error handling, and user feedback
 */

const STORAGE_KEY = "game_state";
const BACKUP_KEY = "game_state_backup";
const CHECKPOINT_KEY = "last_checkpoint";
const OFFLINE_QUEUE_KEY = "offline_save_queue";
const SYNC_LOCK_KEY = "sync_lock";

class GameStateManager {
  constructor() {
    this.state = null;
    this.lastSavedState = null;
    this.saveInterval = null;
    this.initialized = false;
    this.lastCheckpoint = null;
    this.toastCallback = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.pendingSaves = new Set();
    this.syncInProgress = false;
    this.eventListeners = new Map();
  }

  setToastCallback(callback) {
    this.toastCallback = callback;
  }

  showToast(message, type = "info", duration = 5000) {
    if (this.toastCallback) {
      this.toastCallback(message, type, duration);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  checkOnlineStatus() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;

    if (!wasOnline && this.isOnline) {
      this.showToast(
        "Connection restored - syncing game state",
        "success",
        3000,
      );
      this.processOfflineQueue();
    } else if (wasOnline && !this.isOnline) {
      this.showToast("Connection lost - saving locally", "warning", 3000);
    }
  }

  // Process offline save queue when connection is restored
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0 || this.syncInProgress) return;

    this.syncInProgress = true;
    this.showToast("Processing offline saves...", "info", 2000);

    try {
      const queueCopy = [...this.offlineQueue];
      let processedCount = 0;

      for (const saveData of queueCopy) {
        try {
          await this.saveToServer(saveData);
          this.offlineQueue = this.offlineQueue.filter(
            (item) => item.timestamp !== saveData.timestamp,
          );
          processedCount++;
        } catch (error) {
          console.error("Failed to process offline save:", error);
          // Keep failed saves in queue for next attempt
          continue;
        }
      }

      this.saveOfflineQueue();

      if (processedCount > 0) {
        this.showToast(
          `Synced ${processedCount} offline saves`,
          "success",
          3000,
        );
      }
    } catch (error) {
      console.error("Error processing offline queue:", error);
      this.showToast("Failed to sync offline saves", "error", 5000);
    } finally {
      this.syncInProgress = false;
    }
  }

  saveOfflineQueue() {
    try {
      localStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(this.offlineQueue),
      );
    } catch (error) {
      console.error("Error saving offline queue:", error);
    }
  }

  loadOfflineQueue() {
    try {
      const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
        // Clean up old entries (older than 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.offlineQueue = this.offlineQueue.filter(
          (item) => item.timestamp > weekAgo,
        );
        this.saveOfflineQueue();
      }
    } catch (error) {
      console.error("Error loading offline queue:", error);
      this.offlineQueue = [];
    }
  }

  // Save to server with retry logic and proper error handling
  async saveToServer(stateData) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/users/game-state", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(stateData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Server error: ${response.status} - ${errorData.message || "Unknown error"}`,
          );
        }

        const result = await response.json();

        // Validate server response
        if (!result.success) {
          throw new Error(
            result.message || "Server returned unsuccessful response",
          );
        }

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Save attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
          );
        }
      }
    }

    throw lastError;
  }

  init() {
    if (this.initialized) return;

    try {
      // Load offline queue
      this.loadOfflineQueue();

      // Set up online/offline listeners with proper cleanup
      const onlineHandler = () => this.checkOnlineStatus();
      const offlineHandler = () => this.checkOnlineStatus();

      window.addEventListener("online", onlineHandler);
      window.addEventListener("offline", offlineHandler);

      // Store references for cleanup
      this.eventListeners.set("online", onlineHandler);
      this.eventListeners.set("offline", offlineHandler);

      // Try to load the main state
      this.state = this.loadState();

      // Load last checkpoint
      this.lastCheckpoint = this.loadCheckpoint();

      // Set up automatic saving
      this.saveInterval = setInterval(() => this.saveState(), 300000); // Save every 5 minutes

      this.initialized = true;
      this.showToast("Game state loaded successfully", "success", 3000);
    } catch (error) {
      console.error("Failed to initialize game state:", error);
      this.showToast("Failed to load game state", "error", 5000);
      // Try to recover from backup
      this.recoverFromBackup();
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return this.getInitialState();

      const parsedState = JSON.parse(savedState);
      return this.validateState(parsedState)
        ? parsedState
        : this.getInitialState();
    } catch (error) {
      console.error("Error loading game state:", error);
      this.showToast("Error loading game state", "error", 5000);
      return this.getInitialState();
    }
  }

  async saveState(forceServer = false) {
    // Prevent concurrent saves
    if (this.pendingSaves.has("saveState")) {
      console.log("Save already in progress, skipping...");
      return;
    }

    this.pendingSaves.add("saveState");

    try {
      // Always save to localStorage first as backup
      if (this.state) {
        localStorage.setItem(BACKUP_KEY, localStorage.getItem(STORAGE_KEY));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.lastSavedState = { ...this.state };
      }

      // Try to save to server if online and authenticated
      const token = localStorage.getItem("token");
      if (this.isOnline && token && (forceServer || this.retryAttempts === 0)) {
        try {
          await this.saveToServer(this.state);
          this.showToast("Game progress saved to cloud", "success", 2000);
          this.retryAttempts = 0; // Reset retry counter on success
        } catch (serverError) {
          console.error("Server save failed:", serverError);

          // Add to offline queue for later processing
          const saveData = {
            ...this.state,
            timestamp: Date.now(),
            retryCount: 0,
          };

          this.offlineQueue.push(saveData);
          this.saveOfflineQueue();

          this.showToast(
            "Saved locally - will sync when online",
            "warning",
            3000,
          );
        }
      } else if (!this.isOnline) {
        // Offline mode - save to queue
        const saveData = {
          ...this.state,
          timestamp: Date.now(),
          retryCount: 0,
        };

        this.offlineQueue.push(saveData);
        this.saveOfflineQueue();

        this.showToast("Saved locally - offline mode", "info", 2000);
      } else {
        // No token or other issue - just local save
        this.showToast("Game progress saved locally", "success", 2000);
      }
    } catch (error) {
      console.error("Error saving game state:", error);
      this.showToast("Failed to save game progress", "error", 5000);

      // Try to restore last known good state
      if (this.lastSavedState) {
        this.state = { ...this.lastSavedState };
      }

      // Retry save if we haven't exceeded max attempts
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        this.showToast(
          `Retrying save... (${this.retryAttempts}/${this.maxRetries})`,
          "warning",
          3000,
        );
        setTimeout(() => this.saveState(forceServer), 2000);
      } else {
        this.showToast("Save failed after multiple attempts", "error", 5000);
        this.retryAttempts = 0;
      }
    } finally {
      this.pendingSaves.delete("saveState");
    }
  }

  // Force save with user feedback
  async forceSave() {
    this.retryAttempts = 0;
    await this.saveState(true); // Force server save
  }

  // Load saved checkpoint
  loadCheckpoint() {
    try {
      const savedCheckpoint = localStorage.getItem(CHECKPOINT_KEY);
      if (!savedCheckpoint) return null;

      const checkpoint = JSON.parse(savedCheckpoint);
      return this.validateState(checkpoint) ? checkpoint : null;
    } catch (error) {
      console.error("Error loading checkpoint:", error);
      this.showToast("Error loading checkpoint", "error", 5000);
      return null;
    }
  }

  // Save checkpoint
  saveCheckpoint(mapName = null, position = null) {
    try {
      if (this.state) {
        const checkpointData = {
          ...this.state,
          checkpointMap: mapName,
          checkpointPosition: position,
          checkpointTime: Date.now(),
        };

        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpointData));
        this.lastCheckpoint = { ...checkpointData };
        this.showToast("Checkpoint saved", "success", 2000);
      }
    } catch (error) {
      console.error("Error saving checkpoint:", error);
      this.showToast("Failed to save checkpoint", "error", 5000);
    }
  }

  recoverFromBackup() {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const backupState = JSON.parse(backup);
        if (this.validateState(backupState)) {
          this.state = backupState;
          console.log("Recovered from backup state");
          this.showToast("Recovered from backup", "warning", 4000);
          return;
        }
      }

      // If no valid backup, start fresh
      this.state = this.getInitialState();
      this.showToast("Starting with fresh game state", "info", 4000);
    } catch (error) {
      console.error("Failed to recover from backup:", error);
      this.state = this.getInitialState();
      this.showToast("Failed to recover, starting fresh", "error", 5000);
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
      level: 1,
      achievements: [],
      quests: [],
      lastSaved: new Date().toISOString(),
    };
  }

  validateState(state) {
    if (!state || typeof state !== "object") return false;

    const requiredFields = [
      "characterPosition",
      "currentMapIndex",
      "inventory",
      "userArtifacts",
      "modifiedArtifacts",
      "exp",
    ];

    const hasAllFields = requiredFields.every((field) =>
      state.hasOwnProperty(field),
    );
    if (!hasAllFields) return false;

    // Validate character position
    if (!state.characterPosition?.x || !state.characterPosition?.y)
      return false;

    // Validate arrays
    if (
      !Array.isArray(state.inventory) ||
      !Array.isArray(state.userArtifacts) ||
      !Array.isArray(state.modifiedArtifacts)
    ) {
      return false;
    }

    // Validate numeric fields
    if (
      typeof state.currentMapIndex !== "number" ||
      typeof state.exp !== "number"
    ) {
      return false;
    }

    return true;
  }

  getState() {
    return this.state;
  }

  updateState(newState) {
    try {
      this.state = {
        ...this.state,
        ...newState,
        lastSaved: new Date().toISOString(),
      };
      this.saveState();
    } catch (error) {
      console.error("Error updating game state:", error);
      this.showToast("Error updating game state", "error", 5000);
      // Revert to last known good state
      if (this.lastSavedState) {
        this.state = { ...this.lastSavedState };
      }
    }
  }

  // Cleanup method with proper event listener removal
  cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    // Remove all event listeners
    this.eventListeners.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Clear pending operations
    this.pendingSaves.clear();
    this.syncInProgress = false;

    this.initialized = false;
  }
}

// Export singleton instance
export const gameStateManager = new GameStateManager();
export default gameStateManager;
