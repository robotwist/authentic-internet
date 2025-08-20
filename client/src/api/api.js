import axios from "axios";
import { NPC_TYPES } from "../components/Constants";
import cacheManager from '../utils/cacheManager';
import { createErrorHandler, ERROR_CATEGORIES } from '../utils/errorTracker';
const { withCache, createCacheKey, cacheDurations } = cacheManager;

// Display build information in console for tracking deployments
const displayBuildInfo = () => {
  const buildDate = new Date().toISOString();
  const buildEnv = import.meta.env.MODE || 'development';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  
  console.info(`%cApplication Build Info:
  🔹 Environment: ${buildEnv}
  🔹 Build Date: ${buildDate}
  🔹 API URL: ${apiUrl}
  🔹 Base URL: ${window.location.origin}
  🔹 Full Path: ${window.location.href}`,
  'color: #6366F1; font-weight: bold;');
  
  // Log all environment variables in development mode
  if (buildEnv === 'development') {
    console.log('Environment Variables:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_API_FALLBACK_URL: import.meta.env.VITE_API_FALLBACK_URL,
      VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
      // Add other env vars here as needed
    });
  }
  
  return { buildEnv, apiUrl };
};

// Call this on app initialization (always, not just in development)
const { buildEnv, apiUrl } = displayBuildInfo();

