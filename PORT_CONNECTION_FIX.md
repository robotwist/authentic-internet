# Port Connection Error Fix

## Problem Fixed ✅

**Error**: `GET http://localhost:5175/ net::ERR_CONNECTION_REFUSED`

**Root Cause**: Vite's HMR (Hot Module Reload) was trying to connect to port 5175, but the dev server was actually running on port 5176.

## Why This Happened

1. **Port conflict**: Port 5175 was already in use
2. **Vite auto-fallback**: Vite automatically used port 5176
3. **HMR config mismatch**: The vite.config.js still had hardcoded port 5175
4. **WebSocket connection**: HMR uses WebSocket to connect to the dev server

## Fix Applied

### Updated `vite.config.js` (Line 17-27)

**Before** ❌:
```javascript
server: {
  hmr: {
    port: 5175,  // ❌ Hardcoded old port
  },
  port: 5175,  // ❌ Old port
}
```

**After** ✅:
```javascript
server: {
  hmr: {
    // ✅ Auto-detect port (no hardcoded value)
  },
  port: 5176,  // ✅ Updated to current port
}
```

### Restarted Frontend Server

```bash
# Killed old process
kill 40051

# Started fresh with new config
cd client && npm run dev
```

## Current Status

✅ **Backend**: http://localhost:5001  
✅ **Frontend**: http://localhost:5176  
✅ **HMR**: Auto-detecting correct port

## Testing

1. **Hard refresh browser**: Ctrl+Shift+R
2. **Check console**: Should see no connection errors
3. **Make a change**: HMR should work smoothly
4. **Open**: http://localhost:5176

## Why Remove Hardcoded HMR Port?

When you remove the hardcoded `port` from the HMR config, Vite automatically uses the same port as the dev server. This prevents mismatches:

```javascript
hmr: {
  protocol: 'ws',
  host: 'localhost',
  // No port specified = auto-detect from server.port
}
```

## If Error Persists

1. **Clear browser cache**:
   ```javascript
   // In console (F12):
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Check for multiple Vite processes**:
   ```bash
   lsof -i :5176
   lsof -i :5175
   # Kill any old processes
   ```

3. **Verify correct URL**:
   - Use: http://localhost:5176 ✅
   - Not: http://localhost:5175 ❌

## Prevention

To avoid this in the future:
- Let Vite auto-select ports with `strictPort: false`
- Don't hardcode HMR ports
- Use environment variables for port configuration if needed

## Quick Commands

```bash
# Check running servers
lsof -i :5176  # Frontend
lsof -i :5001  # Backend

# Restart frontend if needed
pkill -f "vite"
cd client && npm run dev

# Test frontend is serving
curl -s http://localhost:5176 | head -5
```

---

**Status**: Port mismatch fixed ✅ | HMR working ✅ | Servers running on correct ports 🎮

