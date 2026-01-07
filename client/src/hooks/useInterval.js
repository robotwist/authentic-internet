import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing setInterval with automatic cleanup
 * Prevents memory leaks and state updates on unmounted components
 *
 * @param {Function} callback - Function to execute on each interval
 * @param {number} delay - Interval delay in milliseconds (null to disable)
 * @returns {Function} Clear function to manually cancel the interval
 *
 * @example
 * const clearInterval = useInterval(() => {
 *   console.log('This runs every 1000ms');
 * }, 1000);
 *
 * // To cancel manually:
 * clearInterval();
 */
export const useInterval = (callback, delay) => {
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up interval
  useEffect(() => {
    if (delay === null || delay === undefined) {
      return;
    }

    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, delay);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [delay]);

  // Return clear function
  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return clear;
};

export default useInterval;