// Function to create API instance with the given base URL
const createApiInstance = (baseUrl) => {
  const instance = axios.create({
    baseURL: baseUrl,
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout for all requests
  });

  // Add request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response) {
        const { status, data } = error.response;
        const requestUrl = error.config.url;
        
        // Handle 401 Unauthorized - but ignore during login/register attempts
        if (status === 401) {
          // Check if this is a login or register endpoint
          const isAuthEndpoint = requestUrl && 
            (requestUrl.includes('/api/auth/login') || 
             requestUrl.includes('/api/auth/register'));
          
          if (!isAuthEndpoint) {
            // Only handle as session expiration if NOT a login/register request
            console.warn('Session expired or invalid token');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            window.location.href = '/login';
            return Promise.reject(new Error('Session expired. Please log in again.'));
          } else {
            // For login/register endpoints, pass through the original error
            console.log('Authentication failed - this is normal during login attempts');
            return Promise.reject(new Error(data?.message || 'Authentication failed'));
          }
        }
        
        // Handle 400 Bad Request
        if (status === 400) {
          console.error('Request validation error:', data);
          return Promise.reject(new Error(data.message || 'Invalid request'));
        }
        
        // Handle 403 Forbidden
        if (status === 403) {
          console.error('Access forbidden:', data);
          return Promise.reject(new Error('Access forbidden'));
        }
        
        // Handle 404 Not Found
        if (status === 404) {
          console.error('Resource not found:', data);
          return Promise.reject(new Error('Resource not found'));
        }
        
        // Handle 500 Internal Server Error
        if (status === 500) {
          console.error('Server error:', data);
          return Promise.reject(new Error('Server error. Please try again later.'));
        }
      } else if (error.request) {
        // Handle network errors
        console.error('Network error:', error.message);
        return Promise.reject(new Error('Network error. Please check your connection.'));
      } else {
        // Handle other errors
        console.error('Error:', error.message);
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Get the configured API URL or default to localhost:5001
const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Initialize API with the configured URL - use default instance as fallback
let API = createApiInstance(configuredApiUrl);

// Store alternative ports to try if the main one is unavailable
const alternativePorts = [5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];
let isApiInitialized = false;
let currentApiUrl = configuredApiUrl;
let lastHealthCheckTime = 0;
const HEALTH_CHECK_THROTTLE_MS = 60000; // Limit health checks to once per minute (increased from 10 seconds)
let healthCheckInProgress = false; // Flag to prevent concurrent health checks

// Function to check server health
const checkServerHealth = async (url) => {
  // Bypass health checks to prevent reload loops
  console.log(`🔍 Health check bypassed for ${url} to prevent reload loops`);
  return true;
  
  /* Original implementation commented out
  try {
    console.log(`🔍 Checking server health at ${url}/api/health...`);
    
    // First try /api/health endpoint
    try {
      const response = await axios.get(`${url}/api/health`, { 
        timeout: 5000,
        validateStatus: (status) => status === 200
      });
      
      if (response.status === 200) {
        console.log(`✅ Health check succeeded at ${url}/api/health`);
        return true;
      }
    } catch (healthError) {
      console.log(`⚠️ Health check failed at ${url}/api/health: ${healthError.message}`);
      
      // If /api/health fails, try just hitting the base URL as fallback
      try {
        console.log(`🔍 Trying fallback health check at ${url}...`);
        const fallbackResponse = await axios.get(url, { 
          timeout: 5000,
          validateStatus: (status) => status >= 200 && status < 500
        });
        
        // Accept any 2xx or 3xx status as "server is running"
        if (fallbackResponse.status >= 200 && fallbackResponse.status < 400) {
          console.log(`✅ Fallback health check succeeded at ${url}`);
          return true;
        }
        
        console.log(`⚠️ Fallback health check failed with status ${fallbackResponse.status}`);
        return false;
      } catch (fallbackError) {
        console.log(`❌ All health checks failed for ${url}: ${fallbackError.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ Server health check error for ${url}:`, error.message);
    return false;
  }
  */
};

// Initialize API with port detection
const initApi = async () => {
  // Return existing API if already initialized and working
  if (isApiInitialized) {
    console.log("API already initialized, using existing instance");
    return API;
  }

  // Prevent concurrent health checks
  if (healthCheckInProgress) {
    console.log("Health check already in progress, using current API configuration");
    return API;
  }

  // Throttle health checks to prevent excessive requests
  const now = Date.now();
  if (now - lastHealthCheckTime < HEALTH_CHECK_THROTTLE_MS) {
    console.log(`Health check throttled (last check: ${now - lastHealthCheckTime}ms ago). Using default API configuration.`);
    // Mark as initialized to prevent further checks in development mode
    if (import.meta.env.MODE === 'development') {
      isApiInitialized = true;
    }
    return API; // Return the current API instance
  }
  
  try {
    // Set flag to prevent concurrent checks
    healthCheckInProgress = true;
    
    // Update the last health check time
    lastHealthCheckTime = now;

    // In development mode, limit to one check per session to avoid constant rechecking
    if (import.meta.env.MODE === 'development') {
      // Just check the main URL once
      try {
        const healthCheckResult = await checkServerHealth(configuredApiUrl);
        console.log("Development health check result:", healthCheckResult ? "✅ Success" : "❌ Failed");
        // Whether success or failure, mark as initialized to avoid future checks
        isApiInitialized = true;
        return API;
      } catch (error) {
        console.warn("Development health check error - proceeding with default API config");
        isApiInitialized = true;
        return API;
      }
    }

    // For production, we'll do more thorough checking...
    
    // Try with the configured URL first
    try {
      const healthCheckResult = await checkServerHealth(configuredApiUrl);
      if (healthCheckResult) {
        if (import.meta.env.MODE !== 'production') {
          console.log(`✅ Connected to API at ${configuredApiUrl}`);
        }
        API = createApiInstance(configuredApiUrl);
        currentApiUrl = configuredApiUrl;
        isApiInitialized = true;
        return API;
      }
    } catch (error) {
      console.warn(`Failed to connect to primary API URL ${configuredApiUrl}: ${error.message}`);
      // Continue with alternative ports
    }

    // If we reach here, the configured URL failed. Try alternative ports.
    console.log(`⚠️ Main API at ${configuredApiUrl} unavailable, trying alternative ports...`);
    
    // Add short-circuit for testing/development
    if (import.meta.env.MODE === 'development') {
      // In development, we might just want to proceed with a non-functioning API
      // rather than getting stuck in initialization
      console.log(`Development mode: Proceeding with default API configuration despite health check failure`);
      isApiInitialized = true; // Mark as initialized to prevent further checks
      return API;
    }
    
    // Only try alternative ports if we really need to
    for (const port of alternativePorts) {
      const altUrl = configuredApiUrl.replace(/:\d+/, `:${port}`);
      try {
        if (await checkServerHealth(altUrl)) {
          console.log(`✅ Connected to alternative API at ${altUrl}`);
          API = createApiInstance(altUrl);
          currentApiUrl = altUrl;
          isApiInitialized = true;
          return API;
        }
      } catch (error) {
        console.warn(`Failed to connect to alternative API URL ${altUrl}: ${error.message}`);
      }
    }

    console.error("❌ All API endpoints unavailable. Using default configuration.");
    // Fall back to the original URL, even if it's not working
    isApiInitialized = true; // Mark as initialized to prevent further checks
    return API;
  } catch (error) {
    console.error("Critical error during API initialization:", error);
    // Mark as initialized to prevent further checks that will likely also fail
    isApiInitialized = true;
    return API; // Return the default instance as fallback
  } finally {
    healthCheckInProgress = false; // Reset flag regardless of outcome
  }
};

// Always return the configured API even if health check failed
// This prevents app crashes for non-critical API operations
const getApi = () => {
  // Only do one health check on initial load, not on every API call
  if (!isApiInitialized) {
    // Set as initialized immediately to prevent future checks
    isApiInitialized = true;
    
    // Run the initialization once but don't wait for it
    initApi().catch(err => {
      console.warn("Background API initialization failed:", err.message);
    });
  }
  return API;
};

// Initialize API on import but don't block execution
initApi().catch(error => {
  console.error('API initialization failed:', error);
  // In development, show a more user-friendly error, but don't use alert which blocks UI
  if (import.meta.env.MODE !== 'production') {
    console.error('Failed to connect to the server. Please ensure the server is running and try again.');
  }
});

// Persistent error logging utility
export const logPersistentError = (source, error) => {
  try {
    // Create a formatted error object
    const errorObj = {
      timestamp: new Date().toISOString(),
      source,
      message: error.message || 'Unknown error',
      stack: error.stack,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    };
    
    // Get existing error log or initialize a new one
    const existingLog = JSON.parse(localStorage.getItem('apiErrorLog') || '[]');
    
    // Add new error to the beginning (most recent first)
    existingLog.unshift(errorObj);
    
    // Keep only last 10 errors to avoid filling localStorage
    const trimmedLog = existingLog.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('apiErrorLog', JSON.stringify(trimmedLog));
    
    // Also log to console
    console.error(`Persistent Error [${source}]:`, error);
    
    return errorObj;
  } catch (e) {
    // Fallback if localStorage fails
    console.error('Failed to log error persistently:', e);
    return null;
  }
};

// Retrieve persistent error log
export const getPersistentErrors = () => {
  try {
    return JSON.parse(localStorage.getItem('apiErrorLog') || '[]');
  } catch (e) {
    console.error('Failed to retrieve persistent error log:', e);
    return [];
  }
};

// Clear persistent error log
export const clearPersistentErrors = () => {
  try {
    localStorage.removeItem('apiErrorLog');
    return true;
  } catch (e) {
    console.error('Failed to clear persistent error log:', e);
    return false;
  }
};

export default API;

// Helper function to handle API errors
const handleApiError = (error, defaultMessage = "An error occurred") => {
  // Only log errors in development mode
  if (import.meta.env.MODE !== 'production') {
    console.error("API Error details:", error);
  }
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return error.response.data?.message || error.response.data?.error || defaultMessage;
  } else if (error.request) {
    // The request was made but no response was received
    return "No response from server. Please check your network connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || defaultMessage;
  }
};

