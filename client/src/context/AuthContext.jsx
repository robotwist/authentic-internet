import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { loginUser, registerUser, verifyToken, logoutUser, refreshUserToken, logPersistentError } from '../api/api';

// Constants
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

// Utility functions (defined outside component to avoid circular dependencies)
const parseJWT = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token parsing error:', error);
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
    console.error('Error calculating token expiry:', error);
    return 0;
  }
};

// Local storage helpers
const clearStoredAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const storeAuthData = (data) => {
  if (data.token) localStorage.setItem('token', data.token);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
};

// Create the Auth Context
const AuthContext = createContext(null);

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  SET_USER: 'SET_USER',
  SET_AUTH_STATUS: 'SET_AUTH_STATUS',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  LOGOUT: 'LOGOUT',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  INIT_AUTH: 'INIT_AUTH',
};

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  success: null,
  isAuthenticated: false
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
        success: 'Logged out successfully'
      };
    case AUTH_ACTIONS.AUTH_SUCCESS:
      storeAuthData(action.payload);
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
        success: action.payload.message || 'Authentication successful!'
      };
    case AUTH_ACTIONS.INIT_AUTH:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        loading: false
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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
  
  // Schedule token refresh
  const scheduleTokenRefresh = (token) => {
    clearRefreshTimeout();
    
    const timeUntilExpiry = calculateTimeUntilExpiry(token);
    if (timeUntilExpiry <= 0) return;
    
    const refreshTime = Math.max(1000, timeUntilExpiry - TOKEN_REFRESH_BUFFER_MS);
    console.log(`Scheduling token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
    
    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('Auto refreshing token...');
      await refreshToken(true);
    }, refreshTime);
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
      console.error('Registration error:', error);
      logPersistentError('AuthContext - register', error);
      
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      let fullErrorMessage = errorMessage;
      
      if (error.response?.data?.passwordRequirements) {
        fullErrorMessage += ' ' + error.response.data.passwordRequirements;
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: fullErrorMessage });
      return false;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };
  
  // Login
  const login = async (username, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_MESSAGES });
      
      const data = await loginUser(username, password);
      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: data });
      
      if (data.token) {
        scheduleTokenRefresh(data.token);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      logPersistentError('AuthContext - login', error);
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      let fullErrorMessage = errorMessage;
      
      if (error.response?.data?.passwordRequirements) {
        fullErrorMessage += ' ' + error.response.data.passwordRequirements;
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
        const refreshToken = localStorage.getItem('refreshToken');
        await logoutUser(refreshToken).catch(err => {
          console.error('Error calling logout API:', err);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      logPersistentError('AuthContext - logout', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };
  
  // Refresh token
  const refreshToken = async (force = false) => {
    if (refreshInProgressRef.current && !force) {
      console.log('Token refresh already in progress');
      return false;
    }
    
    refreshInProgressRef.current = true;
    
    try {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedToken || !storedRefreshToken) {
        console.log('No tokens found in storage');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }
      
      const response = await refreshUserToken(storedRefreshToken);
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        scheduleTokenRefresh(response.token);
        
        if (!state.isAuthenticated && state.user) {
          dispatch({ type: AUTH_ACTIONS.SET_AUTH_STATUS, payload: true });
        }
        
        console.log('Token refreshed successfully');
        return true;
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logPersistentError('AuthContext - refreshToken', error);
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
  
  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
          console.log('No stored auth data found');
          dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: null, isAuthenticated: false } });
          return;
        }
        
        let parsedUser;
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          clearStoredAuthData();
          dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: null, isAuthenticated: false } });
          return;
        }
        
        const timeUntilExpiry = calculateTimeUntilExpiry(storedToken);
        
        if (timeUntilExpiry <= TOKEN_REFRESH_BUFFER_MS) {
          console.log('Token expired or expiring soon, attempting refresh');
          
          if (storedRefreshToken) {
            const refreshSuccessful = await refreshToken(true);
            
            if (!refreshSuccessful) {
              console.log('Token refresh failed, clearing auth data');
              clearStoredAuthData();
              dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: null, isAuthenticated: false } });
              return;
            }
          } else {
            console.log('No refresh token available');
            clearStoredAuthData();
            dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: null, isAuthenticated: false } });
            return;
          }
        } else {
          scheduleTokenRefresh(storedToken);
        }
        
        dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: parsedUser, isAuthenticated: true } });
        console.log('Auth initialized from storage');
      } catch (error) {
        console.error('Error initializing auth:', error);
        logPersistentError('AuthContext - initializeAuth', error);
        clearStoredAuthData();
        dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: null, isAuthenticated: false } });
      }
    };
    
    initializeAuth();
    
    return () => {
      clearRefreshTimeout();
    };
  }, []);
  
  // Create context value
  const authContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearMessages,
    getTimeUntilExpiry: calculateTimeUntilExpiry
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {!state.loading ? children : <div className="global-loading">Loading authentication...</div>}
    </AuthContext.Provider>
  );
}; 