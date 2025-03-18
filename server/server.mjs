import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import connectMongo from "connect-mongo";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import artifactRoutes from "./routes/artifactRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import worldRoutes from "./routes/worlds.js";
import npcRoutes from "./routes/npcs.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'development' 
  ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181']
  : [process.env.CLIENT_URL];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
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

// Session configuration
app.use(
  session({
    store: connectMongo.create({ 
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000 
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/artifacts", artifactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/worlds", worldRoutes);
app.use("/api/npcs", npcRoutes);

// Health check routes
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "✅ API is working!",
    endpoints: {
      auth: "/api/auth",
      artifacts: "/api/artifacts",
      users: "/api/users",
      messages: "/api/messages",
      worlds: "/api/worlds",
      npcs: "/api/npcs"
    }
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
    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
