import { useEffect } from 'react';
import PropTypes from 'prop-types';
import PerformanceMonitor from './PerformanceMonitor';
import { setupGlobalErrorHandling } from '../../utils/errorTracker';
import { initializeEnhancedApi } from '../../api/apiEfficiency';

/**
 * Performance Wrapper Component
 * 
 * Add this component to your app once (ideally at the root level)
 * to enable performance monitoring, caching, and error tracking.
 * 
 * No need to modify App.jsx if you don't want to - just import and use:
 * 
 * Example:
 * ```jsx
 * import PerformanceWrapper from './components/performance/PerformanceWrapper';
 * 
 * // Then anywhere in your app:
 * <PerformanceWrapper apiInstance={yourApiInstance}>
 *   {/* Your app content */}
 * </PerformanceWrapper>
 * ```
 */
const PerformanceWrapper = ({ 
  children, 
  apiInstance = null,
  enableErrorTracking = true,
  enableCaching = true,
  showMonitor = true,
  monitorPosition = 'bottom-right'
}) => {
  const startTime = performance.now();

  // Initialize performance features on mount
  useEffect(() => {
    // Set up error tracking if enabled
    if (enableErrorTracking) {
      setupGlobalErrorHandling();
      console.info('Global error tracking initialized');
    }
    
    // Set up API caching if enabled and API instance provided
    if (enableCaching && apiInstance) {
      try {
        initializeEnhancedApi(apiInstance);
        console.info('API caching initialized');
      } catch (error) {
        console.warn('Failed to initialize API caching:', error.message);
      }
    }
    
    // Calculate and log initialization time
    const initTime = performance.now() - startTime;
    console.info(`Performance features initialized in ${Math.round(initTime)}ms`);
    
    // Set performance metrics in localStorage so they persist
    const enablePerfMetrics = localStorage.getItem('enablePerfMetrics');
    if (enablePerfMetrics === null && process.env.NODE_ENV === 'development') {
      localStorage.setItem('enablePerfMetrics', 'true');
    }
    
  }, [enableErrorTracking, enableCaching, apiInstance]);

  return (
    <>
      {children}
      {showMonitor && <PerformanceMonitor position={monitorPosition} />}
    </>
  );
};

PerformanceWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  apiInstance: PropTypes.object,
  enableErrorTracking: PropTypes.bool,
  enableCaching: PropTypes.bool,
  showMonitor: PropTypes.bool,
  monitorPosition: PropTypes.oneOf(['bottom-right', 'bottom-left', 'top-right', 'top-left'])
};

export default PerformanceWrapper; 