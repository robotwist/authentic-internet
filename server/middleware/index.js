import cors from "cors";
import session from "express-session";
import connectMongo from "connect-mongo";
import express from "express";
import errorLogger from "./errorLogger.js";
import corsUpdater from "./cors-updater.js";
import { configureCorsOptions, configureSessionOptions } from "../config/app-config.js";
import { configureSecurityHeaders, enforceHttps } from "../utils/security.js";
import { apiLimiter } from "../utils/rateLimiting.js";

/**
 * Apply all middleware to Express app
 * @param {Object} app - Express app instance
 * @param {Array} allowedOrigins - Array of allowed CORS origins
 */
export const applyMiddleware = (app, allowedOrigins) => {
  // Store allowedOrigins for later access by middleware
  app.set('allowedOrigins', allowedOrigins);
  
  // Apply security headers
  app.use(configureSecurityHeaders());
  
  // Enforce HTTPS in production
  app.use(enforceHttps);
  
  // Apply error logger middleware early to catch all requests
  app.use(errorLogger);

  // Use CORS updater to automatically handle CORS issues
  app.use(corsUpdater);

  // Basic Express middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply CORS configuration
  app.use(cors(configureCorsOptions(allowedOrigins)));
  
  // Apply general rate limiting to all routes
  app.use(apiLimiter);
  
  // Error handling for CORS
  app.use((err, req, res, next) => {
    if (err.message.includes('CORS')) {
      res.status(403).json({
        error: 'CORS Error',
        message: err.message,
        origin: req.headers.origin
      });
    } else {
      next(err);
    }
  });
};

/**
 * Configure and apply session middleware
 * @param {Object} app - Express app instance
 */
export const applySessionMiddleware = (app) => {
  try {
    if (process.env.MONGO_URI) {
      const mongoStore = connectMongo.create({ 
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
      });
      
      app.use(session(configureSessionOptions(mongoStore)));
      console.log("✅ MongoDB Session Store Connected Successfully");
    } else {
      console.log("⚠️ No MONGO_URI provided, using memory sessions");
      app.use(session(configureSessionOptions()));
    }
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB Session Store:", error);
    // Fallback to memory sessions
    app.use(session(configureSessionOptions()));
  }
};

/**
 * Apply error handling middleware
 * @param {Object} app - Express app instance
 */
export const applyErrorHandlingMiddleware = (app) => {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  });
}; 