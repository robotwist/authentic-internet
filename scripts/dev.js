import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Function to kill process by PID file
function killProcessByPidFile(pidFile) {
  try {
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
      try {
        process.kill(pid);
        console.log(`✅ Killed process with PID ${pid}`);
      } catch (err) {
        console.warn(`⚠️ Process ${pid} not found or already terminated`);
      }
      fs.unlinkSync(pidFile);
    }
  } catch (err) {
    console.warn(`⚠️ Error handling PID file ${pidFile}:`, err);
  }
}

// Kill any existing processes
killProcessByPidFile(resolve(projectRoot, 'server/.server_pid'));
killProcessByPidFile(resolve(projectRoot, 'client/.client_pid'));

// Common spawn options
const spawnOptions = {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
};

// Start server with nodemon
const server = spawn('npm', ['run', 'dev'], {
  ...spawnOptions,
  cwd: resolve(projectRoot, 'server')
});

// Start client with Vite
const client = spawn('npm', ['run', 'dev'], {
  ...spawnOptions,
  cwd: resolve(projectRoot, 'client')
});

// Handle process termination
function cleanup() {
  console.log('\n💤 Shutting down development servers...');
  
  // Kill server process
  server.kill();
  killProcessByPidFile(resolve(projectRoot, 'server/.server_pid'));
  
  // Kill client process
  client.kill();
  killProcessByPidFile(resolve(projectRoot, 'client/.client_pid'));
  
  console.log('👋 Development servers stopped');
  process.exit(0);
}

// Listen for termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle process errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  cleanup();
});

client.on('error', (err) => {
  console.error('❌ Client error:', err);
  cleanup();
});

// Handle nodemon restart events
server.on('message', (message) => {
  if (message.type === 'restart') {
    console.log('🔄 Server restarting...');
  }
}); 