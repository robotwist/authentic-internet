#!/bin/bash

# Authentic Internet Development Starter
# This script starts both the server and client with the correct port configuration

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Authentic Internet - Development Environment  ${NC}"
echo -e "${BLUE}================================================${NC}"

# Kill any existing processes on our ports
echo -e "\n${YELLOW}Checking for existing processes...${NC}"

# Function to kill process using a port
kill_process_on_port() {
  local port=$1
  local pid=$(lsof -ti:$port)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Killing process $pid on port $port${NC}"
    kill -9 $pid
  else
    echo -e "${GREEN}Port $port is available${NC}"
  fi
}

# Kill processes on server and client ports
kill_process_on_port 5000
kill_process_on_port 5001
kill_process_on_port 5173

# Ensure MongoDB is running
if which mongod > /dev/null; then
  echo -e "\n${YELLOW}Checking MongoDB status...${NC}"
  if pgrep mongod > /dev/null; then
    echo -e "${GREEN}MongoDB is running${NC}"
  else
    echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
    mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongodb.log || true
  fi
fi

# Clear terminal
echo -e "\n${YELLOW}Starting development environment...${NC}"

# Start the server in the background
echo -e "\n${GREEN}Starting server on port 5000...${NC}"
cd "$(dirname "$0")/server" && PORT=5000 npm start &
SERVER_PID=$!

# Give the server time to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 2

# Test if server is running
if curl -s http://localhost:5000/health > /dev/null; then
  echo -e "${GREEN}Server is running on port 5000${NC}"
else
  echo -e "${YELLOW}Server might not be ready on port 5000, checking port 5001...${NC}"
  if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}Server is running on port 5001${NC}"
  else
    echo -e "${RED}Warning: Server health check failed. Continuing anyway...${NC}"
  fi
fi

# Start the client
echo -e "\n${GREEN}Starting client on port 5173...${NC}"
cd "$(dirname "$0")/client" && npm run dev

# When the client exits, kill the server
echo -e "\n${YELLOW}Stopping server...${NC}"
kill $SERVER_PID

echo -e "\n${GREEN}Development environment stopped.${NC}"

# Final message with instructions
echo -e "\n${BLUE}To manually start the environment:${NC}"
echo -e "1. Server: ${GREEN}cd server && PORT=5000 npm start${NC}"
echo -e "2. Client: ${GREEN}cd client && npm run dev${NC}"
echo -e "\n${BLUE}For testing API connectivity:${NC}"
echo -e "Visit: ${GREEN}http://localhost:5173/api-test.html${NC}" 