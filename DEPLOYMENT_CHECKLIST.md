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
