/**
 * Cache Manager
 * Provides utilities for caching API responses to improve performance
 */

import { trackError, ERROR_CATEGORIES } from './errorTracker';

// Default cache durations in milliseconds
export const cacheDurations = {
  short: 1000 * 60, // 1 minute
  medium: 1000 * 60 * 5, // 5 minutes
  long: 1000 * 60 * 15, // 15 minutes
  session: 1000 * 60 * 30, // 30 minutes
  
  // Specific resource types
  artifacts: 1000 * 60 * 10, // 10 minutes
  character: 1000 * 60 * 5, // 5 minutes
  gameState: 1000 * 60 * 2, // 2 minutes - shorter since game state changes frequently
  
  // Default duration if none specified
  default: 1000 * 60 * 5, // 5 minutes
};

// Memory cache storage
const memoryCache = new Map();

// Generate cache key based on function name and arguments
export const generateCacheKey = (fnName, args = []) => {
  try {
    // For simple arguments, convert to string
    const argsStr = args.map(arg => {
      if (arg === null || arg === undefined) return String(arg);
      if (typeof arg === 'object') return JSON.stringify(arg);
      return String(arg);
    }).join('::');
    
    return `${fnName}::${argsStr}`;
  } catch (error) {
    trackError('Failed to generate cache key', {
      category: ERROR_CATEGORIES.PERFORMANCE,
      originalError: error,
      context: { fnName, args }
    });
    // Return a fallback key
    return `${fnName}::${Date.now()}`;
  }
};

/**
 * Get a value from cache
 * 
 * @param {string} key - Cache key
 * @returns {Object|null} Cached value or null if not found
 */
export const getFromCache = (key) => {
  const cached = memoryCache.get(key);
  
  if (!cached) return null;
  
  // Check if the cache entry has expired
  if (cached.expiry && cached.expiry < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.value;
};

/**
 * Store a value in cache
 * 
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} duration - Cache duration in milliseconds
 * @returns {Object} The cached entry
 */
export const storeInCache = (key, value, duration = cacheDurations.default) => {
  const entry = {
    value,
    expiry: Date.now() + duration,
    timestamp: Date.now()
  };
  
  memoryCache.set(key, entry);
  return entry;
};

/**
 * Clear a specific cache entry
 * 
 * @param {string} key - Cache key to clear
 * @returns {boolean} True if entry was found and cleared
 */
export const clearCache = (key) => {
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
    return true;
  }
  return false;
};

/**
 * Clear all cache entries
 */
export const clearAllCache = () => {
  memoryCache.clear();
};

/**
 * Clear cache entries by pattern
 * 
 * @param {string} pattern - Pattern to match against cache keys
 * @returns {number} Number of entries cleared
 */
export const clearCacheByPattern = (pattern) => {
  let count = 0;
  const regex = new RegExp(pattern);
  
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      count++;
    }
  }
  
  return count;
};

/**
 * Wrap an async function with caching
 * 
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Cache options
 * @param {number} options.duration - Cache duration in ms
 * @param {Function} options.keyFn - Function to generate cache key
 * @returns {Function} Wrapped function with caching
 */
export const withCache = (fn, options = {}) => {
  const {
    duration = cacheDurations.default,
    keyFn
  } = options;

  return async (...args) => {
    try {
      // Generate cache key
      const cacheKey = keyFn 
        ? keyFn(...args) 
        : generateCacheKey(fn.name, args);
      
      // Check if result is in cache
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult !== null) {
        // Log cache hit for performance monitoring
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Cache hit for: ${cacheKey}`);
        }
        return cachedResult;
      }
      
      // Execute original function and store result in cache
      const result = await fn(...args);
      storeInCache(cacheKey, result, duration);
      
      return result;
    } catch (error) {
      // Log error and pass through
      trackError(`Error in cached function ${fn.name}`, {
        category: ERROR_CATEGORIES.PERFORMANCE,
        originalError: error,
        context: { args }
      });
      
      // Re-throw to maintain original behavior
      throw error;
    }
  };
};

/**
 * Get statistics about the cache
 * 
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let expired = 0;
  
  // Count expired entries
  for (const entry of memoryCache.values()) {
    if (entry.expiry && entry.expiry < now) {
      expired++;
    }
  }
  
  return {
    totalEntries: memoryCache.size,
    expiredEntries: expired,
    activeEntries: memoryCache.size - expired
  };
};

export default {
  getFromCache,
  storeInCache,
  clearCache,
  clearAllCache,
  clearCacheByPattern,
  withCache,
  getCacheStats,
  generateCacheKey,
  cacheDurations
}; 