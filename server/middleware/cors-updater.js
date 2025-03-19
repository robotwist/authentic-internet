/**
 * CORS Auto-Updater Middleware
 * 
 * This middleware automatically detects CORS errors and adds the blocked origin
 * to the allowed origins list (in development mode only).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name (handle both ESM and CJS environments)
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // For testing with Jest
  __dirname = process.cwd() + '/server/middleware';
}

// Track origins that were blocked to avoid repeated file operations
const blockedOrigins = new Set();

const corsUpdater = (req, res, next) => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }
  
  // Skip if no origin header
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  
  // Get the current allowed origins
  const allowedOrigins = req.app.get('allowedOrigins') || [];
  
  // Check if origin is already allowed
  if (allowedOrigins.includes(origin)) {
    return next();
  }
  
  // Check if origin has already been processed
  if (blockedOrigins.has(origin)) {
    return next();
  }
  
  // Origin is not allowed, let's log it and potentially add it
  console.log(`[CORS Auto-Updater] Detected potentially blocked origin: ${origin}`);
  blockedOrigins.add(origin);
  
  // Ask the user if they want to add it
  console.log('\x1b[33m%s\x1b[0m', `[CORS Auto-Updater] Do you want to add ${origin} to allowed origins?`);
  console.log('\x1b[33m%s\x1b[0m', 'Type the following command in the server terminal to add it:');
  console.log('\x1b[32m%s\x1b[0m', `CORS_ADD_ORIGIN=${origin} node add-cors-origin.js`);
  
  next();
};

// For testing purposes, expose the blockedOrigins set
export const getBlockedOrigins = () => [...blockedOrigins];
export const clearBlockedOrigins = () => blockedOrigins.clear();

// Attach these methods to the middleware function for easier access in tests
corsUpdater.getBlockedOrigins = getBlockedOrigins;
corsUpdater.clearBlockedOrigins = clearBlockedOrigins;

// Create a helper function to update the server.mjs file
export const addOriginToAllowedOrigins = async (newOrigin) => {
  if (!newOrigin) {
    console.error('No origin specified');
    return { success: false, message: 'No origin specified' };
  }
  
  try {
    // Read the server.mjs file
    const serverFilePath = path.resolve(__dirname, '../server.mjs');
    let content;
    
    try {
      content = fs.readFileSync(serverFilePath, 'utf8');
    } catch (error) {
      console.error(`Error reading server.mjs: ${error.message}`);
      return { 
        success: false, 
        message: `Cannot read server.mjs: ${error.message}` 
      };
    }
    
    // Find the allowedOrigins array
    const originsRegex = /const allowedOrigins = process\.env\.NODE_ENV === 'development'\s*\?\s*\[(.*?)\]\s*:/s;
    const match = content.match(originsRegex);
    
    if (!match) {
      return { 
        success: false, 
        message: 'Could not find allowedOrigins array in server.mjs' 
      };
    }
    
    // Extract the origins
    const originsStr = match[1];
    
    // Check if the origin is already in the list
    if (originsStr.includes(newOrigin)) {
      return { 
        success: false, 
        message: `Origin ${newOrigin} is already in the allowedOrigins array` 
      };
    }
    
    // Add the new origin to the list
    const newOriginsStr = originsStr ? `${originsStr}, '${newOrigin}'` : `'${newOrigin}'`;
    
    // Update the file
    const updatedContent = content.replace(
      originsRegex,
      `const allowedOrigins = process.env.NODE_ENV === 'development' ? [${newOriginsStr}] :`
    );
    
    // Write the updated content back to the file
    try {
      fs.writeFileSync(serverFilePath, updatedContent);
    } catch (error) {
      console.error(`Error writing to server.mjs: ${error.message}`);
      return { 
        success: false, 
        message: `Cannot write to server.mjs: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: `Successfully added ${newOrigin} to allowedOrigins array` 
    };
  } catch (error) {
    console.error('Error updating server.mjs:', error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};

export default corsUpdater; 