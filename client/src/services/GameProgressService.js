import API from "../api/api";
import {
  getAuthToken,
  saveGameProgress,
  getGameProgress,
} from "../utils/authUtils";

/**
 * Game Progress Service
 *
 * Handles player progression, inventory management, and achievements.
 * Provides methods to synchronize local data with the server.
 */
class GameProgressService {
  constructor() {
    this.initialized = false;
    this.syncInProgress = false;
    this.userData = null;
    this.inventory = [];
    this.experience = 0;
    this.level = 1;

    // Track offline progress that needs to be synced
    this.pendingUpdates = {
      inventory: false,
      experience: false,
      achievements: false,
    };

    // Load progress from localStorage on initialization
    this.loadLocalProgress();
  }

  /**
   * Initialize service with user data
   * @param {Object} userData - User data from server
   */
  init(userData) {
    if (!userData) return false;

    this.userData = userData;
    this.experience = userData.experience || 0;
    this.level = userData.level || 1;
    this.inventory = userData.inventory || [];

    this.initialized = true;

    // Merge any offline progress with server data
    this.mergeOfflineProgress();

    return true;
  }

  /**
   * Load progress from localStorage
   */
  loadLocalProgress() {
    try {
      // Load offline experience and level
      const offlineExp = getGameProgress("offlineExperience", 0);
      const offlineLevel = getGameProgress("offlineLevel", 1);

      // Only use offline data if it's higher than current values
      if (offlineExp > this.experience) {
        this.experience = offlineExp;
        this.pendingUpdates.experience = true;
      }

      if (offlineLevel > this.level) {
        this.level = offlineLevel;
        this.pendingUpdates.experience = true;
      }

      // Load offline inventory additions
      const offlineInventory = getGameProgress("offlineInventory", []);
      if (offlineInventory.length > 0) {
        // We'll merge this with server data later
        this.pendingUpdates.inventory = true;
      }

      return true;
    } catch (error) {
      console.error("Error loading local progress:", error);
      return false;
    }
  }

  /**
   * Merge offline progress with server data
   */
  mergeOfflineProgress() {
    if (!this.initialized) return false;

    try {
      // Merge inventory
      if (this.pendingUpdates.inventory) {
        const offlineInventory = getGameProgress("offlineInventory", []);

        // Add unique items from offline inventory
        offlineInventory.forEach((item) => {
          const exists = this.inventory.some((i) => i.id === item.id);
          if (!exists) {
            this.inventory.push(item);
          }
        });

        // Clear offline inventory
        saveGameProgress("offlineInventory", []);
        this.pendingUpdates.inventory = false;
      }

      // If we have pending experience updates, sync with server
      if (this.pendingUpdates.experience) {
        this.syncWithServer();
      }

      return true;
    } catch (error) {
      console.error("Error merging offline progress:", error);
      return false;
    }
  }

  /**
   * Add experience points to the player
   * @param {number} amount - Amount of XP to add
   * @returns {Object} - Updated experience and level data
   */
  addExperience(amount) {
    if (!amount || amount <= 0)
      return { experience: this.experience, level: this.level };

    // Add experience
    this.experience += amount;

    // Check for level up
    const newLevel = this.calculateLevel(this.experience);
    const didLevelUp = newLevel > this.level;
    this.level = newLevel;

    // Save progress locally
    saveGameProgress("offlineExperience", this.experience);
    saveGameProgress("offlineLevel", this.level);

    // If authenticated, sync with server
    if (getAuthToken()) {
      this.syncWithServer();
    } else {
      this.pendingUpdates.experience = true;
    }

    return {
      experience: this.experience,
      level: this.level,
      levelUp: didLevelUp,
      amount,
    };
  }

  /**
   * Calculate player level based on experience points
   * @param {number} experience - Total experience points
   * @returns {number} - Player level
   */
  calculateLevel(experience) {
    // Simple level calculation: level = 1 + exp/100
    return Math.floor(experience / 100) + 1;
  }

  /**
   * Add an item to the player's inventory
   * @param {Object} item - Item to add to inventory
   * @returns {boolean} - Success status
   */
  addToInventory(item) {
    if (!item || !item.id) return false;

    // Check if item already exists in inventory
    const exists = this.inventory.some((i) => i.id === item.id);
    if (exists) return true; // Item already in inventory

    // Add to inventory
    this.inventory.push(item);

    // Save to offline inventory
    const offlineInventory = getGameProgress("offlineInventory", []);
    offlineInventory.push(item);
    saveGameProgress("offlineInventory", offlineInventory);

    // If authenticated, sync with server
    if (getAuthToken()) {
      this.syncWithServer();
    } else {
      this.pendingUpdates.inventory = true;
    }

    return true;
  }

  /**
   * Remove an item from inventory
   * @param {string} itemId - ID of item to remove
   * @returns {boolean} - Success status
   */
  removeFromInventory(itemId) {
    if (!itemId) return false;

    // Remove from inventory
    this.inventory = this.inventory.filter((item) => item.id !== itemId);

    // Update offline inventory
    const offlineInventory = getGameProgress("offlineInventory", []);
    const updatedOfflineInventory = offlineInventory.filter(
      (item) => item.id !== itemId,
    );
    saveGameProgress("offlineInventory", updatedOfflineInventory);

    // If authenticated, sync with server
    if (getAuthToken()) {
      this.syncWithServer();
    } else {
      this.pendingUpdates.inventory = true;
    }

    return true;
  }

  /**
   * Get player's current inventory
   * @returns {Array} - Inventory items
   */
  getInventory() {
    return [...this.inventory];
  }

  /**
   * Get player's current level and experience
   * @returns {Object} - Level and experience data
   */
  getLevelData() {
    return {
      level: this.level,
      experience: this.experience,
      nextLevelAt: this.level * 100,
      progress: this.experience % 100, // Progress to next level as percentage
    };
  }

