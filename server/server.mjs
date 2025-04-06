import express from "express";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db.js";
import { initSocketService } from "./services/socketService.js";
import { applyMiddleware, applySessionMiddleware, applyErrorHandlingMiddleware, applyCsrfProtection } from "./middleware/index.js";
import { applyRoutes } from "./routes/index.js";
import { 
  configureAllowedOrigins, 
  validateEnv, 
  PORT, 
  managePort, 
  cleanupPort 
} from "./config/app-config.js";
import { startServerWithPortResolution, gracefulShutdown, setupGlobalErrorHandlers } from "./utils/serverUtils.js";
import fs from 'fs';

// Load environment variables
dotenv.config();

// Check if server is already running using port management
if (!managePort()) {
  console.error('❌ Server is already running on port', PORT);
  process.exit(1);
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

// Comment out CSRF protection for now to isolate issues
// applyCsrfProtection(app);

// Apply routes
applyRoutes(app);

// Apply error handling middleware (should be last)
applyErrorHandlingMiddleware(app);

/**
 * Start the server and initialize services
 */
const startServer = async () => {
  try {
    console.log('Starting server.mjs...');
    console.log('Inside startServer function...');
    console.log('Checking environment variables...');

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
    await startServerWithPortResolution(server, PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    cleanupPort();
    process.exit(1);
  }
};

// Start server
startServer();

// Set up graceful shutdown and error handlers
setupGlobalErrorHandlers((signal) => {
  gracefulShutdown(server, signal);
  cleanupPort();
});
