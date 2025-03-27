#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="pm2-operations.log"
DATE_FORMAT=$(date +"%Y-%m-%d %H:%M:%S")

# Create logs directories if they don't exist
mkdir -p ./server/logs
mkdir -p ./client/logs

# Logging function
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "ERROR") color=$RED ;;
    "WARNING") color=$YELLOW ;;
  esac
  
  echo -e "${color}[$(date +"$DATE_FORMAT")] [$level] $message${NC}"
  echo "[$(date +"$DATE_FORMAT")] [$level] $message" >> $LOG_FILE
}

# Check if MongoDB is running
check_mongodb() {
  log "INFO" "Checking MongoDB status..."
  if pgrep -x mongod > /dev/null; then
    log "SUCCESS" "MongoDB is running."
    return 0
  else
    log "ERROR" "MongoDB is not running. Please start MongoDB first."
    return 1
  fi
}

# Check if PM2 is installed
check_pm2() {
  if ! command -v pm2 &> /dev/null; then
    log "ERROR" "PM2 is not installed. Please install it with 'npm install -g pm2'."
    exit 1
  fi
}

# Start services with PM2
start_services() {
  log "INFO" "Starting services with PM2..."
  
  # Check if MongoDB is running
  check_mongodb || return 1
  
  # Start services with PM2
  log "INFO" "Starting server and client with PM2..."
  pm2 start ecosystem.config.js
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "Services started successfully with PM2."
    log "INFO" "To monitor services, run: pm2 monit"
    log "INFO" "To view logs, run: pm2 logs"
    log "INFO" "To stop services, run: ./pm2-start.sh stop"
    
    log "INFO" "Server URL: http://localhost:5000"
    log "INFO" "Client URL: http://localhost:5173 or http://localhost:5174"
    log "INFO" "API Health check: http://localhost:5000/health"
    log "INFO" "API Debugger: http://localhost:5173/debug.html"
    return 0
  else
    log "ERROR" "Failed to start services with PM2."
    return 1
  fi
}

# Stop services
stop_services() {
  log "INFO" "Stopping all PM2 services..."
  pm2 stop all
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "All services stopped."
    return 0
  else
    log "ERROR" "Failed to stop services."
    return 1
  fi
}

# Restart services
restart_services() {
  log "INFO" "Restarting all PM2 services..."
  pm2 restart all
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "All services restarted."
    return 0
  else
    log "ERROR" "Failed to restart services."
    return 1
  fi
}

# Check service status
check_status() {
  log "INFO" "Checking service status..."
  pm2 status
  return $?
}

# Save PM2 process list
save_pm2_config() {
  log "INFO" "Saving PM2 process list..."
  pm2 save
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "PM2 process list saved."
    return 0
  else
    log "ERROR" "Failed to save PM2 process list."
    return 1
  fi
}

# Main function
main() {
  # Check if PM2 is installed
  check_pm2
  
  case "$1" in
    start)
      start_services
      save_pm2_config
      ;;
    stop)
      stop_services
      ;;
    restart)
      restart_services
      ;;
    status)
      check_status
      ;;
    logs)
      log "INFO" "Displaying logs..."
      pm2 logs
      ;;
    monitor)
      log "INFO" "Starting PM2 monitor..."
      pm2 monit
      ;;
    *)
      echo "Usage: $0 {start|stop|restart|status|logs|monitor}"
      echo "  start   - Start all services with PM2"
      echo "  stop    - Stop all PM2 services"
      echo "  restart - Restart all PM2 services"
      echo "  status  - Check PM2 service status"
      echo "  logs    - View PM2 logs"
      echo "  monitor - Open PM2 monitor"
      exit 1
      ;;
  esac
}

# Execute main function with all arguments
main "$@" 