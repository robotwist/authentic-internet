import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Users to test login with
const users = [
  { username: 'gemini', password: 'Password123' },
  { username: 'pamela', password: 'Password123' },
  { username: 'robotwist', password: 'Password123' },
  { username: 'baconshirt', password: 'Password123' }
];

// API URL
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test login for a single user
const testLogin = async (username, password) => {
  try {
    console.log(`\nTesting login for user: ${username}`);
    console.log('-'.repeat(40));
    
    // Send login request
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: username,
      username,
      password
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Login successful');
      console.log(`Token received: ${response.data.token.substring(0, 15)}...`);
      console.log(`User: ${JSON.stringify(response.data.user, null, 2)}`);
      return { success: true, token: response.data.token, user: response.data.user };
    } else {
      console.log('❌ Login failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      return { success: false, error: error.response.data };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Test verification with token
const testVerification = async (token) => {
  try {
    console.log('\nTesting token verification');
    console.log('-'.repeat(40));
    
    // Send verification request
    const response = await axios.get(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Token verification successful');
      return { success: true };
    } else {
      console.log('❌ Token verification failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      return { success: false, error: error.response.data };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Test refresh token
const testRefresh = async (refreshToken) => {
  try {
    console.log('\nTesting token refresh');
    console.log('-'.repeat(40));
    
    // Send refresh request
    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      refreshToken
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Token refresh successful');
      console.log(`New token received: ${response.data.token.substring(0, 15)}...`);
      return { success: true, token: response.data.token };
    } else {
      console.log('❌ Token refresh failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Refresh error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      return { success: false, error: error.response.data };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// First test health endpoint
const testHealth = async () => {
  try {
    console.log('Testing API health endpoint');
    console.log('-'.repeat(40));
    
    // Send health request
    const response = await axios.get(`${API_URL}/api/health`);
    
    if (response.status === 200) {
      console.log('✅ API health check successful');
      console.log(`Response:`, response.data);
      return { success: true, data: response.data };
    } else {
      console.log('❌ API health check failed:', response.status);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      return { success: false, error: error.response.data };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Run tests for all users
const runAllTests = async () => {
  console.log('='.repeat(60));
  console.log('AUTHENTICATION SYSTEM TEST');
  console.log('='.repeat(60));
  
  // Test health endpoint first
  await testHealth();
  
  // Test each user
  const results = [];
  for (const user of users) {
    const loginResult = await testLogin(user.username, user.password);
    results.push({ user: user.username, result: loginResult });
    
    // If login successful, test verification and refresh
    if (loginResult.success) {
      const verifyResult = await testVerification(loginResult.token);
      
      if (loginResult.refreshToken) {
        await testRefresh(loginResult.refreshToken);
      } else {
        console.log('⚠️ No refresh token provided, skipping refresh test');
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Summary
  console.log('TEST SUMMARY');
  console.log('-'.repeat(40));
  for (const result of results) {
    console.log(`${result.user}: ${result.result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!result.result.success) {
      console.log(`  Error: ${JSON.stringify(result.result.error)}`);
    }
  }
};

// Run all tests
runAllTests().catch(error => {
  console.error('Test error:', error);
}); 