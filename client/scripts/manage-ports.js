#!/usr/bin/env node

/**
 * Port Management Script for Development Servers
 * 
 * This script helps manage port conflicts and cleanup for Vite development servers.
 * It can be run manually or integrated into npm scripts.
 * 
 * Usage:
 *   node scripts/manage-ports.js cleanup   - Kill all running Vite servers
 *   node scripts/manage-ports.js check     - Check which ports are in use
 *   node scripts/manage-ports.js reset     - Kill all servers and reset port files
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Convert callback-based functions to Promise-based
const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const DEFAULT_PORT = 5173;
const portFilePath = path.join(projectRoot, '.vite-port');

// Helper to run a command and get the output
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) console.error(`Command stderr: ${stderr}`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    return '';
  }
}

// Find all running Vite development servers
async function findViteProcesses() {
  const output = await runCommand("ps aux | grep 'vite --port' | grep -v grep");
  if (!output) return [];

  return output.split('\n').map(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[1];
    const command = parts.slice(10).join(' ');
    
    // Extract port from command
    const portMatch = command.match(/--port\s+(\d+)/);
    const port = portMatch ? parseInt(portMatch[1], 10) : null;
    
    return { pid, command, port };
  });
}

// Kill Vite development server processes
async function killViteProcesses() {
  const processes = await findViteProcesses();
  
  if (processes.length === 0) {
    console.log('No Vite development server processes found.');
    return;
  }
  
  console.log(`Found ${processes.length} Vite processes:`);
  processes.forEach(process => {
    console.log(`  PID ${process.pid} - Port ${process.port || 'unknown'} - ${process.command}`);
  });
  
  const pids = processes.map(process => process.pid).join(' ');
  try {
    await runCommand(`kill -9 ${pids}`);
    console.log('Successfully killed all Vite processes.');
  } catch (error) {
    console.error('Error killing processes:', error);
  }
}

// Save the currently used port to a file for future reference
function saveCurrentPort(port) {
  fs.writeFileSync(portFilePath, port.toString(), 'utf8');
  console.log(`Saved current port (${port}) to ${portFilePath}`);
}

// Read the last used port from the file
function getLastUsedPort() {
  try {
    if (fs.existsSync(portFilePath)) {
      const port = parseInt(fs.readFileSync(portFilePath, 'utf8').trim(), 10);
      return isNaN(port) ? DEFAULT_PORT : port;
    }
  } catch (error) {
    console.error('Error reading port file:', error);
  }
  return DEFAULT_PORT;
}

// Check if a port is in use
async function isPortInUse(port) {
  try {
    const result = await runCommand(`lsof -i:${port} -P -n -sTCP:LISTEN`);
    return result.trim() !== '';
  } catch (error) {
    return false;
  }
}

// Find the next available port
async function findAvailablePort(startPort = DEFAULT_PORT) {
  let port = startPort;
  const MAX_PORT = 65535;
  const MAX_ATTEMPTS = 10;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS && port < MAX_PORT; attempt++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port++;
  }
  
  return startPort; // Return the original port if we couldn't find an available one
}

// Main function
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'cleanup':
      await killViteProcesses();
      break;
      
    case 'check':
      const processes = await findViteProcesses();
      if (processes.length === 0) {
        console.log('No Vite development server processes are running.');
      } else {
        console.log(`Found ${processes.length} Vite processes:`);
        processes.forEach(process => {
          console.log(`  PID ${process.pid} - Port ${process.port || 'unknown'} - ${process.command}`);
        });
      }
      break;
      
    case 'reset':
      await killViteProcesses();
      saveCurrentPort(DEFAULT_PORT);
      console.log(`Reset to default port: ${DEFAULT_PORT}`);
      break;
      
    case 'next-port':
      const lastPort = getLastUsedPort();
      const nextPort = await findAvailablePort(lastPort);
      saveCurrentPort(nextPort);
      console.log(`Next available port: ${nextPort}`);
      break;
      
    case 'help':
    default:
      console.log(`
Port Management Script for Development Servers

Usage:
  node scripts/manage-ports.js cleanup    - Kill all running Vite servers
  node scripts/manage-ports.js check      - Check which ports are in use
  node scripts/manage-ports.js reset      - Kill all servers and reset port files
  node scripts/manage-ports.js next-port  - Find and save the next available port
      `);
      break;
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 