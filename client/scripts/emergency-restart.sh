#!/bin/bash

# Emergency Restart Script
# This script performs a complete reset of the development environment

echo "🔄 Running emergency development server restart..."

# Go to project directory
cd "$(dirname "$0")/.."

# Kill any running node processes
echo "⚙️ Killing node processes..."
pkill -f node || true

# Clean Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite

# Remove port tracking file
echo "⚙️ Resetting port tracking..."
rm -f .vite-port

# Clear browser cache instructions
echo "⚠️ Remember to clear your browser cache or use incognito window!"
echo "  Chrome: Ctrl+Shift+Del → 'Cached images and files' → Clear data"
echo "  Firefox: Ctrl+Shift+Del → 'Cache' → Clear Now"

# Start fresh development server
echo "🚀 Starting fresh development server..."
npm run dev -- --host localhost

# Check for common issues if start fails 
if [ $? -ne 0 ]; then
  echo "⚠️ Server failed to start. Checking for common issues:"
  
  echo "Checking port 5173 usage..."
  lsof -i :5173 || echo "Port 5173 is available."
  
  echo "Checking node_modules..."
  if [ ! -d "node_modules" ] || [ ! -d "node_modules/react" ]; then
    echo "⚠️ Node modules may be corrupted. Consider running: npm install"
  fi

  echo "Checking for disk space issues..."
  df -h .
fi

echo "✅ Emergency restart completed." 