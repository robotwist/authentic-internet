import axios from "axios";

// Display build information in console for tracking deployments
export const displayBuildInfo = () => {
  const buildDate = new Date().toISOString();
  const buildEnv = import.meta.env.MODE || 'development';
  console.info(`%cApplication Build Info:
  🔹 Environment: ${buildEnv}
  🔹 Build Date: ${buildDate}
  🔹 API URL: ${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`,
  'color: #6366F1; font-weight: bold;');
};

// Function to create API instance with the given base URL
export const createApiInstance = (baseUrl) => {
  return axios.create({
    baseURL: baseUrl,
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

// Get the configured API URL or default to localhost:5001
export const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Initialize API with the configured URL
let API = createApiInstance(configuredApiUrl);

// Store alternative ports to try if the main one is unavailable
const alternativePorts = [5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];
let isApiInitialized = false;
let currentApiUrl = configuredApiUrl;

// Initialize API with port detection
export const initApi = async () => {
  if (isApiInitialized) return API;

  try {
    // First try the configured URL
    const response = await axios.get(`${configuredApiUrl}/health`, { timeout: 2000 });
    if (response.status === 200) {
      console.log(`✅ Connected to API at ${configuredApiUrl}`);
      API = createApiInstance(configuredApiUrl);
      currentApiUrl = configuredApiUrl;
      isApiInitialized = true;
      return API;
    }
  } catch (error) {
    // Try again with the proper health endpoint
    try {
      const response = await axios.get(`${configuredApiUrl}/api/health`, { timeout: 2000 });
      if (response.status === 200) {
        console.log(`✅ Connected to API at ${configuredApiUrl}`);
        API = createApiInstance(configuredApiUrl);
        currentApiUrl = configuredApiUrl;
        isApiInitialized = true;
        return API;
      }
    } catch (retryError) {
      console.warn(`⚠️ Could not connect to API at ${configuredApiUrl}: ${error.message}`);
    }
  }

  // If main URL fails, try alternative ports
  const baseUrl = configuredApiUrl.split(':').slice(0, -1).join(':');
  
  for (const port of alternativePorts) {
    const altUrl = `${baseUrl}:${port}`;
    try {
      const response = await axios.get(`${altUrl}/api/health`, { timeout: 1000 });
      if (response.status === 200) {
        console.log(`✅ Connected to API at alternative port: ${altUrl}`);
        API = createApiInstance(altUrl);
        currentApiUrl = altUrl;
        isApiInitialized = true;
        
        // Update environment variable for future use
        if (window.sessionStorage) {
          window.sessionStorage.setItem('apiUrl', altUrl);
        }
        
        return API;
      }
    } catch (error) {
      // Continue trying other ports
    }
  }

  console.error("❌ Failed to connect to API on any port. Using default configuration.");
  // Keep the default API instance as fallback
  return API;
};

// Helper function to handle API errors
export const handleApiError = (error, defaultMessage = "An error occurred") => {
  console.error("API Error details:", error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return error.response.data?.message || error.response.data?.error || defaultMessage;
  } else if (error.request) {
    // The request was made but no response was received
    console.log("No response received:", error.request);
    return "No response from server. Please check your network connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || defaultMessage;
  }
};

// Export the current API URL for reference
export const getCurrentApiUrl = () => currentApiUrl;

// Setup API interceptors
export const setupApiInterceptors = (apiInstance) => {
  // 🔹 Attach Token to Requests
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 🔹 Handle token expiration and errors
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("API Error:", error);
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.warn("Authentication error detected, clearing session");
        
        // Clear token and user data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return apiInstance;
};

// Call setup functions
displayBuildInfo();
setupApiInterceptors(API);

// Export the API instance
export default API; 