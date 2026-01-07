/**
 * Error Tracker Utility
 * Provides error logging, tracking, and reporting functionality
 * for improved debugging and user experience
 */

// Maximum number of errors to store in local storage
const MAX_STORED_ERRORS = 50;

// Error severity levels
export const ERROR_LEVELS = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

// Error categories
export const ERROR_CATEGORIES = {
  API: "api",
  AUTH: "authentication",
  RENDER: "rendering",
  NETWORK: "network",
  INPUT: "user_input",
  ASSET: "asset_loading",
  GAME: "game_logic",
  PERFORMANCE: "performance",
  UNKNOWN: "unknown",
};

// Get errors from localStorage
const getStoredErrors = () => {
  try {
    const storedErrors = localStorage.getItem("error_log");
    return storedErrors ? JSON.parse(storedErrors) : [];
  } catch (e) {
    console.error("Failed to parse stored errors:", e);
    return [];
  }
};

// Save errors to localStorage
const saveErrorsToStorage = (errors) => {
  try {
    // Keep only the latest MAX_STORED_ERRORS
    const trimmedErrors = errors.slice(-MAX_STORED_ERRORS);
    localStorage.setItem("error_log", JSON.stringify(trimmedErrors));
  } catch (e) {
    console.error("Failed to save errors to storage:", e);
  }
};

/**
 * Log an error to the tracking system
 *
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @param {string} options.level - Error severity level (from ERROR_LEVELS)
 * @param {string} options.category - Error category (from ERROR_CATEGORIES)
 * @param {Object} options.context - Additional context data
 * @param {Error} options.originalError - Original error object
 */
export const trackError = (message, options = {}) => {
  const {
    level = ERROR_LEVELS.ERROR,
    category = ERROR_CATEGORIES.UNKNOWN,
    context = {},
    originalError = null,
  } = options;

  // Create error object
  const errorObj = {
    message,
    level,
    category,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  };

  // Log to console based on level
  if (level === ERROR_LEVELS.INFO) {
    console.info(`[${category}] ${message}`, context);
  } else if (level === ERROR_LEVELS.WARNING) {
    console.warn(`[${category}] ${message}`, context, originalError);
  } else {
    console.error(`[${category}] ${message}`, context, originalError);
  }

  // Store error in localStorage
  const storedErrors = getStoredErrors();
  storedErrors.push(errorObj);
  saveErrorsToStorage(storedErrors);

  // If in development mode, add more details
  if (process.env.NODE_ENV === "development" && originalError) {
    console.debug("Original Error:", originalError);
    console.debug("Error Stack:", originalError.stack);
  }

  // Report to backend for critical errors (only if endpoint exists)
  if (level === ERROR_LEVELS.CRITICAL) {
    reportErrorToServer(errorObj).catch((e) => {
      // Silently handle missing diagnostics endpoint
      if (e.message && e.message.includes("404")) {
        console.debug(
          "Diagnostics endpoint not available, error logged locally only",
        );
      } else {
        console.error("Failed to report critical error to server:", e);
      }
    });
  }

  return errorObj;
};

/**
 * Report error to the backend server
 *
 * @param {Object} errorData - Error data to report
 * @returns {Promise} - Promise that resolves when error is reported
 */
const reportErrorToServer = async (errorData) => {
  try {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/diagnostics/errors", {
      method: "POST",
      headers,
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      throw new Error(
        `Server returned ${response.status}: ${response.statusText}`,
      );
    }

    return true;
  } catch (error) {
    console.error("Error reporting to server:", error);
    throw error;
  }
};

/**
 * Get all stored errors
 *
 * @returns {Array} Array of stored errors
 */
export const getErrorLog = () => {
  return getStoredErrors();
};

/**
 * Clear the error log
 */
export const clearErrorLog = () => {
  localStorage.removeItem("error_log");
};

/**
 * General error handler for promises
 *
 * @param {string} context - The context where the error occurred
 * @param {string} category - Error category
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (
  context,
  category = ERROR_CATEGORIES.UNKNOWN,
) => {
  return (error) => {
    return trackError(`Error in ${context}: ${error.message}`, {
      category,
      originalError: error,
      context: { operation: context },
    });
  };
};

// Set up global error handler
export const setupGlobalErrorHandling = () => {
  window.addEventListener("error", (event) => {
    trackError(`Unhandled error: ${event.message}`, {
      level: ERROR_LEVELS.CRITICAL,
      category: ERROR_CATEGORIES.UNKNOWN,
      originalError: event.error,
      context: {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    let message = "Unhandled Promise rejection";

    if (event.reason) {
      if (typeof event.reason === "string") {
        message = `Unhandled Promise rejection: ${event.reason}`;
      } else if (event.reason.message) {
        message = `Unhandled Promise rejection: ${event.reason.message}`;
      }
    }

    trackError(message, {
      level: ERROR_LEVELS.CRITICAL,
      category: ERROR_CATEGORIES.UNKNOWN,
      originalError: event.reason,
    });
  });
};

export default {
  trackError,
  getErrorLog,
  clearErrorLog,
  createErrorHandler,
  setupGlobalErrorHandling,
  LEVELS: ERROR_LEVELS,
  CATEGORIES: ERROR_CATEGORIES,
};
