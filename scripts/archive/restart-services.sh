#!/bin/bash

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log file
LOGFILE="restart-services.log"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Create log directory if it doesn't exist
mkdir -p logs

# Function to log messages
log() {
  local message="$1"
  local level="${2:-INFO}"
  echo -e "${DATE} [${level}] ${message}" | tee -a "logs/${LOGFILE}"
}

# Function to log success messages
log_success() {
  log "${GREEN}$1${NC}" "SUCCESS"
  echo -e "${GREEN}$1${NC}"
}

# Function to log error messages
log_error() {
  log "${RED}$1${NC}" "ERROR"
  echo -e "${RED}$1${NC}"
}

# Function to log warning messages
log_warning() {
  log "${YELLOW}$1${NC}" "WARNING"
  echo -e "${YELLOW}$1${NC}"
}

# Function to log info messages
log_info() {
  log "${BLUE}$1${NC}" "INFO"
  echo -e "${BLUE}$1${NC}"
}

# Print header
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   Authentic Internet - Service Restart Script      ${NC}"
echo -e "${BLUE}====================================================${NC}"
log_info "Starting service restart process"

# Function to check if a port is in use
is_port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
  return $?
}

# Function to kill process running on a specific port
kill_process_on_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  
  if [ -n "$pid" ]; then
    log_warning "Process using port $port (PID: $pid) found. Terminating..."
    kill -15 $pid 2>/dev/null # Try SIGTERM first
    sleep 2
    
    # Check if process is still running
    if kill -0 $pid 2>/dev/null; then
      log_warning "Process still running. Forcing termination with SIGKILL..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    # Verify process is gone
    if ! kill -0 $pid 2>/dev/null; then
      log_success "Process terminated successfully."
    else
      log_error "Failed to terminate process on port $port."
      return 1
    fi
  else
    log_success "No process using port $port."
  fi
  return 0
}

# Function to wait for a port to be available
wait_for_port() {
  local port=$1
  local service_name=$2
  local max_attempts=$3
  local attempt=1
  
  log_info "Waiting for $service_name to be available on port $port..."
  
  while ! nc -z localhost $port >/dev/null 2>&1; do
    if [ $attempt -gt $max_attempts ]; then
      log_error "$service_name not available after $max_attempts attempts. Giving up."
      return 1
    fi
    log_warning "Attempt $attempt/$max_attempts: $service_name not yet available..."
    sleep 2
    ((attempt++))
  done
  
  log_success "$service_name is available on port $port!"
  return 0
}

# Function to verify MongoDB connection
verify_mongodb() {
  log_info "Verifying MongoDB connection..."
  if mongo --eval "db.stats()" >/dev/null 2>&1; then
    log_success "MongoDB connection verified."
    return 0
  else
    log_error "MongoDB connection failed. Please check MongoDB status."
    return 1
  fi
}

