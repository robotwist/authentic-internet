#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${RED}Stopping Authentic Internet Application${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if the application is running
if [ ! -f .server_pid ] || [ ! -f .client_pid ]; then
  echo -e "${YELLOW}PID files not found. Application may not be running.${NC}"
  echo -e "${YELLOW}Attempting to kill any Node processes anyway...${NC}"
  pkill -f node || true
  echo -e "${GREEN}Done!${NC}"
  exit 0
fi

# Read PIDs
SERVER_PID=$(cat .server_pid)
CLIENT_PID=$(cat .client_pid)

# Stop client
echo -e "${YELLOW}Stopping frontend (PID: $CLIENT_PID)...${NC}"
if ps -p $CLIENT_PID > /dev/null; then
  kill $CLIENT_PID
  sleep 2
  if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${RED}Frontend process still running. Sending SIGKILL...${NC}"
    kill -9 $CLIENT_PID || true
  fi
  echo -e "${GREEN}Frontend stopped.${NC}"
else
  echo -e "${YELLOW}Frontend process was not running.${NC}"
fi

# Stop server
echo -e "${YELLOW}Stopping backend (PID: $SERVER_PID)...${NC}"
if ps -p $SERVER_PID > /dev/null; then
  kill $SERVER_PID
  sleep 2
  if ps -p $SERVER_PID > /dev/null; then
    echo -e "${RED}Backend process still running. Sending SIGKILL...${NC}"
    kill -9 $SERVER_PID || true
  fi
  echo -e "${GREEN}Backend stopped.${NC}"
else
  echo -e "${YELLOW}Backend process was not running.${NC}"
fi

# Cleanup PID files
rm -f .server_pid .client_pid

# Make sure there are no orphaned processes
echo -e "${YELLOW}Checking for orphaned Node processes...${NC}"
NODE_PROCESSES=$(pgrep -fl node)
if [ ! -z "$NODE_PROCESSES" ]; then
  echo -e "${RED}Found orphaned Node processes:${NC}"
  echo "$NODE_PROCESSES"
  echo -e "${YELLOW}Attempting to kill them...${NC}"
  pkill -f node || true
  sleep 1
  NODE_PROCESSES=$(pgrep -fl node)
  if [ ! -z "$NODE_PROCESSES" ]; then
    echo -e "${RED}Some Node processes could not be killed:${NC}"
    echo "$NODE_PROCESSES"
    echo -e "${YELLOW}You may need to kill them manually.${NC}"
  else
    echo -e "${GREEN}All Node processes stopped.${NC}"
  fi
else
  echo -e "${GREEN}No orphaned Node processes found.${NC}"
fi

echo -e "${GREEN}Application stopped successfully!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${YELLOW}To start the application again: ${NC}./start-app.sh" 