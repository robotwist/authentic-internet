# Game Performance Best Practices

## React Best Practices for Games

### 1. **useEffect Consolidation**
❌ **Bad**: Multiple useEffects with overlapping dependencies
```javascript
useEffect(() => { updateA() }, [dep1, dep2]);
useEffect(() => { updateB() }, [dep1, dep2]);
useEffect(() => { updateC() }, [dep1, dep2]);
```

✅ **Good**: Consolidate related effects
```javascript
useEffect(() => {
  updateA();
  updateB();
  updateC();
}, [dep1, dep2]);
```

### 2. **Avoid Infinite Loops**
❌ **Bad**: Including state in dependencies that you update
```javascript
useEffect(() => {
  setState(prevState => newState);
}, [state]); // Will loop!
```

✅ **Good**: Use functional setState, remove from dependencies
```javascript
useEffect(() => {
  setState(prevState => ({ ...prevState, ...updates }));
}, [otherDep]); // state not in dependencies
```

### 3. **Memoization for Expensive Computations**
```javascript
// Memoize computed values
const visibleNPCs = useMemo(() => 
  npcs.filter(npc => isVisible(npc, viewport))
, [npcs, viewport]);

// Memoize callbacks
const handleClick = useCallback((id) => {
  // handler logic
}, [dependencies]);
```

### 4. **React.memo for Component Optimization**
```javascript
const ExpensiveComponent = React.memo(({ data }) => {
  // component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

## Asset Loading Best Practices

### 1. **Preload Critical Assets**
```javascript
// Preload assets before game starts
const criticalAssets = [
  { url: '/assets/player.png', type: 'image', priority: 10 },
  { url: '/assets/tileset.png', type: 'image', priority: 9 },
  { url: '/assets/music/main.mp3', type: 'audio', priority: 5 }
];

await assetLoader.preloadAssets(criticalAssets);
```

### 2. **Lazy Load Non-Critical Assets**
```javascript
// Load assets when needed
useEffect(() => {
  if (currentLevel === 2) {
    assetLoader.loadImage('/assets/level2-background.png');
  }
}, [currentLevel]);
```

### 3. **Use Sprite Sheets**
- Combine multiple images into one sprite sheet
- Reduces HTTP requests
- Better for texture atlasing

### 4. **Image Optimization**
- Use WebP format for better compression
- Provide multiple sizes for responsive loading
- Compress images with tools like imagemin

## Sound Management Best Practices

### 1. **Load Sounds Progressively**
```javascript
// Load critical sounds first
await soundManager.loadSounds(['jump', 'collect', 'damage']);

// Load music in background
setTimeout(() => {
  soundManager.loadMusic(['background', 'boss']);
}, 2000);
```

### 2. **Use Audio Sprite for Short Sounds**
- Combine short sound effects into one audio file
- Use Web Audio API to play segments
- Reduces number of HTTP requests

### 3. **Implement Sound Pooling**
```javascript
class SoundPool {
  constructor(soundBuffer, poolSize = 5) {
    this.sources = [];
    this.soundBuffer = soundBuffer;
    this.poolSize = poolSize;
  }
  
  play() {
    // Reuse sources instead of creating new ones
  }
}
```

## Rendering Optimization

### 1. **Viewport Culling**
```javascript
// Only render entities in viewport
const visibleEntities = entities.filter(entity => 
  isInViewport(entity, viewport)
);
```

### 2. **Object Pooling**
```javascript
// Reuse objects instead of creating new ones
class ObjectPool {
  constructor(createFn, resetFn, size = 100) {
    this.pool = Array(size).fill(null).map(createFn);
    this.resetFn = resetFn;
    this.available = [...this.pool];
  }
  
  acquire() {
    return this.available.pop() || null;
  }
  
  release(obj) {
    this.resetFn(obj);
    this.available.push(obj);
  }
}
```

### 3. **RAF for Game Loop**
```javascript
// Use requestAnimationFrame for smooth updates
useEffect(() => {
  let animationFrame;
  
  const gameLoop = (timestamp) => {
    update(timestamp);
    render();
    animationFrame = requestAnimationFrame(gameLoop);
  };
  
  animationFrame = requestAnimationFrame(gameLoop);
  
  return () => cancelAnimationFrame(animationFrame);
}, []);
```

### 4. **Batch State Updates**
```javascript
// Instead of multiple setStates
❌ setState1(value1);
   setState2(value2);
   setState3(value3);

// Use single state object
✅ setGameState(prev => ({
     ...prev,
     value1, value2, value3
   }));
```

## Memory Management

### 1. **Clean Up Resources**
```javascript
useEffect(() => {
  const resources = loadResources();
  
  return () => {
    // Clean up
    resources.forEach(r => r.dispose());
    URL.revokeObjectURL(objectUrl);
  };
}, []);
```

### 2. **Limit Cache Size**
```javascript
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 3. **Monitor Memory Usage**
```javascript
// In development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const memory = performance.memory;
    if (memory.usedJSHeapSize > 100 * 1024 * 1024) {
      console.warn('High memory usage!', memory);
    }
  }, 10000);
}
```

## Performance Monitoring

### 1. **Track Render Time**
```javascript
useEffect(() => {
  const start = performance.now();
  
  return () => {
    const renderTime = performance.now() - start;
    if (renderTime > 16) { // 60fps threshold
      console.warn('Slow render:', renderTime);
    }
  };
});
```

### 2. **Use Performance API**
```javascript
performance.mark('game-start');
// ... game logic
performance.mark('game-end');
performance.measure('game-load', 'game-start', 'game-end');
```

### 3. **Throttle/Debounce Frequent Events**
```javascript
// Throttle scroll/resize handlers
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};
```

## React Specific Game Optimizations

### 1. **Separate Game Logic from Rendering**
```javascript
// Game logic in custom hook
function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  useEffect(() => {
    // Game loop
  }, []);
  
  return { state, actions };
}

// Rendering component
function GameView({ state }) {
  return <Canvas>{/* render state */}</Canvas>;
}
```

### 2. **Use Canvas/WebGL for Complex Scenes**
```javascript
// Instead of DOM elements for many sprites
// Use Canvas or WebGL via libraries like:
// - react-konva
// - react-three-fiber
// - pixi-react
```

### 3. **Virtualize Long Lists**
```javascript
// For long lists of items (inventory, etc.)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

## Current Implementation Checklist

- ✅ Asset preloading system (AssetLoader.js)
- ✅ Sound management with fallbacks (SoundManager.js)
- ✅ Viewport culling in Map component
- ✅ Memoization for expensive computations
- ✅ Performance monitoring in GameWorld
- ⚠️ TODO: Consolidate GameWorld useEffects (16 → 5-6)
- ⚠️ TODO: Implement object pooling for enemies
- ⚠️ TODO: Use sprite sheets for character animations
- ⚠️ TODO: Consider Canvas2D/WebGL for rendering

## Recommended Next Steps

1. **Consolidate useEffects in GameWorld** (high priority)
2. **Implement sprite sheets** for character/NPC animations
3. **Add object pooling** for frequently created/destroyed objects
4. **Profile with React DevTools** to identify bottlenecks
5. **Consider migrating** to Canvas2D for better performance

