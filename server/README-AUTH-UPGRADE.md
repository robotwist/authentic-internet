# Authentication System Upgrade Guide

This guide provides step-by-step instructions for implementing the enhanced authentication system for the Authentic Internet project.

## 📋 Overview

The authentication system upgrade addresses several issues:
- Inconsistent login/logout behavior
- Missing game state persistence
- Token refresh issues
- User experience problems during authentication

## 🔍 Key Components

1. **User Model Enhancement**: Extended game state storage and token management
2. **Auth Routes Consolidation**: Unified endpoints for all auth operations
3. **Auth Controller Improvement**: Better token handling and error management
4. **Middleware Enhancement**: Improved token validation and user verification
5. **Client Auth Context**: More reliable token refresh and auth state management
6. **Game State Persistence**: Support for saving text adventure progress

## ⚠️ Prerequisites

Before implementing the upgrade, ensure you have:

1. **Environment Variables**:
   - `JWT_SECRET`: Secret key for JWT signing
   - `JWT_EXPIRES_IN`: Token expiration time (e.g., "24h")
   - `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration (e.g., "7d")
   - `SALT_ROUNDS`: Number of bcrypt rounds for password hashing

2. **Database Backup**:
   - Create a backup of your MongoDB database
   - Run `mongodump --uri="YOUR_MONGODB_URI" --out=./backups/$(date +%Y-%m-%d)`

## 🚀 Implementation Steps

Follow these steps in order to minimize disruption during the upgrade:

### 1. Update User Model

Update `models/User.js` with:
- Enhanced gameState schema
- refreshTokens array for token management
- New saveGameProgress method for game state persistence

### 2. Update Auth Middleware

Update `middleware/auth.js` with:
- Improved token validation
- User status checking
- Role-based access control
- Activity tracking

### 3. Update Auth Controller

Update `controllers/authController.js` with:
- Token generation and refresh functions
- Game state management functions
- Enhanced login and registration

### 4. Update Auth Routes

Consolidate and update routes in `routes/auth.js` with:
- Validation middleware
- Game state endpoints
- Token verification and refresh endpoints

### 5. Update Client API Functions

Update `client/src/api/api.js` to align with the new server endpoints:
- New registerUser function
- Updated loginUser function
- New refreshUserToken function
- New game state functions

### 6. Update Client Auth Context

Update `client/src/context/AuthContext.jsx` with:
- Token refresh logic
- Improved auth state management
- Better error handling

### 7. Update Text Adventure Component

Update `client/src/components/TextAdventure.jsx` to:
- Load game progress on mount
- Save game progress when state changes
- Save progress on unmount

### 8. Run Tests

Execute the test script to verify the authentication system:
```bash
node server/scripts/test-auth.js
```

Run the consistency check script:
```bash
node server/scripts/check-auth-consistency.js
```

## 🔎 Troubleshooting

If you encounter issues during the upgrade:

1. **Login Issues**:
   - Check browser console for token-related errors
   - Verify JWT_SECRET is consistently used
   - Check for token expiration issues

2. **Game State Issues**:
   - Verify saveGameProgress is called with correct data format
   - Check server logs for validation errors
   - Confirm user document structure in MongoDB

3. **Client-Side Issues**:
   - Clear localStorage and try again
   - Check network requests for 401/403 errors
   - Verify API endpoints match updated route paths

## 📑 Verification

After implementing the upgrade, verify:

1. Users can register successfully
2. Login works with both username and email
3. Token refresh happens automatically
4. Game state is saved and loaded correctly
5. Logout invalidates tokens properly

## 🧪 Testing in Development

Before deploying to production:

1. Test with multiple browsers and sessions
2. Verify token refresh works after long periods
3. Check game state persistence across sessions
4. Test error scenarios (invalid credentials, etc.)
5. Test with slow network conditions

## 📈 Monitoring After Deployment

Monitor these aspects after deployment:

1. Server logs for authentication errors
2. Database performance with new token storage
3. Client-side errors related to authentication
4. User feedback on login experience

---

For any questions or issues, contact the development team. 