# Setting Up Insomnia for Authentic Internet API

This guide will help you set up Insomnia to test your Authentic Internet API.

## Setup Instructions

1. **Install Insomnia**
   - Download and install Insomnia from [https://insomnia.rest/download](https://insomnia.rest/download)

2. **Import the Configuration**
   - Launch Insomnia
   - Click on "Create" (if this is your first time using it)
   - Select "Import from File"
   - Choose the `authentic-internet-insomnia.json` file from this repository

3. **Select the Environment**
   - In the top-left corner, click on the environment dropdown
   - Choose "Production" to use the Heroku API
   - Or choose "Development" if you're running the API locally

## Testing Your API

### Health Check
- First, try the "Health Check" request to ensure your API is accessible
- You should receive a 200 OK response with a JSON body

### Authentication
- Start by creating a new user with the "Register" request
- Then log in with the "Login" request using your email as the "identifier"
- After a successful login, copy the JWT token from the response

### Setting the Token
- Click on the "Environment" dropdown in the top-left corner
- Choose "Manage Environments"
- Find the "Base Environment" and edit it
- Paste your JWT token into the "token" field:
  ```json
  {
    "base_url": "https://authentic-internet-api-9739ffaa9c5f.herokuapp.com",
    "token": "your-jwt-token-here"
  }
  ```
- Click "Done"

### Testing Authenticated Endpoints
- Now you can test endpoints that require authentication
- Try "Get Profile" to fetch your user profile
- Test creating artifacts, checking worlds, etc.

## Troubleshooting

If you encounter any issues:

1. **Check that your API is running**
   - Verify the health check endpoint returns a 200 response

2. **Verify your token**
   - Ensure you've correctly set the JWT token in the environment
   - The token might have expired, try logging in again

3. **CORS Issues**
   - If you're using Insomnia, CORS shouldn't be a problem

4. **Check your request body**
   - Ensure your JSON is properly formatted
   - For login, make sure you're using "identifier" (not "email") and "password" fields

## API Endpoints Included

- **Authentication:**
  - Register
  - Login

- **Users:**
  - Get Profile
  - Update Profile

- **Artifacts:**
  - Get All Artifacts
  - Get Artifact by ID
  - Create Artifact

- **Worlds:**
  - Get All Worlds

- **NPCs:**
  - Get All NPCs

Happy testing! 