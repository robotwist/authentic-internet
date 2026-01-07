# GameWorld.jsx useEffect Audit & Consolidation Plan

## Current State: 15 useEffect Hooks ❌

### Problems:
1. **Too many separate effects** - causes excessive re-render checks
2. **Duplicate dependencies** - multiple effects watching same values
3. **Performance overhead** - React checks all 15 effects on every render
4. **Hard to maintain** - logic scattered across component
5. **Risk of loops** - more effects = more chance of dependency issues

## Current useEffect Breakdown:

### 1. **Explored Tiles Update** (Line 382)
- **Dependencies**: `[characterPosition]`
- **Purpose**: Update minimap fog of war
- **Status**: ✅ Fixed (removed self-dependency)

### 2. **Performance Monitoring Render** (Line 415)
- **Dependencies**: `[]` (runs on every render)
- **Purpose**: Track render performance
- **Status**: ⚠️ Throttled but still runs every render

### 3. **Portal Collision Handler** (Line 732)
- **Dependencies**: `[portalState.isTransitioning, currentMap, PORTAL_CONFIG, handlePortalTransition, updatePortalState]`
- **Purpose**: Listen for portal events
- **Status**: ✅ Event listener pattern

### 4. **Component Initialization** (Line 1177)
- **Dependencies**: `[isInitialized]`
- **Purpose**: Mark component as initialized
- **Status**: ⚠️ Can be removed with better init pattern

### 5. **Main Initialization** (Line 1185)
- **Dependencies**: `[loadCharacter, fetchNPCs, initSoundManager, handleKeyDown, soundManager]`
- **Purpose**: Initialize game state, load data, setup listeners
- **Status**: ✅ Core initialization effect

### 6. **Music Management** (Line 1211)
- **Dependencies**: `[soundManager, currentMapIndex]`
- **Purpose**: Change music when map changes
- **Status**: ✅ Good separation of concerns

### 7. **Portal Proximity** (Line 1259)
- **Dependencies**: `[characterPosition, currentMap, PORTAL_CONFIG, portalState.portalNotificationActive]`
- **Purpose**: Show portal hints
- **Status**: ⚠️ Could consolidate with character position effect

### 8. **Artifact Loading** (Line 1328)
- **Dependencies**: `[updateGameState]`
- **Purpose**: Load artifacts from API
- **Status**: ✅ Runs once on mount

### 9. **Auto-save** (Line 1358)
- **Dependencies**: `[saveGameProgress]`
- **Purpose**: Save game every 30 seconds
- **Status**: ✅ Good interval pattern

### 10. **Mobile/Accessibility Detection** (Line 1364)
- **Dependencies**: `[]`
- **Purpose**: Detect mobile and accessibility preferences
- **Status**: ✅ Runs once on mount, sets up listeners

### 11. **Performance Monitoring Interval** (Line 1420)
- **Dependencies**: `[]`
- **Purpose**: Check memory usage periodically
- **Status**: ⚠️ Duplicate with #2, can consolidate

### 12. **Character Position Update** (Line 1527)
- **Dependencies**: `[characterPosition, adjustViewport]`
- **Purpose**: Update character style and viewport
- **Status**: ✅ Fixed separation from movement

### 13. **Character Movement Animation** (Line 1543)
- **Dependencies**: `[characterMovement.movementDirection, characterMovement.diagonalMovement]`
- **Purpose**: Handle movement animations
- **Status**: ✅ Fixed separation from position

### 14. **Artifact Collision Detection** (Line 1620)
- **Dependencies**: `[characterPosition, currentMapIndex, gameData.artifacts]`
- **Purpose**: Check if player is on artifact
- **Status**: ⚠️ Could consolidate with character position effect

### 15. **Load Achievements** (Line 1895)
- **Dependencies**: `[]`
- **Purpose**: Load achievements from localStorage
- **Status**: ⚠️ Can consolidate with main initialization

## Consolidation Plan: 15 → 6 Effects ✅

