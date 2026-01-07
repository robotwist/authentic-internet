import { useRef, useCallback, useEffect } from "react";

/**
 * Custom hook for managing delayed callbacks with proper cleanup
 * Useful for animations, notifications, and user interactions
 *
 * @param {Function} callback - Function to execute after delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Object with start, cancel, and isPending functions
 *
 * @example
 * const { start, cancel, isPending } = useDelayedCallback(() => {
 *   console.log('Delayed action');
 * }, 1000);
 *
 * // Start the delayed callback
 * start();
 *
 * // Cancel if needed
 * cancel();
 *
 * // Check if pending
 * if (isPending()) { ... }
 */
export const useDelayedCallback = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  const updateCallback = useCallback((newCallback) => {
    callbackRef.current = newCallback;
  }, []);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(
    (...args) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { start, cancel, isPending, updateCallback };
};

export default useDelayedCallback;
