# API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Authentic Internet multiplayer game.

## Base URL

- **Development**: `http://localhost:5001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## User Management

### Register User

**POST** `/users/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, must contain uppercase, lowercase, number)"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "level": "number",
    "experience": "number"
  },
  "token": "jwt-token"
}
```

### Login User

**POST** `/users/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "level": "number",
    "experience": "number"
  },
  "token": "jwt-token"
}
```

### Get User Profile

**GET** `/users/me`

Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "level": "number",
  "experience": "number",
  "friends": ["array of friend IDs"],
  "inventory": ["array of artifact IDs"],
  "achievements": ["array of achievement objects"]
}
```

## Friend System

### Send Friend Request

**POST** `/users/friends/request`

Send a friend request to another user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "targetUserId": "string (24-char ObjectId)"
}
```

**Response:**
```json
{
  "message": "Friend request sent successfully",
  "targetUser": {
    "id": "string",
    "username": "string",
    "avatar": "string"
  }
}
```

### Accept Friend Request

**POST** `/users/friends/accept`

Accept a received friend request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fromUserId": "string (24-char ObjectId)"
}
```

**Response:**
```json
{
  "message": "Friend request accepted successfully",
  "newFriend": {
    "id": "string",
    "username": "string",
    "avatar": "string"
  }
}
```

### Decline Friend Request

**POST** `/users/friends/decline`

Decline a received friend request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fromUserId": "string (24-char ObjectId)"
}
```

**Response:**
```json
{
  "message": "Friend request declined successfully"
}
```

### Get Friends List

**GET** `/users/friends`

Get current user's friends list.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "friends": [
    {
      "id": "string",
      "username": "string",
      "avatar": "string",
      "level": "number",
      "lastActive": "date"
    }
  ],
  "friendCount": "number"
}
```

### Get Friend Requests

**GET** `/users/friends/requests`

Get pending friend requests.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "received": [
    {
      "userId": {
        "id": "string",
        "username": "string",
        "avatar": "string",
        "level": "number"
      },
      "receivedAt": "date",
      "status": "pending"
    }
  ],
  "sent": [
    {
      "userId": {
        "id": "string",
        "username": "string",
        "avatar": "string",
        "level": "number"
      },
      "sentAt": "date",
      "status": "pending"
    }
  ]
}
```

### Get Friend Status

**GET** `/users/friends/status/:userId`

Check friendship status with another user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "friends|requestSent|requestReceived|none",
  "request": {
    "sentAt": "date",
    "status": "pending|accepted|declined"
  },
  "otherUser": {
    "id": "string",
    "username": "string",
    "avatar": "string"
  }
}
```

### Remove Friend

**DELETE** `/users/friends/:friendId`

Remove a friend from your friends list.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Friend removed successfully"
}
```

## Artifact Management

### Create Artifact

**POST** `/artifacts`

Create a new artifact.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string (1-100 chars)",
  "description": "string (max 1000 chars)",
  "type": "game|writing|art|music",
  "content": "object (artifact-specific content)",
  "visibility": "public|private|unlisted",
  "tags": ["array of strings (max 50 chars each)"]
}
```

**Response:**
```json
{
  "message": "Artifact created successfully",
  "artifact": {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "creator": {
      "id": "string",
      "username": "string",
      "avatar": "string"
    },
    "createdAt": "date",
    "visibility": "string"
  }
}
```

### Get Artifact

**GET** `/artifacts/:id`

Get artifact details.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "content": "object",
  "creator": {
    "id": "string",
    "username": "string",
    "avatar": "string",
    "level": "number"
  },
  "createdAt": "date",
  "visibility": "string",
  "isShared": "boolean",
  "marketplace": {
    "isListed": "boolean",
    "price": "number",
    "category": "string",
    "tags": ["array"],
    "description": "string"
  },
  "stats": {
    "discoveryCount": "number",
    "shareCount": "number",
    "rating": "number",
    "ratingCount": "number"
  }
}
```

### Share Artifact

**POST** `/artifacts/:id/share`

Share an artifact publicly.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Artifact shared successfully",
  "artifact": {
    "id": "string",
    "name": "string",
    "isShared": "boolean",
    "sharedAt": "date"
  }
}
```

### Unshare Artifact

**POST** `/artifacts/:id/unshare`

Unshare a previously shared artifact.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Artifact unshared successfully",
  "artifact": {
    "id": "string",
    "name": "string",
    "isShared": "boolean"
  }
}
```

### List in Marketplace

**POST** `/artifacts/:id/marketplace`

List an artifact in the marketplace.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "price": "number (0-10000)",
  "category": "new|featured|trending|popular",
  "tags": ["array of strings"],
  "description": "string (max 500 chars)"
}
```

**Response:**
```json
{
  "message": "Artifact listed in marketplace successfully",
  "artifact": {
    "id": "string",
    "name": "string",
    "marketplace": {
      "isListed": "boolean",
      "price": "number",
      "category": "string",
      "tags": ["array"],
      "description": "string"
    }
  }
}
```

### Get Marketplace

