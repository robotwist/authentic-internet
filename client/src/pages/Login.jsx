import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there was an error from the URL query params (e.g., expired=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please login again.');
    }
    
    // Check API availability
    const checkApi = async () => {
      try {
        const response = await API.get('/health');
        setApiStatus({
          status: 'online',
          message: `API is online (${response.data?.environment || 'unknown'})`
        });
      } catch (err) {
        console.error('API health check failed:', err);
        setApiStatus({
          status: 'offline',
          message: 'API appears to be offline. Login may not work.'
        });
      }
    };
    
    checkApi();
  }, [location.search]);

  // Sync with auth context errors
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { username: formData.username });
      const success = await login(formData.username, formData.password);
      if (success) {
        console.log('Login successful, navigating to:', from);
        navigate(from, { replace: true });
      } else {
        // This will likely not run as the login function will throw on error
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      
      {/* API status indicator */}
      {apiStatus && (
        <div className={`api-status ${apiStatus.status}`}>
          {apiStatus.message}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter username"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="btn"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--secondary-color)' }}>
          Register
        </Link>
      </p>
    </div>
  );
};

export default Login; 