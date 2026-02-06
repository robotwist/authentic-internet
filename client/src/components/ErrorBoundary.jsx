import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      childKey: 0,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to console for debugging
    console.error("Error caught by boundary:", error, errorInfo);

    // Send error report to server (if configured)
    this.reportError(error, errorInfo, errorId);
  }

  reportError = async (error, errorInfo, errorId) => {
    try {
      // Only report in production or if explicitly enabled
      if (
        import.meta.env.MODE === "production" ||
        import.meta.env.VITE_ERROR_REPORTING === "true"
      ) {
        await fetch("/api/errors/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            errorId,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
    }
  };

  handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      childKey: s.childKey + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyErrorId = () => {
    if (!this.state.errorId) return;
    navigator.clipboard
      .writeText(this.state.errorId)
      .then(() => {
        this.setState({ copied: true });
        if (this.copyTimeout) clearTimeout(this.copyTimeout);
        this.copyTimeout = setTimeout(() => this.setState({ copied: false }), 2000);
      })
      .catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1>Something went wrong</h1>
            <p>
              We're sorry, but something unexpected happened. Our team has been
              notified.
            </p>

            {this.state.errorId && (
              <div className="error-id">
                <strong>Error ID:</strong> {this.state.errorId}
                <button
                  type="button"
                  onClick={this.handleCopyErrorId}
                  className="copy-error-id-button"
                  aria-label="Copy error ID"
                >
                  {this.state.copied ? "Copied!" : "Copy error ID"}
                </button>
              </div>
            )}

            {import.meta.env.MODE === "development" && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="retry-button"
                aria-label="Try again"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="reload-button"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            <div className="error-help">
              <p>If this problem persists, please:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={this.state.childKey} style={{ display: "contents" }}>
        {this.props.children}
      </div>
    );
  }
}

export default ErrorBoundary;
