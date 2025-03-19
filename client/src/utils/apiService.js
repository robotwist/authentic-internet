import axios from 'axios';
import { API_CONFIG, buildApiUrl } from './apiConfig';

// Authentication
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(buildApiUrl('/auth/login'), credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(buildApiUrl('/auth/register'), userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(buildApiUrl('/auth/logout'));
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Character
export const getCharacterData = async (characterId) => {
  try {
    const response = await axios.get(buildApiUrl(`/characters/${characterId}`));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCharacter = async (characterId, updateData) => {
  try {
    const response = await axios.patch(buildApiUrl(`/characters/${characterId}`), updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Game related
export const saveGameState = async (gameData) => {
  try {
    const response = await axios.post(buildApiUrl('/game/save'), gameData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loadGameState = async (userId) => {
  try {
    const response = await axios.get(buildApiUrl(`/game/load/${userId}`));
    return response.data;
  } catch (error) {
    throw error;
  }
};

// NPC interactions
export const interactWithNPC = async (npcId, prompt, npcType) => {
  try {
    const response = await axios.post(buildApiUrl(`/npcs/${npcType}`), {
      npcId,
      prompt
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Artifact interactions
export const getArtifactData = async (artifactId) => {
  try {
    const response = await axios.get(buildApiUrl(`/artifacts/${artifactId}`));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const collectArtifact = async (characterId, artifactId) => {
  try {
    const response = await axios.post(buildApiUrl('/artifacts/collect'), {
      characterId,
      artifactId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const dropArtifact = async (characterId, artifactId) => {
  try {
    const response = await axios.post(buildApiUrl('/artifacts/drop'), {
      characterId,
      artifactId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const trackArtifactInteraction = async (artifactId, interactionType) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not authenticated, skipping interaction tracking');
      return null;
    }
    
    const response = await fetch(`/api/artifacts/${artifactId}/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ interactionType })
    });
    
    if (!response.ok) {
      throw new Error('Failed to track interaction');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error tracking ${interactionType} interaction:`, error);
    return null;
  }
};

// User settings and preferences
export const updateUserSettings = async (userId, settings) => {
  try {
    const response = await axios.patch(buildApiUrl(`/users/${userId}/settings`), settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Quotes APIs for welcome page and daily wisdom
export const getRandomShakespeareQuote = async () => {
  try {
    // Try to get from our server endpoint first
    const response = await axios.post(buildApiUrl('/npcs/shakespeare'), {
      prompt: "Share a quote about wisdom or life"
    });
    
    if (response.data && response.data.response) {
      return { quote: response.data.response };
    }
    
    // Fallback to external API if available
    throw new Error('Server quote unavailable');
  } catch (error) {
    // Try external Shakespeare API
    try {
      const response = await axios.get('https://api.allorigins.win/raw?url=' + 
        encodeURIComponent('https://shakespeare-quotes-gen.herokuapp.com/api/v1/quotes/random'));
      if (response.data && response.data.quote) {
        return response.data;
      }
      throw new Error('External API failed');
    } catch (externalError) {
      console.error('Shakespeare quote API failed:', externalError);
      throw externalError;
    }
  }
};

export const getZenQuote = async () => {
  try {
    // Try to get from our server endpoint first
    const response = await axios.post(buildApiUrl('/npcs/zen'), {
      prompt: "Share a quote about wisdom"
    });
    
    if (response.data && response.data.response) {
      return { 
        q: response.data.response,
        a: "Zen Master" 
      };
    }
    
    // Fallback to external API if available
    throw new Error('Server quote unavailable');
  } catch (error) {
    // Try external Zen Quotes API
    try {
      const response = await axios.get('https://api.allorigins.win/raw?url=' + 
        encodeURIComponent('https://zenquotes.io/api/random'));
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('External API failed');
    } catch (externalError) {
      console.error('Zen quote API failed:', externalError);
      throw externalError;
    }
  }
};

export const getQuoteForArtifact = async (artifactType) => {
  try {
    // Map artifact types to NPC types for quote retrieval
    const npcTypeMap = {
      'scroll': 'shakespeare',
      'book': 'philosopher',
      'tablet': 'zen',
      'journal': 'john_muir',
      'map': 'explorer'
    };
    
    const npcType = npcTypeMap[artifactType] || 'shakespeare';
    
    const response = await axios.post(buildApiUrl(`/npcs/${npcType}`), {
      prompt: "Share wisdom about nature and exploration"
    });
    
    if (response.data && response.data.response) {
      return {
        text: response.data.response,
        source: getNpcNameFromType(npcType),
        npcType: npcType
      };
    }
    throw new Error('Server quote unavailable');
  } catch (error) {
    console.error('Failed to get artifact quote:', error);
    throw error;
  }
};

// Helper function to get display name from NPC type
function getNpcNameFromType(npcType) {
  const npcNames = {
    'shakespeare': 'William Shakespeare',
    'philosopher': 'Ancient Philosopher',
    'zen': 'Zen Master',
    'john_muir': 'John Muir',
    'explorer': 'Explorer'
  };
  
  return npcNames[npcType] || 'Scholar';
} 