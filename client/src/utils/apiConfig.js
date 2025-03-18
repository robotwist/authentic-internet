/**
 * Central configuration for all external APIs used in the project
 * This file consolidates all API endpoints and keys in one place
 */

// Environment variables
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'a5913e247d4c4ed5bd721932251402';
const QUOTES_API_KEY = import.meta.env.VITE_QUOTES_API_KEY || 'free-tier';

// API Base URLs
export const API_CONFIG = {
  // Weather API (OpenWeatherMap)
  weather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: WEATHER_API_KEY,
    endpoints: {
      current: '/weather',
      forecast: '/forecast'
    }
  },
  
  // Quotable API (free to use)
  quotable: {
    baseUrl: 'https://api.quotable.io',
    apiKey: null, // No API key needed
    endpoints: {
      random: '/random',
      today: '/random', // Using random as fallback since 'today' endpoint doesn't exist
      quotes: '/quotes',
      authors: '/authors',
      tags: '/tags',
      search: '/search/quotes'
    }
  },
  
  // ZenQuotes API (free to use)
  zenQuotes: {
    baseUrl: 'https://zenquotes.io/api',
    apiKey: null, // No API key needed
    endpoints: {
      random: '/random',
      today: '/today',
      quotes: '/quotes'
    }
  },
  
  // Folger Shakespeare Library API (free to use)
  folger: {
    baseUrl: 'https://www.folgerdigitaltexts.org',
    apiEndpoint: 'https://folgerdigitaltexts.org/api',
    apiKey: null, // No API key needed
    endpoints: {
      random: '/random_quote',
      play: (play) => `/${play}`,
      line: (play, line) => `/${play}/ftln/${line}`
    }
  }
};

/**
 * Helper function to construct a full API URL with parameters
 * @param {string} apiName - The name of the API from API_CONFIG
 * @param {string} endpoint - The endpoint to use
 * @param {Object} params - Query parameters to include
 * @returns {string} The full URL
 */
export const buildApiUrl = (apiName, endpoint, params = {}) => {
  const config = API_CONFIG[apiName];
  if (!config) {
    throw new Error(`Unknown API: ${apiName}`);
  }
  
  let url;
  if (typeof endpoint === 'function') {
    // Handle function endpoints like folger.endpoints.play('Ham')
    url = `${config.baseUrl}${endpoint}`;
  } else {
    // Handle string endpoints
    url = `${config.baseUrl}${config.endpoints[endpoint] || endpoint}`;
  }
  
  // Add API key if available
  if (config.apiKey) {
    params.apiKey = config.apiKey;
  }
  
  // Add query parameters
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};

export default API_CONFIG; 