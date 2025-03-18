# Authentic Internet Deployment Guide

This guide will help you deploy the Authentic Internet application to:
- Backend: Heroku
- Frontend: Netlify

## Prerequisites

- Git installed and configured
- Node.js and npm installed
- Heroku CLI installed and logged in
- Netlify CLI installed and logged in
- MongoDB Atlas account (for database)

## Automatic Deployment

We've created a deployment script to automate most of the process:

```bash
./deploy.sh
```

This script will:
1. Deploy the backend to Heroku
2. Deploy the frontend to Netlify
3. Set up the necessary environment variables

## Manual Deployment Steps

If you prefer to deploy manually or encounter issues with the script, follow these steps:

### Backend Deployment (Heroku)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Make sure you're logged into Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku app (if it doesn't exist):
   ```bash
   heroku create authentic-internet-api
   ```

4. Set environment variables:
   ```bash
   heroku config:set MONGO_URI="your_mongo_connection_string"
   heroku config:set JWT_SECRET="your_jwt_secret"
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL="https://authentic-internet.netlify.app"
   ```

5. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

6. Verify deployment:
   ```bash
   heroku open
   ```

### Frontend Deployment (Netlify)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Create/update the `.env.production` file with these settings:
   ```
   VITE_API_URL=https://authentic-internet-api.herokuapp.com
   VITE_WEATHER_API_KEY=a5913e247d4c4ed5bd721932251402
   VITE_QUOTES_API_KEY=free-tier
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

5. Configure domain (if needed) in the Netlify dashboard.

## Troubleshooting

### Heroku Issues
- **App crashing on startup**: Check logs with `heroku logs --tail`
- **Database connection errors**: Verify your MongoDB URI is correct and the IP whitelist includes Heroku's IPs
- **Environment variables**: Check with `heroku config` to ensure all are set correctly

### Netlify Issues
- **Build errors**: Check your build logs in the Netlify dashboard
- **API connection issues**: Ensure your `VITE_API_URL` points to the correct Heroku app URL
- **CORS errors**: Verify the `CLIENT_URL` on your Heroku app matches your Netlify domain

## Maintenance

To update the application:

1. Make changes to your code
2. Commit changes: `git add . && git commit -m "Your update message"`
3. Deploy backend: `git push heroku main` (from server directory)
4. Deploy frontend: Run `npm run build && netlify deploy --prod` (from client directory)

Alternatively, just run `./deploy.sh` again after committing your changes.

## Monitoring

- Heroku metrics: Visit the Heroku dashboard
- Netlify analytics: Available in the Netlify dashboard
- MongoDB metrics: Check MongoDB Atlas dashboard

## Support

If you encounter any issues, please refer to:
- Heroku documentation: https://devcenter.heroku.com/
- Netlify documentation: https://docs.netlify.com/
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com/ 