# Function to verify server health
verify_server_health() {
  local port=$1
  local max_attempts=$2
  local attempt=1
  
  log_info "Verifying server health on port $port..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:$port/health >/dev/null 2>&1; then
      local health_data=$(curl -s http://localhost:$port/health)
      log_success "Server health check passed on port $port!"
      log_info "Health data: $health_data"
      return 0
    fi
    
    log_warning "Attempt $attempt/$max_attempts: Server health check failed. Retrying in 2 seconds..."
    sleep 2
    ((attempt++))
  done
  
  log_error "Server health check failed after $max_attempts attempts."
  return 1
}

# 1. Check for and kill processes on required ports
log_info "Step 1: Checking for processes using required ports..."
required_ports=(5000 5001 5173 5174 5175)
failed_ports=()

for port in "${required_ports[@]}"; do
  if is_port_in_use $port; then
    if ! kill_process_on_port $port; then
      failed_ports+=($port)
    fi
  else
    log_success "Port $port is available."
  fi
done

if [ ${#failed_ports[@]} -gt 0 ]; then
  log_warning "Failed to free ports: ${failed_ports[*]}. Attempting to continue..."
fi

# 2. Check MongoDB
log_info "Step 2: Checking MongoDB status..."
if pgrep -x "mongod" > /dev/null; then
  log_success "MongoDB is running."
  
  # Verify MongoDB connection
  verify_mongodb
  mongodb_status=$?
else
  log_warning "MongoDB is not running. Attempting to start..."
  if which mongod > /dev/null; then
    mongod --fork --logpath /var/log/mongodb.log 2>/dev/null
    if [ $? -eq 0 ]; then
      log_success "MongoDB started successfully."
      # Give MongoDB a moment to initialize
      sleep 3
      verify_mongodb
      mongodb_status=$?
    else
      log_error "Failed to start MongoDB."
      log_info "Attempting to continue without MongoDB. Some features may not work."
      mongodb_status=1
    fi
  else
    log_error "MongoDB not found. Please install MongoDB."
    log_info "Attempting to continue without MongoDB. Some features may not work."
    mongodb_status=1
  fi
fi

# 3. Clear any zombie processes
log_info "Step 3: Cleaning up any zombie Node.js processes..."
pkill -f "node.*server.mjs" || log_info "No server processes found to kill."
pkill -f "vite" || log_info "No Vite dev server processes found to kill."

# Create a backup of the current logs
if [ -f server/server.log ]; then
  cp server/server.log server/server.log.backup
  log_info "Backed up server log."
fi

if [ -f client/client.log ]; then
  cp client/client.log client/client.log.backup
  log_info "Backed up client log."
fi

# 4. Start the server
log_info "Step 4: Starting the server..."
cd server || { log_error "Server directory not found!"; exit 1; }

log_info "Installing any missing dependencies..."
npm install --quiet || log_warning "npm install had some issues, but continuing..."

log_info "Starting the server in the background..."
echo "" > server.log # Clear log file
export PORT=5000
nohup npm start > server.log 2>&1 &
SERVER_PID=$!
log_info "Server process started with PID: $SERVER_PID"
sleep 5

# Check if server started properly
if ps -p $SERVER_PID > /dev/null; then
  log_success "Server process is running with PID: $SERVER_PID"
  
  # Verify server is responding to requests
  if wait_for_port 5000 "Server" 10; then
    log_success "Server is listening on port 5000."
    
    # Verify server health
    verify_server_health 5000 5
    server_health=$?
  else
    log_error "Server is not responding on port 5000."
    server_health=1
  fi
else
  log_error "Server process failed to start. Check server.log for details."
  server_health=1
fi

# 5. Start the client
log_info "Step 5: Starting the client..."
cd ../client || { log_error "Client directory not found!"; exit 1; }

log_info "Installing any missing dependencies..."
npm install --quiet || log_warning "npm install had some issues, but continuing..."

log_info "Starting the client in development mode..."
echo "" > client.log # Clear log file
nohup npm run dev > client.log 2>&1 &
CLIENT_PID=$!
log_info "Client process started with PID: $CLIENT_PID"
sleep 8

# Check if client started properly and determine which port it's using
client_port=""
if ps -p $CLIENT_PID > /dev/null; then
  log_success "Client process is running with PID: $CLIENT_PID"
  
  # Check which port Vite is using (might be 5173, 5174, etc.)
  for port in 5173 5174 5175 5176; do
    if wait_for_port $port "Client" 2; then
      client_port=$port
      log_success "Client is available on port $client_port."
      break
    fi
  done
  
  if [ -z "$client_port" ]; then
    log_error "Client is running but not available on any expected port."
    client_status=1
  else
    client_status=0
  fi
else
  log_error "Client process failed to start. Check client.log for details."
  client_status=1
fi

# 6. Final status and instructions
echo -e "\n${BLUE}====================================================${NC}"

if [ $server_health -eq 0 ] && [ $client_status -eq 0 ]; then
  log_success "Services restarted successfully!"
elif [ $server_health -eq 0 ]; then
  log_warning "Server started successfully, but client has issues."
elif [ $client_status -eq 0 ]; then
  log_warning "Client started successfully, but server has issues."
else
  log_error "Both server and client have issues. Please check logs."
fi

echo -e "${BLUE}====================================================${NC}"

# Print access URLs and status information
echo -e "\n${CYAN}Access URLs:${NC}"
if [ $server_health -eq 0 ]; then
  echo -e "${CYAN}Server:${NC} http://localhost:5000"
  echo -e "${CYAN}API Health:${NC} http://localhost:5000/health"
else
  echo -e "${RED}Server:${NC} Not available"
fi

if [ $client_status -eq 0 ] && [ ! -z "$client_port" ]; then
  echo -e "${CYAN}Client:${NC} http://localhost:$client_port"
  echo -e "${CYAN}API Debugger:${NC} http://localhost:$client_port/debug.html"
else
  echo -e "${RED}Client:${NC} Not available"
fi

# MongoDB status
if [ $mongodb_status -eq 0 ]; then
  echo -e "${CYAN}MongoDB:${NC} Connected and running"
else
  echo -e "${RED}MongoDB:${NC} Not available or not connected"
fi

# Print log commands
echo -e "\n${CYAN}Log Files:${NC}"
echo -e "${CYAN}Server Log:${NC} tail -f server/server.log"
echo -e "${CYAN}Client Log:${NC} tail -f client/client.log"
echo -e "${CYAN}Restart Log:${NC} cat logs/${LOGFILE}"

# Print helpful commands
echo -e "\n${CYAN}Helpful Commands:${NC}"
echo -e "${CYAN}Restart Services:${NC} ./restart-services.sh"
echo -e "${CYAN}Stop Server:${NC} kill $SERVER_PID"
echo -e "${CYAN}Stop Client:${NC} kill $CLIENT_PID"
echo -e "${CYAN}Debug API:${NC} open http://localhost:$client_port/debug.html in your browser"

# Store PIDs for future reference
echo "$SERVER_PID" > .server_pid
echo "$CLIENT_PID" > .client_pid

log_info "Restart script completed"
echo -e "\n${GREEN}✨ Done! Have a productive day!${NC}"

# Return overall status
if [ $server_health -eq 0 ] && [ $client_status -eq 0 ]; then
  exit 0
else
  exit 1
fi 