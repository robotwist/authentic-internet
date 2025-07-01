# Authentic Internet

A digital world where users explore, create, and unlock hidden artifacts with authentic historical figures.

## Features

- **Interactive Game World**: Explore a tile-based world with NPCs, artifacts, and portals.
- **Historical NPCs**: Interact with authentic historical figures like Shakespeare, Ada Lovelace, and Lord Byron.
- **Artifact System**: Discover, create, and collect artifacts throughout the world.
- **Quote Collection**: Save authentic quotes from historical figures to your character profile.
- **User Authentication**: Secure login and registration system.

## Technology Stack

- **Frontend**: React, Vite, CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Deployment**: Heroku (backend), Netlify (frontend)

## Local Development

### Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB connection

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/robotwist/authentic-internet.git
   cd authentic-internet
   ```

2. Install dependencies:
   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Create `.env` files in both `server` and `client` directories based on the provided examples.

4. Start the development servers:
   ```
   # Start the server (from the server directory)
   npm start

   # Start the client (from the client directory)
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

### Running Development Servers

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

### Updated Application Scripts

We've created dedicated scripts to make running and managing the application easier:

1. **Starting the Application (Both Frontend and Backend)**:
   ```
   npm start
   # OR
   ./start-app.sh
   ```
   This script:
   - Kills any existing Node processes
   - Checks if ports 5001 (API) and 5173 (client) are available
   - Starts the backend server and waits for it to be ready
   - Starts the frontend development server
   - Provides real-time status updates

2. **Stopping the Application**:
   ```
   npm run stop
   # OR
   ./stop-app.sh
   ```
   This script cleanly terminates all application processes.

3. **Diagnosing Issues**:
   ```
   npm run diagnose
   # OR
   ./diagnose.sh
   ```
   This script checks for:
   - Required tools and their versions
   - Running processes that may conflict
   - Port availability
   - MongoDB connection
   - .env configuration
   - Available disk space

These scripts ensure a consistent development environment and help troubleshoot common issues.

## Testing

### Running API Tests

We've implemented a browser-based test suite to verify API functionality:

1. Start the development server:
   ```
   cd client
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173/run-tests.html
   ```
   (If you're using a different port, replace 5173 with your port number)

3. Click the "Run Artifact Tests" button to execute tests for artifact operations.

The API test suite includes:
- Basic update tests (JSON data)
- File attachment update tests (FormData)
- Proper authentication token handling

### Running End-to-End Game Tests

We've also implemented a comprehensive end-to-end test that simulates a player going through the entire game:

1. Navigate to the run-tests page as described above
2. Click the "Run Complete Game Test" button

The end-to-end game test covers:
- Character movement in all directions
- NPC interactions (finding NPCs, dialogue system)
- Inventory management
- Artifact collection and creation
- World map navigation
- Portal transitions between maps
- Level completion conditions for all levels
- Final challenge completion

This test helps ensure that all game mechanics are working correctly and that players can progress through the entire game experience.

### Troubleshooting Tests

If you encounter the error "Basic update test failed = error denied - no token provided":
- Make sure the test runner is properly setting the mock authentication token
- Check your browser console for more detailed error messages
- Verify that the API endpoints are correctly configured for authentication

For game test errors:
- Make sure all game assets (sprites, maps, sounds) are properly loaded
- Check the DOM structure matches what the tests are looking for (class names, element hierarchy)
- Review the specific test stage where the failure occurred for more details

## Deployment

### Automated Deployment

Run the deployment preparation script:
```
./deploy.sh
```

### Manual Deployment

#### Backend (Heroku)

1. Install Heroku CLI and login:
   ```
   npm install -g heroku
   heroku login
   ```

2. Create a new Heroku app:
   ```
   cd server
   heroku create authentic-internet-api
   ```

3. Set environment variables:
   ```
   heroku config:set MONGO_URI=your_mongo_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL=https://authentic-internet.netlify.app
   ```

4. Deploy the server:
   ```
   git subtree push --prefix server heroku main
   ```

#### Frontend (Netlify)

1. Install Netlify CLI and login:
   ```
   npm install -g netlify-cli
   netlify login
   ```

2. Build the client:
   ```
   cd client
   npm run build
   ```

3. Deploy to Netlify:
   ```
   netlify deploy --prod
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Folger Shakespeare Library API for authentic Shakespeare quotes
- Historical sources for Ada Lovelace and Lord Byron content 
## Project Structure

This project is organized with:
- Frontend code in the `/client` directory
- Backend code in the `/server` directory
- Comprehensive documentation in the `/docs` directory

Do not add server files to the root directory.

## 📚 Documentation

**Complete documentation is available in the [`/docs`](./docs/) folder**, maintained by Docsmith - The Documentation Alchemist 🧙‍♂️

### Quick Links:
- **[📖 Full Documentation Index](./docs/README.md)** - Start here for complete documentation
- **[🧩 Component Guide](./docs/component-docs.md)** - React components and architecture
- **[🌐 API Reference](./docs/api-endpoints.md)** - Complete REST API documentation  
- **[🎮 Gameplay Features](./docs/gameplay-features.md)** - Game mechanics and features
- **[📝 Recent Changes](./docs/changelog.md)** - Latest updates and improvements

### Docsmith Commands:
```bash
# Scan recent commits for documentation updates
node scripts/docsmith.js scan

# Update all documentation
node scripts/docsmith.js update

# Check if documentation is outdated  
node scripts/docsmith.js check
```

## Deployment Status

- GitHub: https://github.com/robotwist/authentic-internet
- Heroku API: https://authentic-internet-api-9739ffaa9c5f.herokuapp.com/
- Netlify Client: https://flourishing-starburst-8cf88b.netlify.app/

## Automatic Deployment Test

Last updated: 2023-07-21 14:00:00
