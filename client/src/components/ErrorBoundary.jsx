import React, { Component } from "react";
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or an error reporting service
    console.error("🔥 Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Optionally send to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Force reload the app
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <h1 style={styles.heading}>⚠️ Something went wrong!</h1>
          <div style={styles.errorDetails}>
            <p style={styles.errorMessage}>
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details style={styles.errorStack}>
                <summary>Error Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
          <p style={styles.instructions}>Please try resetting the application:</p>
          <div style={styles.actions}>
            <button onClick={this.handleReset} style={styles.resetButton}>
              🔄 Reset App
            </button>
            <a href="/" style={styles.homeButton}>
              🏠 Go to Homepage
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#1b1b1b",
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
  },
  heading: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#f44336",
  },
  errorDetails: {
    width: "80%",
    maxWidth: "800px",
    margin: "0 auto 20px auto",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "left",
  },
  errorMessage: {
    color: "#ff8a80",
    fontSize: "18px",
    marginBottom: "10px",
  },
  errorStack: {
    color: "#aaaaaa",
    fontSize: "14px",
    fontFamily: "monospace",
    maxHeight: "200px",
    overflow: "auto",
  },
  instructions: {
    fontSize: "16px",
    marginBottom: "20px",
  },
  actions: {
    display: "flex",
    gap: "15px",
  },
  resetButton: {
    padding: "12px 20px",
    fontSize: "16px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  homeButton: {
    padding: "12px 20px",
    fontSize: "16px",
    backgroundColor: "#2196f3",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    textDecoration: "none",
    fontWeight: "bold",
  }
};

export default ErrorBoundary;
