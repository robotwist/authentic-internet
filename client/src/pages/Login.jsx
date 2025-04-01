/**
 * Login Component
 * 
 * Handles user authentication with username and password.
 * Features include:
 * - Form validation
 * - Password visibility toggle
 * - Remember me functionality
 * - Responsive design with accessibility features
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { testApiConnection } from '../api/api';

// Custom hook for API health check (for developer debugging only)
const useApiHealthCheck = () => {
  useEffect(() => {
    let isMounted = true;
    
    const checkApi = async () => {
      try {
        // Skip if we're in production to avoid unnecessary requests
        if (import.meta.env.PROD) return;
        
        // Only proceed if the component is still mounted
        if (!isMounted) return;
        
        // Use a custom timeout to avoid blocking the login flow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await API.get('/health', {
          signal: controller.signal
        }).catch(e => {
          // Silently fail if request times out or fails
          clearTimeout(timeoutId);
          return null;
        });
        
        clearTimeout(timeoutId);
        
        if (response && response.data) {
          console.debug(
            `API is online (${response.data?.environment || 'unknown'})`
          );
        }
      } catch (err) {
        // Only log if the component is still mounted and not in production
        if (isMounted && !import.meta.env.PROD) {
          console.debug('API health check failed - this is normal during development');
        }
      }
    };
    
    // Delay the health check to prioritize the login UI rendering
    const timerId = setTimeout(checkApi, 2000);
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);
};

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const usernameInputRef = useRef(null);
  
  // Use our custom hook for developer debugging only
  useApiHealthCheck();

  // Check if there was an error from the URL query params (e.g., expired=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please login again.');
    }
  }, [location.search]);

  // Sync with auth context errors
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Focus username input on component mount
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  // Check for existing token on mount (for debugging)
  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    
    if (existingToken && existingUser) {
      console.log("Found existing login session - this is just for debugging");
      
      // Quick sanity check on the token format
      if (typeof existingToken !== 'string' || existingToken.length < 10) {
        console.warn("⚠️ Existing token may be invalid:", 
          existingToken.substring(0, 10) + '...');
      }
    }
  }, []);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing again
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add a failsafe login method as backup
  const attemptFailsafeLogin = async () => {
    try {
      console.warn("Using failsafe login method");
      
      // Show API URL for debugging
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      console.log(`🔍 API URL used: ${apiUrl}`);
      
      // Log the data being sent
      const loginData = {
        identifier: formData.username, 
        username: formData.username,
        password: formData.password
      };
      console.log("Sending login data:", { ...loginData, password: '******' });
      
      // Direct API call as fallback
      const response = await API.post('/api/auth/login', loginData);
      
      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);
      
      // Safely extract token and user data
      const token = response?.data?.token;
      const user = response?.data?.user;
      
      if (!token || !user) {
        console.error("Invalid login response format:", response.data);
        return false;
      }
      
      // Save token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify the token was saved
      console.log("Token saved:", localStorage.getItem('token')?.substring(0, 10) + '...');
      console.log("User saved:", localStorage.getItem('user'));
      
      // Reload the page to reset all app state with new authentication
      window.location.href = from;
      return true;
    } catch (error) {
      // Enhanced error logging
      console.error("Failsafe login failed:", error);
      
      if (error.response) {
        console.error("Server response status:", error.response.status);
        console.error("Server response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("Login failed: Unable to connect to the server. Please check if the API server is running.");
      } else {
        console.error("Request setup error:", error.message);
      }
      
      // If it's a network error, check if the server is accessible
      if (error.message.includes('Network Error')) {
        console.error("Network error detected - API might be down or inaccessible from client");
        try {
          // Attempt a basic health check
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          console.log(`Attempting health check on ${apiUrl}`);
          
          fetch(`${apiUrl}/api/health`, { 
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            timeout: 5000
          }).then(response => {
            console.log("Health check response:", response.status);
          }).catch(err => {
            console.error("Health check failed:", err);
          });
        } catch (healthCheckError) {
          console.error("Health check attempt failed:", healthCheckError);
        }
      }
      
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    
    // Basic validation - just ensure fields aren't empty
    if (!formData.username || !formData.password) {
      setFormErrors({
        ...((!formData.username) ? { username: 'Username is required' } : {}),
        ...((!formData.password) ? { password: 'Password is required' } : {})
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Attempt login with credentials
      let success = false;
      
      try {
        // Try normal login through context first
        success = await login(formData.username, formData.password);
        
        if (success) {
          console.log("Context login successful");
          // Verify the token is in localStorage
          const token = localStorage.getItem('token');
          if (!token) {
            console.warn("Login reported success but no token found");
            success = false;
          } else {
            console.log("Token found after login:", token.substring(0, 10) + '...');
          }
        }
      } catch (contextError) {
        console.warn("Context login failed, trying failsafe:", contextError);
        // If context login fails, try the direct approach
        success = await attemptFailsafeLogin();
      }
      
      if (success) {
        // Force a full page reload to ensure all components recognize the new auth state
        window.location.href = from;
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Provide user-friendly error messages
      console.error("Login error:", err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="form-container" aria-labelledby="login-heading">
      <h2 id="login-heading">Login</h2>
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            ref={usernameInputRef}
            required
            aria-required="true"
            aria-invalid={!!formErrors.username}
            aria-describedby={formErrors.username ? "username-error" : undefined}
            autoComplete="username"
            placeholder="Enter username"
            disabled={isLoading}
            className={formErrors.username ? 'error-input' : ''}
          />
          {formErrors.username && (
            <div className="input-error" id="username-error" role="alert">
              {formErrors.username}
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!formErrors.password}
              aria-describedby={formErrors.password ? "password-error" : undefined}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isLoading}
              className={formErrors.password ? 'error-input' : ''}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              tabIndex="-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <div className="input-error" id="password-error" role="alert">
              {formErrors.password}
            </div>
          )}
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({
              ...formData,
              rememberMe: e.target.checked
            })}
            disabled={isLoading}
          />
          <label htmlFor="rememberMe">Remember me</label>
        </div>
        <button 
          type="submit" 
          className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              <span>Logging in...</span>
            </>
          ) : 'Login'}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </div>
      
      {/* Show diagnostic button only in development or if there's an error */}
      {(import.meta.env.DEV || error) && (
        <div className="diagnostic-tools" style={{ marginTop: '20px', padding: '10px', border: '1px dashed #ccc' }}>
          <h3>Diagnostic Tools</h3>
          <button 
            onClick={async () => {
              try {
                console.log("Testing API connection...");
                const results = await testApiConnection();
                console.log("Connection test results:", results);
                alert(`API Connection Test Results:
                  API URL: ${results.apiUrl}
                  Origin: ${results.originUrl}
                  CORS Test: ${results.corsTest ? '✅' : '❌'} (${results.corsStatus})
                  Health Test: ${results.healthTest ? '✅' : '❌'} (${results.healthStatus})
                  ${results.error ? `Error: ${results.error}` : ''}`);
              } catch (err) {
                console.error("Connection test failed:", err);
                alert(`API test failed: ${err.message}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Test API Connection
          </button>
          <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5001'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Login; 