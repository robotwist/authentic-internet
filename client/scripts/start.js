#!/usr/bin/env node

/**
 * Client startup script with proper environment detection and logging
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Determine environment
const env = process.env.NODE_ENV || 'development';
console.log(`Starting client in ${env} mode...`);

// Determine the command to run
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const command = npmCmd;
const args = env === 'development' ? ['run', 'dev'] : ['run', 'preview'];

// Start client
const clientProcess = spawn(command, args, {
  cwd: rootDir,
  env: process.env,
  stdio: 'pipe',
  detached: false
});

// Store the PID for possible shutdown later
try {
  writeFileSync(path.join(rootDir, '.client_pid'), String(clientProcess.pid));
  console.log(`Client PID ${clientProcess.pid} saved to .client_pid`);
} catch (err) {
  console.error('Failed to save client PID:', err);
}

// Log output from the client
clientProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

clientProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle client process events
clientProcess.on('close', (code) => {
  console.log(`Client process exited with code ${code}`);
});

clientProcess.on('error', (err) => {
  console.error('Failed to start client process:', err);
  process.exit(1);
});

// Handle termination signals
const handleTermination = () => {
  if (clientProcess) {
    console.log('Stopping client process...');
    
    // Kill the process
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', clientProcess.pid, '/f', '/t']);
    } else {
      process.kill(-clientProcess.pid, 'SIGINT'); // The negative PID kills the process group
    }
  }
  
  process.exit(0);
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

console.log('Client startup script running. Press Ctrl+C to stop.'); 