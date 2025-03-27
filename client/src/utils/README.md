# Authentication Debugging Tools

This directory contains utilities to help debug authentication issues in the Authentic Internet application.

## Available Tools

### Browser Console Helpers

These tools are available directly in your browser console:

```javascript
// Check your current authentication status
auth.checkAuth();

// Clear all authentication data (for troubleshooting)
auth.clearAuth();

// Log in with the test user
auth.testLogin();

// Get current user details
auth.whoAmI();
```

### Test Scripts

You can also run automated tests to verify authentication:

```bash
# From the client directory
npm run test:login
```

Or run all tests:

```bash
# From the client directory
node src/run-tests.js
```

## Troubleshooting Common Issues

### "Access Denied - No token provided"

This error occurs when your authentication token is missing or invalid.

Solutions:
1. Clear your authentication data: `auth.clearAuth()`
2. Log in again: `auth.testLogin()`
3. Check if your login was successful: `auth.checkAuth()`

### "Token expired" or "Invalid token"

Your authentication token has expired or is no longer valid.

Solutions:
1. Clear your authentication data: `auth.clearAuth()`
2. Log in again: `auth.testLogin()`

### Browser Storage Issues

If your application is stuck in a loop or showing inconsistent authentication:

1. Open your browser's Developer Tools
2. Go to Application > Storage > Local Storage
3. Clear the data for your site
4. Refresh the page
5. Log in again

## API Reference

| Function | Description |
|----------|-------------|
| `checkAuth()` | Displays current authentication status |
| `clearAuth()` | Clears all authentication data from storage |
| `testLogin()` | Logs in with test user credentials |
| `whoAmI()` | Shows current user details if logged in |

For more detailed API information, see the source code in `authHelper.js`. 