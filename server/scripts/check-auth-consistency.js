/**
 * Authentication System Consistency Check
 *
 * This script checks that all components of the authentication system
 * are properly implemented and consistent with each other.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const serverRoot = path.resolve(__dirname, '..');
const clientRoot = path.resolve(__dirname, '../../client');

// Required server files
const serverFiles = {
  'models/User.js': [
    'username', 'email', 'password', 'refreshTokens', 'gameState',
    'comparePassword', 'saveGameProgress'
  ],
  'controllers/authController.js': [
    'register', 'login', 'verifyToken', 'refreshToken', 
    'logout', 'getUserGameState', 'updateGameState'
  ],
  'routes/auth.js': [
    '/register', '/login', '/verify', '/refresh', 
    '/logout', '/game-state'
  ],
  'middleware/auth.js': [
    'auth', 'checkRole', 'trackActivity'
  ]
};

// Required client files
const clientFiles = {
  'src/api/api.js': [
    'registerUser', 'loginUser', 'verifyToken', 'logoutUser', 
    'refreshUserToken', 'getUserGameState', 'updateGameState'
  ],
  'src/context/AuthContext.jsx': [
    'login', 'register', 'logout', 'refreshToken', 
    'parseToken', 'getTimeUntilExpiry', 'scheduleTokenRefresh'
  ]
};

// Check if file exists
const fileExists = (filepath) => {
  return fs.existsSync(filepath);
};

// Check if file contains pattern
const fileContainsPattern = (filepath, pattern) => {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const regex = new RegExp(pattern);
    return regex.test(content);
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error.message);
    return false;
  }
};

// Check a set of files for required patterns
const checkFiles = (basePath, files) => {
  console.log(chalk.blue('\nChecking files in:'), chalk.yellow(basePath));
  console.log(chalk.gray('======================================='));
  
  let allPassed = true;
  
  for (const [file, patterns] of Object.entries(files)) {
    const filepath = path.join(basePath, file);
    const fileStatus = fileExists(filepath);
    
    console.log(
      fileStatus ? chalk.green('✓ FOUND: ') : chalk.red('✗ MISSING: '),
      chalk.white(file)
    );
    
    if (fileStatus) {
      for (const pattern of patterns) {
        const patternStatus = fileContainsPattern(filepath, pattern);
        
        console.log(
          patternStatus ? chalk.green('  ✓ ') : chalk.red('  ✗ '),
          chalk.gray(pattern)
        );
        
        if (!patternStatus) {
          allPassed = false;
        }
      }
    } else {
      allPassed = false;
    }
    
    console.log('');
  }
  
  return allPassed;
};

// Check for environment variables
const checkEnvironmentVariables = () => {
  console.log(chalk.blue('\nChecking for environment variables:'));
  console.log(chalk.gray('======================================='));
  
  const envFile = path.join(serverRoot, '.env');
  
  if (!fileExists(envFile)) {
    console.log(chalk.red('✗ .env file is missing'));
    return false;
  }
  
  console.log(chalk.green('✓ .env file exists'));
  
  const envVars = [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN',
    'SALT_ROUNDS',
    'MONGODB_URI'
  ];
  
  const content = fs.readFileSync(envFile, 'utf8');
  let allVarsPresent = true;
  
  for (const envVar of envVars) {
    const isPresent = content.includes(envVar + '=');
    
    console.log(
      isPresent ? chalk.green('  ✓ ') : chalk.red('  ✗ '),
      chalk.gray(envVar)
    );
    
    if (!isPresent) {
      allVarsPresent = false;
    }
  }
  
  return allVarsPresent;
};

// Main function
const checkAuthConsistency = () => {
  console.log(chalk.blue.bold('AUTHENTICATION SYSTEM CONSISTENCY CHECK'));
  console.log(chalk.gray('======================================='));
  
  console.log(chalk.yellow('Server root:'), serverRoot);
  console.log(chalk.yellow('Client root:'), clientRoot);
  
  // Check server files
  const serverPassed = checkFiles(serverRoot, serverFiles);
  
  // Check client files
  const clientPassed = checkFiles(clientRoot, clientFiles);
  
  // Check environment variables
  const envPassed = checkEnvironmentVariables();
  
  // Summary
  console.log(chalk.blue.bold('\nSUMMARY'));
  console.log(chalk.gray('======================================='));
  console.log(
    'Server files check:',
    serverPassed ? chalk.green('PASSED') : chalk.red('FAILED')
  );
  console.log(
    'Client files check:',
    clientPassed ? chalk.green('PASSED') : chalk.red('FAILED')
  );
  console.log(
    'Environment variables check:',
    envPassed ? chalk.green('PASSED') : chalk.red('FAILED')
  );
  
  const overallStatus = serverPassed && clientPassed && envPassed;
  
  console.log(
    '\nOverall status:',
    overallStatus ? chalk.green.bold('PASSED') : chalk.red.bold('FAILED')
  );
  
  return overallStatus ? 0 : 1;
};

// Run the check
const exitCode = checkAuthConsistency();
console.log('\nCheck completed.');

// Exit with appropriate code
process.exit(exitCode); 