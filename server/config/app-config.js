import fs from 'fs';
import path from 'path';
import { configureCorsOptions as securityCorsOptions } from "../utils/security.js";
import { getEnv, getRequiredEnv, validateEnvironment } from "./envManager.js";

// Port management
const PORT = parseInt(getEnv('PORT')) || 5001;
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
  return getEnv('NODE_ENV') === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181', 'http://localhost:5004', 'http://localhost:8080']
    : [
        getEnv('CLIENT_URL'),
        'https://flourishing-starburst-8cf88b.netlify.app',
        'https://authentic-internet.netlify.app',
        /^https:\/\/[\w-]+\.netlify\.app$/, // Deploy previews
      ];
};

// CORS options - use our centralized security configuration
const configureCorsOptions = (allowedOrigins) => {
  return securityCorsOptions(allowedOrigins);
};

// Session configuration
const configureSessionOptions = (mongoStore) => {
  const baseOptions = {
    secret: getRequiredEnv('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: getEnv('NODE_ENV') === 'production',
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Provides some CSRF protection
    }
  };
  
  if (mongoStore) {
    baseOptions.store = mongoStore;
  }
  
  return baseOptions;
};

// Validate critical environment variables
const validateEnv = () => {
  const validation = validateEnvironment();
  
  if (validation.warnings.length > 0) {
    console.warn("⚠️ Environment warnings:");
    validation.warnings.forEach(warning => console.warn(`  ${warning}`));
  }
  
  if (validation.errors.length > 0) {
    console.error("❌ Environment errors:");
    validation.errors.forEach(error => console.error(`  ${error}`));
    
    if (validation.isProduction) {
      console.error("Exiting process due to missing required environment variables in production");
      process.exit(1);
    }
  }
  
  if (validation.isValid) {
    console.log("✅ Environment validation passed");
  } else if (!validation.isProduction) {
    console.log("🔧 Using default values for missing environment variables");
  }
  
  return validation.isValid;
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