### **Consolidated Effect 1: Initialization** (Mount Once)
**Consolidates**: #4, #5, #8, #10, #15
```javascript
useEffect(() => {
  // Mark as initialized
  setIsInitialized(true);
  
  // Initialize game state manager
  gameStateManager.init();
  
  // Load initial data
  loadCharacter();
  fetchNPCs();
  initSoundManager();
  
  // Load artifacts and achievements
  loadArtifacts();
  loadAchievements();
  
  // Detect mobile/accessibility
  detectMobileAndAccessibility();
  
  // Setup event listeners
  window.addEventListener("keydown", handleKeyDownEvent);
  
  return () => {
    window.removeEventListener("keydown", handleKeyDownEvent);
    soundManager?.cleanup();
  };
}, []); // Empty deps - run once
```

### **Consolidated Effect 2: Character Updates** (Position Changes)
**Consolidates**: #1, #7, #12, #14
```javascript
useEffect(() => {
  // Update explored tiles (fog of war)
  updateExploredTiles(characterPosition);
  
  // Update character style
  setCharacterState(prev => ({
    ...prev,
    style: {
      ...prev.style,
      left: characterPosition.x,
      top: characterPosition.y,
    },
  }));
  
  // Adjust viewport
  adjustViewport(characterPosition);
  
  // Check artifact collision
  checkArtifactCollision(characterPosition);
  
  // Show portal hints if nearby
  checkPortalProximity(characterPosition);
}, [characterPosition]);
```

### **Consolidated Effect 3: Movement Animation**
**Keeps**: #13 (already well-separated)
```javascript
useEffect(() => {
  // Handle movement animations
  // Already optimized
}, [characterMovement.movementDirection, characterMovement.diagonalMovement]);
```

### **Consolidated Effect 4: Map Changes**
**Consolidates**: #3, #6
```javascript
useEffect(() => {
  // Setup portal collision listener
  window.addEventListener('portalCollision', handlePortalCollision);
  
  // Change music for new map
  if (soundManager) {
    changeMusicForMap(currentMap.name);
  }
  
  return () => {
    window.removeEventListener('portalCollision', handlePortalCollision);
  };
}, [currentMapIndex]);
```

### **Consolidated Effect 5: Auto-save**
**Keeps**: #9 (already well-separated)
```javascript
useEffect(() => {
  const autoSaveInterval = setInterval(saveGameProgress, 30000);
  return () => clearInterval(autoSaveInterval);
}, [saveGameProgress]);
```

### **Consolidated Effect 6: Performance Monitoring**
**Consolidates**: #2, #11 (development only)
```javascript
useEffect(() => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Track render count and time
  renderCount.current++;
  const now = performance.now();
  const renderTime = now - lastRenderTime.current;
  
  // Log slow renders (throttled)
  if (renderTime > 16 && renderCount.current % 100 === 0) {
    console.warn(`Slow render: ${renderTime.toFixed(2)}ms`);
  }
  
  lastRenderTime.current = now;
  
  // Memory monitoring
  const memoryInterval = setInterval(() => {
    const memory = performance.memory;
    if (memory?.usedJSHeapSize > 100 * 1024 * 1024) {
      console.warn('High memory usage:', Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB');
    }
  }, 10000);
  
  return () => clearInterval(memoryInterval);
}, []); // Empty deps but still runs for render tracking
```

## Benefits of Consolidation:

1. **Performance**: 
   - 60% fewer effect checks per render (15 → 6)
   - Reduced reconciliation overhead
   - Better code splitting

2. **Maintainability**:
   - Related logic grouped together
   - Easier to understand data flow
   - Fewer files to modify for changes

3. **Reliability**:
   - Fewer dependency arrays = less chance of mistakes
   - Clear separation of concerns
   - Easier to test

4. **Best Practices**:
   - Follows React documentation guidelines
   - Similar to how Redux/Zustand organize effects
   - Industry standard for complex components

## Implementation Steps:

1. ✅ Fix infinite loop issues (already done)
2. ✅ Create helper functions for complex logic
3. ⏳ Refactor effects according to plan above
4. ⏳ Test thoroughly to ensure no regressions
5. ⏳ Monitor performance improvements

## Testing Checklist:

- [ ] Character movement still works
- [ ] Music changes with maps
- [ ] Portal detection works
- [ ] Auto-save functions
- [ ] Artifacts load correctly
- [ ] Mobile detection works
- [ ] Performance monitoring active
- [ ] No console errors
- [ ] No infinite loops
- [ ] Memory usage stable

