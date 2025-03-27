// Global Authentication Helpers
import { login, checkAuthStatus, clearStorageData } from './api';
import { runAuthDiagnostics, testDirectApiCall, testArtifactUpdateDirect } from './authTest';
import { testArtifactUpdate, testServerConnection } from './artifactTests';

// Create a global auth helper for browser console use
const createGlobalHelper = () => {
  const authHelper = {
    // Basic auth functions
    login: async (username = 'testuser', password = 'password123') => {
      console.log(`🔑 Attempting login for ${username}...`);
      const result = await login(username, password, true);
      console.log(`Login result: ${result ? '✅ Success' : '❌ Failed'}`);
      return result;
    },
    
    checkAuth: () => {
      console.log('🔍 Checking authentication status...');
      const status = checkAuthStatus();
      console.log('Auth status:', status);
      return status;
    },
    
    clearAuth: () => {
      console.log('🧹 Clearing authentication data...');
      clearStorageData();
      console.log('✅ Done');
      return true;
    },
    
    // Advanced diagnostic tools
    diagnose: async () => {
      console.log('🧪 Running comprehensive authentication diagnostics...');
      return await runAuthDiagnostics();
    },
    
    testApiCall: async () => {
      console.log('🔌 Testing direct API call...');
      return await testDirectApiCall();
    },
    
    testArtifactUpdate: async () => {
      console.log('🏺 Testing artifact update...');
      return await testArtifactUpdateDirect();
    },
    
    // New artifact testing functions
    testArtifactUpdateAdvanced: async () => {
      console.log('🧪 Running advanced artifact update tests...');
      return await testArtifactUpdate();
    },
    
    testServerConnection: async () => {
      console.log('🔌 Testing server connection...');
      return await testServerConnection();
    },
    
    // Helper to display instructions
    help: () => {
      console.log(`
📋 Authentication Helper Commands:
--------------------------------
auth.login(username, password) - Login with the given credentials
auth.checkAuth()               - Check the current authentication status
auth.clearAuth()               - Clear all authentication data
auth.diagnose()                - Run comprehensive authentication diagnostics
auth.testApiCall()             - Test a direct authenticated API call
auth.testArtifactUpdate()      - Test artifact update API call
auth.testArtifactUpdateAdvanced() - Run advanced artifact update tests
auth.testServerConnection()    - Test server connection
auth.help()                    - Show this help message
      `);
    }
  };
  
  // Make it globally available
  if (typeof window !== 'undefined') {
    window.auth = authHelper;
    console.log(`
🔐 Authentication helpers loaded!
--------------------------------
Try 'auth.help()' to see available commands.
    `);
  }
  
  return authHelper;
};

// Self-executing function to create the helper
const authHelper = createGlobalHelper();

export default authHelper; 