// Base API config
import API, { initApi, getCurrentApiUrl, handleApiError } from "./apiConfig";

// Export all services
export * from "./authService";
export * from "./userService";
export * from "./artifactService";
export * from "./messageService";
// Re-enable temporarily to prevent import errors, but mark as deprecated
export * from "./externalApis"; // DEPRECATED - use utils/quoteSystem.js instead

// Also export the base utilities
export { API, initApi, getCurrentApiUrl, handleApiError };

// Export a function to initialize all API services
export const initializeApi = async () => {
  const apiInstance = await initApi();
  return apiInstance;
};

export default API;
