// Service Worker for Authentic Internet Game
const CACHE_NAME = "authentic-internet-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/apple-touch-icon.png",
  "/assets/tiles/piskel_grass.png",
  "/assets/tiles/wall.webp",
  "/assets/tiles/water.webp",
  "/assets/tiles/sand.png",
  "/assets/tiles/dungeon.webp",
  "/assets/sounds/pickup.mp3",
  "/assets/sounds/drop.mp3",
  // Add other important assets here
];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("Service worker installation failed:", error);
      }),
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests (these should always go to network)
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Don't cache non-successful responses or non-GET requests
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic" ||
              event.request.method !== "GET"
            ) {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((err) => {
                console.error("Failed to cache response:", err);
              });

            return response;
          })
          .catch((error) => {
            console.error("Fetch failed:", error);
            // Optional: return a custom offline page or fallback content here
          });
      })
      .catch((error) => {
        console.error("Cache match failed:", error);
        // Fall back to network
        return fetch(event.request);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          }),
        );
      })
      .then(() => {
        // Take control of uncontrolled clients
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("Service worker activation failed:", error);
      }),
  );
});
