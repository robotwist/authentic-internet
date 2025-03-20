// prebuild.js - Run before the build to generate build information
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to get git info if available
let gitHash = 'unknown';
let gitBranch = 'unknown';

try {
  gitHash = execSync('git rev-parse HEAD').toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (error) {
  console.log('Git information not available:', error.message);
  
  // In Netlify, use their environment variables
  if (process.env.COMMIT_REF) {
    gitHash = process.env.COMMIT_REF;
  }
}

// Create build info
const buildInfo = {
  timestamp: new Date().toISOString(),
  gitHash,
  gitBranch,
  environment: process.env.NODE_ENV || 'development',
  netlifyContext: process.env.CONTEXT || 'local'
};

// Write to a JSON file that can be imported
const outputPath = path.join(__dirname, 'src', 'buildInfo.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:', buildInfo); 