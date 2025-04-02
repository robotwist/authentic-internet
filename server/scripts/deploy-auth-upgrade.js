/**
 * Authentication System Upgrade Deployment Script
 * 
 * This script guides through the deployment of the authentication system upgrade.
 * It performs some automatic checks and provides a step-by-step guide for manual steps.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Setup
dotenv.config();
const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SERVER_DIR = path.resolve(__dirname, '..');

// Check if a package is installed, install if not
const ensurePackageInstalled = async (packageName) => {
  try {
    console.log(chalk.yellow(`Checking if ${packageName} is installed...`));
    await execPromise(`npm list ${packageName}`);
    console.log(chalk.green(`✓ ${packageName} is already installed`));
    return true;
  } catch (error) {
    console.log(chalk.yellow(`Installing ${packageName}...`));
    try {
      await execPromise(`npm install ${packageName}`);
      console.log(chalk.green(`✓ ${packageName} installed successfully`));
      return true;
    } catch (installError) {
      console.error(chalk.red(`Failed to install ${packageName}: ${installError.message}`));
      return false;
    }
  }
};

// Check if required tools are installed
const checkPrerequisites = async () => {
  console.log(chalk.blue('=== Checking Prerequisites ==='));
  
  // Check for required npm packages
  const requiredPackages = ['inquirer', 'chalk'];
  for (const pkg of requiredPackages) {
    await ensurePackageInstalled(pkg);
  }
  
  // Check for required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  let allEnvVarsPresent = true;
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(chalk.red(`❌ Required environment variable ${varName} is not set!`));
      allEnvVarsPresent = false;
    } else {
      console.log(chalk.green(`✓ Environment variable ${varName} is set`));
    }
  }
  
  if (!allEnvVarsPresent) {
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Some required environment variables are missing. Do you want to continue anyway?',
      default: false
    }]);
    
    if (!proceed) {
      console.log(chalk.yellow('Deployment aborted.'));
      process.exit(1);
    }
  }
  
  return true;
};

// Create a database backup
const createDatabaseBackup = async () => {
  console.log(chalk.blue('\n=== Creating Database Backup ==='));
  
  const { shouldBackup } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldBackup',
    message: 'Do you want to create a MongoDB backup before proceeding?',
    default: true
  }]);
  
  if (!shouldBackup) {
    console.log(chalk.yellow('Skipping database backup...'));
    return true;
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(SERVER_DIR, 'backups', timestamp);
  
  console.log(chalk.yellow(`Creating backup at ${backupDir}...`));
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(path.join(SERVER_DIR, 'backups'))) {
      fs.mkdirSync(path.join(SERVER_DIR, 'backups'));
    }
    
    // Run mongodump
    await execPromise(`mongodump --uri="${process.env.MONGODB_URI}" --out=${backupDir}`);
    
    console.log(chalk.green(`✓ Database backup created successfully at ${backupDir}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to create database backup: ${error.message}`));
    
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Database backup failed. Do you want to continue anyway?',
      default: false
    }]);
    
    return proceed;
  }
};

// Deploy step by step with confirmation
const deployStepByStep = async () => {
  console.log(chalk.blue('\n=== Deployment Steps ==='));
  
  const steps = [
    {
      name: 'Update User Model',
      file: 'models/User.js',
      description: 'Updates the User model with enhanced game state and token storage'
    },
    {
      name: 'Update Auth Middleware',
      file: 'middleware/auth.js',
      description: 'Updates authentication middleware with improved token validation'
    },
    {
      name: 'Update Auth Controller',
      file: 'controllers/authController.js',
      description: 'Updates auth controller with enhanced token handling and game state functions'
    },
    {
      name: 'Update Auth Routes',
      file: 'routes/auth.js',
      description: 'Updates auth routes with consolidated endpoints'
    },
    {
      name: 'Update Client API',
      file: '../client/src/api/api.js',
      description: 'Updates client API functions for the new auth system'
    },
    {
      name: 'Update Auth Context',
      file: '../client/src/context/AuthContext.jsx',
      description: 'Updates client auth context with improved token refresh'
    },
    {
      name: 'Update Text Adventure',
      file: '../client/src/components/TextAdventure.jsx',
      description: 'Updates the TextAdventure component with game state persistence'
    },
    {
      name: 'Run Tests',
      command: 'node server/scripts/test-auth.js',
      description: 'Runs tests to verify the authentication system'
    },
    {
      name: 'Check Consistency',
      command: 'node server/scripts/check-auth-consistency.js',
      description: 'Checks consistency across auth system components'
    }
  ];
  
  for (const [index, step] of steps.entries()) {
    console.log(chalk.yellow(`\n--- Step ${index + 1}/${steps.length}: ${step.name} ---`));
    console.log(chalk.white(step.description));
    
    if (step.file) {
      console.log(chalk.cyan(`File to update: ${step.file}`));
      console.log(chalk.white('Please manually update this file with the changes described in README-AUTH-UPGRADE.md'));
    }
    
    if (step.command) {
      console.log(chalk.cyan(`Command to run: ${step.command}`));
      
      const { runCommand } = await inquirer.prompt([{
        type: 'confirm',
        name: 'runCommand',
        message: 'Do you want to run this command now?',
        default: true
      }]);
      
      if (runCommand) {
        try {
          console.log(chalk.yellow('Running command...'));
          const { stdout, stderr } = await execPromise(step.command, { cwd: ROOT_DIR });
          console.log(chalk.green('Command output:'));
          console.log(stdout);
          
          if (stderr) {
            console.error(chalk.red('Errors:'));
            console.error(stderr);
          }
        } catch (error) {
          console.error(chalk.red(`Command failed: ${error.message}`));
          if (error.stdout) console.log(error.stdout);
          if (error.stderr) console.error(chalk.red(error.stderr));
          
          const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Command failed. Do you want to continue with the next step?',
            default: false
          }]);
          
          if (!proceed) {
            console.log(chalk.yellow('Deployment paused. Fix the issues and run the script again.'));
            return false;
          }
        }
      }
    }
    
    // Confirm completion of step
    if (index < steps.length - 1) {
      const { stepComplete } = await inquirer.prompt([{
        type: 'confirm',
        name: 'stepComplete',
        message: `Have you completed step ${index + 1} (${step.name})?`,
        default: false
      }]);
      
      if (!stepComplete) {
        console.log(chalk.yellow(`Please complete step ${index + 1} before continuing.`));
        index--; // Repeat this step
      }
    }
  }
  
  return true;
};

// Final verification
const verifyDeployment = async () => {
  console.log(chalk.blue('\n=== Deployment Verification ==='));
  
  const verificationSteps = [
    'Users can register successfully',
    'Login works with both username and email',
    'Token refresh happens automatically',
    'Game state is saved and loaded correctly',
    'Logout invalidates tokens properly'
  ];
  
  console.log(chalk.yellow('Please verify the following manually:'));
  
  for (const [index, step] of verificationSteps.entries()) {
    console.log(chalk.cyan(`${index + 1}. ${step}`));
  }
  
  const { allVerified } = await inquirer.prompt([{
    type: 'confirm',
    name: 'allVerified',
    message: 'Have you verified all the steps above?',
    default: false
  }]);
  
  if (!allVerified) {
    console.log(chalk.yellow('Please complete verification before finalizing the deployment.'));
    return false;
  }
  
  return true;
};

// Main deployment function
const deploy = async () => {
  console.log(chalk.green('=== Authentication System Upgrade Deployment ==='));
  
  try {
    // Check prerequisites
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) return;
    
    // Create database backup
    const backupOk = await createDatabaseBackup();
    if (!backupOk) return;
    
    // Get deployment confirmation
    const { startDeployment } = await inquirer.prompt([{
      type: 'confirm',
      name: 'startDeployment',
      message: 'Are you ready to start the deployment process?',
      default: false
    }]);
    
    if (!startDeployment) {
      console.log(chalk.yellow('Deployment aborted.'));
      return;
    }
    
    // Deploy step by step
    const deploymentOk = await deployStepByStep();
    if (!deploymentOk) return;
    
    // Verify deployment
    const verificationOk = await verifyDeployment();
    if (!verificationOk) return;
    
    console.log(chalk.green('\n=== Authentication System Upgrade Completed Successfully ==='));
    console.log(chalk.white('The new authentication system has been deployed and verified.'));
    console.log(chalk.white('Remember to monitor server logs and user feedback for any issues.'));
    
  } catch (error) {
    console.error(chalk.red(`Deployment failed: ${error.message}`));
    console.error(error);
  }
};

// Run the deployment
deploy(); 