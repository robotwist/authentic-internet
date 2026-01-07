import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import {
  loginUser,
  registerUser,
  verifyToken,
  logoutUser,
  refreshUserToken,
  logPersistentError,
} from "../api/api";
import API from "../api/api";

// Constants
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const REFRESH_RETRY_DELAY_MS = 60 * 1000; // 1 minute retry delay
const MAX_REFRESH_RETRIES = 3; // Maximum retry attempts
const DEVICE_SLEEP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes threshold for device sleep detection

// Utility functions (defined outside component to avoid circular dependencies)
const parseJWT = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token parsing error:", error);
    return null;
  }
};

const calculateTimeUntilExpiry = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return 0;

    const expiryMs = payload.exp * 1000; // Convert to milliseconds
    const currentMs = Date.now();
    return Math.max(0, expiryMs - currentMs);
  } catch (error) {
    console.error("Error calculating token expiry:", error);
    return 0;
  }
};

// Enhanced token refresh scheduling with fallback logic
const scheduleTokenRefreshWithFallback = (
  token,
  onRefreshSuccess,
  onRefreshFailure,
) => {
  const timeUntilExpiry = calculateTimeUntilExpiry(token);

  if (timeUntilExpiry <= 0) {
    console.log("Token already expired, attempting immediate refresh");
    onRefreshFailure("Token expired");
    return null;
  }

  // Calculate exact refresh time using Date.now() for precision
  const refreshTime = Math.max(1000, timeUntilExpiry - TOKEN_REFRESH_BUFFER_MS);
  const refreshTimestamp = Date.now() + refreshTime;

  console.log(
    `Scheduling token refresh at ${new Date(refreshTimestamp).toISOString()} (in ${Math.floor(refreshTime / 1000 / 60)} minutes)`,
  );

  // Store the target refresh timestamp for verification
  localStorage.setItem("tokenRefreshTimestamp", refreshTimestamp.toString());

  const timeoutId = setTimeout(async () => {
    console.log("Auto refreshing token...");

    // Verify we're still on schedule (device might have been asleep)
    const storedTimestamp = localStorage.getItem("tokenRefreshTimestamp");
    const currentTime = Date.now();
    const scheduledTime = storedTimestamp ? parseInt(storedTimestamp) : 0;

    // Check for device sleep or significant time drift
    if (Math.abs(currentTime - scheduledTime) > DEVICE_SLEEP_THRESHOLD_MS) {
      console.warn(
        "Token refresh significantly off schedule - device may have been asleep",
      );

      // If device was asleep for a long time, check if token is still valid
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        const remainingTime = calculateTimeUntilExpiry(currentToken);
        if (remainingTime <= 0) {
          console.error("Token expired while device was asleep");
          onRefreshFailure("Token expired during device sleep");
          return;
        }
      }
    }

    try {
      const success = await onRefreshSuccess();

      if (!success) {
        console.error("Automatic token refresh failed, will retry in 1 minute");
        // Implement exponential backoff for retries
        setTimeout(() => {
          console.log("Retrying token refresh...");
          onRefreshSuccess();
        }, REFRESH_RETRY_DELAY_MS);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      onRefreshFailure(error.message);
    }
  }, refreshTime);

  return timeoutId;
};

// Local storage helpers
const clearStoredAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const storeAuthData = (data) => {
  if (data.token) localStorage.setItem("token", data.token);
  if (data.refreshToken)
    localStorage.setItem("refreshToken", data.refreshToken);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
};

