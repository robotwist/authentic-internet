import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApiHealthCheck.css';
import { API_CONFIG, buildApiUrl } from '../utils/apiConfig';

/**
 * Component to check health of external APIs used by the application
 */
const ApiHealthCheck = () => {
  const [apiStatuses, setApiStatuses] = useState({
    server: { status: 'checking', message: 'Checking server connection...' },
    quotable: { status: 'checking', message: 'Checking Quotable API...' },
    zenQuotes: { status: 'checking', message: 'Checking ZenQuotes API...' },
    folger: { status: 'checking', message: 'Checking Folger Shakespeare API...' },
    weather: { status: 'checking', message: 'Checking Weather API...' }
  });

  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    // Reset statuses
    setApiStatuses({
      server: { status: 'checking', message: 'Checking server connection...' },
      quotable: { status: 'checking', message: 'Checking Quotable API...' },
      zenQuotes: { status: 'checking', message: 'Checking ZenQuotes API...' },
      folger: { status: 'checking', message: 'Checking Folger Shakespeare API...' },
      weather: { status: 'checking', message: 'Checking Weather API...' }
    });

    // Check server health
    checkServerHealth();
    
    // Check Quotable API
    checkQuotableHealth();
    
    // Check ZenQuotes API
    checkZenQuotesHealth();
    
    // Check Folger Shakespeare API
    checkFolgerHealth();
    
    // Check Weather API
    checkWeatherHealth();
  };

  /**
   * Check if server is running
   */
  const checkServerHealth = async () => {
    try {
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${serverUrl}/api/health`);
      
      if (response.status === 200) {
        setApiStatuses(prev => ({
          ...prev,
          server: {
            status: 'online',
            message: `Server is online (${response.data.environment || 'unknown'})`,
            details: response.data
          }
        }));
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      setApiStatuses(prev => ({
        ...prev,
        server: {
          status: 'offline',
          message: `Server check failed: ${error.message}`,
          error: error.message
        }
      }));
    }
  };

  /**
   * Check if Quotable API is accessible
   */
  const checkQuotableHealth = async () => {
    try {
      const url = buildApiUrl('quotable', 'random');
      const response = await axios.get(url);
      
      if (response.status === 200 && response.data?.content) {
        setApiStatuses(prev => ({
          ...prev,
          quotable: {
            status: 'online',
            message: 'Quotable API is working',
            details: { 
              quote: response.data.content, 
              author: response.data.author 
            },
            note: 'The app has fallback quotes if this API fails'
          }
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Quotable API check failed:', error);
      setApiStatuses(prev => ({
        ...prev,
        quotable: {
          status: 'offline',
          message: `Quotable API check failed: ${error.message}`,
          error: error.message,
          note: 'The app has fallback quotes if this API fails'
        }
      }));
    }
  };

  /**
   * Check if ZenQuotes API is accessible
   */
  const checkZenQuotesHealth = async () => {
    try {
      const url = buildApiUrl('zenQuotes', 'random');
      const response = await axios.get(url);
      
      if (response.status === 200 && Array.isArray(response.data) && response.data[0]?.q) {
        setApiStatuses(prev => ({
          ...prev,
          zenQuotes: {
            status: 'online',
            message: 'ZenQuotes API is working',
            details: { 
              quote: response.data[0].q, 
              author: response.data[0].a 
            },
            note: 'The app has fallback quotes if this API fails'
          }
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('ZenQuotes API check failed:', error);
      setApiStatuses(prev => ({
        ...prev,
        zenQuotes: {
          status: 'offline',
          message: `ZenQuotes API check failed: ${error.message}`,
          error: error.message,
          note: 'The app has fallback quotes if this API fails'
        }
      }));
    }
  };

  /**
   * Check if Folger Shakespeare API is accessible
   */
  const checkFolgerHealth = async () => {
    try {
      // For Folger we'll use a specific line from Hamlet as a test
      const url = `${API_CONFIG.folger.baseUrl}/Ham/ftln/0012`;
      const response = await axios.get(url);
      
      // For Folger API, we're just checking if we get an HTML response
      if (response.status === 200) {
        setApiStatuses(prev => ({
          ...prev,
          folger: {
            status: 'online',
            message: 'Folger Shakespeare API is working',
            details: { responseSize: response.data?.length || 0 },
            note: 'The app has fallback Shakespeare quotes if this API fails'
          }
        }));
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Folger API check failed:', error);
      setApiStatuses(prev => ({
        ...prev,
        folger: {
          status: 'offline',
          message: `Folger API check failed: ${error.message}`,
          error: error.message,
          note: 'The app has fallback Shakespeare quotes if this API fails'
        }
      }));
    }
  };

  /**
   * Check if Weather API is accessible
   */
  const checkWeatherHealth = async () => {
    try {
      // Use a simple lookup for London to test the API
      const params = {
        q: 'London',
        appid: API_CONFIG.weather.apiKey,
        units: 'metric'
      };
      
      const url = `${API_CONFIG.weather.baseUrl}${API_CONFIG.weather.endpoints.current}`;
      const response = await axios.get(url, { params });
      
      if (response.status === 200 && response.data?.main) {
        setApiStatuses(prev => ({
          ...prev,
          weather: {
            status: 'online',
            message: 'Weather API is working',
            details: { 
              location: response.data.name,
              temp: response.data.main.temp,
              condition: response.data.weather[0]?.main
            }
          }
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Weather API check failed:', error);
      setApiStatuses(prev => ({
        ...prev,
        weather: {
          status: 'offline',
          message: `Weather API check failed: ${error.message}`,
          error: error.message
        }
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="api-health-check">
      <div className="api-health-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3>API Status Check</h3>
        <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
      </div>
      
      {!isCollapsed && (
        <div className="api-health-content">
          <button className="refresh-button" onClick={checkApiHealth}>
            Refresh Status
          </button>
          
          <div className="api-status-list">
            {Object.entries(apiStatuses).map(([api, data]) => (
              <div key={api} className={`api-status-item ${data.status}`}>
                <div className="api-status-header">
                  <span className="api-status-icon">{getStatusIcon(data.status)}</span>
                  <strong>{api}:</strong> {data.message}
                </div>
                {data.note && <div className="api-status-note">{data.note}</div>}
                {data.details && (
                  <div className="api-status-details">
                    <pre>{JSON.stringify(data.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="api-health-footer">
            <p>Note: The application has fallback mechanisms for all external APIs.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiHealthCheck; 