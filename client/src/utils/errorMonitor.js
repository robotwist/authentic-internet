/**
 * Error Monitor Utility
 *
 * This utility provides real-time error monitoring for the application,
 * with special handling for CORS errors and console errors.
 * It will display errors in the UI and provide suggestions for fixing them.
 */

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.isActive = false;
    this.container = null;
    this.content = null;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  /**
   * Start monitoring for errors
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;

    // Create error display container
    this.createErrorContainer();

    // Override console methods
    this.overrideConsoleMethods();

    // Override fetch API
    this.overrideFetch();

    // Override XMLHttpRequest
    this.overrideXHR();

    // Add global error handler
    window.addEventListener("error", this.handleGlobalError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handlePromiseRejection.bind(this),
    );

    console.log("🔍 Error Monitor started - automatically catching errors");
  }

  /**
   * Stop monitoring for errors
   */
  stop() {
    if (!this.isActive) return;

    // Restore original methods
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;

    // Remove global error handlers
    window.removeEventListener("error", this.handleGlobalError);
    window.removeEventListener(
      "unhandledrejection",
      this.handlePromiseRejection,
    );

    // Remove error container
    if (
      this.container &&
      document.body &&
      document.body.contains(this.container)
    ) {
      document.body.removeChild(this.container);
    }

    this.isActive = false;
    console.log("Error Monitor stopped");
  }

  /**
   * Create error display container in the UI
   */
  createErrorContainer() {
    // Create container if it doesn't exist
    if (!this.container) {
      // Check if document is available (for testing)
      if (typeof document === "undefined") {
        return;
      }

      this.container = document.createElement("div");
      this.container.id = "error-monitor-container";
      this.container.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        max-height: 300px;
        overflow-y: auto;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        z-index: 10000;
        border-top-left-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      `;

      // Add header with controls
      const header = document.createElement("div");
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #666;
      `;

      const title = document.createElement("div");
      title.textContent = "🔍 Error Monitor";
      title.style.fontWeight = "bold";

      const controls = document.createElement("div");

      const clearBtn = document.createElement("button");
      clearBtn.textContent = "Clear";
      clearBtn.style.cssText = `
        background: #555;
        color: white;
        border: none;
        padding: 2px 8px;
        margin-right: 5px;
        cursor: pointer;
        border-radius: 3px;
      `;
      clearBtn.onclick = () => this.clearErrors();

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.style.cssText = `
        background: #555;
        color: white;
        border: none;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 3px;
      `;
      closeBtn.onclick = () => this.stop();

      controls.appendChild(clearBtn);
      controls.appendChild(closeBtn);

      header.appendChild(title);
      header.appendChild(controls);
      this.container.appendChild(header);

      // Create content area
      this.content = document.createElement("div");
      this.container.appendChild(this.content);

      document.body.appendChild(this.container);
    }
  }

  /**
   * Override console methods to catch errors
   */
  overrideConsoleMethods() {
    console.error = (...args) => {
      this.logError("console.error", args);
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      // Only capture warnings that might be important
      if (
        args.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("error") ||
              arg.includes("fail") ||
              arg.includes("CORS") ||
              arg.includes("rejected") ||
              arg.includes("denied")),
        )
      ) {
        this.logError("console.warn", args);
      }
      this.originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * Override fetch API to catch CORS and network errors
   */
  overrideFetch() {
    window.fetch = async (...args) => {
      try {
        const response = await this.originalFetch.apply(window, args);

        // Check if it's a CORS error or other error
        if (!response.ok) {
          const url =
            typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown";
          const method = args[1]?.method || "GET";

          // Try to get more details about the error
          try {
            const clonedResponse = response.clone();
            const data = await clonedResponse.text();

            this.logError("fetch error", {
              status: response.status,
              statusText: response.statusText,
              url,
              method,
              response: data,
            });
          } catch (e) {
            this.logError("fetch error", {
              status: response.status,
              statusText: response.statusText,
              url,
              method,
            });
          }
        }

        return response;
      } catch (error) {
        // This is likely a CORS or network error
        const url =
          typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown";
        const method = args[1]?.method || "GET";

        this.logError("fetch error", {
          message: error.message,
          url,
          method,
          type: error.name,
        });

        throw error;
      }
    };
  }

  /**
   * Override XMLHttpRequest to catch CORS and network errors
   */
  overrideXHR() {
    // Save this reference for the callbacks
    const self = this;

    XMLHttpRequest.prototype.open = function () {
      this._url = arguments[1];
      this._method = arguments[0];
      self.originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      this.addEventListener("error", function () {
        self.logError("xhr error", {
          url: this._url,
          method: this._method,
          message: "Network Error",
        });
      });

      this.addEventListener("load", function () {
        if (this.status >= 400) {
          self.logError("xhr error", {
            url: this._url,
            method: this._method,
            status: this.status,
            statusText: this.statusText,
            response: this.responseText,
          });
        }
      });

      self.originalXHRSend.apply(this, arguments);
    };
  }

  /**
   * Handle global window errors
   */
  handleGlobalError(event) {
    this.logError("global error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  handlePromiseRejection(event) {
    this.logError("promise rejection", {
      message: event.reason?.message || "Unhandled Promise Rejection",
      stack: event.reason?.stack,
    });
  }

  /**
   * Log an error to the UI
   */
  logError(type, details) {
    // Create a new error object
    const error = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      details,
      solution: this.getSolution(type, details),
    };

    this.errors.push(error);
    this.renderError(error);

    return error; // Return for testing
  }

  /**
   * Try to provide a solution for the error
   */
  getSolution(type, details) {
    // CORS error detection and solutions
    if (type === "fetch error" || type === "xhr error") {
      if (
        details.status === 403 ||
        (details.message && details.message.includes("CORS"))
      ) {
        let origin = "current origin";
        let target = "target origin";

        try {
          if (typeof location !== "undefined") {
            origin = location.origin;
          }

          if (details.url) {
            target = new URL(details.url).origin;
          }
        } catch (e) {
          // Ignore URL parsing errors
        }

        return {
          title: "CORS Error",
          description: `The server is blocking requests from ${origin} to ${target}`,
          steps: [
            "Add this origin to the allowedOrigins array in server.mjs",
            `const allowedOrigins = [..., '${origin}']`,
          ],
        };
      }
    }

    // Network error
    if (
      (type === "fetch error" || type === "xhr error") &&
      ((details.message && details.message.includes("Network")) ||
        details.status === 0)
    ) {
      return {
        title: "Network Error",
        description: "Cannot connect to the server",
        steps: [
          "Check if the server is running",
          "Verify the server URL is correct",
          "Check for firewall or proxy issues",
        ],
      };
    }

    // API errors
    if (
      (type === "fetch error" || type === "xhr error") &&
      details.status >= 400
    ) {
      if (details.status === 401 || details.status === 403) {
        return {
          title: "Authentication Error",
          description: "Not authorized to access this resource",
          steps: [
            "Check if you are logged in",
            "Verify your authentication token is valid",
            "Check user permissions",
          ],
        };
      }

      if (details.status === 404) {
        return {
          title: "Resource Not Found",
          description: `The resource at ${details.url || "requested URL"} does not exist`,
          steps: [
            "Check the URL path",
            "Verify the resource ID is correct",
            "Check the server routes",
          ],
        };
      }

      if (details.status >= 500) {
        return {
          title: "Server Error",
          description:
            "The server encountered an error processing your request",
          steps: [
            "Check the server logs for more details",
            "Verify the request data is valid",
            "Check for server-side bugs",
          ],
        };
      }
    }

    return {
      title: "Unknown Error",
      description: "An error occurred but no specific solution is available",
      steps: [
        "Check the console for more details",
        "Inspect the network tab in dev tools",
        "Check server logs",
      ],
    };
  }

  /**
   * Render an error in the UI
   */
  renderError(error) {
    if (!this.container || !this.content) return;

    // Check if document is available (for testing)
    if (typeof document === "undefined") {
      return;
    }

    const errorElement = document.createElement("div");
    errorElement.className = "error-item";
    errorElement.dataset.errorId = error.id;
    errorElement.style.cssText = `
      margin-bottom: 10px;
      padding: 8px;
      background-color: rgba(255, 0, 0, 0.2);
      border-left: 3px solid red;
      border-radius: 3px;
    `;

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      margin-bottom: 5px;
    `;

    const title = document.createElement("span");
    title.textContent = `${error.solution.title} (${error.type})`;

    const timestamp = document.createElement("span");
    timestamp.textContent = error.timestamp;
    timestamp.style.opacity = "0.7";

    header.appendChild(title);
    header.appendChild(timestamp);

    // Create content
    const content = document.createElement("div");

    // Description
    const description = document.createElement("div");
    description.textContent = error.solution.description;
    description.style.marginBottom = "5px";

    content.appendChild(description);

    // Solution steps
    if (error.solution.steps && error.solution.steps.length) {
      const steps = document.createElement("div");
      steps.style.marginTop = "5px";

      const stepsTitle = document.createElement("div");
      stepsTitle.textContent = "Solution:";
      stepsTitle.style.fontWeight = "bold";
      steps.appendChild(stepsTitle);

      const stepsList = document.createElement("ol");
      stepsList.style.cssText = `
        margin: 5px 0 0 20px;
        padding: 0;
      `;

      error.solution.steps.forEach((step) => {
        const stepItem = document.createElement("li");
        stepItem.textContent = step;
        stepsList.appendChild(stepItem);
      });

      steps.appendChild(stepsList);
      content.appendChild(steps);
    }

    // Details (collapsible)
    const detailsToggle = document.createElement("button");
    detailsToggle.textContent = "Show Details";
    detailsToggle.style.cssText = `
      background: none;
      border: none;
      color: #aaa;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
      margin-top: 5px;
      font-size: 11px;
    `;

    const detailsContent = document.createElement("pre");
    detailsContent.textContent = JSON.stringify(error.details, null, 2);
    detailsContent.style.cssText = `
      margin-top: 5px;
      padding: 5px;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 3px;
      white-space: pre-wrap;
      word-break: break-all;
      display: none;
    `;

    detailsToggle.onclick = () => {
      const isShowing = detailsContent.style.display !== "none";
      detailsContent.style.display = isShowing ? "none" : "block";
      detailsToggle.textContent = isShowing ? "Show Details" : "Hide Details";
    };

    content.appendChild(detailsToggle);
    content.appendChild(detailsContent);

    // Add dismiss button
    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "Dismiss";
    dismissBtn.style.cssText = `
      display: block;
      margin-top: 5px;
      background: #333;
      color: white;
      border: none;
      padding: 2px 8px;
      cursor: pointer;
      border-radius: 3px;
      font-size: 11px;
    `;
    dismissBtn.onclick = () => {
      this.content.removeChild(errorElement);
      this.errors = this.errors.filter((e) => e.id !== error.id);
    };

    content.appendChild(dismissBtn);

    // Add header and content to the error element
    errorElement.appendChild(header);
    errorElement.appendChild(content);

    // Add to container
    this.content.appendChild(errorElement);

    // Scroll to the bottom
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
    if (this.content) {
      this.content.innerHTML = "";
    }
  }
}

// Create singleton instance
const errorMonitor = new ErrorMonitor();

export default errorMonitor;