// Create the Auth Context
export const AuthContext = createContext(null);

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_SUCCESS: "SET_SUCCESS",
  SET_USER: "SET_USER",
  SET_AUTH_STATUS: "SET_AUTH_STATUS",
  CLEAR_MESSAGES: "CLEAR_MESSAGES",
  LOGOUT: "LOGOUT",
  AUTH_SUCCESS: "AUTH_SUCCESS",
  INIT_AUTH: "INIT_AUTH",
};

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  success: null,
  isAuthenticated: false,
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case AUTH_ACTIONS.SET_SUCCESS:
      return { ...state, success: action.payload };
    case AUTH_ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.SET_AUTH_STATUS:
      return { ...state, isAuthenticated: action.payload };
    case AUTH_ACTIONS.CLEAR_MESSAGES:
      return { ...state, error: null, success: null };
    case AUTH_ACTIONS.LOGOUT:
      clearStoredAuthData();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
        success: "Logged out successfully",
      };
    case AUTH_ACTIONS.AUTH_SUCCESS:
      storeAuthData(action.payload);
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
        success: action.payload.message || "Authentication successful!",
      };
    case AUTH_ACTIONS.INIT_AUTH:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        loading: false,
      };
    default:
      return state;
  }
}

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Set up axios interceptor for attaching Authorization header
const setupAxiosInterceptors = (token) => {
  // Request interceptor to add the auth token
  API.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor to handle 401 errors (token expired)
  API.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is 401 and we haven't tried refreshing the token yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Call refresh token endpoint (uses HTTP-only cookie automatically)
          const response = await API.post("/api/auth/refresh");

          if (response.data.token) {
            // Store the new token
            localStorage.setItem("token", response.data.token);

            // Update Authorization header for the original request
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

            // Update the Authorization header for future requests
            API.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;

            // Retry the original request
            return API(originalRequest);
          }
        } catch (refreshError) {
          // If refreshing failed, logout the user
          logout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );
};

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export const AuthProvider = ({ children }) => {
  // Use reducer for state management
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Refs
  const refreshTimeoutRef = useRef(null);
  const refreshInProgressRef = useRef(false);

  // Helper to clear refresh timeout
  const clearRefreshTimeout = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  // Schedule token refresh with enhanced fallback logic
  const scheduleTokenRefresh = (token) => {
    clearRefreshTimeout();

    refreshTimeoutRef.current = scheduleTokenRefreshWithFallback(
      token,
      async () => {
        return await refreshToken(true);
      },
      (error) => {
        console.error("Token refresh failed:", error);
        // If refresh fails during app usage, show user-friendly message
        if (state.isAuthenticated) {
          dispatch({
            type: AUTH_ACTIONS.SET_ERROR,
            payload: "Session expired. Please log in again.",
          });
        }
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      },
    );
  };

  // API Functions

  // Register
  const register = async (username, email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_MESSAGES });

      const data = await registerUser(username, email, password);
      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: data });

      if (data.token) {
        scheduleTokenRefresh(data.token);
      }

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      logPersistentError("AuthContext - register", error);

      let errorMessage = "Registration failed. Please try again.";

      // Handle validation errors from the backend
      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        const validationErrors = error.response.data.errors
          .map((err) => err.msg)
          .join(", ");
        errorMessage = validationErrors;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Add password requirements if available
      if (error.response?.data?.passwordRequirements) {
        errorMessage += " " + error.response.data.passwordRequirements;
      }

      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      // Clear any previous session data before attempting new login
      clearStoredAuthData();

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_MESSAGES });

      const data = await loginUser(username, password);

      // Verify the response data has the expected structure
      if (!data || !data.token || !data.user) {
        throw new Error("Invalid response from server. Please try again.");
      }

      // Store token in localStorage (access token only)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Set up axios interceptors for Authorization headers
      setupAxiosInterceptors(data.token);

      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: data });

      if (data.token) {
        scheduleTokenRefresh(data.token);
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      logPersistentError("AuthContext - login", error);

      // Clear any partial auth data that might exist
      clearStoredAuthData();

      // Try to provide a user-friendly error message
      let errorMessage = "Login failed. Please check your credentials.";

      // If the error has a specific message, use that
      if (error.message) {
        // Improve common error messages
        if (
          error.message.includes("401") ||
          error.message.includes("unauthorized")
        ) {
          errorMessage = "Invalid username or password. Please try again.";
        } else if (error.message.includes("connect")) {
          errorMessage =
            "Unable to connect to the server. Please check your internet connection.";
        } else {
          // Use the actual error message
          errorMessage = error.message;
        }
      }

      // Check for password requirements
      let fullErrorMessage = errorMessage;
      if (error.response?.data?.passwordRequirements) {
        fullErrorMessage += " " + error.response.data.passwordRequirements;
      }

      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: fullErrorMessage });
      return false;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Logout
  const logout = async () => {
    try {
      clearRefreshTimeout();

      if (state.isAuthenticated) {
        const refreshToken = localStorage.getItem("refreshToken");
        await logoutUser(refreshToken).catch((err) => {
          console.error("Error calling logout API:", err);
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      logPersistentError("AuthContext - logout", error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh token
  const refreshToken = async (force = false) => {
    if (refreshInProgressRef.current && !force) {
      console.log("Token refresh already in progress");
      return false;
    }

    refreshInProgressRef.current = true;

    try {
      const storedToken = localStorage.getItem("token");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedToken || !storedRefreshToken) {
        console.log("No tokens found in storage");
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }

      const response = await refreshUserToken(storedRefreshToken);

      if (response && response.token) {
        localStorage.setItem("token", response.token);
        scheduleTokenRefresh(response.token);

        if (!state.isAuthenticated && state.user) {
          dispatch({ type: AUTH_ACTIONS.SET_AUTH_STATUS, payload: true });
        }

        console.log("Token refreshed successfully");
        return true;
      }

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logPersistentError("AuthContext - refreshToken", error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return false;
    } finally {
      refreshInProgressRef.current = false;
    }
  };

  // Clear messages
  const clearMessages = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_MESSAGES });
  };

  // Update user data
  const updateUser = (updatedUser) => {
    // Update local storage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Update state
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
  };

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedUser = localStorage.getItem("user");

        if (!storedToken || !storedUser) {
          console.log("No stored auth data found");
          dispatch({
            type: AUTH_ACTIONS.INIT_AUTH,
            payload: { user: null, isAuthenticated: false },
          });
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          clearStoredAuthData();
          dispatch({
            type: AUTH_ACTIONS.INIT_AUTH,
            payload: { user: null, isAuthenticated: false },
          });
          return;
        }

        const timeUntilExpiry = calculateTimeUntilExpiry(storedToken);

        // Check if token is expired or expiring soon
        if (timeUntilExpiry <= TOKEN_REFRESH_BUFFER_MS) {
          console.log(
            `Token expired or expiring soon (${Math.floor(timeUntilExpiry / 1000)}s remaining), attempting refresh`,
          );

          if (storedRefreshToken) {
            const refreshSuccessful = await refreshToken(true);

            if (!refreshSuccessful) {
              console.log("Token refresh failed, clearing auth data");
              clearStoredAuthData();
              dispatch({
                type: AUTH_ACTIONS.INIT_AUTH,
                payload: { user: null, isAuthenticated: false },
              });
              return;
            }
          } else {
            console.log("No refresh token available, clearing auth data");
            clearStoredAuthData();
            dispatch({
              type: AUTH_ACTIONS.INIT_AUTH,
              payload: { user: null, isAuthenticated: false },
            });
            return;
          }
        } else {
          // Token is still valid, schedule refresh
          console.log(
            `Token valid for ${Math.floor(timeUntilExpiry / 1000 / 60)} minutes, scheduling refresh`,
          );
          scheduleTokenRefresh(storedToken);
        }

        // Set up axios interceptors for the current token
        setupAxiosInterceptors(storedToken);

        dispatch({
          type: AUTH_ACTIONS.INIT_AUTH,
          payload: { user: parsedUser, isAuthenticated: true },
        });
        console.log("Auth initialized from storage successfully");
      } catch (error) {
        console.error("Error initializing auth:", error);
        logPersistentError("AuthContext - initializeAuth", error);
        clearStoredAuthData();
        dispatch({
          type: AUTH_ACTIONS.INIT_AUTH,
          payload: { user: null, isAuthenticated: false },
        });
      }
    };

    initializeAuth();

    return () => {
      clearRefreshTimeout();
    };
  }, []);

  // Effect to set up interceptors when the context mounts or when token changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setupAxiosInterceptors(token);
    }
  }, []);

  // Create context value
  const authContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearMessages,
    updateUser,
    getTimeUntilExpiry: calculateTimeUntilExpiry,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!state.loading ? (
        children
      ) : (
        <div className="global-loading">Loading authentication...</div>
      )}
    </AuthContext.Provider>
  );
};
