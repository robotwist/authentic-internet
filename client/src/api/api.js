import axios from "axios";
import { NPC_TYPES } from "../components/Constants";

// Display build information in console for tracking deployments
const displayBuildInfo = () => {
  const buildDate = new Date().toISOString();
  const buildEnv = import.meta.env.MODE || 'development';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  
  console.info(`%cApplication Build Info:
  🔹 Environment: ${buildEnv}
  🔹 Build Date: ${buildDate}
  🔹 API URL: ${apiUrl}
  🔹 Base URL: ${window.location.origin}`,
  'color: #6366F1; font-weight: bold;');
  
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
        
        // Handle 401 Unauthorized
        if (status === 401) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
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
const HEALTH_CHECK_THROTTLE_MS = 10000; // Limit health checks to once per 10 seconds
let healthCheckInProgress = false; // Flag to prevent concurrent health checks

// Function to check server health
const checkServerHealth = async (url) => {
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
  // Schedule async health check but don't wait for it
  if (!isApiInitialized) {
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
export const loginUser = async (identifier, password) => {
  try {
    const response = await getApi().post('/api/auth/login', {
      identifier,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await getApi().post('/api/auth/register', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const verifyToken = async () => {
  try {
    const response = await getApi().post('/api/auth/verify');
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 CHARACTER ENDPOINTS
──────────────────────────────── */
export const fetchCharacter = async (userId) => {
  try {
    const response = await getApi().get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Fetch character for user ${userId} failed:`, error);
    throw error;
  }
};

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
export const fetchArtifacts = async (filterOptions = {}) => {
  try {
    const response = await getApi().get("/api/artifacts");
    return response.data;
  } catch (error) {
    console.error('Fetch artifacts failed:', error);
    throw error;
  }
};

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
