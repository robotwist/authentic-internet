# Performance Optimization Components

This module provides components and utilities for monitoring and optimizing application performance.

## Features

### Performance Monitoring

- Real-time FPS counter
- Memory usage tracking (in supported browsers)
- Network request tracking
- Cache hit/miss statistics
- Error logging and tracking

### Error Tracking

- Global error handling for unhandled exceptions
- Categorized error tracking
- Error severity levels
- Local storage of error logs
- Server-side error reporting for critical issues

### API Caching

- Automatic caching of API responses
- Configurable cache durations by resource type
- Cache invalidation strategies
- Cache statistics

## Usage

### Basic Usage

Add the `PerformanceWrapper` component to your application:

```jsx
import { PerformanceWrapper } from './components/performance';
import API from './api/api';

function App() {
  return (
    <PerformanceWrapper apiInstance={API}>
      {/* Your application content */}
    </PerformanceWrapper>
  );
}
```

### Monitor Only

If you only want to show the performance monitor:

```jsx
import { PerformanceMonitor } from './components/performance';

function YourComponent() {
  return (
    <div>
      <h1>Your Component</h1>
      <PerformanceMonitor position="bottom-right" />
    </div>
  );
}
```

### Error Tracking

Track errors in your code:

```jsx
import { trackError, ERROR_CATEGORIES, ERROR_LEVELS } from './components/performance';

try {
  // Your code that might throw an error
} catch (error) {
  trackError('Something went wrong', {
    category: ERROR_CATEGORIES.API,
    level: ERROR_LEVELS.ERROR,
    originalError: error,
    context: { yourData: 'here' }
  });
}
```

### API Caching

Enhance your API with caching:

```jsx
import { withCache, cacheDurations } from './components/performance';

// Create a cached version of an API function
const getCachedData = withCache(
  async (id) => {
    const response = await fetch(`/api/data/${id}`);
    return response.json();
  },
  { 
    duration: cacheDurations.medium, 
    keyFn: (id) => `data-${id}` 
  }
);
```

## Components

### PerformanceMonitor

A floating display showing real-time performance metrics.

Props:
- `position`: Where to display the monitor ('bottom-right', 'bottom-left', 'top-right', 'top-left')
- `showMetrics`: Whether to show the monitor regardless of environment

### PerformanceWrapper

A wrapper component that initializes performance monitoring, error tracking, and API caching.

Props:
- `apiInstance`: Your API instance to enhance with caching
- `enableErrorTracking`: Whether to enable global error tracking
- `enableCaching`: Whether to enable API caching
- `showMonitor`: Whether to show the performance monitor
- `monitorPosition`: Where to position the monitor

## Utilities

### Error Tracking

- `trackError(message, options)`: Log an error with the tracking system
- `createErrorHandler(context, category)`: Create a reusable error handler
- `setupGlobalErrorHandling()`: Set up global error listeners
- `getErrorLog()`: Get all stored errors
- `clearErrorLog()`: Clear all stored errors

### Caching

- `withCache(fn, options)`: Wrap a function with caching
- `clearAllCache()`: Clear all cached items
- `clearCacheByPattern(pattern)`: Clear cache entries matching a pattern
- `getCacheStats()`: Get statistics about the cache

## Configuration

You can enable or disable performance monitoring in localStorage:

```js
// Enable performance metrics
localStorage.setItem('enablePerfMetrics', 'true');

// Or use the helper
import Performance from './components/performance';
Performance.enablePerformanceMetrics(true);
```

## Browser Support

- Full support: Chrome, Edge, Firefox, Safari
- Partial support: IE11 (basic monitoring only, no memory metrics) 