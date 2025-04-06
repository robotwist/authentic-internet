// Service Worker for Authentic Internet

// Cache names
const STATIC_CACHE_NAME = 'authentic-internet-static-v1';
const DYNAMIC_CACHE_NAME = 'authentic-internet-dynamic-v1';
const ASSET_CACHE_NAME = 'authentic-internet-assets-v1';

// Assets to cache on install (static assets)
const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Assets to cache with longer expiration (game assets)
const gameAssets = [
  '/assets/maps/',
  '/assets/characters/',
  '/assets/tiles/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🤖 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('Caching static assets');
          return cache.addAll(staticAssets);
        }),
        
      // Prepare game assets cache
      caches.open(ASSET_CACHE_NAME)
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🤖 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== ASSET_CACHE_NAME
            ) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper function to determine if request is for an API
const isApiRequest = (url) => {
  const parsedUrl = new URL(url);
  return parsedUrl.pathname.startsWith('/api/');
};

// Helper function to determine if request is for an asset
const isAssetRequest = (url) => {
  const parsedUrl = new URL(url);
  return gameAssets.some(path => parsedUrl.pathname.includes(path));
};

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== 'GET' ||
    !requestUrl.startsWith('http')
  ) {
    return;
  }
  
  // Handle API requests - Network first, then cache
  if (isApiRequest(requestUrl)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache successful responses
          if (response.ok) {
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If no cached response, return an offline response for API requests
              return new Response(
                JSON.stringify({ 
                  error: true, 
                  message: 'You are offline', 
                  offline: true 
                }),
                {
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
  
  // Game assets - Cache first, then network
  if (isAssetRequest(requestUrl)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached response if found
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise fetch from network
          return fetch(event.request)
            .then((response) => {
              // Cache the response
              const responseToCache = response.clone();
              
              if (response.ok) {
                caches.open(ASSET_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            });
        })
    );
    return;
  }
  
  // Static assets and other requests - Cache first, then network with dynamic caching
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache successful responses in dynamic cache
            if (response.ok) {
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Show default offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html')
                .then((offlineResponse) => {
                  return offlineResponse || new Response(
                    'You are offline. Please check your connection.',
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            // Return nothing for other types of requests
            return new Response(
              'Offline content not available',
              {
                headers: { 'Content-Type': 'text/plain' }
              }
            );
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-state') {
    event.waitUntil(syncGameState());
  }
});

// Function to sync game state when online
const syncGameState = async () => {
  try {
    // Open the IDB store for offline data
    const offlineQueue = await getOfflineQueue();
    
    // Process all pending offline actions
    const pendingActions = await offlineQueue.getAll();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove from queue if successful
          await offlineQueue.delete(action.id);
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncGameState:', error);
  }
};

// Helper function placeholder for IndexedDB interaction
// In a real implementation, this would use IndexedDB APIs
const getOfflineQueue = async () => {
  // Simplified version - in a real app, use IndexedDB
  return {
    getAll: async () => {
      // Get all pending offline actions from indexedDB
      return [];
    },
    delete: async (id) => {
      // Delete an action from the queue
    }
  };
}; 