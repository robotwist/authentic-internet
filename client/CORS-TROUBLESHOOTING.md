# CORS Troubleshooting Guide

This guide will help you diagnose and fix CORS (Cross-Origin Resource Sharing) issues that you might encounter while working on this project.

## What is CORS?

CORS is a security feature implemented by browsers that restricts web pages from making requests to a different domain than the one that served the original page. This is a security measure to prevent malicious websites from making unauthorized requests to other websites on your behalf.

## Common CORS Error Messages

- `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header is present on the requested resource`
- `Request header field Authorization is not allowed by Access-Control-Allow-Headers in preflight response`

## Common Causes of CORS Errors in Our Project

1. **Running the client on a port not included in the allowedOrigins list**
2. **Server and client running on different URLs than expected**
3. **Environment variables not properly set**
4. **Server not running or restarted without client knowing**
5. **Authentication headers misconfiguration**

## Automatic Fixes

Our project includes automatic CORS handling:

1. The API client will automatically retry requests that fail due to CORS errors
2. It will switch to the fallback API URL if the primary URL has CORS issues
3. The server's CORS configuration is permissive in development mode

## Manual Fixes

### 1. Update Allowed Origins

You can add a new origin to the allowed list by running:

```bash
# From the project root
CORS_ADD_ORIGIN=http://localhost:YOUR_PORT node server/add-cors-origin.js
```

### 2. Restart Services

Often, simply restarting all services fixes CORS issues:

```bash
# From the project root
./restart-services.sh
```

### 3. Check Environment Variables

Verify that your `.env` files have the correct URLs:

- Client: `client/.env`
- Server: `server/.env`

Make sure `VITE_API_URL` and other URL variables match your actual server address.

### 4. Use the Debug Tools

The project includes debugging tools:

- Browser console: Look for CORS error diagnostics
- API Debugger: Visit http://localhost:5173/debug.html
- Network tab: Check for failed requests with CORS errors

### 5. Directly Test the API

Use a tool like curl to test the API directly:

```bash
curl -v -H "Origin: http://localhost:5173" http://localhost:5000/health
```

Look for the `Access-Control-Allow-Origin` header in the response.

## Advanced CORS Troubleshooting

### Browser Extensions

Some browser extensions can cause CORS issues. Try disabling extensions or testing in incognito mode.

### Proxy Configuration

Our Vite development server includes a proxy configuration that forwards API requests:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000',
    '/health': 'http://localhost:5000'
  }
}
```

Make sure this configuration is correct and that the proxy is working properly.

### Server Code Review

Check these files for CORS configuration:

- `server/server.mjs` - Main CORS configuration
- `server/middleware/cors-updater.js` - Auto-updating CORS middleware
- `server/add-cors-origin.js` - Script to add origins

## Common Gotchas

1. **Inconsistent ports**: Vite might change ports if the default port is in use.
2. **HTTPS vs HTTP**: Mixing secure and non-secure origins causes CORS errors.
3. **Wildcards**: Using `*` for `Access-Control-Allow-Origin` doesn't work with credentials.
4. **Cached preflight responses**: Browsers cache preflight responses, which might cause issues after configuration changes.

## Need More Help?

If you're still encountering CORS issues:

1. Check the browser console for detailed error messages.
2. Look at server logs for CORS error diagnostics.
3. Try creating a minimal reproduction case to isolate the issue.
4. Search for similar issues in the project's issue tracker.

Remember that CORS is a client-side security feature - the errors appear in the browser, but the fix is almost always on the server side! 