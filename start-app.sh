#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Authentic Internet Application Launcher${NC}"
echo -e "${BLUE}=====================================${NC}"

# Step 1: Kill any existing Node processes that might conflict
echo -e "${YELLOW}Cleaning up environment...${NC}"
pkill -f node || true

# Step 2: Clear Vite caches
echo -e "${YELLOW}Clearing Vite cache...${NC}"
rm -rf client/node_modules/.vite

# Step 3: Check if ports are available
echo -e "${YELLOW}Checking port availability...${NC}"
check_port() {
  nc -z localhost $1 > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${RED}Port $1 is already in use. Attempting to free it...${NC}"
    fuser -k $1/tcp || true
    sleep 1
    nc -z localhost $1 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo -e "${RED}Failed to free port $1. Please check manually.${NC}"
      return 1
    else
      echo -e "${GREEN}Successfully freed port $1.${NC}"
      return 0
    fi
  else
    echo -e "${GREEN}Port $1 is available.${NC}"
    return 0
  fi
}

# Check critical ports
check_port 5001 # Backend API
check_port 5175 # Frontend development server

# Step 4: Start the backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../.server_pid
cd ..

# Wait for server to be ready
echo -e "${YELLOW}Waiting for API to be available...${NC}"
timeout=30
counter=0
while ! curl -s http://localhost:5001/api/health > /dev/null && [ $counter -lt $timeout ]; do
  echo -e "${YELLOW}Waiting for API... ($counter/$timeout)${NC}"
  sleep 1
  counter=$((counter+1))
done

if [ $counter -lt $timeout ]; then
  echo -e "${GREEN}API is ready!${NC}"
else
  echo -e "${RED}API server did not start properly within timeout period.${NC}"
  echo -e "${YELLOW}Check server.log for errors.${NC}"
  cat server.log | tail -n 20
  exit 1
fi

# Step 5: Start the frontend
echo -e "${YELLOW}Starting frontend development server...${NC}"
cd client
npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../.client_pid
cd ..

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be available...${NC}"
timeout=30
counter=0
while ! curl -s http://localhost:5175 > /dev/null && [ $counter -lt $timeout ]; do
  echo -e "${YELLOW}Waiting for frontend... ($counter/$timeout)${NC}"
  sleep 1
  counter=$((counter+1))
done

if [ $counter -lt $timeout ]; then
  echo -e "${GREEN}Frontend is ready!${NC}"
  echo -e "${GREEN}Application started successfully!${NC}"
  echo -e "${BLUE}------------------------------------${NC}"
  echo -e "${GREEN}Backend API:${NC} http://localhost:5001"
  echo -e "${GREEN}Frontend:${NC} http://localhost:5175"
  echo -e "${BLUE}------------------------------------${NC}"
  echo -e "${YELLOW}Server logs: ${NC}tail -f server.log"
  echo -e "${YELLOW}Client logs: ${NC}tail -f client.log"
  echo -e "${YELLOW}To stop the application: ${NC}./stop-app.sh"
else
  echo -e "${RED}Frontend did not start properly within timeout period.${NC}"
  echo -e "${YELLOW}Check client.log for errors.${NC}"
  cat client.log | tail -n 20
  exit 1
fi 