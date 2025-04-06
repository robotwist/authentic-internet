/**
 * API Efficiency Module
 * 
 * Enhances API functions with caching and performance optimizations.
 * Works alongside the main API module to provide better performance.
 */

import { trackError, ERROR_CATEGORIES, createErrorHandler } from '../utils/errorTracker';
import { withCache, cacheDurations, clearCacheByPattern, clearAllCache } from '../utils/cacheManager';
import axios from 'axios';

// Cache durations specific to game functionality
const GAME_CACHE_DURATIONS = {
  artifacts: cacheDurations.medium,     // 5 minutes for artifacts
  characters: cacheDurations.medium,    // 5 minutes for character data
  gameState: cacheDurations.short,      // 1 minute for game state (changes frequently)
  worlds: cacheDurations.long,          // 15 minutes for world data (rarely changes)
  leaderboard: cacheDurations.medium,   // 5 minutes for leaderboard data
  achievements: cacheDurations.medium,  // 5 minutes for achievements
  inventory: cacheDurations.short       // 1 minute for inventory (changes frequently)
};

/**
 * Wraps the API instance to provide caching for GET requests
 * 
 * @param {Object} apiInstance - Axios API instance to enhance
 * @returns {Object} Enhanced API instance with caching
 */
export const enhanceApiWithCaching = (apiInstance) => {
  // Store the original get method
  const originalGet = apiInstance.get;
  
  // Replace with cached version
  apiInstance.get = withCache(
    async (url, config = {}) => {
      try {
        const response = await originalGet(url, config);
        return response.data;
      } catch (error) {
        // Use the error tracker to log API errors
        trackError(`API GET error: ${url}`, {
          category: ERROR_CATEGORIES.API,
          originalError: error,
          context: { url, config }
        });
        throw error;
      }
    },
    { 
      // Generate cache key based on URL and params
      keyFn: (url, config = {}) => {
        const params = config.params ? JSON.stringify(config.params) : '';
        return `api::get::${url}::${params}`;
      },
      // Use medium duration by default
      duration: cacheDurations.medium
    }
  );
  
  // Enhance the API with direct cached methods for specific resources
  return {
    ...apiInstance,
    
    // Cached resource getters
    getArtifacts: withCache(
      async (params = {}) => {
        try {
          const response = await originalGet('/artifacts', { params });
          return response.data;
        } catch (error) {
          createErrorHandler('getArtifacts', ERROR_CATEGORIES.API)(error);
          throw error;
        }
      },
      { duration: GAME_CACHE_DURATIONS.artifacts }
    ),
    
    getCharacter: withCache(
      async (characterId, params = {}) => {
        try {
          const response = await originalGet(`/characters/${characterId}`, { params });
          return response.data;
        } catch (error) {
          createErrorHandler('getCharacter', ERROR_CATEGORIES.API)(error);
          throw error;
        }
      },
      { 
        duration: GAME_CACHE_DURATIONS.characters,
        keyFn: (characterId, params = {}) => {
          const paramsStr = params ? JSON.stringify(params) : '';
          return `api::getCharacter::${characterId}::${paramsStr}`;
        }
      }
    ),
    
    getGameState: withCache(
      async (userId = null) => {
        try {
          // Use current user if userId not provided
          const endpoint = userId ? `/game-state/${userId}` : '/game-state';
          const response = await originalGet(endpoint);
          return response.data;
        } catch (error) {
          createErrorHandler('getGameState', ERROR_CATEGORIES.API)(error);
          throw error;
        }
      },
      { 
        duration: GAME_CACHE_DURATIONS.gameState,
        keyFn: (userId) => {
          // If no userId provided, get from localStorage
          const id = userId || localStorage.getItem('userId') || 'current';
          return `api::getGameState::${id}`;
        }
      }
    ),
    
    getWorld: withCache(
      async (worldId) => {
        try {
          const response = await originalGet(`/worlds/${worldId}`);
          return response.data;
        } catch (error) {
          createErrorHandler('getWorld', ERROR_CATEGORIES.API)(error);
          throw error;
        }
      },
      { 
        duration: GAME_CACHE_DURATIONS.worlds,
        keyFn: (worldId) => `api::getWorld::${worldId}`
      }
    ),
    
    getLeaderboard: withCache(
      async (limit = 10) => {
        try {
          const response = await originalGet('/leaderboard', { params: { limit } });
          return response.data;
        } catch (error) {
          createErrorHandler('getLeaderboard', ERROR_CATEGORIES.API)(error);
          throw error;
        }
      },
      { 
        duration: GAME_CACHE_DURATIONS.leaderboard,
        keyFn: (limit) => `api::getLeaderboard::${limit}`
      }
    ),
    
    // Cache management functions
    clearResourceCache: (resourceType, id = null) => {
      let pattern;
      
      switch (resourceType) {
        case 'artifacts':
          pattern = 'api::getArtifacts';
          break;
        case 'character':
          pattern = id ? `api::getCharacter::${id}` : 'api::getCharacter';
          break;
        case 'gameState':
          pattern = id ? `api::getGameState::${id}` : 'api::getGameState';
          break;
        case 'world':
          pattern = id ? `api::getWorld::${id}` : 'api::getWorld';
          break;
        case 'leaderboard':
          pattern = 'api::getLeaderboard';
          break;
        case 'all':
          clearAllCache();
          return;
        default:
          trackError(`Unknown resource type: ${resourceType}`, {
            category: ERROR_CATEGORIES.API,
            level: 'warning'
          });
          return;
      }
      
      clearCacheByPattern(pattern);
    },
    
    // Clear cache when resources are modified
    invalidateCache: (resourceType, id = null) => {
      // Clear directly affected resource
      if (resourceType && resourceType !== 'all') {
        apiInstance.clearResourceCache(resourceType, id);
      }
      
      // Clear related resources based on dependencies
      switch (resourceType) {
        case 'character':
          // Character changes affect game state
          apiInstance.clearResourceCache('gameState');
          break;
        case 'gameState':
          // Game state changes might affect leaderboard
          apiInstance.clearResourceCache('leaderboard');
          break;
        case 'all':
          clearAllCache();
          break;
      }
    }
  };
};

// Helper function to determine if a request should be cached
export const shouldCacheRequest = (url, method) => {
  // Only cache GET requests
  if (method.toLowerCase() !== 'get') return false;
  
  // Don't cache authentication requests
  if (url.includes('/auth/')) return false;
  
  // Don't cache health checks
  if (url.includes('/health')) return false;
  
  return true;
};

// Export a function to initialize the enhanced API
export const initializeEnhancedApi = (baseApiInstance) => {
  return enhanceApiWithCaching(baseApiInstance);
};

export default {
  enhanceApiWithCaching,
  shouldCacheRequest,
  initializeEnhancedApi,
  GAME_CACHE_DURATIONS
}; 