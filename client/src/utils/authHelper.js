// Auth Helper Utilities
// Import these in the browser console for easy authentication troubleshooting

import { checkAuthStatus, clearStorageData, login, getCurrentUser } from '../api/api';

// Call this to see your authentication status
export const checkAuth = () => {
  console.log('🔍 Checking Authentication Status:');
  const status = checkAuthStatus();
  
  console.log('Summary:');
  console.log(`✅ Authenticated: ${status.isAuthenticated}`);
  
  return status;
};

// Call this to clear any problematic authentication data
export const clearAuth = () => {
  console.log('🧹 Clearing Authentication Data:');
  clearStorageData();
  
  console.log('✅ Done - Try logging in again');
  return true;
};

// Login with the test user
export const testLogin = async () => {
  console.log('🔑 Logging in with test user credentials:');
  const result = await login('testuser', 'password123', true);
  
  if (result) {
    console.log('✅ Login successful');
    return true;
  } else {
    console.error('❌ Login failed');
    return false;
  }
};

// Get the current user
export const whoAmI = async () => {
  console.log('👤 Fetching current user:');
  const user = await getCurrentUser();
  
  if (user) {
    console.log('✅ Logged in as:', user.username);
    console.log('User details:', user);
    return user;
  } else {
    console.error('❌ Not logged in or unable to retrieve user');
    return null;
  }
};

// Export all helper functions
export default {
  checkAuth,
  clearAuth,
  testLogin,
  whoAmI
}; 