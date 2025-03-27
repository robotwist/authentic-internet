# Port Management for Development Servers

## The Problem: Port Creep

When running the Vite development server, you may have noticed that the port number sometimes increases (e.g., from 5173 to 5174 to 5175). This happens because:

1. Previous development server instances weren't properly terminated
2. Vite automatically tries the next available port when it finds the previous one is in use
3. Over time, this leads to "port creep" - using higher and higher port numbers

This can cause issues with WebSocket connections, browser bookmarks, and general confusion about which port to use.

## Solutions

We've implemented several solutions to manage this problem:

### 1. New NPM Scripts

We've added several scripts to the `package.json` file:

```bash
# Clean any existing Vite processes before starting a new one
npm run dev:clean

# Clean and start with the browser automatically opening
npm run dev:open

# Check which ports are in use by Vite
npm run port:check

# Kill all Vite processes
npm run port:clean

# Kill all Vite processes and reset to the default port (5173)
npm run port:reset
```

### 2. Port Management Script

We've created a script at `scripts/manage-ports.js` that provides more advanced port management:

```bash
# Manual usage
node scripts/manage-ports.js cleanup    # Kill all running Vite servers
node scripts/manage-ports.js check      # Check which ports are in use
node scripts/manage-ports.js reset      # Kill all servers and reset port files
node scripts/manage-ports.js next-port  # Find and save the next available port
```

## Best Practices

To avoid port creep in the future:

1. Always use `npm run dev:clean` instead of `npm run dev` when starting the development server
2. Run `npm run port:check` if you're unsure what's running
3. Run `npm run port:reset` periodically to reset back to port 5173
4. If you notice ports creeping up, check for zombie processes with `npm run port:check`

## For Windows Users

The port management scripts use Unix commands that might not work on Windows. If you're using Windows:

1. Consider using Git Bash, which provides Unix-like commands
2. Or run the commands manually:
   - Find Vite processes: `tasklist | findstr "node.exe"`
   - Kill them: `taskkill /F /PID <process_id>`

## Troubleshooting

If you're still experiencing issues:

1. Close and reopen your terminal completely
2. Restart your development environment
3. Check if ports are in use with: `netstat -ano | findstr :5173` (Windows) or `lsof -i :5173` (Mac/Linux)
4. Make sure you don't have multiple instances of the project open simultaneously 