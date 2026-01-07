/**
 * Service Worker Cleanup Utility
 * Helps unregister service workers to prevent caching and reload loops
 */

export const unregisterServiceWorkers = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();

      // Unregister each service worker
      for (const registration of registrations) {
        await registration.unregister();
        console.log("ServiceWorker unregistered:", registration.scope);
      }

      // Clear caches
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
        console.log("All caches cleared");
      }

      console.log("Service worker cleanup complete");
      return true;
    } catch (error) {
      console.error("Error during service worker cleanup:", error);
      return false;
    }
  }

  return false;
};

// Auto-execute on load to prevent service worker issues
unregisterServiceWorkers();

export default { unregisterServiceWorkers };