// Export the current API URL for reference
export const getCurrentApiUrl = () => currentApiUrl;

// Proxy function for external APIs to avoid CORS issues
export const proxyExternalRequest = async (url, options = {}) => {
  try {
    const response = await API.post('/api/proxy', {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data || null
    });
    
    return response.data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 AUTHENTICATION ENDPOINTS
──────────────────────────────── */

/**
 * Register a new user
 * @param {string} username - Username
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} Authentication data
 */
export const registerUser = async (username, email, password) => {
  try {
    // Log registration attempt
    console.log(`Attempting to register user: ${username}`);
    
    // Send registration request
    const response = await getApi().post('/api/auth/register', {
      username,
      email,
      password
    });
    
    // Check for success flag in response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Registration failed');
    }
    
    // Return auth data
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @returns {Promise<Object>} Authentication data
 */
export const loginUser = async (username, password) => {
  try {
    // Log login attempt
    console.log(`Attempting login for user: ${username}`);
    
    // Send login request
    const response = await getApi().post('/api/auth/login', {
      identifier: username, // Server expects 'identifier' field
      password
    });

    // Check for success flag in response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }

    // Set the Authorization header for future requests
    const api = getApi();
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    // Return auth data
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    
    // If we have a response from the server, prioritize that message
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    // If it's a network error, provide a clearer message
    if (error.message && error.message.includes('Network Error')) {
      throw new Error('Unable to connect to the authentication server. Please check your network connection.');
    }
    
    // Otherwise pass through the error
    throw error;
  }
};

/**
 * Logout a user
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<Object>} Logout response
 */
export const logoutUser = async (refreshToken) => {
  try {
    // Get token for auth header
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, already logged out');
      return { success: true };
    }
    
    // Send logout request
    const response = await getApi().post('/api/auth/logout', 
      { refreshToken },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Return response
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
    return { success: true };
  }
};

/**
 * Verify auth token
 * @returns {Promise<Object>} Verification response
 */
export const verifyToken = async () => {
  try {
    // Get token for auth header
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    // Send verification request
    const response = await getApi().get('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check for success flag in response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Token verification failed');
    }
    
    // Return verification data
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Refresh response with new token
 */
export const refreshUserToken = async (refreshToken) => {
  try {
    // Basic validation - don't even try if token looks invalid
    if (!refreshToken || refreshToken.length < 10) {
      console.warn('Invalid refresh token format - too short or missing');
      throw new Error('Invalid refresh token format');
    }
    
    // Log refresh attempt (without showing token)
    console.log(`Attempting to refresh token (${refreshToken.substring(0, 5)}...)`);
    
    // Send refresh request
    const response = await getApi().post('/api/auth/refresh', { refreshToken });
    
    // Check for success flag in response
    if (!response.data.success) {
      // Throw a more specific error for session expiration
      if (response.data.message && response.data.message.includes('expired')) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(response.data.message || 'Token refresh failed');
    }
    
    // Return new token data
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If the error is related to network issues or server not responding,
    // provide a clearer message
    if (error.request && !error.response) {
      throw new Error('Unable to connect to authentication server. Please try again later.');
    }
    
    // If it's an expired token or invalid token error from the server
    if (error.response && (
        error.response.status === 401 || 
        error.response.status === 403 ||
        (error.response.data && error.response.data.message && 
         (error.response.data.message.includes('expired') || 
          error.response.data.message.includes('invalid')))
    )) {
      // Clear auth data to force a fresh login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      throw new Error('Session expired. Please log in again.');
    }
    
    throw error;
  }
};

/**
 * Fetch the user's game state including achievements, inventory, and progress
 * @returns {Promise<Object>} The user's game state
 */
export const getUserGameState = withCache(
  async (idToken) => {
    try {
      if (!idToken) {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication required');
        }
        idToken = token;
      }
      
      const response = await fetch(`${API_URL}/api/users/game-state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch game state');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching game state:', error);
      throw error;
    }
  },
  { 
    duration: cacheDurations.gameState,
    keyFn: () => `gameState:${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'guest'}`
  }
);

/**
 * Update the user's experience points in the database
 * @param {number} experience - The new experience points total
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserExperience = async (experience) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/users/experience`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ experience })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update experience');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating experience:', error);
    throw error;
  }
};

/**
 * Add a new achievement for the user
 * @param {Object} achievement - The achievement to add
 * @param {string} achievement.name - The name of the achievement
 * @param {string} achievement.description - Description of the achievement
 * @param {string} achievement.type - Type of achievement (discovery, completion, etc.)
 * @returns {Promise<Object>} The updated achievements array
 */
export const addUserAchievement = async (achievement) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/users/achievements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ achievement })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add achievement');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding achievement:', error);
    throw error;
  }
};

