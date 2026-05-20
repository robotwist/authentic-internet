/**
 * Authentic Internet - Port Configuration
 * 
 * This file defines the standard ports used by the application.
 * Both client and server can import this file to ensure consistency.
 */

module.exports = {
  SERVER_PORT: 5000,
  CLIENT_PORT: 5173,
  
  // For development environment with multiple instances
  FALLBACK_SERVER_PORT: 5001,
  
  // For use in scripts and configuration files
  getServerUrl: () => `http://localhost:${module.exports.SERVER_PORT}`,
  getClientUrl: () => `http://localhost:${module.exports.CLIENT_PORT}`
}; 