// Authentication Testing Utility
import API, { login, checkAuthStatus, clearStorageData } from './api';
import axios from 'axios';

// Helper to display token details
const showTokenDetails = (token) => {
  if (!token) return 'No token found';
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return 'Token is not in JWT format';
    
    // Base64 decoding needs to be web-safe
    const decodeBase64 = (str) => {
      // Add padding if needed
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      switch (str.length % 4) {
        case 0:
          break;
        case 2:
          str += '==';
          break;
        case 3:
          str += '=';
          break;
        default:
          throw new Error('Invalid base64 string');
      }
      
      try {
        return JSON.parse(atob(str));
      } catch (e) {
        return `Error decoding: ${e.message}`;
      }
    };
    
    const header = decodeBase64(parts[0]);
    const payload = decodeBase64(parts[1]);
    
    // Calculate expiration time if available
    let expirationMessage = '';
    if (payload.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = payload.exp * 1000 < now.getTime();
      expirationMessage = `Expires: ${expirationDate.toLocaleString()} (${isExpired ? 'EXPIRED' : 'Valid'})`;
    }
    
    return {
      header,
      payload,
      expiration: expirationMessage,
      raw: {
        header: parts[0],
        payload: parts[1],
        signature: parts[2].substring(0, 10) + '...'
      }
    };
  } catch (error) {
    return `Error parsing token: ${error.message}`;
  }
};

// Function to test direct API calls with console output
export const testDirectApiCall = async () => {
  console.log('🔍 Testing direct API call with axios...');
  
  // Get token from both storage locations
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  const token = localToken || sessionToken;
  
  if (!token) {
    console.error('❌ No token found in storage - cannot test API call');
    return false;
  }
  
  try {
    console.log(`Token being used: ${token.substring(0, 15)}...`);
    
    // Create a fresh axios instance for this test
    const testAxios = axios.create({
      baseURL: 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Log the headers being sent
    console.log('Request headers:', testAxios.defaults.headers);
    
    // Make a simple authenticated request
    const response = await testAxios.get('/api/auth/verify');
    console.log('✅ API call successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API call failed:', error.response || error.message);
    
    // Additional debugging for network errors
    if (!error.response) {
      console.error('Network error details:', error);
    } else {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
};

// Test artifact update directly
export const testArtifactUpdateDirect = async () => {
  console.log('🧪 Testing artifact update directly...');
  
  // Get token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found in storage - cannot test artifact update');
    return false;
  }
  
  try {
    const testAxios = axios.create({
      baseURL: 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test data
    const testArtifactId = 'test-artifact-12345';
    const updateData = {
      name: 'Updated Test Artifact',
      description: 'This is an updated test description',
      content: 'Updated test content'
    };
    
    // Display headers being sent
    console.log('Request headers:', testAxios.defaults.headers);
    console.log('Request data:', updateData);
    
    // Make the update request with test mode
    const response = await testAxios.put(`/api/artifacts/${testArtifactId}?testMode=true`, updateData);
    
    console.log('✅ Artifact update successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Artifact update failed:', error.response || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
};

// Run a comprehensive test of authentication
export const runAuthDiagnostics = async () => {
  console.log('🧪 Running Authentication Diagnostics');
  console.log('===================================');
  
  // Step 1: Check current auth status
  console.log('\n📋 STEP 1: Current Auth Status');
  const authStatus = checkAuthStatus();
  console.log('  Result:', authStatus);
  
  // Step 2: Analyze tokens in detail
  console.log('\n📋 STEP 2: Token Analysis');
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  
  console.log('  localStorage token:', localToken ? '✅ Present' : '❌ Missing');
  if (localToken) {
    console.log('  localStorage token details:', showTokenDetails(localToken));
  }
  
  console.log('  sessionStorage token:', sessionToken ? '✅ Present' : '❌ Missing');
  if (sessionToken) {
    console.log('  sessionStorage token details:', showTokenDetails(sessionToken));
  }
  
  // Step 3: Clear and re-authenticate
  console.log('\n📋 STEP 3: Fresh Authentication');
  console.log('  Clearing existing auth data...');
  clearStorageData();
  
  try {
    console.log('  Logging in with test credentials...');
    const loginResult = await login('testuser', 'password123', true);
    console.log('  Login result:', loginResult ? '✅ Success' : '❌ Failed');
    
    if (loginResult) {
      // Re-check tokens after login
      const newLocalToken = localStorage.getItem('token');
      console.log('  New token acquired:', newLocalToken ? '✅ Yes' : '❌ No');
      
      if (newLocalToken) {
        console.log('  New token details:', showTokenDetails(newLocalToken));
      }
    }
  } catch (error) {
    console.error('  Login error:', error);
  }
  
  // Step 4: Test a direct API call
  console.log('\n📋 STEP 4: Direct API Call Test');
  const apiCallResult = await testDirectApiCall();
  
  // Step 5: Check API instance configuration
  console.log('\n📋 STEP 5: API Instance Configuration');
  console.log('  API defaults:', API.defaults);
  console.log('  Authorization header:', API.defaults.headers?.common?.['Authorization'] || 'Not set');
  
  // Step 6: Verify CORS configuration
  console.log('\n📋 STEP 6: CORS Verification');
  try {
    const response = await fetch('http://localhost:5000/health');
    console.log('  Health check response:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('  Server status:', data);
    }
  } catch (error) {
    console.error('  CORS test failed:', error);
  }
  
  // Step 7: Test artifact update
  console.log('\n📋 STEP 7: Artifact Update Test');
  const artifactUpdateResult = await testArtifactUpdateDirect();
  
  // Final summary
  console.log('\n📋 DIAGNOSTICS SUMMARY');
  if (authStatus.isAuthenticated) {
    console.log('✅ Auth status reports authenticated');
  } else {
    console.log('❌ Auth status reports not authenticated');
  }
  
  if (apiCallResult) {
    console.log('✅ Direct API call successful');
  } else {
    console.log('❌ Direct API call failed');
  }
  
  if (artifactUpdateResult) {
    console.log('✅ Artifact update test successful');
  } else {
    console.log('❌ Artifact update test failed');
  }
  
  console.log('\nDiagnostics complete. Check console for details.');
  return {
    initialAuthStatus: authStatus,
    loginSuccess: localStorage.getItem('token') !== null,
    apiCallSuccess: apiCallResult,
    artifactUpdateSuccess: artifactUpdateResult
  };
};

// Export the functions
export default {
  runAuthDiagnostics,
  testDirectApiCall,
  testArtifactUpdateDirect,
  showTokenDetails
}; 