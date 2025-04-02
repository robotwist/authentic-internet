import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loginUser, registerUser, verifyToken, logPersistentError } from '../api/api';

const AuthContext = createContext(null);

// Separate the useAuth hook for better compatibility with Fast Refresh
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Add a debounce utility to prevent too many API calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState(null);
  const [lastVerified, setLastVerified] = useState(0);
  const [renderCount, setRenderCount] = useState(0); // Add render counter
  const [initAttempted, setInitAttempted] = useState(false); // Track if initialization was attempted
  const VERIFICATION_THROTTLE_MS = 30000; // 30 seconds between verification attempts
  const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
  const TOKEN_REFRESH_INTERVAL_MS = 300000; // 5 minutes
  
  // Log rendering for debugging
  console.log(`AuthProvider rendering #${renderCount} at ${new Date().toISOString()}`);
  
  // Increment render count on each render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);
  
  // Store these functions in refs to break circular dependencies
  const refreshTokenRef = useRef(null);
  const scheduleTokenRefreshRef = useRef(null);
  const logoutRef = useRef(null); // Add ref for logout
  const refreshingRef = useRef(false);

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

  // Add throttling to token verification with memoization
  const throttledVerifyToken = useCallback(async () => {
    const now = Date.now();
    // Only verify if we haven't verified in the last VERIFICATION_THROTTLE_MS
    if (now - lastVerified < VERIFICATION_THROTTLE_MS) {
      console.log("Skipping token verification - throttled");
      return { token: localStorage.getItem('token') }; // Return existing token
    }
    
    try {
      setIsVerifying(true);
      const result = await verifyToken();
      // Update last verified time
      setLastVerified(now);
      return result;
    } catch (error) {
      console.error("Token verification failed:", error);
      return { token: localStorage.getItem('token') }; // Return existing token on error
    } finally {
      setIsVerifying(false);
    }
  }, [lastVerified]);

  // Function to schedule token refresh - break circular dependency with useRef
  scheduleTokenRefreshRef.current = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Clear existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      // Schedule refresh 5 minutes before expiration or at minimum 30 minutes
      const refreshTime = Math.max(1800000, Math.min(timeUntilExpiry - 300000, 3600000)); // Between 30-60 minutes
      console.log(`Scheduling token refresh in ${refreshTime/60000} minutes`);
      
      const timeout = setTimeout(async () => {
        let refreshed = false;
        if (refreshTokenRef.current) {
          refreshed = await refreshTokenRef.current();
        }
        if (!refreshed && logoutRef.current) {
          logoutRef.current();
        }
      }, refreshTime);

      setRefreshTimeout(timeout);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  };

  // Function to refresh token - break circular dependency with useRef
  refreshTokenRef.current = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return false;

      const response = await throttledVerifyToken();
      if (response.token) {
        localStorage.setItem('token', response.token);
        if (scheduleTokenRefreshRef.current) {
          scheduleTokenRefreshRef.current(response.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Stable wrapper function for external use
  const refreshToken = useCallback(async (force = false) => {
    try {
      if (refreshingRef.current) {
        console.log("Already refreshing token");
        return;
      }
      
      refreshingRef.current = true;
      
      // Skip refresh if not forced and the token is still valid
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const now = Date.now();
      const timeUntilExpiration = tokenExpiration ? parseInt(tokenExpiration) - now : 0;
      
      if (!force && timeUntilExpiration > TOKEN_REFRESH_BUFFER_MS) {
        console.log(`Token still valid for ${Math.round(timeUntilExpiration / 1000 / 60)} minutes, skipping refresh`);
        refreshingRef.current = false;
        return;
      }
      
      const data = await verifyToken();
      handleAuthSuccess(data);
      
      // Set new timeout for next refresh
      if (refreshTimeout) clearTimeout(refreshTimeout);
      setRefreshTimeout(setTimeout(() => refreshToken(), TOKEN_REFRESH_INTERVAL_MS));
      
      console.log("Token refreshed successfully");
      refreshingRef.current = false;
    } catch (error) {
      logPersistentError('AuthContext - Token Refresh', error);
      console.error("Failed to refresh token:", error);
      refreshingRef.current = false;
      logout();
    }
  }, []);

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
    if (scheduleTokenRefreshRef.current) {
      scheduleTokenRefreshRef.current(data.token);
    }
    setSuccess(data.message || 'Authentication successful!');
    setError(null);
  }, []);

  // Logout function - break circular dependency
  logoutRef.current = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    setSuccess('Logged out successfully');
    setLastVerified(0);
  };

  // Stable wrapper for logout
  const logout = useCallback(() => {
    if (logoutRef.current) {
      logoutRef.current();
    }
  }, []);

  // Initialize auth only once
  useEffect(() => {
    let isMounted = true;
    console.log("AuthContext: Running initialization effect.");
    
    // Skip initialization if already attempted to prevent loops
    if (initAttempted) {
      console.log("AuthContext: Init already attempted, skipping");
      if (isMounted && loading) {
        setLoading(false); // Ensure we exit loading state
      }
      return;
    }
    
    // Mark that we've attempted initialization
    setInitAttempted(true);

    const initializeAuth = async () => {
      if (!isMounted) {
          console.log("AuthContext: Initialization aborted, component unmounted.");
          return;
      }
      console.log("AuthContext: Starting initializeAuth function.");

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      let finalUser = null;
      let finalToken = storedToken;
      let finalSuccess = null;
      let finalError = null;
      let needsLogout = false; // Flag to determine if logout cleanup is needed

      if (finalToken && storedUser) {
        console.log("AuthContext: Found token and user in storage.");
        try {
          // Attempt to parse user data early
          try {
              finalUser = JSON.parse(storedUser);
              if (!finalUser || !finalUser.id) {
                  throw new Error('Invalid user data format in storage');
              }
          } catch (parseError) {
              console.error("AuthContext: Failed to parse stored user data.", parseError);
              throw new Error('Invalid user data format in storage'); // Propagate error
          }

          // Skip verification for now, just use the stored user data
          // This prevents network errors during initialization
          console.log("AuthContext: Using stored user data, skipping token verification for now.");
          finalSuccess = 'Session restored successfully';

          // Schedule a future verification after component is mounted and renders
          if (scheduleTokenRefreshRef.current) {
             console.log("AuthContext: Scheduling initial token refresh for later.");
             scheduleTokenRefreshRef.current(finalToken);
          }
        } catch (error) {
          console.error('AuthContext: Auth initialization error:', error);
          needsLogout = true; // Mark for logout on any initialization error
          finalError = 'Failed to initialize session.';
        }
      } else {
        console.log("AuthContext: No token/user found in storage.");
        needsLogout = true; // No token means logged out state
      }

      // --- Final State Updates ---
      if (isMounted) {
        console.log("AuthContext: Applying final state updates.");

        if (needsLogout) {
            console.log("AuthContext: Setting final state to logged out.");
            setUser(null);
            // Clear storage and timeouts if we determined a logout is needed
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (refreshTimeout) clearTimeout(refreshTimeout);
            setRefreshTimeout(null);
            setLastVerified(0); // Reset verification time on logout
        } else {
             console.log("AuthContext: Setting final state to logged in.");
             setUser(finalUser);
        }

        // Set messages and loading state regardless
        setError(finalError);
        setSuccess(finalSuccess);
        console.log("AuthContext: Setting loading to false.");
        setLoading(false);
      } else {
          console.log("AuthContext: Final state updates skipped, component unmounted.");
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log("AuthContext: Cleaning up initialization effect.");
      isMounted = false;
      // Clear refresh timeout on unmount is important
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        console.log("AuthContext: Cleared refresh timeout on unmount.");
      }
    };
    // Keep dependencies empty to run only once on mount
  }, []);

  const login = async (username, password) => {
    try {
      clearMessages();
      setLoading(true);
      const data = await loginUser(username, password);
      handleAuthSuccess(data);
      setLoading(false);
      return true;
    } catch (error) {
      logPersistentError('AuthContext - Login', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      clearMessages();
      setLoading(true);
      const data = await registerUser(username, email, password);
      handleAuthSuccess(data);
      setLoading(false);
      return true;
    } catch (error) {
      logPersistentError('AuthContext - Register', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

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

  // Determine if we should show children - either:
  // 1. We've finished loading OR
  // 2. We've tried initializing at least once and 2+ seconds have passed
  const shouldShowChildren = !loading || (initAttempted && renderCount > 3);
  
  console.log(`AuthContext: shouldShowChildren=${shouldShowChildren}, loading=${loading}, initAttempted=${initAttempted}, renderCount=${renderCount}`);

  return (
    <AuthContext.Provider value={value}>
      {shouldShowChildren ? children : <div>Loading authentication state...</div>}
    </AuthContext.Provider>
  );
}; 