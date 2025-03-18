#!/bin/bash

echo "=== Authentic Internet Deployment Script ==="
echo "This script will deploy your application to Netlify (frontend) and Heroku (backend)"
echo ""

# Ensure we're in the project root
cd "$(dirname "$0")" || exit

# Step 1: Deploy backend to Heroku
echo "=== Deploying backend to Heroku ==="
cd server || exit

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "Heroku CLI not found. Please install it first."
    echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if already logged into Heroku
if ! heroku whoami &> /dev/null; then
    echo "Please log in to Heroku:"
    heroku login
fi

# Check if app already exists
APP_NAME="authentic-internet-api"
if ! heroku apps:info "$APP_NAME" &> /dev/null; then
    echo "Creating Heroku app: $APP_NAME"
    heroku create "$APP_NAME"
else
    echo "Using existing Heroku app: $APP_NAME"
fi

# Set environment variables on Heroku
echo "Setting up environment variables on Heroku..."
heroku config:set MONGO_URI="$(grep MONGO_URI .env.production | cut -d= -f2)" --app "$APP_NAME"
heroku config:set JWT_SECRET="$(grep JWT_SECRET .env.production | cut -d= -f2)" --app "$APP_NAME"
heroku config:set NODE_ENV=production --app "$APP_NAME"
heroku config:set CLIENT_URL="$(grep CLIENT_URL .env.production | cut -d= -f2)" --app "$APP_NAME"

# Push to Heroku
echo "Deploying backend to Heroku..."
git push heroku experimental-yolo:main

echo "Backend deployed successfully to Heroku!"
echo "Backend URL: https://$APP_NAME.herokuapp.com"

# Step 2: Deploy frontend to Netlify
echo ""
echo "=== Deploying frontend to Netlify ==="
cd ../client || exit

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if logged into Netlify
if ! netlify status &> /dev/null; then
    echo "Please log in to Netlify:"
    netlify login
fi

# Build the app
echo "Building frontend..."
npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

echo "=== Deployment Complete ==="
echo "Backend: https://$APP_NAME.herokuapp.com"
echo "Frontend: https://authentic-internet.netlify.app"
echo ""
echo "Note: If this is your first deployment, you may need to configure the domain manually in the Netlify dashboard." 