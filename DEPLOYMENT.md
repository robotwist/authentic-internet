# Deployment Guide for Authentic Internet

This guide outlines the steps needed to deploy the Authentic Internet application to production.

## Prerequisites

- Node.js (v14+)
- MongoDB Atlas account
- Netlify account (for frontend)
- Render account (for backend)

## Environment Configuration

### Client Environment Variables

The following environment variables are set in the client deployment:

```
VITE_API_URL=https://authentic-internet-api.onrender.com
VITE_WEATHER_API_KEY=a5913e247d4c4ed5bd721932251402
# No API key needed for Quotable, Folger Shakespeare, or ZenQuotes
```

### Server Environment Variables

The following environment variables are set in the server deployment:

```
MONGO_URI=mongodb+srv://your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
PORT=5001
NODE_ENV=production
CLIENT_URL=https://authentic-internet.netlify.app
```

## Deployment Steps (General Assembly Requirements)

### Frontend Deployment to Netlify

1. **Prepare your local repository**
   - Run `npm run build` in the `/client` directory to verify the build works locally
   - Create a `_redirects` file in the `/client/public` directory with:
     ```
     /*    /index.html   200
     ```

2. **Deploy to Netlify**
   - Log in to your Netlify account
   - Click "New site from Git"
   - Select your GitHub repository
   - Configure the build settings:
     - Base directory: `client`
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables in the "Advanced build settings" section
   - Click "Deploy site"

3. **Configure Custom Domain (Optional)**
   - In the Netlify dashboard, go to "Domain settings"
   - Click "Add custom domain" and follow the instructions

### Backend Deployment to Render

1. **Prepare your repository**
   - Ensure your `Procfile` contains: `web: node server.mjs`
   - Verify your server is using environment variables for configuration

2. **Deploy to Render**
   - Log in to your Render account
   - Click "New" and select "Web Service"
   - Connect to your GitHub repository
   - Configure the deployment settings:
     - Name: `authentic-internet-api`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.mjs`
     - Root Directory: `server` (if your repository has a separate server folder)
   - Add environment variables from your `.env.production` file
   - Click "Create Web Service"

3. **Test the Backend**
   - Visit `https://authentic-internet-api.onrender.com/health` to verify the backend is running
   - You should see a JSON response with a status of "ok"

## Post-Deployment Verification

1. **Test User Authentication**
   - Try registering a new user account
   - Try logging in with existing credentials

2. **Test Artifact Creation and Management**
   - Create an artifact with different quote types
   - Verify artifacts appear on the map
   - Edit and delete artifacts

3. **Test Quote API Integration**
   - Verify Shakespeare quotes appear correctly
   - Verify Zen quotes and daily quotes work

4. **Mobile Responsiveness**
   - Test the application on different device sizes
   - Verify all features work on mobile devices

## Troubleshooting Common Issues

### CORS Errors
- Check that your server's CORS configuration includes `https://authentic-internet.netlify.app`
- Verify the `CLIENT_URL` environment variable is set correctly on the server

### API Connection Fails
- Check the browser console for specific error messages
- Verify the `VITE_API_URL` is set correctly in your frontend

### Authentication Issues
- Clear browser cookies and local storage
- Try re-logging in
- Check the JWT token expiration configuration

### Artifact Creation Fails
- Check the browser console for validation errors
- Verify all required fields are being sent to the server

## How to Submit to General Assembly

1. **Share links to your deployed application:**
   - Frontend: `https://authentic-internet.netlify.app`
   - Backend: `https://authentic-internet-api.onrender.com`

2. **Share your GitHub repository link**

3. **Provide installation instructions for local development:**
   ```
   # Clone the repository
   git clone https://github.com/your-username/authentic-internet.git
   cd authentic-internet

   # Install backend dependencies and start server
   cd server
   npm install
   npm start

   # In another terminal, install frontend dependencies and start client
   cd client
   npm install
   npm run dev
   ```

4. **Document any known issues or limitations** 