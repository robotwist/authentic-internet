import axios from "axios";
import { NPC_TYPES } from "../components/Constants";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Helper function to handle API errors
const handleApiError = (error, defaultMessage = "An error occurred") => {
  console.error("API Error details:", error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return error.response.data?.message || error.response.data?.error || defaultMessage;
  } else if (error.request) {
    // The request was made but no response was received
    console.log("No response received:", error.request);
    return "No response from server. Please check your network connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || defaultMessage;
  }
};

// 🔹 Attach Token to Requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Handle token expiration and errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.warn("Authentication error detected, clearing session");
      
      // Clear token and user data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

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
    // Use the Netlify proxy redirect path for the API call
    const response = await API.post("/api/auth/login", { 
      identifier: username, 
      password 
    });
    
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      
      // Store user data if available
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      return response.data;
    } else {
      throw new Error("Invalid response from server: No authentication token received");
    }
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = handleApiError(error, "Login failed. Please check your credentials.");
    throw new Error(errorMessage);
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await API.post("/api/auth/register", { username, password });
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    handleError(error);
  }
};

/* ────────────────────────────────
   🔹 CHARACTER ENDPOINTS
──────────────────────────────── */
export const fetchCharacter = async (userId) => {
  try {
    const response = await API.get(`/api/users/${userId}`);
    console.log("Character data response:", response); // Debugging log
    return response.data;
  } catch (error) {
    console.error("Error fetching character:", error);
    handleError(error);
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
    handleError(error);
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
    // Validate artifact data
    if (updatedData.name !== undefined && updatedData.name.trim().length < 1) {
      throw new Error('Artifact name is required');
    }
    if (updatedData.description !== undefined && updatedData.description.trim().length < 1) {
      throw new Error('Artifact description is required');
    }
    if (updatedData.content !== undefined && updatedData.content.trim().length < 1) {
      throw new Error('Artifact content is required');
    }
    
    // Ensure location data is valid if it's being updated
    if (updatedData.location) {
      if ((typeof updatedData.location.x !== 'number' && typeof updatedData.location.x !== 'string') ||
          (typeof updatedData.location.y !== 'number' && typeof updatedData.location.y !== 'string')) {
        throw new Error('Valid location coordinates are required');
      }
      
      // Ensure location values are numbers
      updatedData.location = {
        x: Number(updatedData.location.x),
        y: Number(updatedData.location.y)
      };
    }

    // Process string fields to trim whitespace
    const processedData = { ...updatedData };
    if (processedData.name) processedData.name = processedData.name.trim();
    if (processedData.description) processedData.description = processedData.description.trim();
    if (processedData.content) processedData.content = processedData.content.trim();
    
    console.log("Updating artifact with data:", processedData);
    const response = await API.put(`/api/artifacts/${artifactId}`, processedData);
    console.log("Updated artifact:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating artifact:", error);
    throw error.response?.data?.message || error.message || 'Failed to update artifact';
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
    handleError(error);
    return null;
  }
};

export const fetchMessage = async (artifactId) => {
  try {
    const response = await API.get(`/artifacts/${artifactId}/message`);
    console.log("Fetched message:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
};

export const fetchMessages = async () => {
  try {
    const response = await API.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    handleError(error);
    return [];
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
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to update message';
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
    throw error;
  }
};

/* ────────────────────────────────
   🔹 ERROR HANDLING FUNCTION
──────────────────────────────── */
const handleError = (error) => {
  if (error.response) {
    console.error("Backend error:", error.response.data);
    throw error.response.data;
  } else if (error.request) {
    console.error("Network error:", error.request);
    throw new Error("Network error, please try again later.");
  } else {
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};

export default API;
