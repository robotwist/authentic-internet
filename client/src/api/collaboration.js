import { API_BASE_URL } from "../config";

/**
 * Collaboration API Service
 * Handles all collaboration-related API calls and real-time features
 */

class CollaborationAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/collaboration`;
    this.token = localStorage.getItem("token");
  }

  // Helper method to get headers
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Session Management
   */

  // Create a new collaboration session
  async createSession(sessionData) {
    const response = await fetch(`${this.baseURL}/sessions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(sessionData),
    });
    return this.handleResponse(response);
  }

  // Get all collaboration sessions for the current user
  async getSessions(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/sessions?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get a specific collaboration session
  async getSession(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Update collaboration session settings
  async updateSessionSettings(sessionId, settings) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/settings`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ settings }),
      },
    );
    return this.handleResponse(response);
  }

  // Delete a collaboration session
  async deleteSession(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  /**
   * Participant Management
   */

  // Join a collaboration session
  async joinSession(sessionId, role = "editor") {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/join`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    return this.handleResponse(response);
  }

  // Leave a collaboration session
  async leaveSession(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/leave`,
      {
        method: "POST",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Invite users to a collaboration session
  async inviteUsers(sessionId, userEmails, role = "editor") {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/invite`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ userEmails, role }),
      },
    );
    return this.handleResponse(response);
  }

  // Update participant role
  async updateParticipantRole(sessionId, userId, role) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/participants/${userId}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ role }),
      },
    );
    return this.handleResponse(response);
  }

  // Remove participant from session
  async removeParticipant(sessionId, userId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/participants/${userId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * Content Management
   */

  // Save artifact progress
  async saveProgress(sessionId, artifactData, version) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/save`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ artifactData, version }),
    });
    return this.handleResponse(response);
  }

  // Publish collaboration artifact
  async publishArtifact(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/publish`,
      {
        method: "POST",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Get version history
  async getVersionHistory(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/versions`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Restore to a specific version
  async restoreVersion(sessionId, versionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/versions/${versionId}/restore`,
      {
        method: "POST",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * Comments and Feedback
   */

  // Add a comment
  async addComment(sessionId, commentData) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(commentData),
      },
    );
    return this.handleResponse(response);
  }

  // Get comments for a session
  async getComments(sessionId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments?${params}`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Update a comment
  async updateComment(sessionId, commentId, updates) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments/${commentId}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      },
    );
    return this.handleResponse(response);
  }

  // Delete a comment
  async deleteComment(sessionId, commentId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Resolve a comment
  async resolveComment(sessionId, commentId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments/${commentId}/resolve`,
      {
        method: "POST",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Add reply to a comment
  async addReply(sessionId, commentId, replyData) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/comments/${commentId}/replies`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(replyData),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * Analytics and Insights
   */

  // Get collaboration analytics
  async getAnalytics(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/analytics`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Get user collaboration statistics
  async getUserStats() {
    const response = await fetch(`${this.baseURL}/stats/user`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get global collaboration statistics
  async getGlobalStats() {
    const response = await fetch(`${this.baseURL}/stats/global`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  /**
   * Real-time Collaboration Features
   */

  // Track user activity
  async trackActivity(sessionId, activityData) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/activity`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(activityData),
      },
    );
    return this.handleResponse(response);
  }

  // Get active users in a session
  async getActiveUsers(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/active-users`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Update user status
  async updateUserStatus(sessionId, status) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/status`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * File and Media Management
   */

  // Upload file to collaboration session
  async uploadFile(sessionId, file, type = "media") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      },
    );
    return this.handleResponse(response);
  }

  // Get files in collaboration session
  async getFiles(sessionId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/files`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Delete file from collaboration session
  async deleteFile(sessionId, fileId) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/files/${fileId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * Search and Discovery
   */

  // Search collaboration sessions
  async searchSessions(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    const response = await fetch(`${this.baseURL}/sessions/search?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get trending collaboration sessions
  async getTrendingSessions(limit = 10) {
    const response = await fetch(
      `${this.baseURL}/sessions/trending?limit=${limit}`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Get recommended collaboration sessions
  async getRecommendedSessions(limit = 10) {
    const response = await fetch(
      `${this.baseURL}/sessions/recommended?limit=${limit}`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  /**
   * Utility Methods
   */

  // Refresh authentication token
  async refreshToken() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      this.token = data.token;
      localStorage.setItem("token", data.token);
    }
  }

  // Update token when it changes
  updateToken(newToken) {
    this.token = newToken;
  }

  // Check if user has permission for action
  async checkPermission(sessionId, action) {
    const response = await fetch(
      `${this.baseURL}/sessions/${sessionId}/permissions/${action}`,
      {
        headers: this.getHeaders(),
      },
    );
    return this.handleResponse(response);
  }

  // Get collaboration templates
  async getTemplates() {
    const response = await fetch(`${this.baseURL}/templates`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Create session from template
  async createFromTemplate(templateId, customizations = {}) {
    const response = await fetch(
      `${this.baseURL}/templates/${templateId}/create`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(customizations),
      },
    );
    return this.handleResponse(response);
  }
}

// Create singleton instance
const collaborationAPI = new CollaborationAPI();

// Export both the class and the singleton instance
export { CollaborationAPI };
export default collaborationAPI;
