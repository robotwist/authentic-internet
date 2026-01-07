/**
 * Recommendation Engine API Service
 * Handles all recommendation-related API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Make authenticated API request
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

/**
 * Get AI-powered recommendations
 * @param {Object} params - Recommendation parameters
 * @param {string} params.algorithm - Algorithm to use (hybrid, collaborative, contentBased, contextual, serendipity)
 * @param {number} params.limit - Number of recommendations to return
 * @param {number} params.diversity - Diversity level (0-1)
 * @param {number} params.novelty - Novelty level (0-1)
 * @returns {Promise<Object>} Recommendations data
 */
export const getRecommendations = async (params = {}) => {
  const {
    algorithm = "hybrid",
    limit = 12,
    diversity = 0.5,
    novelty = 0.3,
  } = params;

  const queryParams = new URLSearchParams({
    algorithm,
    limit: limit.toString(),
    diversity: diversity.toString(),
    novelty: novelty.toString(),
  });

  return makeRequest(`/api/recommendations?${queryParams}`);
};

/**
 * Track user interaction with recommendations
 * @param {Object} interaction - Interaction data
 * @param {string} interaction.artifactId - ID of the artifact
 * @param {string} interaction.type - Type of interaction (view, select, feedback, etc.)
 * @param {string} interaction.feedback - Feedback type (positive, negative)
 * @param {string} interaction.algorithm - Algorithm that generated the recommendation
 * @returns {Promise<Object>} Success response
 */
export const trackInteraction = async (interaction) => {
  return makeRequest("/api/recommendations/interaction", {
    method: "POST",
    body: JSON.stringify(interaction),
  });
};

/**
 * Get user profile and preferences
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  return makeRequest("/api/recommendations/profile");
};

/**
 * Get recommendation insights and analytics
 * @returns {Promise<Object>} Insights data
 */
export const getInsights = async () => {
  return makeRequest("/api/recommendations/insights");
};

/**
 * Track artifact view for recommendation learning
 * @param {string} artifactId - ID of the viewed artifact
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackArtifactView = async (artifactId, algorithm = null) => {
  try {
    await trackInteraction({
      artifactId,
      type: "view",
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track artifact view:", error);
  }
};

/**
 * Track artifact selection for recommendation learning
 * @param {string} artifactId - ID of the selected artifact
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackArtifactSelection = async (artifactId, algorithm = null) => {
  try {
    await trackInteraction({
      artifactId,
      type: "select",
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track artifact selection:", error);
  }
};

/**
 * Track recommendation feedback
 * @param {string} artifactId - ID of the artifact
 * @param {string} feedback - Feedback type (positive, negative)
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackFeedback = async (artifactId, feedback, algorithm = null) => {
  try {
    await trackInteraction({
      artifactId,
      type: "feedback",
      feedback,
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track feedback:", error);
  }
};

/**
 * Track artifact completion
 * @param {string} artifactId - ID of the completed artifact
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackArtifactCompletion = async (artifactId, algorithm = null) => {
  try {
    await trackInteraction({
      artifactId,
      type: "complete",
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track artifact completion:", error);
  }
};

/**
 * Track social interactions
 * @param {string} artifactId - ID of the artifact
 * @param {string} type - Type of social interaction (comment, share, rate)
 * @param {Object} data - Additional interaction data
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackSocialInteraction = async (
  artifactId,
  type,
  data = {},
  algorithm = null,
) => {
  try {
    await trackInteraction({
      artifactId,
      type,
      data,
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track social interaction:", error);
  }
};

/**
 * Track creative interactions
 * @param {string} artifactId - ID of the artifact
 * @param {string} type - Type of creative interaction (create, remix)
 * @param {Object} data - Additional interaction data
 * @param {string} algorithm - Algorithm that suggested the artifact
 */
export const trackCreativeInteraction = async (
  artifactId,
  type,
  data = {},
  algorithm = null,
) => {
  try {
    await trackInteraction({
      artifactId,
      type,
      data,
      algorithm,
    });
  } catch (error) {
    console.error("Failed to track creative interaction:", error);
  }
};