  /**
   * Sync player progress with the server
   * @returns {Promise<boolean>} - Success status
   */
  async syncWithServer() {
    if (!getAuthToken() || this.syncInProgress) return false;

    this.syncInProgress = true;

    try {
      // Prepare update data
      const updateData = {
        experience: this.experience,
        level: this.level,
        inventory: this.inventory.map((item) => item.id), // Send only IDs to server
      };

      // Update user data on server
      const response = await API.put("/api/users/profile", updateData);

      // Update local data with server response
      if (response.data) {
        this.userData = response.data;

        // Clear pending updates
        this.pendingUpdates.experience = false;
        this.pendingUpdates.inventory = false;

        console.log("Game progress synced with server successfully");
      }

      return true;
    } catch (error) {
      console.error("Error syncing progress with server:", error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Complete an achievement
   * @param {string} achievementId - ID of the achievement
   * @returns {Promise<Object>} - Updated achievement data
   */
  async completeAchievement(achievementId) {
    if (!achievementId) return false;

    try {
      // Record achievement completion locally
      const completedAchievements = getGameProgress(
        "completedAchievements",
        [],
      );
      if (!completedAchievements.includes(achievementId)) {
        completedAchievements.push(achievementId);
        saveGameProgress("completedAchievements", completedAchievements);
      }

      // If authenticated, sync with server
      if (getAuthToken()) {
        const response = await API.post(
          `/api/users/achievements/${achievementId}`,
        );
        return response.data;
      } else {
        this.pendingUpdates.achievements = true;
        return { id: achievementId, completed: true, offlineOnly: true };
      }
    } catch (error) {
      console.error("Error completing achievement:", error);
      return false;
    }
  }

  /**
   * Reset all progress (for testing)
   * @returns {boolean} - Success status
   */
  resetAllProgress() {
    try {
      // Reset local state
      this.experience = 0;
      this.level = 1;
      this.inventory = [];

      // Clear local storage keys
      saveGameProgress("offlineExperience", 0);
      saveGameProgress("offlineLevel", 1);
      saveGameProgress("offlineInventory", []);
      saveGameProgress("completedAchievements", []);

      // If authenticated, sync with server
      if (getAuthToken()) {
        this.syncWithServer();
      }

      return true;
    } catch (error) {
      console.error("Error resetting progress:", error);
      return false;
    }
  }

  /**
   * Check if the user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    return !!getAuthToken() && !!this.userData;
  }

  // Save a quote to the user's collection
  saveQuote(quote) {
    try {
      // First save locally
      const savedQuotes = JSON.parse(
        localStorage.getItem("savedQuotes") || "[]",
      );
      if (!savedQuotes.some((q) => q.id === quote.id)) {
        savedQuotes.push(quote);
        localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
      }

      // Then sync with server if authenticated
      if (this.isAuthenticated()) {
        const authToken = getAuthToken();
        if (!authToken) {
          console.warn("No auth token found, quote will only be saved locally");
          return Promise.resolve();
        }

        const userId = this.userData?.id;
        if (!userId) {
          console.warn("No user ID found, quote will only be saved locally");
          return Promise.resolve();
        }

        // Use the API object instead of fetch directly
        return API.post(`/api/users/${userId}/quotes`, { quote }).then(
          (response) => {
            console.log("Quote saved to server:", response.data);
            return response.data;
          },
        );
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving quote:", error);
      return Promise.reject(error);
    }
  }

  // Get all saved quotes
  getSavedQuotes() {
    // First try to get from local storage
    const localQuotes = JSON.parse(localStorage.getItem("savedQuotes") || "[]");

    // Then try to get from server if authenticated
    if (this.isAuthenticated()) {
      const authToken = getAuthToken();
      if (!authToken) {
        return Promise.resolve(localQuotes);
      }

      const userId = this.userData?.id;
      if (!userId) {
        return Promise.resolve(localQuotes);
      }

      // Use the API object instead of fetch directly
      return API.get(`/api/users/${userId}/quotes`)
        .then((response) => {
          // Merge server quotes with local quotes that don't exist on server
          const serverQuoteIds = response.data.quotes.map((q) => q.id);
          const uniqueLocalQuotes = localQuotes.filter(
            (q) => !serverQuoteIds.includes(q.id),
          );

          return [...response.data.quotes, ...uniqueLocalQuotes];
        })
        .catch((error) => {
          console.error("Error fetching quotes:", error);
          return localQuotes;
        });
    }

    return Promise.resolve(localQuotes);
  }

  // Record an interaction with an NPC
  recordNPCInteraction(npcId) {
    // Save interaction to local storage
    const npcInteractions = JSON.parse(
      localStorage.getItem("npcInteractions") || "[]",
    );
    if (!npcInteractions.includes(npcId)) {
      npcInteractions.push(npcId);
      localStorage.setItem("npcInteractions", JSON.stringify(npcInteractions));

      // Add a small amount of experience for each new NPC interaction
      this.addExperience(5);
    }

    // Sync with server if authenticated
    if (this.isAuthenticated()) {
      const authToken = getAuthToken();
      if (!authToken) {
        return Promise.resolve();
      }

      const userId = this.userData?.id;
      if (!userId) {
        return Promise.resolve();
      }

      // Use the API object instead of fetch directly
      return API.post(`/api/users/${userId}/npc-interactions`, { npcId }).catch(
        (error) => {
          console.error("Error recording NPC interaction:", error);
          return Promise.reject(error);
        },
      );
    }

    return Promise.resolve();
  }
}

// Create and export a singleton instance
const gameProgressService = new GameProgressService();
export default gameProgressService;
