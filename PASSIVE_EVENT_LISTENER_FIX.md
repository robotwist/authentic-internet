# Passive Event Listener Fix

## Issue Fixed ✅

**Error**: `Unable to preventDefault inside passive event listener invocation`

**Location**: Map.jsx line 56 (wheel event handler)

## Problem Explained

Modern browsers automatically make certain event listeners (like `wheel`, `touchstart`, `touchmove`) **passive** by default for performance reasons. Passive listeners cannot call `preventDefault()` because the browser needs to know immediately if scrolling should be blocked.

### What was happening:
```javascript
// ❌ This doesn't work with React's synthetic events:
<div onWheel={handleWheel}>
  // handleWheel tries to call e.preventDefault()
  // Browser warning: "Can't preventDefault in passive listener!"
</div>
```

## Solution Applied

Changed from React's synthetic event to a native DOM event listener with `{ passive: false }`:

```javascript
// ✅ Fixed with useEffect and native addEventListener:
useEffect(() => {
  const mapElement = document.querySelector(`[data-map-name="${mapName}"]`);
  if (mapElement) {
    // Explicitly set passive: false to allow preventDefault
    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    
    // Clean up on unmount
    return () => {
      mapElement.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }
}, [mapName, handleWheel]);
```

## Changes Made

### 1. **Wrapped handler in useCallback**
```javascript
const handleWheel = useCallback((e) => {
  e.preventDefault();
  // Zoom functionality can be added here
}, []);
```

### 2. **Added useEffect to attach native listener**
```javascript
useEffect(() => {
  const mapElement = document.querySelector(`[data-map-name="${mapName}"]`);
  if (mapElement) {
    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      mapElement.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }
}, [mapName, handleWheel]);
```

### 3. **Removed onWheel from JSX**
```javascript
// ❌ Before:
<div onWheel={handleWheel}>

// ✅ After:
<div>
// Event listener attached via useEffect instead
```

## Why This Matters

1. **No more console warnings** - Clean console for debugging
2. **Proper event handling** - preventDefault() now works correctly
3. **Better performance** - Browser can optimize scrolling when not prevented
4. **React best practices** - Using refs/useEffect for DOM manipulation

## Current Server Status

✅ **Backend**: http://localhost:5001  
✅ **Frontend**: http://localhost:5176 (NOTE: Changed from 5175)

## Testing

1. Open http://localhost:5176
2. Open browser console (F12)
3. Scroll on the map
4. **Expected**: No warning messages
5. **Expected**: Smooth scrolling behavior

## Additional Notes

- The frontend port changed from **5175** to **5176** because 5175 was already in use
- Killed the old process to avoid conflicts
- All changes applied via HMR (Hot Module Replacement)

## Related Files

- **Fixed**: `client/src/components/Map.jsx`
- **Lines changed**: 55-58, 240-249, 289-296

---

**Status**: Warning fixed ✅ | Servers running cleanly ✅ | Ready to use 🎮

