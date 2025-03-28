import React from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Try to save game state if possible
    try {
      const gameState = {
        timestamp: new Date().toISOString(),
        location: window.location.pathname,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
      localStorage.setItem('gameState_backup', JSON.stringify(gameState));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }

  handleRetry = () => {
    // Clear the error state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });

    // Attempt to reload the component
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    // Clear local storage and reload the page
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset:', e);
      // Force reload as fallback
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Oops! Something went wrong</h2>
            <p>Don't worry, your progress has been saved.</p>
            
            {this.state.error && (
              <div className="error-details">
                <p>{this.state.error.message}</p>
                {this.state.errorInfo && (
                  <details>
                    <summary>Technical Details</summary>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                Try Again
              </button>
              <button onClick={this.handleReset} className="reset-button">
                Reset Game
              </button>
              <a href="/" className="home-link">
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onRetry: PropTypes.func
};

export default ErrorBoundary;
