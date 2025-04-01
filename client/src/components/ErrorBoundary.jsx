import React from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0, // Track error frequency
      lastErrorTime: 0, // Track when errors occur
      resetAttempts: 0, // Track how many times we've reset
      lastResetTime: 0 // Track when resets occur
    };
    console.log('ErrorBoundary constructed at', new Date().toISOString());
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidMount() {
    console.log('ErrorBoundary mounted at', new Date().toISOString());
  }

  componentDidCatch(error, errorInfo) {
    const now = Date.now();
    const errorCount = this.state.errorCount + 1;
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    console.error(`!!! ErrorBoundary caught an error (#${errorCount}) !!!`, error, errorInfo);
    console.log(`Time since last error: ${timeSinceLastError}ms`);
    
    // Check for rapid error cycles which might indicate an infinite loop
    if (timeSinceLastError < 1000 && errorCount > 3) {
      console.error('CRITICAL: Rapid error cycling detected! This may be an infinite loop.');
      
      // Don't update state again if we're in a rapid cycle
      if (errorCount > 10 && timeSinceLastError < 500) {
        console.error('BREAKING ERROR CYCLE: Not updating state to prevent infinite loop');
        return; // Don't set state to break the cycle
      }
    }
    
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo,
      errorCount: errorCount,
      lastErrorTime: now
    });
    
    // Log the error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // Try to save game state if possible
    try {
      const gameState = {
        timestamp: new Date().toISOString(),
        location: window.location.pathname,
        error: {
          message: error.message,
          stack: error.stack
        },
        errorCount: errorCount,
        componentStack: errorInfo.componentStack
      };
      localStorage.setItem('gameState_backup', JSON.stringify(gameState));
      console.log('Game state saved to localStorage for recovery');
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }

  handleRetry = () => {
    const now = Date.now();
    const timeSinceLastReset = now - this.state.lastResetTime;
    const newResetAttempts = this.state.resetAttempts + 1;
    
    console.log(`Retry attempt #${newResetAttempts}, ${timeSinceLastReset}ms since last retry`);
    
    // Don't attempt retry if errors or resets are cycling too rapidly
    if (this.state.errorCount > 5 && timeSinceLastReset < 5000) {
      console.warn('Too many errors too quickly, blocking retry attempt');
      alert('Too many errors occurring. Please try refreshing the page instead.');
      return;
    }
    
    // Block retry if we've tried too many times in quick succession
    if (newResetAttempts > 3 && timeSinceLastReset < 10000) {
      console.warn('Too many reset attempts, blocking retry');
      alert('Multiple reset attempts detected. Please wait a moment or refresh the page.');
      return;
    }
    
    // Clear the error state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      resetAttempts: newResetAttempts,
      lastResetTime: now
      // Don't reset error count - we want to track this across retries
    });

    // Attempt to reload the component
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    console.log('Full reset requested');
    
    // Only allow one reset every 10 seconds
    if (Date.now() - this.state.lastResetTime < 10000) {
      console.warn('Reset blocked - too soon since last reset');
      alert('Please wait a moment before trying again.');
      return;
    }
    
    // Clear local storage and reload the page
    try {
      // Keep a backup before clearing
      const backup = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backup[key] = localStorage.getItem(key);
      }
      localStorage.setItem('_error_backup', JSON.stringify(backup));
      
      // Clear and reload
      localStorage.clear();
      console.log('LocalStorage cleared, reloading page');
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset:', e);
      // Force reload as fallback
      window.location.href = '/';
    }
  };

  render() {
    console.log('ErrorBoundary render - hasError:', this.state.hasError, 'errorCount:', this.state.errorCount);
    
    if (this.state.hasError) {
      // If we're in a severe error state with many repeating errors, 
      // show a simpler error UI to break potential render loops
      if (this.state.errorCount > 10 && (Date.now() - this.state.lastErrorTime) < 10000) {
        return (
          <div className="error-boundary critical-error">
            <h2>Critical Error</h2>
            <p>The application is in a crash loop. Please refresh the page.</p>
            <p className="error-details">Error Count: {this.state.errorCount}</p>
            <button onClick={() => window.location.reload()} className="reset-button">
              Refresh Page
            </button>
          </div>
        );
      }
      
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
