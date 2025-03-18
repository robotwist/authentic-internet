#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Authentic Internet Deployment Tool ${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists git; then
  echo -e "${RED}Git is not installed. Please install Git and try again.${NC}"
  exit 1
fi

if ! command_exists heroku; then
  echo -e "${RED}Heroku CLI is not installed. Please install it and try again.${NC}"
  exit 1
fi

if ! command_exists netlify; then
  echo -e "${RED}Netlify CLI is not installed. Please install it and try again.${NC}"
  exit 1
fi

# Deploy server to Heroku
deploy_server() {
  echo -e "\n${YELLOW}Deploying server to Heroku...${NC}"
  
  cd server
  
  # Check if Heroku remote exists
  if ! git remote | grep -q "heroku"; then
    echo -e "${YELLOW}Setting up Heroku remote...${NC}"
    heroku git:remote -a authentic-internet-api
  fi
  
  # Deploy to Heroku
  git add .
  git commit -m "Deploy server to Heroku"
  git push heroku main
  
  # Check if deployment was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Server deployed successfully!${NC}"
    heroku open
  else
    echo -e "${RED}Server deployment failed. Please check the logs.${NC}"
    heroku logs --tail
  fi
  
  cd ..
}

# Deploy client to Netlify
deploy_client() {
  echo -e "\n${YELLOW}Deploying client to Netlify...${NC}"
  
  cd client
  
  # Build the app
  npm run build
  
  # Deploy to Netlify
  netlify deploy --prod
  
  # Check if deployment was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Client deployed successfully!${NC}"
  else
    echo -e "${RED}Client deployment failed. Please check the logs.${NC}"
  fi
  
  cd ..
}

# Main menu
echo -e "\n${YELLOW}What would you like to deploy?${NC}"
echo -e "1) Server (Heroku)"
echo -e "2) Client (Netlify)"
echo -e "3) Both"
echo -e "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    deploy_server
    ;;
  2)
    deploy_client
    ;;
  3)
    deploy_server
    deploy_client
    ;;
  4)
    echo -e "${BLUE}Exiting...${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting...${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Deployment process completed!${NC}" 