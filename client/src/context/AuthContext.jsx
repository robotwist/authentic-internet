import { createContext, useContext, useState, useEffect } from 'react';
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
  const [isVerifying, setIsVerifying] = useState(false);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  // Function to refresh token
  const refreshToken = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return false;

      const response = await verifyToken();
      if (response.token) {
        localStorage.setItem('token', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

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
          }

          setUser(userData);
          await verifyToken();
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setError('Session expired. Please login again.');
        } finally {
          setIsVerifying(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isVerifying]);

  const login = async (username, password) => {
    try {
      setError(null);
      const data = await loginUser(username, password);
      setUser(data.user);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const data = await registerUser(username, email, password);
      setUser(data.user);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 