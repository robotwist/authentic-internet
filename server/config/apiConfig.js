/**
 * Centralized API configuration for server
 * Keeps all API endpoints, keys and configurations in one place
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extract API keys from environment
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const QUOTABLE_API_KEY = process.env.QUOTABLE_API_KEY || '';
const ZENQUOTES_API_KEY = process.env.ZENQUOTES_API_KEY || '';

/**
 * API configuration object with all endpoints and keys
 */
export const API_CONFIG = {
  // Weather API (OpenWeatherMap)
  weather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: WEATHER_API_KEY,
    endpoints: {
      current: '/weather',
      forecast: '/forecast'
    },
    defaultParams: {
      units: 'metric'
    }
  },
  
  // Quotable API 
  quotable: {
    baseUrl: 'https://api.quotable.io',
    apiKey: QUOTABLE_API_KEY,
    endpoints: {
      random: '/random',
      today: '/today',
      quotes: '/quotes',
      search: '/search/quotes',
      authors: '/authors',
      tags: '/tags'
    }
  },
  
  // ZenQuotes API
  zenQuotes: {
    baseUrl: 'https://zenquotes.io/api',
    apiKey: ZENQUOTES_API_KEY,
    endpoints: {
      random: '/random',
      today: '/today',
      quotes: '/quotes'
    }
  },
  
  // Folger Shakespeare API
  folger: {
    baseUrl: 'https://www.folgerdigitaltexts.org',
    endpoints: {
      random: '/api/random_quote'
    },
    plays: {
      hamlet: 'Ham',
      macbeth: 'Mac',
      kingLear: 'Lr',
      romeo: 'Rom',
      tempest: 'Tmp',
      midsummer: 'MND',
      othello: 'Oth',
      juliusCaesar: 'JC',
      merchantOfVenice: 'MV',
      muchAdo: 'Ado'
    }
  }
};

/**
 * Get the full API URL for a specific service and endpoint
 * @param {string} service - The API service (e.g., 'weather', 'quotable')
 * @param {string} endpoint - The endpoint name as defined in the config
 * @returns {string} The complete URL
 */
export const buildApiUrl = (service, endpoint) => {
  if (!API_CONFIG[service]) {
    throw new Error(`Service "${service}" not found in API configuration`);
  }
  
  if (!API_CONFIG[service].endpoints[endpoint]) {
    throw new Error(`Endpoint "${endpoint}" not found for service "${service}"`);
  }
  
  return `${API_CONFIG[service].baseUrl}${API_CONFIG[service].endpoints[endpoint]}`;
};

/**
 * Get API parameters including the API key if required
 * @param {string} service - The API service (e.g., 'weather', 'quotable') 
 * @param {Object} customParams - Additional parameters to include
 * @returns {Object} Combined parameters
 */
export const getApiParams = (service, customParams = {}) => {
  if (!API_CONFIG[service]) {
    throw new Error(`Service "${service}" not found in API configuration`);
  }
  
  const params = { ...customParams };
  
  // Add default parameters if they exist
  if (API_CONFIG[service].defaultParams) {
    Object.assign(params, API_CONFIG[service].defaultParams);
  }
  
  // Add API key with the correct parameter name depending on the service
  if (API_CONFIG[service].apiKey) {
    switch (service) {
      case 'weather':
        params.appid = API_CONFIG[service].apiKey;
        break;
      case 'zenQuotes':
        params.apikey = API_CONFIG[service].apiKey;
        break;
      default:
        // For most APIs, use api_key as the parameter name
        if (API_CONFIG[service].apiKey) {
          params.api_key = API_CONFIG[service].apiKey;
        }
    }
  }
  
  return params;
};

export default API_CONFIG; 