import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Port management
const PORT = parseInt(process.env.PORT) || 5001;
const PORT_FILE = path.join(process.cwd(), '.server_pid');

const managePort = () => {
  try {
    // Check if port file exists
    if (fs.existsSync(PORT_FILE)) {
      const pid = parseInt(fs.readFileSync(PORT_FILE, 'utf8'));
      try {
        // Check if process is still running
        process.kill(pid, 0);
        console.warn(`⚠️ Port ${PORT} is already in use by process ${pid}`);
        return false;
      } catch (error) {
        // Process is not running, remove stale PID file
        fs.unlinkSync(PORT_FILE);
      }
    }

    // Write current process ID to file
    fs.writeFileSync(PORT_FILE, process.pid.toString());
    return true;
  } catch (error) {
    console.error('Error managing port:', error);
    return false;
  }
};

// Cleanup function for port management
const cleanupPort = () => {
  try {
    if (fs.existsSync(PORT_FILE)) {
      fs.unlinkSync(PORT_FILE);
    }
  } catch (error) {
    console.error('Error cleaning up port file:', error);
  }
};

// CORS configuration
const configureAllowedOrigins = () => {
  return process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181', 'http://localhost:5004']
    : [process.env.CLIENT_URL, 'https://flourishing-starburst-8cf88b.netlify.app'];
};

// CORS options
const configureCorsOptions = (allowedOrigins) => {
  return {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests, or Netlify Functions)
      if (!origin) return callback(null, true);
      
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
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
  };
};

// Session configuration
const configureSessionOptions = (mongoStore) => {
  const baseOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };
  
  if (mongoStore) {
    baseOptions.store = mongoStore;
  }
  
  return baseOptions;
};

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

export {
  PORT,
  managePort,
  cleanupPort,
  configureAllowedOrigins,
  configureCorsOptions,
  configureSessionOptions,
  validateEnv
}; 