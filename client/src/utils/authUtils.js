/**
 * Auth Utility Functions
 * 
 * Centralizes all authentication and token-related operations
 * to ensure consistent behavior across the application.
 */

/**
 * Get auth token from storage (checks both localStorage and sessionStorage)
 * @returns {string|null} The auth token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Store auth token and user data
 * @param {string} token - JWT auth token
 * @param {Object} user - User data object
 * @param {boolean} rememberMe - Whether to store in localStorage (true) or sessionStorage (false)
 */
export const storeAuthData = (token, user, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  
  // Clear any existing tokens from both storages
  clearAuthData();
  
  // Store the new token and user data
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  
  // Update the authorization header for API requests
  updateAuthHeader(token);
  
  return true;
};

/**
 * Clear all auth data from storage
 */
export const clearAuthData = () => {
  // Clear from both storage types to ensure complete logout
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Remove auth header
  updateAuthHeader(null);
  
  return true;
};

/**
 * Update the Authorization header for API requests
 * @param {string|null} token - JWT token or null to remove header
 */
export const updateAuthHeader = (token) => {
  if (typeof window === 'undefined') return; // Skip in SSR context
  
  // This assumes you're using axios with a global config
  if (window.API && window.API.defaults && window.API.defaults.headers) {
    if (token) {
      window.API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete window.API.defaults.headers.common['Authorization'];
    }
  }
};

/**
 * Check if a user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get the current user data from storage
 * @returns {Object|null} User data or null if not found
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if token needs to be refreshed
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expiring soon
 */
export const isTokenExpiringSoon = (token) => {
  if (!token) return false;
  
  try {
    // Extract payload from JWT token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Get expiration time from token
    const exp = payload.exp;
    if (!exp) return false;
    
    // Check if token expires in less than 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = exp - currentTime;
    return timeRemaining < 300; // 5 minutes in seconds
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

/**
 * Save game progress data
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 */
export const saveGameProgress = (key, data) => {
  try {
    localStorage.setItem(key, typeof data === 'object' ? JSON.stringify(data) : data);
    return true;
  } catch (error) {
    console.error(`Error saving game progress (${key}):`, error);
    return false;
  }
};

/**
 * Get game progress data
 * @param {string} key - The key to retrieve
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The stored value or defaultValue
 */
export const getGameProgress = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    // Try to parse JSON, but return as-is if it fails (for string values)
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`Error getting game progress (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Reset specific game progress
 * @param {string} key - The key to reset
 */
export const resetGameProgress = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error resetting game progress (${key}):`, error);
    return false;
  }
};

/**
 * Reset all game progress (but keep authentication)
 */
export const resetAllGameProgress = () => {
  try {
    // Save auth data temporarily
    const token = getAuthToken();
    const user = getCurrentUser();
    const isInLocalStorage = !!localStorage.getItem('token');
    
    // Get all keys in localStorage
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== 'token' && key !== 'user') {
        keys.push(key);
      }
    }
    
    // Remove all game progress keys
    keys.forEach(key => localStorage.removeItem(key));
    
    // Restore auth data
    if (token && user) {
      storeAuthData(token, user, isInLocalStorage);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting all game progress:', error);
    return false;
  }
};

export default {
  getAuthToken,
  storeAuthData,
  clearAuthData,
  isAuthenticated,
  getCurrentUser,
  isTokenExpiringSoon,
  saveGameProgress,
  getGameProgress,
  resetGameProgress,
  resetAllGameProgress
}; 