/**
 * Get personalized recommendations for a specific context
 * @param {Object} context - Context information
 * @param {string} context.timeOfDay - Time of day (morning, afternoon, evening, night)
 * @param {string} context.sessionType - Session type (short, medium, long)
 * @param {string} context.userMood - User mood (productive, relaxed, creative, social)
 * @param {string} context.location - User location/area
 * @returns {Promise<Object>} Contextual recommendations
 */
export const getContextualRecommendations = async (context = {}) => {
  const params = {
    algorithm: "contextual",
    ...context,
  };

  return getRecommendations(params);
};

/**
 * Get serendipitous recommendations (unexpected but relevant)
 * @param {number} serendipityLevel - Level of serendipity (0-1)
 * @returns {Promise<Object>} Serendipitous recommendations
 */
export const getSerendipitousRecommendations = async (
  serendipityLevel = 0.5,
) => {
  const params = {
    algorithm: "serendipity",
    novelty: serendipityLevel,
  };

  return getRecommendations(params);
};

/**
 * Get collaborative filtering recommendations
 * @returns {Promise<Object>} Collaborative recommendations
 */
export const getCollaborativeRecommendations = async () => {
  return getRecommendations({ algorithm: "collaborative" });
};

/**
 * Get content-based recommendations
 * @returns {Promise<Object>} Content-based recommendations
 */
export const getContentBasedRecommendations = async () => {
  return getRecommendations({ algorithm: "contentBased" });
};

/**
 * Get hybrid recommendations (default)
 * @returns {Promise<Object>} Hybrid recommendations
 */
export const getHybridRecommendations = async () => {
  return getRecommendations({ algorithm: "hybrid" });
};

/**
 * Batch track multiple interactions
 * @param {Array} interactions - Array of interaction objects
 * @returns {Promise<Object>} Success response
 */
export const trackBatchInteractions = async (interactions) => {
  try {
    const promises = interactions.map((interaction) =>
      trackInteraction(interaction),
    );
    await Promise.all(promises);
    return { success: true, message: "All interactions tracked successfully" };
  } catch (error) {
    console.error("Failed to track batch interactions:", error);
    throw error;
  }
};

/**
 * Get recommendation performance metrics
 * @returns {Promise<Object>} Performance metrics
 */
export const getRecommendationMetrics = async () => {
  try {
    const [profile, insights] = await Promise.all([
      getUserProfile(),
      getInsights(),
    ]);

    return {
      profile: profile.profile,
      insights: insights.insights,
      metrics: {
        totalInteractions: profile.profile?.learning?.totalInteractions || 0,
        confidence: profile.profile?.learning?.confidence || 0,
        accuracy: insights.insights?.recommendationsAccuracy || 0,
        favoriteTypes: insights.insights?.favoriteTypes || [],
        interactionTrends: insights.insights?.interactionTrends || {},
      },
    };
  } catch (error) {
    console.error("Failed to get recommendation metrics:", error);
    throw error;
  }
};

/**
 * Export tracking functions for global use
 */
export const recommendationTracking = {
  trackArtifactView,
  trackArtifactSelection,
  trackFeedback,
  trackArtifactCompletion,
  trackSocialInteraction,
  trackCreativeInteraction,
  trackBatchInteractions,
};

// Make tracking functions available globally for easy access
if (typeof window !== "undefined") {
  window.recommendationTracking = recommendationTracking;
}

export default {
  getRecommendations,
  trackInteraction,
  getUserProfile,
  getInsights,
  trackArtifactView,
  trackArtifactSelection,
  trackFeedback,
  trackArtifactCompletion,
  trackSocialInteraction,
  trackCreativeInteraction,
  getContextualRecommendations,
  getSerendipitousRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getHybridRecommendations,
  trackBatchInteractions,
  getRecommendationMetrics,
};
