/**
 * Authentication Manager
 * Handles user authentication, token management, and session recovery
 */

import axios from 'axios';
import { buildApiUrl } from './apiUtils';

class AuthManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    this.refreshTimeout = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      // Try to recover session
      this.token = localStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }

      if (this.token) {
        this.setupRefreshTimer();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth manager:', error);
      this.clearAuth();
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post(buildApiUrl('/auth/login'), credentials);
      
      this.setAuthData(response.data);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(buildApiUrl('/auth/register'), userData);
      
      this.setAuthData(response.data);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  setAuthData(data) {
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.user = data.user;

    localStorage.setItem('auth_token', this.token);
    localStorage.setItem('refresh_token', this.refreshToken);
    localStorage.setItem('user', JSON.stringify(this.user));

    this.setupRefreshTimer();
  }

  setupRefreshTimer() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Refresh 5 minutes before token expires
    const refreshTime = this.getTokenExpiryTime() - 5 * 60 * 1000;
    if (refreshTime > 0) {
      this.refreshTimeout = setTimeout(() => this.refreshAuth(), refreshTime);
    }
  }

  getTokenExpiryTime() {
    try {
      const tokenData = JSON.parse(atob(this.token.split('.')[1]));
      return (tokenData.exp * 1000) - Date.now();
    } catch (error) {
      console.error('Error parsing token:', error);
      return 0;
    }
  }

  async refreshAuth() {
    try {
      const response = await axios.post(buildApiUrl('/auth/refresh'), {
        refreshToken: this.refreshToken
      });

      this.setAuthData(response.data);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  isAuthenticated() {
    return !!this.token && this.getTokenExpiryTime() > 0;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async logout() {
    try {
      if (this.token) {
        await axios.post(buildApiUrl('/auth/logout'), {}, {
          headers: this.getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }
}

export const authManager = new AuthManager();
export default authManager; 