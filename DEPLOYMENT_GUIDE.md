# 🚀 Authentic Internet - Production Deployment Guide

This guide will help you deploy the Authentic Internet application to production using Netlify (frontend) and Heroku (backend).

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Node.js v20+ installed
- [ ] Git repository with all changes committed
- [ ] MongoDB Atlas account (for database)
- [ ] Netlify account (for frontend)
- [ ] Heroku account (for backend)

## 🔧 Environment Setup

### 1. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://mongodb.com)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

### 2. Environment Variables

You'll need to set these environment variables in Heroku:

```bash
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/authentic-internet
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=https://authentic-internet.netlify.app
NODE_ENV=production
PORT=5001
```

## 🎯 Deployment Options

### Option 1: Automated Deployment (Recommended)

Use our deployment script:

```bash
# Make the script executable (if not already)
chmod +x deploy-production.sh

# Run the deployment script
./deploy-production.sh
```

The script will:
- ✅ Check all requirements
- ✅ Build the client application
- ✅ Test the server locally
- ✅ Guide you through Heroku and Netlify deployment

### Option 2: Manual Deployment

#### Step 1: Deploy Backend to Heroku

1. **Install Heroku CLI** (if not already installed):
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**:
   ```bash
   heroku create authentic-internet-api
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set MONGO_URI="your-mongodb-connection-string"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set CLIENT_URL="https://authentic-internet.netlify.app"
   heroku config:set NODE_ENV="production"
   ```

4. **Deploy to Heroku**:
   ```bash
   git push heroku main
   ```

5. **Verify Deployment**:
   ```bash
   heroku open
   # Should show your API health endpoint
   ```

#### Step 2: Deploy Frontend to Netlify

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Build the Client**:
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```

3. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod --dir=client/dist
   ```

4. **Configure Site Settings**:
   - Go to your Netlify dashboard
   - Set the site name to `authentic-internet`
   - Configure custom domain if needed

## 🔗 Deployment URLs

After successful deployment, your application will be available at:

- **Frontend**: https://authentic-internet.netlify.app
- **Backend API**: https://authentic-internet-api.herokuapp.com
- **API Health Check**: https://authentic-internet-api.herokuapp.com/api/health

## 🧪 Post-Deployment Testing

### 1. Test API Endpoints

```bash
# Health check
curl https://authentic-internet-api.herokuapp.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend Features

1. **User Registration/Login**:
   - Visit https://authentic-internet.netlify.app
   - Try registering a new account
   - Test login functionality

2. **Character System**:
   - After login, test the character creation system
   - Try importing a Piskel file
   - Test character selection

3. **Game Features**:
   - Test artifact creation
   - Test multiplayer chat
   - Test world navigation

### 3. Test Mobile Responsiveness

- Test the application on different screen sizes
- Verify all features work on mobile devices

## 🔧 Troubleshooting

### Common Issues

#### 1. Heroku Deployment Fails

**Error**: `Module not found` or `Cannot find package`
**Solution**: Ensure all dependencies are in `package.json` and run:
```bash
heroku run npm install
```

#### 2. CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
**Solution**: Check that `CLIENT_URL` is set correctly in Heroku:
```bash
heroku config:set CLIENT_URL="https://authentic-internet.netlify.app"
```

#### 3. MongoDB Connection Issues

**Error**: `MongoNetworkError: connect ECONNREFUSED`
**Solution**: 
- Verify your MongoDB Atlas connection string
- Ensure your IP is whitelisted in MongoDB Atlas
- Check that the database user has correct permissions

#### 4. Netlify Build Fails

**Error**: Build fails during deployment
**Solution**: 
- Check the build logs in Netlify dashboard
- Ensure all dependencies are properly installed
- Verify the build command in `netlify.toml`

### Debug Commands

```bash
# Check Heroku logs
heroku logs --tail

# Check Heroku config
heroku config

# Restart Heroku app
heroku restart

# Check Netlify build status
netlify status
```

## 📊 Monitoring

### Heroku Monitoring

- **Logs**: `heroku logs --tail`
- **Metrics**: Available in Heroku dashboard
- **Add-ons**: Consider adding monitoring add-ons like New Relic

### Netlify Monitoring

- **Build Logs**: Available in Netlify dashboard
- **Analytics**: Enable in site settings
- **Forms**: Monitor form submissions

## 🔄 Continuous Deployment

### GitHub Integration

Both Netlify and Heroku can be configured for automatic deployment:

1. **Netlify**: Connect your GitHub repository in the Netlify dashboard
2. **Heroku**: Enable GitHub integration in the Heroku dashboard

### Environment Variables Management

For production, consider using:
- **Heroku**: Environment variables in dashboard
- **Netlify**: Environment variables in site settings

## 🎉 Success!

Once deployed, your Authentic Internet application will be live with:

- ✅ **Character Creation System**: Users can create and import pixel characters
- ✅ **Multiplayer Features**: Real-time chat and interaction
- ✅ **Security**: Input validation, XSS protection, rate limiting
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Testing**: Comprehensive test suite
- ✅ **Monitoring**: Health checks and logging

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `heroku logs --tail`
3. Verify environment variables are set correctly
4. Test locally first: `npm run dev` in both client and server directories

---

**Happy Deploying! 🚀**
