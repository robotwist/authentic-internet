/**
 * Performance Monitoring Components
 * 
 * This module exports components and utilities for monitoring and improving
 * application performance.
 */

import PerformanceMonitor from './PerformanceMonitor';
import PerformanceWrapper from './PerformanceWrapper';

// Direct component exports
export { PerformanceMonitor, PerformanceWrapper };

// Re-export utilities from related modules
export { 
  withCache, 
  cacheDurations, 
  clearAllCache, 
  clearCacheByPattern 
} from '../../utils/cacheManager';

export { 
  trackError, 
  createErrorHandler, 
  ERROR_LEVELS, 
  ERROR_CATEGORIES,
  setupGlobalErrorHandling
} from '../../utils/errorTracker';

// Main export for easier imports
export default {
  PerformanceMonitor,
  PerformanceWrapper,
  
  // Helper function to enable performance metrics via localStorage
  enablePerformanceMetrics: (enable = true) => {
    localStorage.setItem('enablePerfMetrics', enable ? 'true' : 'false');
    console.log(`Performance metrics ${enable ? 'enabled' : 'disabled'}`);
    return enable;
  },
  
  // Helper to check if performance metrics are enabled
  arePerformanceMetricsEnabled: () => {
    return localStorage.getItem('enablePerfMetrics') === 'true';
  }
}; 