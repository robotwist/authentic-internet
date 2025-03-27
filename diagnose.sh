#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Authentic Internet Diagnostic Tool${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check for required tools
echo -e "${YELLOW}Checking for required tools...${NC}"
MISSING_TOOLS=0
for tool in node npm nc curl; do
  if ! command -v $tool &> /dev/null; then
    echo -e "${RED}$tool is not installed. Please install it.${NC}"
    MISSING_TOOLS=1
  else
    echo -e "${GREEN}$tool is installed.${NC}"
  fi
done

if [ $MISSING_TOOLS -eq 1 ]; then
  echo -e "${RED}Some required tools are missing. Please install them and try again.${NC}"
  exit 1
fi

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
if [ $NODE_MAJOR_VERSION -lt 16 ]; then
  echo -e "${RED}Node.js version $NODE_VERSION is too old. Please upgrade to at least v16.${NC}"
else
  echo -e "${GREEN}Node.js version $NODE_VERSION is supported.${NC}"
fi

# Check for existing Node processes
echo -e "${YELLOW}Checking for running Node processes...${NC}"
NODE_PROCESSES=$(pgrep -fl node)
if [ ! -z "$NODE_PROCESSES" ]; then
  echo -e "${RED}Found running Node processes:${NC}"
  echo "$NODE_PROCESSES"
  echo -e "${YELLOW}These may interfere with the application. Consider stopping them.${NC}"
else
  echo -e "${GREEN}No existing Node processes found.${NC}"
fi

# Check for port availability
echo -e "${YELLOW}Checking port availability...${NC}"
for port in 5001 5173; do
  nc -z localhost $port > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${RED}Port $port is already in use. This will cause conflicts.${NC}"
    echo -e "${YELLOW}Process using port $port:${NC}"
    lsof -i:$port || fuser -n tcp $port || echo "Could not identify process"
  else
    echo -e "${GREEN}Port $port is available.${NC}"
  fi
done

# Check server package installation
echo -e "${YELLOW}Checking server package installation...${NC}"
if [ ! -d "server/node_modules" ]; then
  echo -e "${RED}Server node_modules directory not found. Packages may need to be installed.${NC}"
  echo -e "${YELLOW}Run 'cd server && npm install' to install server dependencies.${NC}"
else
  echo -e "${GREEN}Server node_modules directory exists.${NC}"
fi

# Check client package installation
echo -e "${YELLOW}Checking client package installation...${NC}"
if [ ! -d "client/node_modules" ]; then
  echo -e "${RED}Client node_modules directory not found. Packages may need to be installed.${NC}"
  echo -e "${YELLOW}Run 'cd client && npm install' to install client dependencies.${NC}"
else
  echo -e "${GREEN}Client node_modules directory exists.${NC}"
fi

# Check for .env files
echo -e "${YELLOW}Checking for environment files...${NC}"
if [ ! -f "server/.env" ]; then
  echo -e "${RED}Server .env file not found. This may cause configuration issues.${NC}"
else
  echo -e "${GREEN}Server .env file found.${NC}"
fi

if [ ! -f "client/.env" ]; then
  echo -e "${RED}Client .env file not found. This may cause configuration issues.${NC}"
else
  echo -e "${GREEN}Client .env file found.${NC}"
fi

# Check MongoDB connection
echo -e "${YELLOW}Checking MongoDB connection (using configuration from .env)...${NC}"
if [ -f "server/.env" ]; then
  # Extract MongoDB URI from .env file
  MONGO_URI=$(grep "MONGO_URI" server/.env | cut -d '=' -f2)
  if [ -z "$MONGO_URI" ]; then
    echo -e "${RED}MONGO_URI not found in server/.env file.${NC}"
  else
    # Simple check - just try to connect and check exit code
    node -e "
      const { MongoClient } = require('mongodb');
      const uri = '$MONGO_URI';
      const client = new MongoClient(uri);
      async function run() {
        try {
          await client.connect();
          console.log('Connected to MongoDB');
          await client.close();
          process.exit(0);
        } catch (err) {
          console.error('Failed to connect to MongoDB:', err);
          process.exit(1);
        }
      }
      run();
    " > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}MongoDB connection successful.${NC}"
    else
      echo -e "${RED}Could not connect to MongoDB. Check your connection string.${NC}"
    fi
  fi
else
  echo -e "${YELLOW}Cannot check MongoDB connection without server/.env file.${NC}"
fi

# Check for disk space
echo -e "${YELLOW}Checking available disk space...${NC}"
DISK_SPACE=$(df -h . | tail -1 | awk '{print $4}')
echo -e "${GREEN}Available disk space: $DISK_SPACE${NC}"

# Generate report
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Diagnostic Report${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${YELLOW}If you encountered issues, check the following:${NC}"
echo -e "1. Make sure all required tools are installed."
echo -e "2. Ensure Node.js version is compatible (v16+)."
echo -e "3. Verify no conflicting Node processes are running."
echo -e "4. Confirm ports 5001 and 5173 are available."
echo -e "5. Ensure all dependencies are installed."
echo -e "6. Verify environment files are properly configured."
echo -e "7. Check MongoDB connection is working."
echo -e "${BLUE}=====================================${NC}"
echo -e "${YELLOW}To start the application, run: ${NC}./start-app.sh" 