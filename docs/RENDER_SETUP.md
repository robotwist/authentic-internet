# Render Deployment Setup Guide

This guide will help you deploy the Authentic Internet backend to Render using the `render.yaml` configuration.

## Quick Start

### 1. Push render.yaml to GitHub
```bash
git add render.yaml
git commit -m "Add Render infrastructure configuration"
git push origin main
```

### 2. Create Service from Blueprint

#### Option A: New Service (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository: `robotwist/authentic-internet`
4. Render will detect `render.yaml` and show the configuration
5. Click "Apply" to create the service

#### Option B: Update Existing Service
If you already have a service running:
1. The existing service will continue working
2. You can manually update settings to match `render.yaml`
3. Or delete the old service and create new one from blueprint

### 3. Set Required Environment Variables

Go to your service → "Environment" → "Add Environment Variable"

**CRITICAL - Must Set These:**

```bash
# Generate secrets using:
# openssl rand -base64 32

JWT_SECRET=<generate-random-32-char-string>
SESSION_SECRET=<generate-random-32-char-string>
CSRF_SECRET=<generate-random-32-char-string>
MONGO_URI=<your-mongodb-atlas-connection-string>
```

**Optional - For Email Functionality:**
```bash
EMAIL_HOST=smtp.gmail.com  # or your email provider
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password
```

## MongoDB Setup (Required)

### Using MongoDB Atlas (Free Tier Available)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster
3. Create database user:
   - Database Access → Add New User
   - Username & Password (save these)
4. Whitelist Render IPs:
   - Network Access → Add IP Address
   - Add: `0.0.0.0/0` (allows from anywhere - Render IPs change)
5. Get connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/authentic-internet?retryWrites=true&w=majority`

## Generate Secure Secrets

Use these commands to generate secure random strings:

```bash
# On Mac/Linux/WSL:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or online tool:
# https://www.random.org/strings/
```

## Verify Deployment

1. **Check Service Status:**
   - Render Dashboard → Your Service → "Events" tab
   - Should show "Deploy succeeded"

2. **Test Health Endpoint:**
   ```bash
   curl https://authentic-internet.onrender.com/api/health
   ```
   Should return: `{"status":"OK","serverTime":"...","database":{"connected":true}}`

3. **Check Logs:**
   - Dashboard → "Logs" tab
   - Look for: "✅ MongoDB Connected Successfully"
   - Look for: "✅ Environment validation passed"

## Update Frontend to Use New Backend

Your frontend is already configured correctly in `.github/workflows/netlify-deploy.yml`:
```yaml
VITE_API_URL: 'https://authentic-internet.onrender.com'
```

## Troubleshooting

### Service Won't Start
- Check "Logs" tab for errors
- Verify all required env vars are set
- Check MongoDB connection string is correct

### Database Connection Failed
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user has read/write permissions
- Test connection string with MongoDB Compass

### CORS Errors
- Frontend URL must be in `ALLOWED_ORIGINS` env var
- Check `CLIENT_URL` is set correctly
- Verify CORS configuration in `server/utils/security.js`

### 500 Errors
- Check "Logs" tab for stack traces
- Verify all required env vars are set
- Check database connection is active

## Auto-Deploy

With `render.yaml`, your service will automatically:
- Deploy on every push to `main` branch
- Run health checks at `/api/health`
- Show deployment status in GitHub commits
- Notify you of deployment failures

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Verify character creation works
3. Check error logging endpoints
4. Test authentication flow
5. Monitor logs for any issues

## Useful Commands

```bash
# Check your service
curl https://authentic-internet.onrender.com/api/health

# View all endpoints
curl https://authentic-internet.onrender.com/api

# Test authentication
curl -X POST https://authentic-internet.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Project Issues: https://github.com/robotwist/authentic-internet/issues
