import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./fonts.css"; // Import fonts first
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary"; // Global error handling
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { GameStateProvider } from "./context/GameStateContext";
import { setupGlobalErrorHandling } from "./utils/errorTracker";
import "./utils/serviceWorkerCleanup"; // Import service worker cleanup

// Initialize error tracking
setupGlobalErrorHandling();

// Performance monitoring
const reportWebVitals = ({ name, delta, id }) => {
  // Only log in development or if explicitly enabled
  if (
    process.env.NODE_ENV === "development" ||
    localStorage.getItem("enablePerfMetrics") === "true"
  ) {
    console.log(`Performance: ${name} - ${Math.round(delta)} ms (ID: ${id})`);
  }

  // Send to analytics in production (if analytics script is loaded)
  if (process.env.NODE_ENV === "production" && window.gtag) {
    window.gtag("event", name, {
      event_category: "Web Vitals",
      event_label: id,
      value: Math.round(delta),
      non_interaction: true,
    });
  }
};

// Create measurement observer for performance monitoring
if ("PerformanceObserver" in window) {
  try {
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log long-running tasks (those blocking the main thread)
        if (entry.duration > 50) {
          // Tasks longer than 50ms are considered problematic
          console.warn(
            `Long task detected: ${Math.round(entry.duration)}ms`,
            entry,
          );
        }
      });
    });
    longTaskObserver.observe({ entryTypes: ["longtask"] });

    // Monitor layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Only log significant layout shifts
        if (entry.value > 0.1) {
          console.warn(
            `Layout shift detected: ${entry.value.toFixed(4)}`,
            entry,
          );
        }
      });
    });
    layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
  } catch (e) {
    console.error("Performance observer error:", e);
  }
}

// Measure initial page load
const startTime = performance.now();
window.addEventListener("load", () => {
  const loadTime = performance.now() - startTime;
  console.info(`Page loaded in ${Math.round(loadTime)}ms`);

  // Remove loading spinner
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.opacity = "0";
    setTimeout(() => {
      spinner.style.display = "none";
    }, 300);
  }
});

// Render the React application
ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode> - Commented out to prevent double renders in development
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <AuthProvider>
      <WebSocketProvider>
        <GameStateProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </GameStateProvider>
      </WebSocketProvider>
    </AuthProvider>
  </BrowserRouter>,
  // </React.StrictMode>
);

// Export performance reporting for use with web vitals
export { reportWebVitals };
