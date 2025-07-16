import mongoose from "mongoose";
import fs from 'fs';

/**
 * Start the server with automatic port conflict resolution
 * @param {Object} server - HTTP server instance
 * @param {number} preferredPort - Preferred port to start on
 * @returns {Promise<boolean>} - Whether server was started successfully
 */
export const startServerWithPortResolution = async (server, preferredPort = 5001) => {
  let currentPort = parseInt(preferredPort, 10);
  let maxAttempts = 10; // Try up to 10 alternative ports
  
  const startServerOnPort = (port) => {
    return new Promise((resolve, reject) => {
      server.listen(port)
        .once('listening', () => {
          console.log(`🚀 Server running on port ${port}`);
          console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
          console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
          console.log(`🔌 WebSockets: Enabled`);
          
          // Save the server PID to a file
          try {
            fs.writeFileSync('.server_pid', process.pid.toString());
          } catch (err) {
            console.warn('⚠️ Could not save server PID:', err);
          }
          
          resolve(true);
        })
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is already in use, trying another port...`);
            resolve(false);
          } else {
            reject(err);
          }
        });
    });
  };

  let serverStarted = false;
  let attempts = 0;
  
  while (!serverStarted && attempts < maxAttempts) {
    try {
      serverStarted = await startServerOnPort(currentPort);
      if (!serverStarted) {
        currentPort++;
        attempts++;
      }
    } catch (error) {
      console.error(`❌ Error starting server on port ${currentPort}:`, error);
      currentPort++;
      attempts++;
    }
  }

  if (!serverStarted) {
    console.error(`❌ Failed to start server after ${maxAttempts} attempts`);
    console.error(`🔄 Please try a different port range or check running processes`);
    return false;
  }
  
  return true;
};

/**
 * Gracefully shut down server and close connections
 * @param {Object} server - HTTP server instance
 * @param {string} signal - Signal that triggered shutdown
 */
export const gracefulShutdown = (server, signal) => {
  console.log(`\n💤 ${signal} signal received: shutting down gracefully...`);
  
  // Close server first
  server.close(async () => {
    console.log('🔒 HTTP server closed');
    
    try {
      // Close database connections
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed');
      }
      
      // Remove PID file
      try {
        if (fs.existsSync('.server_pid')) {
          fs.unlinkSync('.server_pid');
        }
      } catch (err) {
        console.warn('⚠️ Could not remove server PID file:', err);
      }
      
      console.log('👋 Server shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during graceful shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000); // 10 second timeout
};

/**
 * Set up global error handlers for uncaught exceptions and unhandled rejections
 * @param {Function} shutdownFn - Function to call on shutdown
 */
export const setupGlobalErrorHandlers = (shutdownFn) => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    if (shutdownFn) {
      shutdownFn('SIGTERM');
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    // In development, don't shut down for MongoDB connection errors
    if (process.env.NODE_ENV === 'development' && 
        reason && reason.message && 
        reason.message.includes('mongodb')) {
      console.log('⚠️ Ignoring MongoDB connection error in development mode');
      return;
    }
    
    if (shutdownFn) {
      shutdownFn('SIGTERM');
    }
  });

  // Handle termination signals
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`\n📡 Received ${signal} signal`);
      if (shutdownFn) {
        shutdownFn(signal);
      }
    });
  });
};

// Ensure this file is using an async function or top-level await
const loadFs = async () => {
  const fs = await import('fs');
  return fs;
};

// Example usage
(async () => {
  const fs = await loadFs();
  console.log('File system module loaded:', fs);
})();