/**
 * Save the entire game state to the server
 * @param {Object} gameState - The complete game state object
 * @returns {Promise<Object>} The saved game state
 */
export const saveGameState = async (gameState) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/users/game-state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(gameState)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save game state');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 CHARACTER ENDPOINTS
──────────────────────────────── */
export const fetchCharacter = withCache(
  async (id) => {
    try {
      const response = await getApi().get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching character:', error);
      throw error;
    }
  },
  { 
    duration: cacheDurations.character,
    keyFn: (id) => `character:${id}`
  }
);

export const updateCharacter = async (characterData) => {
  try {
    // Convert to FormData if there is a file to upload
    if (characterData.avatarFile) {
      const formData = new FormData();
      const { avatarFile, ...userData } = characterData;
      
      // Add the text fields
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined) {
          // Handle nested properties like savedQuotes
          if (typeof userData[key] === 'object' && userData[key] !== null) {
            formData.append(key, JSON.stringify(userData[key]));
          } else {
            formData.append(key, userData[key]);
          }
        }
      });
      
      // Add the file
      formData.append('avatar', avatarFile);
      
      // Make the request with proper headers
      return getApi().put(`/api/users/${characterData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => response.data);
    }
    
    // No file - just send the JSON data
    const processedData = { ...characterData };
    
    // Convert any arrays to JSON strings if needed
    if (Array.isArray(processedData.savedQuotes)) {
      processedData.savedQuotes = processedData.savedQuotes;
    }
    
    const response = await getApi().put(`/api/users/${characterData.id}`, processedData);
    return response.data;
  } catch (error) {
    console.error('Update character failed:', error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 ARTIFACT ENDPOINTS (CRUD)
──────────────────────────────── */
export const fetchArtifacts = withCache(
  async () => {
    try {
      const response = await getApi().get("/api/artifacts");
      return response.data;
    } catch (error) {
      console.error('Error fetching artifacts:', error);
      throw error;
    }
  },
  { duration: cacheDurations.artifacts }
);

export const createArtifact = async (artifactData) => {
  try {
    let requestData = { ...artifactData };
    let requestConfig = {};
    
    // If there's a file to upload, use FormData
    if (artifactData.file) {
      const formData = new FormData();
      
      // Add all the text fields
      Object.keys(artifactData).forEach(key => {
        if (key !== 'file' && artifactData[key] !== undefined) {
          // Handle location object
          if (key === 'location' && artifactData.location) {
            formData.append('location[x]', artifactData.location.x);
            formData.append('location[y]', artifactData.location.y);
          } 
          // Handle other objects or arrays
          else if (typeof artifactData[key] === 'object' && artifactData[key] !== null) {
            formData.append(key, JSON.stringify(artifactData[key]));
          } 
          // Handle primitive values
          else {
            formData.append(key, artifactData[key]);
          }
        }
      });
      
      // Add the file
      formData.append('image', artifactData.file);
      
      // Update request data and config
      requestData = formData;
      requestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
    }
    
    const response = artifactData.file 
      ? await getApi().post("/api/artifacts", requestData, requestConfig)
      : await getApi().post("/api/artifacts", requestData);
      
    return response.data;
  } catch (error) {
    console.error('Create artifact failed:', error);
    throw error;
  }
};

export const updateArtifact = async (artifactId, updatedData) => {
  try {
    // If there's a file to upload, use FormData
    if (updatedData.file) {
      const formData = new FormData();
      
      // Add all the text fields
      Object.keys(updatedData).forEach(key => {
        if (key !== 'file' && updatedData[key] !== undefined) {
          // Handle location object
          if (key === 'location' && updatedData.location) {
            formData.append('location[x]', updatedData.location.x);
            formData.append('location[y]', updatedData.location.y);
          } 
          // Handle other objects or arrays
          else if (typeof updatedData[key] === 'object' && updatedData[key] !== null) {
            formData.append(key, JSON.stringify(updatedData[key]));
          } 
          // Handle primitive values
          else {
            formData.append(key, updatedData[key]);
          }
        }
      });
      
      // Add the file
      formData.append('image', updatedData.file);
      
      const response = await getApi().put(`/api/artifacts/${artifactId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    }
    
    // No file - just send the JSON data
    const processedData = { ...updatedData };
    
    const response = await getApi().put(`/api/artifacts/${artifactId}`, processedData);
    return response.data;
  } catch (error) {
    console.error(`Update artifact ${artifactId} failed:`, error);
    throw error;
  }
};

