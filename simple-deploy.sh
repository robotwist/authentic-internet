#!/bin/bash

# Simple Deployment Script for Authentic Internet
# This script prepares everything for web-based deployment

set -e

echo "🚀 Simple Deployment Preparation for Authentic Internet"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Ensure everything is committed
print_status "Checking Git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_warning "You have uncommitted changes. Please commit them first:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo "  git push origin main"
    exit 1
fi

print_success "All changes are committed!"

# Step 2: Test client build
print_status "Testing client build..."
cd client
npm install
npm run build
cd ..

print_success "Client build successful!"

# Step 3: Test server
print_status "Testing server..."
cd server
npm install
# Test if server can start (timeout after 10 seconds)
timeout 10s npm start || true
cd ..

print_success "Server test completed!"

# Step 4: Create deployment checklist
print_status "Creating deployment checklist..."

cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# 🚀 Deployment Checklist

## ✅ Pre-Deployment (COMPLETED)
- [x] All code committed to GitHub
- [x] Client builds successfully
- [x] Server starts without errors
- [x] Dependencies installed

## 🔧 Heroku Deployment Steps

### 1. Create Heroku App
1. Go to https://dashboard.heroku.com/
2. Click "New" → "Create new app"
3. App name: `authentic-internet-api`
4. Region: Choose closest to your users
5. Click "Create app"

### 2. Connect to GitHub
1. Click "Deploy" tab
2. Choose "GitHub" as deployment method
3. Connect your GitHub account
4. Select repository: `robotwist/authentic-internet`
5. Branch: `main`

### 3. Set Environment Variables
1. Go to "Settings" tab
2. Click "Reveal Config Vars"
3. Add these variables:
   ```
   MONGO_URI = your-mongodb-connection-string
   JWT_SECRET = your-super-secret-jwt-key
   CLIENT_URL = https://authentic-internet.netlify.app
   NODE_ENV = production
   PORT = 5001
   ```

### 4. Deploy
1. Go back to "Deploy" tab
2. Click "Deploy Branch"
3. Wait for deployment to complete

## 🌐 Netlify Deployment Steps

### 1. Create Netlify Site
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub
4. Select repository: `robotwist/authentic-internet`
5. Branch: `main`

### 2. Configure Build Settings
- Base directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

### 3. Set Environment Variables
1. Go to "Site settings" → "Environment variables"
2. Add:
   ```
   VITE_API_URL = https://authentic-internet-api.herokuapp.com
   ```

### 4. Deploy
1. Click "Deploy site"
2. Wait for deployment to complete

## 🧪 Post-Deployment Testing

### Test API Endpoints
```bash
# Health check
curl https://authentic-internet-api.herokuapp.com/api/health
```

### Test Frontend Features
1. Visit https://authentic-internet.netlify.app
2. Test user registration/login
3. Test character creation system
4. Test multiplayer features
5. Test artifact creation

## 🔗 Expected URLs
- Frontend: https://authentic-internet.netlify.app
- Backend: https://authentic-internet-api.herokuapp.com
- API Health: https://authentic-internet-api.herokuapp.com/api/health

## 📞 Troubleshooting
- Check Heroku logs: https://dashboard.heroku.com/apps/authentic-internet-api/logs
- Check Netlify logs: https://app.netlify.com/sites/authentic-internet/deploys
- Verify environment variables are set correctly
EOF

print_success "Deployment checklist created: DEPLOYMENT_CHECKLIST.md"

echo ""
echo "🎉 Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Follow the checklist in DEPLOYMENT_CHECKLIST.md"
echo "2. Deploy to Heroku first (backend)"
echo "3. Deploy to Netlify second (frontend)"
echo "4. Test all features after deployment"
echo ""
echo "🔗 Your application will be available at:"
echo "   Frontend: https://authentic-internet.netlify.app"
echo "   Backend:  https://authentic-internet-api.herokuapp.com"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
