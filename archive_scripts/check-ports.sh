#!/bin/bash

# Check Ports Script - Authentic Internet
# This script checks if the required ports are available or what's using them

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     Authentic Internet - Port Availability     ${NC}"
echo -e "${BLUE}================================================${NC}"

# Ports to check
PORTS=(5000 5001 5173)

# Check each port
for PORT in "${PORTS[@]}"; do
  echo -e "\n${BLUE}Checking port ${PORT}...${NC}"
  
  # Try to get process using the port
  PID=$(lsof -ti:${PORT})
  
  if [ -z "$PID" ]; then
    echo -e "${GREEN}✓ Port ${PORT} is available${NC}"
  else
    echo -e "${RED}✗ Port ${PORT} is in use by process ${PID}${NC}"
    
    # Get process details
    PROCESS_INFO=$(ps -p $PID -o comm=,args=)
    echo -e "${YELLOW}Process details: ${PROCESS_INFO}${NC}"
    
    # Offer to kill the process
    echo -ne "${YELLOW}Do you want to kill this process? (y/n) ${NC}"
    read -r KILL
    
    if [[ $KILL == "y" || $KILL == "Y" ]]; then
      kill -9 $PID
      echo -e "${GREEN}Process killed. Port ${PORT} is now available.${NC}"
    else
      echo -e "${YELLOW}Process not killed. Port ${PORT} remains in use.${NC}"
    fi
  fi
done

# Check network connectivity
echo -e "\n${BLUE}Testing API health endpoints...${NC}"

# Function to test URL
test_url() {
  URL=$1
  if curl -s --head $URL > /dev/null; then
    echo -e "${GREEN}✓ $URL is accessible${NC}"
    return 0
  else
    echo -e "${RED}✗ $URL is not accessible${NC}"
    return 1
  fi
}

# Test server health endpoints
test_url "http://localhost:5000/health"
SERVER_STATUS=$?

test_url "http://localhost:5001/health"
FALLBACK_STATUS=$?

# Final summary
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}                   SUMMARY                      ${NC}"
echo -e "${BLUE}================================================${NC}"

if [ $SERVER_STATUS -eq 0 ] || [ $FALLBACK_STATUS -eq 0 ]; then
  echo -e "${GREEN}API server is running and accessible.${NC}"
else
  echo -e "${RED}API server is not running or not accessible.${NC}"
  echo -e "${YELLOW}To start the server: ${NC}cd server && PORT=5000 npm start"
fi

# Check if any ports are in use
PORTS_IN_USE=false
for PORT in "${PORTS[@]}"; do
  if lsof -ti:${PORT} > /dev/null; then
    PORTS_IN_USE=true
    break
  fi
done

if [ "$PORTS_IN_USE" = true ]; then
  echo -e "${YELLOW}Some ports are still in use. To free all ports, run:${NC}"
  echo -e "killall node"
else
  echo -e "${GREEN}All required ports are available.${NC}"
fi

echo -e "\n${BLUE}To start the full development environment:${NC}"
echo -e "./start-dev.sh" 