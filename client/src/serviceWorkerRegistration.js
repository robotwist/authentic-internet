/**
 * Service Worker Registration
 * Handles registration and lifecycle management of the service worker
 */

export const register = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/serviceWorker.js";

      registerServiceWorker(swUrl);

      // Handle service worker updates
      handleServiceWorkerUpdates();
    });
  }
};

const registerServiceWorker = (swUrl) => {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("ServiceWorker registered successfully:", registration.scope);

      // Check for updates on page load
      registration.update();

      // Set up periodic updates
      setInterval(
        () => {
          registration.update();
          console.log("Checking for service worker updates...");
        },
        1000 * 60 * 60,
      ); // Check every hour
    })
    .catch((error) => {
      console.error("ServiceWorker registration failed:", error);
    });
};

const handleServiceWorkerUpdates = () => {
  // Track if a reload has already been triggered
  let reloadTriggered = false;

  // Handle controller change (new service worker activated)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloadTriggered) {
      console.log(
        "New service worker activated. Page will reload to use updated assets.",
      );
      reloadTriggered = true;

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log(
        "Page reload already triggered, preventing duplicate reload.",
      );
    }
  });
};

// Check for connectivity changes
export const setupConnectivityListeners = () => {
  // Variable to track online status
  let isOnline = navigator.onLine;

  // Function to show/hide offline notification
  const updateOfflineStatus = () => {
    const offlineNotice = document.getElementById("offline-notice");

    if (!offlineNotice) {
      // Create offline notice if it doesn't exist
      if (!navigator.onLine) {
        createOfflineNotice();
      }
      return;
    }

    // Update existing notice
    if (navigator.onLine) {
      offlineNotice.classList.add("hidden");
      setTimeout(() => {
        if (offlineNotice.parentNode) {
          offlineNotice.parentNode.removeChild(offlineNotice);
        }
      }, 500);
    } else {
      offlineNotice.classList.remove("hidden");
    }
  };

  // Create an offline notice element
  const createOfflineNotice = () => {
    const notice = document.createElement("div");
    notice.id = "offline-notice";
    notice.className = "offline-notice";
    notice.innerHTML = `
      <div class="offline-icon">📡</div>
      <div class="offline-text">You are offline. Some features may be limited.</div>
    `;

    // Add offline notice styles if they don't exist
    if (!document.getElementById("offline-notice-styles")) {
      const style = document.createElement("style");
      style.id = "offline-notice-styles";
      style.textContent = `
        .offline-notice {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #2a2a2a;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .offline-notice.hidden {
          opacity: 0;
          transform: translateY(20px);
        }
        .offline-icon {
          font-size: 24px;
          margin-right: 12px;
        }
        .offline-text {
          font-size: 14px;
          font-weight: 500;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notice);

    // Trigger reflow before adding hidden class for animation
    notice.getBoundingClientRect();

    // If online, hide the notice
    if (navigator.onLine) {
      notice.classList.add("hidden");
    }
  };

  // Listen for online/offline events
  window.addEventListener("online", () => {
    if (!isOnline) {
      isOnline = true;
      updateOfflineStatus();

      // Attempt to sync data when back online
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register("sync-game-state");
        });
      }
    }
  });

  window.addEventListener("offline", () => {
    if (isOnline) {
      isOnline = false;
      updateOfflineStatus();
    }
  });

  // Initial check
  updateOfflineStatus();
};

export default { register, setupConnectivityListeners };
