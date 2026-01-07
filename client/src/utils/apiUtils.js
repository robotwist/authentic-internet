/**
 * API Utilities
 * Helper functions for API operations
 */

// Base API URL from environment variable or default
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

/**
 * Builds a complete API URL from the given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/quotes/random')
 * @returns {string} The complete API URL
 */
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * Handles API errors consistently
 * @param {Error} error - The error object from the API call
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error) => {
  console.error("API Error:", error);
  return {
    error: true,
    message: error.message || "An unexpected error occurred",
    status: error.response?.status || 500,
  };
};

/**
 * Validates API response
 * @param {Object} response - The API response to validate
 * @returns {boolean} Whether the response is valid
 */
export const isValidResponse = (response) => {
  return (
    response &&
    !response.error &&
    response.status !== "error" &&
    response.status !== "failed"
  );
};

/**
 * Formats API parameters
 * @param {Object} params - The parameters to format
 * @returns {string} URL-encoded parameter string
 */
export const formatParams = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
};