**GET** `/artifacts/marketplace`

Get artifacts listed in the marketplace.

**Query Parameters:**
- `category`: Filter by category
- `tags`: Comma-separated tags to filter by
- `sort`: `newest|popular|trending|featured`
- `limit`: Number of results (default: 20)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "artifacts": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "creator": {
        "id": "string",
        "username": "string",
        "avatar": "string",
        "level": "number"
      },
      "marketplace": {
        "price": "number",
        "category": "string",
        "tags": ["array"],
        "description": "string",
        "listedAt": "date"
      },
      "stats": {
        "discoveryCount": "number",
        "shareCount": "number"
      }
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### Discover Artifact

**POST** `/artifacts/:id/discover`

Mark an artifact as discovered (increments discovery count).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Artifact discovered!",
  "discoveryCount": "number"
}
```

## World Management

### Get Public Worlds

**GET** `/worlds/`

Get list of public worlds.

**Response:**
```json
[
  {
    "worldId": "string",
    "name": "string",
    "description": "string",
    "creator": {
      "id": "string",
      "username": "string"
    },
    "activePlayers": "number",
    "maxPlayers": "number",
    "createdAt": "date"
  }
]
```

### Get World Instance

**GET** `/worlds/instance/:worldId`

Get details of a specific world instance.

**Response:**
```json
{
  "worldId": "string",
  "name": "string",
  "description": "string",
  "creator": {
    "id": "string",
    "username": "string"
  },
  "activePlayers": "number",
  "maxPlayers": "number",
  "settings": {
    "allowChat": "boolean",
    "allowInteractions": "boolean",
    "maxMessageLength": "number"
  },
  "stats": {
    "totalMessages": "number",
    "totalVisits": "number",
    "createdAt": "date"
  }
}
```

### Get World Chat History

**GET** `/worlds/instance/:worldId/chat`

Get chat history for a world.

**Query Parameters:**
- `limit`: Number of messages (default: 50)
- `before`: Get messages before this timestamp

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "type": "world|system",
      "senderId": "string",
      "senderName": "string",
      "senderAvatar": "string",
      "senderLevel": "number",
      "content": "string",
      "timestamp": "date",
      "reactions": [
        {
          "userId": "string",
          "username": "string",
          "emoji": "string"
        }
      ]
    }
  ]
}
```

### Get Online Players

**GET** `/worlds/instance/:worldId/players`

Get list of players currently in a world.

**Response:**
```json
{
  "players": [
    {
      "userId": "string",
      "username": "string",
      "avatar": "string",
      "level": "number",
      "position": {
        "x": "number",
        "y": "number",
        "z": "number"
      },
      "facing": "up|down|left|right",
      "joinedAt": "date"
    }
  ]
}
```

## WebSocket Events

### Connection

Connect to WebSocket with authentication:

```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client to Server Events

#### Join World
```javascript
socket.emit('world:join', {
  worldId: 'string',
  worldName: 'string',
  position: { x: 0, y: 0, z: 0 }
});
```

#### Leave World
```javascript
socket.emit('world:leave', {
  worldId: 'string'
});
```

#### Send Message
```javascript
socket.emit('world:message', {
  worldId: 'string',
  content: 'string'
});
```

#### Update Position
```javascript
socket.emit('world:update-position', {
  worldId: 'string',
  position: { x: 0, y: 0, z: 0 },
  facing: 'up|down|left|right'
});
```

#### Player Interaction
```javascript
socket.emit('world:player-interaction', {
  worldId: 'string',
  targetUserId: 'string',
  interactionType: 'greet|trade|challenge'
});
```

#### React to Message
```javascript
socket.emit('world:react', {
  messageId: 'string',
  emoji: 'string'
});
```

### Server to Client Events

#### World Joined
```javascript
socket.on('world:joined', (data) => {
  // data: { worldId, players, messages }
});
```

#### User Joined
```javascript
socket.on('world:user-joined', (data) => {
  // data: { userId, username, avatar, position }
});
```

#### User Left
```javascript
socket.on('world:user-left', (data) => {
  // data: { userId, username }
});
```

#### Message Received
```javascript
socket.on('world:message', (data) => {
  // data: { messageId, senderId, senderName, content, timestamp }
});
```

#### Player Moved
```javascript
socket.on('world:player-moved', (data) => {
  // data: { userId, position, facing }
});
```

#### Players Updated
```javascript
socket.on('world:players-updated', (data) => {
  // data: { players: [...] }
});
```

#### Player Interaction
```javascript
socket.on('world:player-interaction', (data) => {
  // data: { fromUserId, fromUsername, interactionType }
});
```

#### Message Reaction
```javascript
socket.on('world:reaction', (data) => {
  // data: { messageId, userId, username, emoji }
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **WebSocket**: No rate limiting (handled by connection limits)

## Versioning

API versioning is handled through URL prefixes. Current version is v1 (default).

- Current: `/api/endpoint`
- Future: `/api/v2/endpoint`

## Support

For API support or questions, please contact the development team or refer to the project documentation.