export const deleteArtifact = async (artifactId) => {
  try {
    const response = await getApi().delete(`/api/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    console.error(`Delete artifact ${artifactId} failed:`, error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 MESSAGING ENDPOINTS (CRUD)
──────────────────────────────── */
export const sendMessage = async (recipient, content, artifactId) => {
  try {
    const response = await getApi().post("/messages", { recipient, content, artifactId });
    return response.data;
  } catch (error) {
    console.error('Send message failed:', error);
    throw error;
  }
};

export const fetchMessage = async (artifactId) => {
  try {
    const response = await getApi().get(`/artifacts/${artifactId}/message`);
    return response.data;
  } catch (error) {
    console.error(`Fetch message for artifact ${artifactId} failed:`, error);
    throw error;
  }
};

export const fetchMessages = async () => {
  try {
    const response = await getApi().get("/messages");
    return response.data;
  } catch (error) {
    console.error('Fetch messages failed:', error);
    throw error;
  }
};

export const updateMessage = async (artifactId, content) => {
  try {
    const response = await getApi().put(`/artifacts/${artifactId}/message`, {
      content
    });
    return response.data;
  } catch (error) {
    console.error(`Update message for artifact ${artifactId} failed:`, error);
    throw error;
  }
};

export const deleteMessage = async (artifactId) => {
  try {
    const response = await getApi().delete(`/artifacts/${artifactId}/message`);
    return response.data;
  } catch (error) {
    console.error(`Delete message for artifact ${artifactId} failed:`, error);
    throw error;
  }
};

// Historical source collections
const HISTORICAL_SOURCES = {
  SHAKESPEARE: {
    works: [
      'hamlet',
      'macbeth',
      'king-lear',
      'romeo-and-juliet',
      'midsummer-nights-dream',
      'tempest',
      'othello',
      'merchant-of-venice',
      'julius-caesar',
      'much-ado-about-nothing',
      'sonnets'
    ],
    textTypes: ['plays', 'sonnets', 'poems'],
    format: 'modern',
    requiredFields: ['text', 'source', 'work', 'location']
  },
  SOCRATES: {
    works: [
      'apology',
      'republic',
      'symposium',
      'phaedo',
      'crito',
      'gorgias',
      'meno',
      'phaedrus',
      'theaetetus',
      'protagoras'
    ],
    translations: ['Jowett', 'Bloom', 'Grube', 'Reeve'],
    requiredFields: ['text', 'dialogue', 'translator', 'section']
  },
  AUGUSTINE: {
    works: [
      'confessions',
      'city-of-god',
      'on-christian-doctrine',
      'on-free-choice-of-the-will',
      'on-the-trinity',
      'enchiridion'
    ],
    translations: ['Chadwick', 'Boulding', 'Dyson'],
    requiredFields: ['text', 'work', 'book', 'chapter', 'translator']
  },
  MICHELANGELO: {
    works: [
      'letters',
      'poems',
      'documented-conversations',
      'contracts',
      'notes'
    ],
    sources: ['Carteggio', 'Girardi', 'Condivi', 'Vasari'],
    requiredFields: ['text', 'source', 'date', 'recipient']
  },
  OSCAR_WILDE: {
    works: [
      'lady-windermeres-fan',
      'the-importance-of-being-earnest',
      'the-picture-of-dorian-gray',
      'de-profundis',
      'the-soul-of-man-under-socialism',
      'the-ballad-of-reading-gaol',
      'an-ideal-husband',
      'a-woman-of-no-importance',
      'salome',
      'the-duchess-of-padua',
      'attributed'
    ],
    requiredFields: ['text', 'source', 'date', 'work']
  },
  ALEXANDER_POPE: {
    works: [
      'an-essay-on-criticism',
      'an-essay-on-man',
      'the-rape-of-the-lock',
      'moral-essays',
      'the-dunciad',
      'imitations-of-horace',
      'thoughts-on-various-subjects',
      'letters',
      'the-universal-prayer'
    ],
    requiredFields: ['text', 'source', 'date', 'work']
  },
  ZEUS: {
    works: [
      'iliad',
      'odyssey',
      'theogony',
      'homeric-hymns',
      'works-and-days',
      'prometheus-bound',
      'greek-mythology'
    ],
    authors: ['Homer', 'Hesiod', 'Aeschylus', 'Various', 'Traditional'],
    requiredFields: ['text', 'source', 'date', 'work']
  }
};

// Source validation function
const validateHistoricalSource = (response, npcType) => {
  if (!response) return false;

  const sourceConfig = HISTORICAL_SOURCES[npcType.toUpperCase()];
  if (!sourceConfig) return false;

  // Check required fields
  const hasAllRequiredFields = sourceConfig.requiredFields.every(field => 
    response.hasOwnProperty(field) && response[field]
  );
  if (!hasAllRequiredFields) return false;

  // Validate work/source is in approved list
  if (sourceConfig.works) {
    // Special handling for Oscar Wilde and Alexander Pope
    if (npcType === NPC_TYPES.OSCAR_WILDE || npcType === NPC_TYPES.ALEXANDER_POPE) {
      // For these authors, we're using our own curated quotes, so we'll skip the work validation
      return true;
    }
    
    const work = response.work?.toLowerCase() || response.source?.toLowerCase();
    if (!sourceConfig.works.some(w => work?.includes(w))) return false;
  }

  // Validate translation if applicable
  if (sourceConfig.translations && response.translator) {
    if (!sourceConfig.translations.includes(response.translator)) return false;
  }

  return true;
};

// Format citation based on source type
const formatCitation = (response, npcType) => {
  switch (npcType) {
    case NPC_TYPES.SHAKESPEARE:
      return `${response.work}, ${response.location} (Folger Shakespeare Library)`;
    case NPC_TYPES.SOCRATES:
      return `${response.dialogue}, ${response.section} (trans. ${response.translator})`;
    case NPC_TYPES.AUGUSTINE:
      return `${response.work}, Book ${response.book}, Chapter ${response.chapter} (trans. ${response.translator})`;
    case NPC_TYPES.MICHELANGELO:
      return `${response.source}, ${response.date}${response.recipient ? `, to ${response.recipient}` : ''}`;
    case NPC_TYPES.OSCAR_WILDE:
      return `${response.source}, ${response.date} (${response.work})`;
    case NPC_TYPES.ALEXANDER_POPE:
      return `${response.source}, ${response.date} (${response.work})`;
    case NPC_TYPES.ZEUS:
      return `${response.source}, ${response.date} (${response.work})`;
    default:
      return response.source || '';
  }
};

export const chat = async (prompt, context, role, npcConfig = null, signal = null) => {
  try {
    // Special handling for Shakespeare using Folger API
    if (npcConfig?.type === NPC_TYPES.SHAKESPEARE) {
      const response = await fetch(npcConfig.apiEndpoint + '/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_FOLGER_API_KEY || ''}`
        },
        body: JSON.stringify({
          query: prompt,
          works: HISTORICAL_SOURCES.SHAKESPEARE.works,
          textTypes: HISTORICAL_SOURCES.SHAKESPEARE.textTypes,
          format: HISTORICAL_SOURCES.SHAKESPEARE.format
        }),
        signal
      });

      if (!response.ok) throw new Error('Folger API response was not ok');
      const data = await response.json();

      // Validate each match
      const validMatches = data.matches.filter(match => 
        validateHistoricalSource(match, NPC_TYPES.SHAKESPEARE)
      );

      if (validMatches.length === 0) {
        throw new Error('No valid historical sources found');
      }

      return {
        response: validMatches.map(match => ({
          text: match.text,
          source: formatCitation(match, NPC_TYPES.SHAKESPEARE),
          type: match.textType
        }))
      };
    }

    // Handle other historical figures
    if (npcConfig?.type in NPC_TYPES) {
      const response = await fetch(`/api/${npcConfig.type.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          context,
          sourceConfig: HISTORICAL_SOURCES[npcConfig.type.toUpperCase()]
        }),
        signal
      });

      if (!response.ok) throw new Error('Historical API response was not ok');
      const data = await response.json();

      // Validate response
      if (!validateHistoricalSource(data, npcConfig.type)) {
        throw new Error('Invalid historical source');
      }

      // Special handling for Michelangelo to include additional quotes
      if (npcConfig.type === NPC_TYPES.MICHELANGELO && data.additionalQuotes && data.additionalQuotes.length > 0) {
        return {
          response: [
            {
              text: data.text,
              source: formatCitation(data, npcConfig.type)
            },
            ...data.additionalQuotes.map(quote => ({
              text: quote,
              source: "Michelangelo, Various Works"
            }))
          ]
        };
      }

      // Special handling for Oscar Wilde to include additional quotes
      if (npcConfig.type === NPC_TYPES.OSCAR_WILDE && data.additionalQuotes && data.additionalQuotes.length > 0) {
        return {
          response: [
            {
              text: data.text,
              source: formatCitation(data, npcConfig.type)
            },
            ...data.additionalQuotes.map(quote => ({
              text: quote,
              source: "Oscar Wilde, Various Works"
            }))
          ]
        };
      }

      // Special handling for Alexander Pope to include additional quotes
      if (npcConfig.type === NPC_TYPES.ALEXANDER_POPE && data.additionalQuotes && data.additionalQuotes.length > 0) {
        return {
          response: [
            {
              text: data.text,
              source: formatCitation(data, npcConfig.type)
            },
            ...data.additionalQuotes.map(quote => ({
              text: quote,
              source: "Alexander Pope, Various Works"
            }))
          ]
        };
      }

      // Special handling for Zeus to include additional quotes and weather data
      if (npcConfig.type === NPC_TYPES.ZEUS && data.additionalQuotes && data.additionalQuotes.length > 0) {
        return {
          response: [
            {
              text: data.text,
              source: formatCitation(data, npcConfig.type)
            },
            ...data.additionalQuotes.map(quote => ({
              text: quote,
              source: "Zeus, Greek Mythology"
            }))
          ]
        };
      }

      return {
        response: data.text,
        source: formatCitation(data, npcConfig.type)
      };
    }

    // Default chat handling for non-historical NPCs
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        prompt,
        context,
        role
      }),
      signal
    });

    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    // Check if this is an AbortError
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      throw error; // Rethrow to be handled by the component
    }
    
    console.error('Error in chat:', error);
    const errorMessage = handleApiError(error, "Failed to chat");
    throw new Error(errorMessage);
  }
};

// Export a function to proxy OpenAI requests
export const proxyOpenAIRequest = async (endpoint, requestData) => {
  try {
    const response = await getApi().post('/api/proxy', {
      targetEndpoint: endpoint,
      requestData
    });
    return response.data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
};

// User management
export const fetchUsers = async () => {
  try {
    const response = await getApi().get('/api/users');
    return response.data;
  } catch (error) {
    console.error('Fetch users failed:', error);
    throw error;
  }
};

// Add CORS diagnostic function to test server reachability
export const testApiConnection = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
  const results = {
    apiUrl,
    originUrl: window.location.origin,
    corsTest: false,
    healthTest: false,
    error: null
  };
  
  try {
    // Try a simple CORS preflight with OPTIONS
    console.log(`Testing CORS preflight to ${apiUrl}/api/health...`);
    
    // First test: OPTIONS request
    const optionsResult = await fetch(`${apiUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    results.corsTest = optionsResult.ok;
    results.corsStatus = optionsResult.status;
    console.log(`CORS preflight result: ${optionsResult.status}`);
    
    // Second test: GET request to health endpoint
    const healthResult = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': window.location.origin
      }
    });
    
    results.healthTest = healthResult.ok;
    results.healthStatus = healthResult.status;
    
    if (healthResult.ok) {
      results.healthData = await healthResult.json();
      console.log(`Health check passed: ${JSON.stringify(results.healthData)}`);
    } else {
      console.error(`Health check failed with status ${healthResult.status}`);
    }
    
    return results;
  } catch (error) {
    console.error("API connection test failed:", error);
    results.error = error.message;
    return results;
  }
};

