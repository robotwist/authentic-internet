import axios from "axios";
import { NPC_TYPES } from "../components/Constants";

// Display build information in console for tracking deployments
const displayBuildInfo = () => {
  const buildDate = new Date().toISOString();
  const buildEnv = import.meta.env.MODE || 'development';
  console.info(`%cApplication Build Info:
  🔹 Environment: ${buildEnv}
  🔹 Build Date: ${buildDate}
  🔹 API URL: ${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`,
  'color: #6366F1; font-weight: bold;');
};

// Call this on app initialization (only in non-production)
if (import.meta.env.MODE !== 'production') {
  displayBuildInfo();
}

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

// Initialize API with the configured URL
let API = createApiInstance(configuredApiUrl);

// Store alternative ports to try if the main one is unavailable
const alternativePorts = [5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];
let isApiInitialized = false;
let currentApiUrl = configuredApiUrl;

// Function to check server health
const checkServerHealth = async (url) => {
  try {
    const response = await axios.get(`${url}/api/health`, { 
      timeout: 5000,
      validateStatus: (status) => status === 200
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Initialize API with port detection
const initApi = async () => {
  if (isApiInitialized) return;

  try {
    // Try with the configured URL first
    if (await checkServerHealth(configuredApiUrl)) {
      if (import.meta.env.MODE !== 'production') {
        console.log(`✅ Connected to API at ${configuredApiUrl}`);
      }
      API = createApiInstance(configuredApiUrl);
      currentApiUrl = configuredApiUrl;
      isApiInitialized = true;
      return;
    }

    // Try alternative ports
    for (const port of alternativePorts) {
      const url = `http://localhost:${port}`;
      if (await checkServerHealth(url)) {
        if (import.meta.env.MODE !== 'production') {
          console.log(`✅ Connected to API at ${url}`);
        }
        API = createApiInstance(url);
        currentApiUrl = url;
        isApiInitialized = true;
        return;
      }
    }

    throw new Error('No available API server found');
  } catch (error) {
    console.error('Failed to initialize API:', error);
    throw error;
  }
};

// Initialize API on import
initApi().catch(error => {
  console.error('API initialization failed:', error);
  // In development, show a more user-friendly error
  if (import.meta.env.MODE !== 'production') {
    alert('Failed to connect to the server. Please ensure the server is running and try again.');
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
export const loginUser = async (username, password) => {
  try {
    const response = await API.post('/api/auth/login', {
      identifier: username,
      password
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await API.post('/api/auth/register', {
      username,
      email,
      password
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const verifyToken = async () => {
  try {
    const response = await API.get('/api/auth/verify');
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

/* ────────────────────────────────
   🔹 CHARACTER ENDPOINTS
──────────────────────────────── */
export const fetchCharacter = async (userId) => {
  try {
    // Check if we have a token before making the request
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Skipping character fetch - no authentication token");
      return null;
    }

    // Validate userId
    if (!userId) {
      console.log("Skipping character fetch - no userId provided");
      return null;
    }

    const response = await API.get(`/api/users/${userId}`);
    console.log("Character data response:", response); // Debugging log
    return response.data;
  } catch (error) {
    // Don't log the full error for 401 errors as they're expected when not logged in
    if (error.response && error.response.status === 401) {
      console.log("Unable to fetch character: Authentication required");
    } else {
      console.error("Error fetching character:", error);
    }
    
    // Return null instead of throwing to prevent UI crashes
    return null;
  }
};

export const updateCharacter = async (updatedCharacter) => {
  try {
    const userId = updatedCharacter._id || updatedCharacter.id;
    if (!userId) {
      throw new Error("Character ID is required for update");
    }
    
    // Validate character data
    if (updatedCharacter.username !== undefined && updatedCharacter.username.trim().length < 1) {
      throw new Error('Username is required');
    }
    
    // Process data - trim strings, convert numbers, etc.
    const processedData = { ...updatedCharacter };
    if (processedData.username) processedData.username = processedData.username.trim();
    if (processedData.bio) processedData.bio = processedData.bio.trim();
    
    // If position/location is being updated, ensure it has numeric values
    if (processedData.position) {
      processedData.position = {
        x: Number(processedData.position.x),
        y: Number(processedData.position.y)
      };
    }
    
    console.log("Updating character with data:", processedData);
    const response = await API.put(`/api/users/${userId}`, processedData);
    console.log("✅ Character updated successfully:", response.data);
    return response.data.user;
  } catch (error) {
    console.error("❌ Error updating character:", error);
    const errorMessage = handleApiError(error, "Failed to update character");
    throw new Error(errorMessage);
  }
};

/* ────────────────────────────────
   🔹 ARTIFACT ENDPOINTS (CRUD)
──────────────────────────────── */
export const fetchArtifacts = async () => {
  try {
    console.log("Fetching artifacts from server...");
    const response = await API.get("/api/artifacts");
    
    // Check if the response contains an array of artifacts
    if (Array.isArray(response.data)) {
      console.log(`Successfully fetched ${response.data.length} artifacts:`, response.data);
      return response.data;
    } else {
      console.warn("Server returned non-array response for artifacts:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error("Server response error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    // Don't throw the error, return empty array to prevent UI crashes
    return [];
  }
};

export const createArtifact = async (artifactData) => {
  try {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("You must be logged in to create artifacts");
    }
    
    // Validate artifact data
    if (!artifactData.name || artifactData.name.trim().length < 1) {
      throw new Error('Artifact name is required');
    }
    if (!artifactData.description || artifactData.description.trim().length < 1) {
      throw new Error('Artifact description is required');
    }
    if (!artifactData.content || artifactData.content.trim().length < 1) {
      // Set content to description if missing
      artifactData.content = artifactData.description;
    }
    
    // Ensure location data is valid
    if (!artifactData.location || 
        (typeof artifactData.location.x !== 'number' && typeof artifactData.location.x !== 'string') ||
        (typeof artifactData.location.y !== 'number' && typeof artifactData.location.y !== 'string')) {
      throw new Error('Valid location coordinates are required');
    }

    // Create FormData for file uploads if needed
    let requestData;
    let requestConfig = {};
    
    if (artifactData instanceof FormData) {
      // It's already FormData
      requestData = artifactData;
      requestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
    } else {
      // Ensure all required fields are present and properly formatted
      const processedData = {
        ...artifactData,
        name: artifactData.name.trim(),
        description: artifactData.description.trim(),
        content: artifactData.content.trim(),
        area: artifactData.area || "Overworld",
        location: {
          x: Number(artifactData.location.x),
          y: Number(artifactData.location.y)
        }
      };
      
      // Send as JSON
      requestData = processedData;
      console.log("Processing artifact data:", requestData);
    }

    // Make API request
    console.log("Sending artifact data:", requestData);
    const response = artifactData instanceof FormData
      ? await API.post("/api/artifacts", requestData, requestConfig)
      : await API.post("/api/artifacts", requestData);

    console.log("Created artifact:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating artifact:", error);
    // Format the error message nicely
    const errorMessage = handleApiError(error, 'Failed to create artifact');
    throw new Error(errorMessage);
  }
};

export const updateArtifact = async (artifactId, updatedData) => {
  try {
    if (!artifactId) {
      throw new Error('Artifact ID is required for updates');
    }

    // Check if we're dealing with FormData (file uploads)
    if (updatedData instanceof FormData) {
      console.log("Updating artifact with file attachment:", artifactId);
      
      // Ensure the FormData object has the artifact ID
      if (!updatedData.has('id') && !updatedData.has('_id')) {
        updatedData.append('id', artifactId);
      }
      
      // For FormData, we need to set the correct axios config
      // Note: We do NOT set Content-Type here - axios will automatically set the correct
      // multipart/form-data boundary header when it detects FormData
      const response = await API.put(`/api/artifacts/${artifactId}`, updatedData, {
        headers: {
          // Let axios set the correct Content-Type with boundary
          // 'Content-Type' is intentionally omitted
        }
      });
      
      console.log("Updated artifact with file:", response.data);
      return response.data;
    }
    
    // Regular JSON update (no files) - validate only fields that are provided
    const processedData = { ...updatedData };
    
    // Only validate name if provided
    if (processedData.name !== undefined) {
      if (processedData.name.trim().length < 1) {
        throw new Error('Artifact name cannot be empty');
      }
      processedData.name = processedData.name.trim();
    }
    
    // Only validate description if provided
    if (processedData.description !== undefined) {
      if (processedData.description.trim().length < 1) {
        throw new Error('Artifact description cannot be empty');
      }
      processedData.description = processedData.description.trim();
    }
    
    // Only validate content if provided
    if (processedData.content !== undefined) {
      if (processedData.content.trim().length < 1) {
        throw new Error('Artifact content cannot be empty');
      }
      processedData.content = processedData.content.trim();
    }
    
    // Process location data if provided
    if (processedData.location) {
      // Validate location coordinates
      if ((typeof processedData.location.x !== 'number' && typeof processedData.location.x !== 'string') ||
          (typeof processedData.location.y !== 'number' && typeof processedData.location.y !== 'string')) {
        throw new Error('Valid location coordinates are required');
      }
      
      // Ensure location values are numbers
      processedData.location = {
        x: Number(processedData.location.x),
        y: Number(processedData.location.y)
      };
    }
    
    console.log("Updating artifact with data:", processedData);
    const response = await API.put(`/api/artifacts/${artifactId}`, processedData);
    console.log("Updated artifact:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating artifact:", error);
    // Create a user-friendly error message
    let errorMessage = 'Failed to update artifact';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export const deleteArtifact = async (artifactId) => {
  try {
    const response = await API.delete(`/api/artifacts/${artifactId}`);
    console.log("Deleted artifact:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting artifact:", error);
    throw error.response?.data?.message || error.message || 'Failed to delete artifact';
  }
};

/* ────────────────────────────────
   🔹 MESSAGING ENDPOINTS (CRUD)
──────────────────────────────── */
export const sendMessage = async (recipient, content, artifactId = null) => {
  try {
    console.log("🚀 Sending message payload:", { recipient, content, artifactId });
    const response = await API.post("/messages", { recipient, content, artifactId });
    return response.data;
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
    const errorMessage = handleApiError(error, "Failed to send message");
    throw new Error(errorMessage);
  }
};

export const fetchMessage = async (artifactId) => {
  try {
    const response = await API.get(`/artifacts/${artifactId}/message`);
    console.log("Fetched message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    const errorMessage = handleApiError(error, "Failed to fetch message");
    throw new Error(errorMessage);
  }
};

export const fetchMessages = async () => {
  try {
    const response = await API.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    const errorMessage = handleApiError(error, "Failed to fetch messages");
    throw new Error(errorMessage);
  }
};

export const updateMessage = async (artifactId, messageText) => {
  try {
    // Validate inputs
    if (!artifactId) {
      throw new Error("Artifact ID is required");
    }
    
    // Ensure messageText is a string and trim it
    const processedMessage = messageText ? messageText.trim() : "";
    
    console.log(`Updating message for artifact ${artifactId}:`, processedMessage);
    
    const response = await API.put(`/artifacts/${artifactId}/message`, { 
      messageText: processedMessage 
    });
    
    console.log("Updated message response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating message:", error);
    const errorMessage = handleApiError(error, "Failed to update message");
    throw new Error(errorMessage);
  }
};

export const deleteMessage = async (artifactId) => {
  try {
    const response = await API.delete(`/artifacts/${artifactId}/message`);
    console.log("Deleted message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting message:", error);
    const errorMessage = handleApiError(error, "Failed to delete message");
    throw new Error(errorMessage);
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
