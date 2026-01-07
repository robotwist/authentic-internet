// Configuration constants for the Authentic Internet client

// Get the configured API URL or default to localhost:5001
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Other configuration constants can be added here as needed
export const APP_NAME = "Authentic Internet";
export const APP_VERSION = "1.0.0";

// Feature flags
export const FEATURES = {
  COLLABORATION: true,
  REAL_TIME: true,
  ANALYTICS: true,
  FILE_UPLOAD: true,
};

// API endpoints
export const ENDPOINTS = {
  AUTH: "/auth",
  ARTIFACTS: "/artifacts",
  COLLABORATION: "/collaboration",
  USERS: "/users",
  HEALTH: "/health",
};