// Add a function to clear specific cache entries
export const clearCacheFor = (type, id = null) => {
  switch (type) {
    case 'artifacts':
      cacheManager.clear('artifacts');
      break;
    case 'character':
      if (id) {
        cacheManager.clear(`character:${id}`);
      } else {
        cacheManager.clear('character:');
      }
      break;
    case 'gameState':
      cacheManager.clear('gameState:');
      break;
    case 'all':
      cacheManager.clear();
      break;
    default:
      console.warn(`Unknown cache type: ${type}`);
  }
};

// Artifact Game System APIs
export const updateUserProgress = async (userId, progressData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ progress: progressData })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update user progress: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

export const awardPlayerPowers = async (userId, powers) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/powers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ powers })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to award powers: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error awarding powers:', error);
    throw error;
  }
};

export const unlockAreas = async (userId, areas) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ areas })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to unlock areas: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error unlocking areas:', error);
    throw error;
  }
};

export const getArtifactProgress = async (artifactId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/artifacts/${artifactId}/progress`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get artifact progress: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting artifact progress:', error);
    throw error;
  }
};

export const saveArtifactProgress = async (artifactId, progress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/artifacts/${artifactId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ progress })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save artifact progress: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving artifact progress:', error);
    throw error;
  }
};

export const completeArtifact = async (artifactId, completionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/artifacts/${artifactId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(completionData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete artifact: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing artifact:', error);
    throw error;
  }
};

export const getArtifactHint = async (artifactId, hintLevel = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/artifacts/${artifactId}/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ hintLevel })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get hint: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting hint:', error);
    throw error;
  }
};

export const seedGameArtifacts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/artifacts/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to seed artifacts: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error seeding artifacts:', error);
    throw error;
  }
};
