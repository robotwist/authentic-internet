import API, { handleApiError } from './apiConfig';

/**
 * Fetches all artifacts
 * @returns {Promise<Array>} - Array of artifacts
 */
export const fetchArtifacts = async () => {
  try {
    const response = await API.get("/api/artifacts");
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch artifacts"));
  }
};

/**
 * Fetches a single artifact by ID
 * @param {string} artifactId - The artifact ID
 * @returns {Promise<Object>} - Artifact data
 */
export const fetchArtifact = async (artifactId) => {
  try {
    const response = await API.get(`/api/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to fetch artifact"));
  }
};

/**
 * Creates a new artifact
 * @param {Object} artifactData - Artifact data
 * @returns {Promise<Object>} - Created artifact
 */
export const createArtifact = async (artifactData) => {
  try {
    const response = await API.post("/api/artifacts", artifactData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to create artifact"));
  }
};

/**
 * Updates an artifact
 * @param {string} artifactId - The artifact ID
 * @param {Object} updatedData - Updated artifact data
 * @returns {Promise<Object>} - Updated artifact
 */
export const updateArtifact = async (artifactId, updatedData) => {
  try {
    const response = await API.put(`/api/artifacts/${artifactId}`, updatedData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to update artifact"));
  }
};

/**
 * Deletes an artifact
 * @param {string} artifactId - The artifact ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteArtifact = async (artifactId) => {
  try {
    const response = await API.delete(`/api/artifacts/${artifactId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, "Failed to delete artifact"));
  }
}; 