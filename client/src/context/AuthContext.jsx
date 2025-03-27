import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, verifyToken } from '../api/api';

const AuthContext = createContext(null);

// Separate the useAuth hook for better compatibility with Fast Refresh
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  // Function to check if token is expired
  const isTokenExpired = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Return true if token expires in less than 5 minutes
      return timeUntilExpiry < 300000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }, []);

  // Function to schedule token refresh
  const scheduleTokenRefresh = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Clear existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      // Schedule refresh 5 minutes before expiration
      const refreshTime = Math.max(0, timeUntilExpiry - 300000);
      const timeout = setTimeout(async () => {
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        }
      }, refreshTime);

      setRefreshTimeout(timeout);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }, [refreshTimeout]);

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return false;

      const response = await verifyToken();
      if (response.token) {
        localStorage.setItem('token', response.token);
        scheduleTokenRefresh(response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [scheduleTokenRefresh]);

  // Function to clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Function to handle successful authentication
  const handleAuthSuccess = useCallback((data) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    scheduleTokenRefresh(data.token);
    setSuccess(data.message || 'Authentication successful!');
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser && !isVerifying) {
        try {
          setIsVerifying(true);
          const userData = JSON.parse(storedUser);
          
          if (!userData.id) {
            throw new Error('Invalid user data');
          }

          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              throw new Error('Token expired and refresh failed');
            }
          } else {
            scheduleTokenRefresh(storedToken);
          }

          setUser(userData);
          await verifyToken();
          setSuccess('Session restored successfully');
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        } finally {
          setIsVerifying(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isVerifying, isTokenExpired, refreshToken, scheduleTokenRefresh, refreshTimeout]);

  const login = async (identifier, password) => {
    try {
      clearMessages();
      const data = await loginUser(identifier, password);
      handleAuthSuccess(data);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      clearMessages();
      const data = await registerUser(username, email, password);
      handleAuthSuccess(data);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  const logout = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    setSuccess('Logged out successfully');
  }, [refreshTimeout]);

  const value = {
    user,
    loading,
    error,
    success,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    clearMessages
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 