import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import connectMongo from "connect-mongo";
import http from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import artifactRoutes from "./routes/artifactRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import worldRoutes from "./routes/worlds.js";
import npcRoutes from "./routes/npcs.js";
import proxyRoutes from "./routes/proxy.js";
import { initSocketService } from "./services/socketService.js";
import errorLogger from "./middleware/errorLogger.js";
import corsUpdater from "./middleware/cors-updater.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Apply error logger middleware early to catch all requests
app.use(errorLogger);

// Use CORS updater to automatically handle CORS issues
app.use(corsUpdater);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'development' 
  ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181']
  : [process.env.CLIENT_URL, 'https://flourishing-starburst-8cf88b.netlify.app'];

// Store allowedOrigins for later access by middleware
app.set('allowedOrigins', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or Netlify Functions)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed or if it's a Netlify deployment URL
    if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('netlify.app')) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn(`CORS blocked request from: ${origin}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-From'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

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

// Validate critical environment variables
const validateEnv = () => {
  const requiredVars = ['JWT_SECRET', 'SESSION_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error("These are critical security settings. Fix this before continuing.");
    if (process.env.NODE_ENV === 'production') {
      console.error("Exiting process due to missing security variables in production");
      process.exit(1);
    }
    return false;
  }
  return true;
};

// Check environment variables
validateEnv();

// Session configuration
try {
  if (process.env.MONGO_URI) {
    app.use(
      session({
        store: connectMongo.create({ 
          mongoUrl: process.env.MONGO_URI,
          ttl: 14 * 24 * 60 * 60 // 14 days
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true, 
          maxAge: 24 * 60 * 60 * 1000 
        },
      })
    );
    console.log("✅ MongoDB Session Store Connected Successfully");
  } else {
    console.log("⚠️ No MONGO_URI provided, using memory sessions");
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true, 
          maxAge: 24 * 60 * 60 * 1000 
        },
      })
    );
  }
} catch (error) {
  console.error("❌ Failed to connect to MongoDB Session Store:", error);
  // Fallback to memory sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 
      },
    })
  );
}

// Route for health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/artifacts", artifactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/worlds", worldRoutes);
app.use("/api/npcs", npcRoutes);
app.use("/api/proxy", proxyRoutes);

// WebSocket route for testing
app.get("/api/socket-test", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "WebSocket endpoint is running and sockets are enabled",
    instructions: "Connect to the WebSocket server using socket.io client"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const startServer = async () => {
  try {
    // Connect to MongoDB but don't crash if it fails
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
      serverStarted = await startServerOnPort(currentPort);
      if (!serverStarted) {
        currentPort++;
        attempts++;
      }
    }

    if (!serverStarted) {
      console.error(`❌ Failed to start server after ${maxAttempts} attempts`);
      console.error(`🔄 Please try a different port range or check running processes`);
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Add cleanup handler
const gracefulShutdown = (signal) => {
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
      
      console.log('👋 Server shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during graceful shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('⏱️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // Give the server 10 seconds to finish processing requests
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Add global unhandled exception and rejection handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED REJECTION');
});
