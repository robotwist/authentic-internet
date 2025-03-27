import express from "express";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db.js";
import { initSocketService } from "./services/socketService.js";
import { applyMiddleware, applySessionMiddleware, applyErrorHandlingMiddleware } from "./middleware/index.js";
import { applyRoutes } from "./routes/index.js";
import { configureAllowedOrigins, validateEnv } from "./config/app-config.js";
import { startServerWithPortResolution, gracefulShutdown, setupGlobalErrorHandlers } from "./utils/serverUtils.js";
import fs from 'fs';

// Load environment variables
dotenv.config();

// Check if server is already running
try {
  if (fs.existsSync('.server_pid')) {
    const pid = parseInt(fs.readFileSync('.server_pid', 'utf8'));
    try {
      process.kill(pid, 0); // Check if process exists
      console.error('❌ Server is already running with PID:', pid);
      process.exit(1);
    } catch (err) {
      // Process doesn't exist, remove stale PID file
      fs.unlinkSync('.server_pid');
    }
  }
} catch (err) {
  console.warn('⚠️ Could not check for existing server:', err);
}

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Check environment variables
validateEnv();

// Configure CORS
const allowedOrigins = configureAllowedOrigins();

// Apply middleware
applyMiddleware(app, allowedOrigins);
applySessionMiddleware(app);

// Apply routes
applyRoutes(app);

// Apply error handling middleware (should be last)
applyErrorHandlingMiddleware(app);

/**
 * Start the server and initialize services
 */
const startServer = async () => {
  try {
    // Connect to MongoDB but don't crash if it fails
    console.log("🔄 Attempting to connect to MongoDB with URI:", 
      process.env.MONGO_URI ? 
      process.env.MONGO_URI.split('@')[0].replace(/:([^:]+)@/, ':****@') + '@' + process.env.MONGO_URI.split('@')[1] : 
      'undefined');
    
    const dbConnected = await connectDB();
    if (dbConnected) {
      console.log("✅ MongoDB Connected Successfully");
    } else {
      console.log("⚠️ Running without MongoDB connection");
    }

    // Initialize WebSocket service
    await initSocketService(server);
    
    // Start server with port conflict resolution
    const preferredPort = process.env.PORT || 5001;
    await startServerWithPortResolution(server, preferredPort);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start server
startServer();

// Set up graceful shutdown and error handlers
setupGlobalErrorHandlers((signal) => {
  gracefulShutdown(server, signal);
  // Clean up PID file on shutdown
  try {
    if (fs.existsSync('.server_pid')) {
      fs.unlinkSync('.server_pid');
    }
  } catch (err) {
    console.warn('⚠️ Could not remove server PID file:', err);
  }
});
