import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔥 Error caught by ErrorBoundary:", error, errorInfo);
    // TODO: Optionally send errors to a logging service
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload(); // Optional: force refresh for full reset
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <h1 style={styles.heading}>⚠️ Something went wrong!</h1>
          <p>Try refreshing the page or resetting the app.</p>
          <button onClick={this.handleReset} style={styles.button}>
            🔄 Reset App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  },
  heading: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    marginTop: "10px",
  },
};

export default ErrorBoundary;
