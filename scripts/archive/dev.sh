#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Authentic Internet Development Server${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Starting development environment..."

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/authentic-internet"
export PORT=5000
export CLIENT_PORT=5173

# Kill any processes that might be using the ports
echo -e "Ensuring ports 5000 and 5173 are available..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start the application using npm script
echo -e "${GREEN}Starting server on port 5000 and client on port 5173...${NC}"
echo -e "${BLUE}------------------------------------${NC}"
echo -e "Server: ${GREEN}http://localhost:5000${NC}"
echo -e "Client: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}------------------------------------${NC}"
echo -e "Press ${RED}Ctrl+C${NC} to stop all services."

# Start both client and server
npm run dev
