#!/usr/bin/env node

/**
 * Master script to start both client and server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, createWriteStream } from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const logsDir = path.join(rootDir, 'logs');

// Create logs directory if it doesn't exist
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Determine environment
const env = process.env.NODE_ENV || 'development';
console.log(`Starting application in ${env} mode...`);

// Set up command to run
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';

// Start server
console.log('Starting server...');
const serverProcess = spawn(nodeCmd, ['scripts/start.js'], {
  cwd: serverDir,
  env: { ...process.env, NODE_ENV: env },
  stdio: 'pipe',
  detached: true
});

const serverLogStream = createWriteStream(path.join(logsDir, 'server.log'), { flags: 'a' });

serverProcess.stdout.pipe(serverLogStream);
serverProcess.stderr.pipe(serverLogStream);

// Log server output to console
serverProcess.stdout.on('data', (data) => {
  process.stdout.write(`[SERVER] ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(`[SERVER ERROR] ${data}`);
});

// Delay client start to allow server to initialize
setTimeout(() => {
  // Start client
  console.log('Starting client...');
  const clientProcess = spawn(nodeCmd, ['scripts/start.js'], {
    cwd: clientDir,
    env: { ...process.env, NODE_ENV: env },
    stdio: 'pipe',
    detached: true
  });

  const clientLogStream = createWriteStream(path.join(logsDir, 'client.log'), { flags: 'a' });

  clientProcess.stdout.pipe(clientLogStream);
  clientProcess.stderr.pipe(clientLogStream);

  // Log client output to console
  clientProcess.stdout.on('data', (data) => {
    process.stdout.write(`[CLIENT] ${data}`);
  });

  clientProcess.stderr.on('data', (data) => {
    process.stderr.write(`[CLIENT ERROR] ${data}`);
  });

  // Handle client process events
  clientProcess.on('close', (code) => {
    console.log(`Client process exited with code ${code}`);
    
    // Kill server if client is closed
    if (serverProcess && !serverProcess.killed) {
      console.log('Stopping server process due to client exit...');
      serverProcess.kill('SIGINT');
    }
  });

  clientProcess.on('error', (err) => {
    console.error('Failed to start client process:', err);
  });

}, 5000); // 5 second delay to allow server to start

// Handle server process events
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

// Handle termination signals
const handleTermination = () => {
  console.log('Stopping all processes...');
  
  // Kill server and client
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGINT');
  }
  
  // The client should be killed by the server process exit handler
  
  process.exit(0);
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

console.log('Application startup script running. Press Ctrl+C to stop.'); 