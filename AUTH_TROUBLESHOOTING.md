# Authentication Troubleshooting Guide

This guide will help you diagnose and fix authentication issues in the Authentic Internet application.

## Quick Start

1. Open your application in the browser at http://localhost:5173
2. Open the browser console (F12 or Ctrl+Shift+I)
3. Use the built-in auth helpers:

```javascript
// Check your authentication status
auth.checkAuth();

// If problems exist, clear auth data
auth.clearAuth();

// Log in with the test user
auth.testLogin();

// Verify you're logged in
auth.whoAmI();
```

## Common Issues and Solutions

### "Access Denied - No token provided"

**Problem**: API requests are failing because no authentication token is being sent.

**Solutions**:
1. Check if you're logged in: `auth.checkAuth()`
2. Clear existing auth data: `auth.clearAuth()`
3. Login again: `auth.testLogin()`
4. Verify requests include the token by checking Network tab in dev tools

### API Calls Not Working After Login

**Problem**: You've logged in but API calls still fail.

**Solutions**:
1. Check token format: `auth.checkAuth()`
2. Verify token is being added to requests (check Network tab)
3. Try using the login util directly: `auth.testLogin()`
4. Check server logs for token validation errors

### Login Loop or Constant Redirects

**Problem**: The application keeps redirecting to login page.

**Solutions**:
1. Clear all browser storage: `auth.clearAuth()`
2. Check for cookie conflicts (try incognito mode)
3. Verify your login credentials
4. Check for CORS issues in the Network tab

### Cannot Access Protected Routes

**Problem**: You're logged in but can't access certain routes.

**Solutions**:
1. Verify you're authenticated: `auth.checkAuth()`
2. Check if your user has the required permissions
3. Try logging out and back in: `auth.clearAuth()` then `auth.testLogin()`

## Debugging Steps

1. **Check Authentication Status**
   ```javascript
   auth.checkAuth()
   ```
   This shows if you have valid tokens in storage and the API.

2. **Clear Authentication**
   ```javascript
   auth.clearAuth()
   ```
   Removes all authentication data for a fresh start.

3. **Test Login**
   ```javascript
   auth.testLogin()
   ```
   Attempts to log in with test credentials.

4. **Verify Current User**
   ```javascript
   auth.whoAmI()
   ```
   Checks if you can retrieve the current user data.

5. **Test API Connectivity**
   ```javascript
   fetch('http://localhost:3001/health').then(r => r.json()).then(console.log)
   ```
   Verifies the API server is reachable.

6. **Manual Token Test**
   ```javascript
   // Get token
   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
   
   // Test with token
   fetch('http://localhost:3001/api/auth/verify', {
     headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log)
   ```

## Server Side Troubleshooting

If client-side diagnostics don't solve the issue, check the server:

1. Verify the server is running: `curl http://localhost:3001/health`
2. Check server logs for authentication errors
3. Verify MongoDB connection: `curl http://localhost:3001/health | grep database`
4. Test token validation directly: 
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"testuser","password":"password123"}' | jq -r '.token')
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/verify
   ```

## Getting Further Help

If you're still having issues:

1. Check the server logs for detailed error messages
2. Review the API response in the Network tab
3. Try using an API testing tool like Insomnia or Postman
4. Clear all browser data and try again in incognito mode

## Running Tests

### Browser Console Testing
The login test can be run directly from the browser console:

```javascript
// Import the test login script
import('./src/testLogin.js').then(m => m.testLogin());

// Or if you're already on a page, just run:
auth.testLogin();
```

### Using the Run Tests Module
To run a comprehensive test suite:

```javascript
// Import the test runner
import('./src/run-tests.js').then(m => m.testAppFunctionality());
```

**Note**: These tests are designed to be run in the browser console, not directly with Node.js, as they require the browser environment. 