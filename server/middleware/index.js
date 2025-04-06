import cors from "cors";
import session from "express-session";
import connectMongo from "connect-mongo";
import express from "express";
import cookieParser from "cookie-parser";
import errorLogger from "./errorLogger.js";
import corsUpdater from "./cors-updater.js";
import { csrfProtection, handleCsrfError, provideCsrfToken } from "./csrf.js";
import { configureCorsOptions, configureSessionOptions } from "../config/app-config.js";
import { configureSecurityHeaders, enforceHttps } from "../utils/security.js";
import { apiLimiter, healthCheckLimiter } from "../utils/rateLimiting.js";

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
  
  // Add cookie parser for handling HTTP-only cookies
  app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

  // Apply CORS configuration
  app.use(cors(configureCorsOptions(allowedOrigins)));
  
  // Apply rate limiters for different endpoints
  // Apply health check rate limiter only to health endpoints
  app.use(['/health', '/api/health'], healthCheckLimiter);
  
  // Apply general rate limiting to all other routes
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
 * Apply CSRF protection middleware to sensitive routes
 * This should be applied AFTER session and cookie middleware
 * @param {Object} app - Express app instance
 */
export const applyCsrfProtection = (app) => {
  if (process.env.NODE_ENV === 'test') {
    console.log("⚠️ CSRF protection disabled in test environment");
    return;
  }
  
  // Apply CSRF protection to sensitive routes
  const protectedRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password/*',
    '/api/progress/*',
    '/api/users/*',
    '/api/artifacts/*',
    '/api/messages/*'
  ];
  
  // Create CSRF token endpoint
  app.get('/api/auth/csrf-token', csrfProtection, (req, res) => {
    res.json({ 
      success: true, 
      csrfToken: req.csrfToken() 
    });
  });
  
  // Apply CSRF protection to specified routes
  protectedRoutes.forEach(route => {
    app.use(route, csrfProtection, provideCsrfToken);
  });
  
  // Handle CSRF errors
  app.use(handleCsrfError);
  
  console.log("✅ CSRF Protection enabled for sensitive routes");
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