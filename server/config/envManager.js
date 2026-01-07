/**
 * Environment Variable Manager
 * Provides fallback mechanisms for tests and better error handling
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default values for development and testing
const DEFAULT_VALUES = {
  // Authentication
  JWT_SECRET: 'dev-jwt-secret-key-change-in-production',
  SESSION_SECRET: 'dev-session-secret-key-change-in-production',
  
  // Database
  MONGO_URI: 'mongodb://localhost:27017/authentic-internet-test',
  
  // Server
  PORT: 5001,
  NODE_ENV: 'development',
  
  // Email
  EMAIL_HOST: 'smtp.ethereal.email',
  EMAIL_PORT: 587,
  EMAIL_USER: 'test@example.com',
  EMAIL_PASS: 'test-password',
  
  // Client
  CLIENT_URL: 'http://localhost:5173',
  
  // CORS
  ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5175',
  
  // Security
  CSRF_SECRET: 'dev-csrf-secret-key-change-in-production',
  
  // Features
  ENABLE_WEBSOCKETS: 'true',
  ENABLE_EMAIL: 'true',
  ENABLE_RATE_LIMITING: 'true'
};

// Required variables for production
const REQUIRED_PRODUCTION_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'MONGO_URI'
];

// Required variables for development
const REQUIRED_DEV_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET'
];

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not set
 * @returns {string} Environment variable value
 */
export const getEnv = (key, defaultValue = null) => {
  const value = process.env[key];
  
  if (value !== undefined) {
    return value;
  }
  
  // Check if we have a default value
  if (defaultValue !== null) {
    return defaultValue;
  }
  
  // Check if we have a default in our DEFAULT_VALUES
  if (DEFAULT_VALUES[key] !== undefined) {
    return DEFAULT_VALUES[key];
  }
  
  return undefined;
};

/**
 * Get required environment variable
 * @param {string} key - Environment variable key
 * @returns {string} Environment variable value
 * @throws {Error} If variable is not set and no default exists
 */
export const getRequiredEnv = (key) => {
  const value = getEnv(key);
  
  if (value === undefined) {
    const error = new Error(`Required environment variable ${key} is not set`);
    error.code = 'MISSING_ENV_VAR';
    error.variable = key;
    throw error;
  }
  
  return value;
};

/**
 * Validate environment variables for current environment
 * @returns {Object} Validation result
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredVars = isProduction ? REQUIRED_PRODUCTION_VARS : REQUIRED_DEV_VARS;
  
  // Check required variables
  for (const varName of requiredVars) {
    try {
      getRequiredEnv(varName);
    } catch (error) {
      if (isProduction) {
        errors.push(`Missing required environment variable: ${varName}`);
      } else {
        warnings.push(`Missing environment variable: ${varName} (using default)`);
      }
    }
  }
  
  // Check for common issues
  if (isProduction) {
    if (getEnv('JWT_SECRET') === DEFAULT_VALUES.JWT_SECRET) {
      warnings.push('Using default JWT_SECRET in production - this is insecure');
    }
    
    if (getEnv('SESSION_SECRET') === DEFAULT_VALUES.SESSION_SECRET) {
      warnings.push('Using default SESSION_SECRET in production - this is insecure');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isProduction
  };
};

/**
 * Get all environment variables with defaults for testing
 * @returns {Object} Environment configuration
 */
export const getEnvironmentConfig = () => {
  return {
    // Authentication
    JWT_SECRET: getEnv('JWT_SECRET'),
    SESSION_SECRET: getEnv('SESSION_SECRET'),
    
    // Database
    MONGO_URI: getEnv('MONGO_URI'),
    
    // Server
    PORT: parseInt(getEnv('PORT')) || 5001,
    NODE_ENV: getEnv('NODE_ENV', 'development'),
    
    // Email
    EMAIL_HOST: getEnv('EMAIL_HOST'),
    EMAIL_PORT: parseInt(getEnv('EMAIL_PORT')) || 587,
    EMAIL_USER: getEnv('EMAIL_USER'),
    EMAIL_PASS: getEnv('EMAIL_PASS'),
    
    // Client
    CLIENT_URL: getEnv('CLIENT_URL'),
    
    // CORS
    ALLOWED_ORIGINS: getEnv('ALLOWED_ORIGINS'),
    
    // Security
    CSRF_SECRET: getEnv('CSRF_SECRET'),
    
    // Features
    ENABLE_WEBSOCKETS: getEnv('ENABLE_WEBSOCKETS', 'true') === 'true',
    ENABLE_EMAIL: getEnv('ENABLE_EMAIL', 'true') === 'true',
    ENABLE_RATE_LIMITING: getEnv('ENABLE_RATE_LIMITING', 'true') === 'true'
  };
};

/**
 * Setup environment for testing
 * @param {Object} overrides - Environment variable overrides
 */
export const setupTestEnvironment = (overrides = {}) => {
  // Set test defaults
  const testDefaults = {
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://localhost:27017/authentic-internet-test',
    JWT_SECRET: 'test-jwt-secret',
    SESSION_SECRET: 'test-session-secret',
    ENABLE_EMAIL: 'false',
    ENABLE_WEBSOCKETS: 'false'
  };
  
  // Apply overrides
  Object.assign(process.env, testDefaults, overrides);
};

/**
 * Reset environment to original state
 */
export const resetEnvironment = () => {
  // This would need to be implemented based on how you want to handle
  // environment variable restoration
  console.log('Environment reset requested');
};

export default {
  getEnv,
  getRequiredEnv,
  validateEnvironment,
  getEnvironmentConfig,
  setupTestEnvironment,
  resetEnvironment
}; 