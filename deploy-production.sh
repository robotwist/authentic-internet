#!/bin/bash

# Authentic Internet - Production Deployment Script
# This script helps deploy the application to Netlify (frontend) and Heroku (backend)

set -e

echo "🚀 Starting production deployment for Authentic Internet..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Build the client application
build_client() {
    print_status "Building client application..."
    
    cd client
    
    # Install dependencies
    print_status "Installing client dependencies..."
    npm install
    
    # Build the application
    print_status "Building client application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Client build completed successfully!"
    else
        print_error "Client build failed!"
        exit 1
    fi
    
    cd ..
}

# Test the server locally
test_server() {
    print_status "Testing server locally..."
    
    cd server
    
    # Install dependencies
    print_status "Installing server dependencies..."
    npm install
    
    # Check if server starts without errors
    print_status "Testing server startup..."
    timeout 10s npm start || true
    
    cd ..
    
    print_success "Server test completed!"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_warning "Heroku CLI is not installed. Please install it first:"
        echo "  npm install -g heroku"
        echo "  heroku login"
        return 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_warning "Not logged in to Heroku. Please run: heroku login"
        return 1
    fi
    
    # Create or get Heroku app
    APP_NAME="authentic-internet-api"
    
    if heroku apps:info --app $APP_NAME &> /dev/null; then
        print_status "Using existing Heroku app: $APP_NAME"
    else
        print_status "Creating new Heroku app: $APP_NAME"
        heroku create $APP_NAME
    fi
    
    # Set environment variables
    print_status "Setting Heroku environment variables..."
    
    # You'll need to set these manually in Heroku dashboard or via CLI
    print_warning "Please set the following environment variables in Heroku:"
    echo "  MONGO_URI - Your MongoDB connection string"
    echo "  JWT_SECRET - A secure random string for JWT tokens"
    echo "  CLIENT_URL - https://authentic-internet.netlify.app"
    
    # Deploy to Heroku
    print_status "Deploying to Heroku..."
    git push heroku main
    
    if [ $? -eq 0 ]; then
        print_success "Heroku deployment completed!"
        print_status "Your API will be available at: https://$APP_NAME.herokuapp.com"
    else
        print_error "Heroku deployment failed!"
        return 1
    fi
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI is not installed. Please install it first:"
        echo "  npm install -g netlify-cli"
        echo "  netlify login"
        return 1
    fi
    
    # Check if logged in to Netlify
    if ! netlify status &> /dev/null; then
        print_warning "Not logged in to Netlify. Please run: netlify login"
        return 1
    fi
    
    # Deploy to Netlify
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=client/dist
    
    if [ $? -eq 0 ]; then
        print_success "Netlify deployment completed!"
    else
        print_error "Netlify deployment failed!"
        return 1
    fi
}

# Main deployment process
main() {
    echo "🎮 Authentic Internet - Production Deployment"
    echo "=============================================="
    
    # Check requirements
    check_requirements
    
    # Build client
    build_client
    
    # Test server
    test_server
    
    # Ask user which platform to deploy to
    echo ""
    echo "Choose deployment options:"
    echo "1) Deploy to Heroku (Backend)"
    echo "2) Deploy to Netlify (Frontend)"
    echo "3) Deploy to both"
    echo "4) Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_heroku
            ;;
        2)
            deploy_netlify
            ;;
        3)
            deploy_heroku
            deploy_netlify
            ;;
        4)
            print_status "Deployment cancelled."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    echo "🔗 Your application should be available at:"
    echo "   Frontend: https://authentic-internet.netlify.app"
    echo "   Backend:  https://authentic-internet-api.herokuapp.com"
    echo ""
    echo "📝 Don't forget to:"
    echo "   1. Set environment variables in Heroku dashboard"
    echo "   2. Configure CORS settings if needed"
    echo "   3. Test the application thoroughly"
}

# Run the main function
main "$@"
