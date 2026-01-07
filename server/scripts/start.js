#!/usr/bin/env node

/**
 * Server startup script with proper environment detection and logging
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
console.log(`Starting server in ${env} mode...`);

// Choose the right command
const command = process.platform === 'win32' ? 'node.exe' : 'node';
const args = [path.join(rootDir, 'server.mjs')];

// Start server
const serverProcess = spawn(command, args, {
  cwd: rootDir,
  env: process.env,
  stdio: 'pipe',
  detached: false
});

// Store the PID for possible shutdown later
try {
  writeFileSync(path.join(rootDir, '.server_pid'), String(serverProcess.pid));
  console.log(`Server PID ${serverProcess.pid} saved to .server_pid`);
} catch (err) {
  console.error('Failed to save server PID:', err);
}

// Log output from the server
serverProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle server process events
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

// Handle termination signals
const handleTermination = () => {
  if (serverProcess && !serverProcess.killed) {
    console.log('Stopping server process...');
    
    try {
      // Kill the process
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
      } else {
        // Check if process still exists before killing
        try {
          process.kill(-serverProcess.pid, 0); // Signal 0 checks if process exists
          process.kill(-serverProcess.pid, 'SIGINT'); // The negative PID kills the process group
        } catch (err) {
          if (err.code !== 'ESRCH') {
            // Process doesn't exist, which is fine
            throw err;
          }
        }
      }
    } catch (err) {
      // Process may have already exited, that's okay
      if (err.code !== 'ESRCH') {
        console.error('Error stopping server:', err);
      }
    }
  }
  
  process.exit(0);
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

console.log('Server startup script running. Press Ctrl+C to stop.'); 