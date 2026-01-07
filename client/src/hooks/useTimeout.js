import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing setTimeout with automatic cleanup
 * Prevents memory leaks and state updates on unmounted components
 *
 * @param {Function} callback - Function to execute after delay
 * @param {number} delay - Delay in milliseconds (null to disable)
 * @returns {Function} Clear function to manually cancel the timeout
 *
 * @example
 * const clearTimeout = useTimeout(() => {
 *   console.log('This runs after 1000ms');
 * }, 1000);
 *
 * // To cancel manually:
 * clearTimeout();
 */
export const useTimeout = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up timeout
  useEffect(() => {
    if (delay === null || delay === undefined) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [delay]);

  // Return clear function
  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return clear;
};

export default useTimeout;
