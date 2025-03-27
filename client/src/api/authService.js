import API, { handleApiError } from './apiConfig';

/**
 * Logs in a user
 * @param {string} username - The username or email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - User data and token
 */
export const loginUser = async (username, password) => {
  try {
    const response = await API.post("/api/auth/login", { 
      identifier: username, 
      password 
    });
    
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      
      // Store user data if available
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      return response.data;
    } else {
      throw new Error("No token received from server");
    }
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to login"));
  }
};

/**
 * Registers a new user
 * @param {string} username - The username
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - User data and token
 */
export const registerUser = async (username, email, password) => {
  try {
    const response = await API.post("/api/auth/register", { username, email, password });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to register"));
  }
};

/**
 * Logs out the current user
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Optional: Call to server to invalidate token
  return API.post("/api/auth/logout")
    .catch(error => console.warn("Logout error:", error));
};

/**
 * Gets the current authenticated user from localStorage
 * @returns {Object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Checks if user is authenticated
 * @returns {boolean} - True if user has a token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
}; 