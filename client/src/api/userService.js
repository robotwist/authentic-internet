import API, { handleApiError } from "./apiConfig";

/**
 * Fetches a user's character
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Character data
 */
export const fetchCharacter = async (userId) => {
  try {
    const response = await API.get(`/api/users/${userId}/character`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch character"));
  }
};

/**
 * Updates a user's character
 * @param {Object} updatedCharacter - The updated character data
 * @returns {Promise<Object>} - Updated character data
 */
export const updateCharacter = async (updatedCharacter) => {
  try {
    const response = await API.put(
      `/api/users/${updatedCharacter.userId}/character`,
      updatedCharacter,
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to update character"));
  }
};

/**
 * Gets a user profile
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await API.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch user profile"));
  }
};

/**
 * Updates a user profile
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await API.put(`/api/users/${userId}`, profileData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to update user profile"));
  }
};

/**
 * Lists all users (admin only)
 * @returns {Promise<Array>} - List of users
 */
export const listUsers = async () => {
  try {
    const response = await API.get("/api/users");
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to list users"));
  }
};
