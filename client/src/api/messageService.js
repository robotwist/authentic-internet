import API, { handleApiError } from './apiConfig';

/**
 * Sends a message
 * @param {string} recipient - Recipient user ID
 * @param {string} content - Message content
 * @param {string} artifactId - Optional artifact ID
 * @returns {Promise<Object>} - Created message
 */
export const sendMessage = async (recipient, content, artifactId = null) => {
  try {
    const response = await API.post("/api/messages", { recipient, content, artifactId });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to send message"));
  }
};

/**
 * Fetches a message by artifact ID
 * @param {string} artifactId - The artifact ID
 * @returns {Promise<Object>} - Message data
 */
export const fetchMessage = async (artifactId) => {
  try {
    const response = await API.get(`/api/messages/artifact/${artifactId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch message"));
  }
};

/**
 * Fetches all messages for the current user
 * @returns {Promise<Array>} - Array of messages
 */
export const fetchMessages = async () => {
  try {
    const response = await API.get("/api/messages");
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch messages"));
  }
};

/**
 * Updates a message
 * @param {string} artifactId - The artifact ID for the message
 * @param {string} messageText - Updated message text
 * @returns {Promise<Object>} - Updated message
 */
export const updateMessage = async (artifactId, messageText) => {
  try {
    const response = await API.put(`/api/messages/artifact/${artifactId}`, { content: messageText });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to update message"));
  }
};

/**
 * Deletes a message
 * @param {string} artifactId - The artifact ID for the message
 * @returns {Promise<Object>} - Response data
 */
export const deleteMessage = async (artifactId) => {
  try {
    const response = await API.delete(`/api/messages/artifact/${artifactId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to delete message"));
  }
}; 