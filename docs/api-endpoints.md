# API Endpoints Documentation

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://authentic-internet-api-9739ffaa9c5f.herokuapp.com/api`

## Authentication
Most endpoints require JWT token authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## System Endpoints

### Health Check
```http
GET /api/health
```
Returns server status and timestamp.

**Response:**
```json
{
  "status": "OK",
  "serverTime": "2023-06-12T14:35:42.123Z"
}
```

### API Overview
```http
GET /api
```
Lists all available endpoints.

### WebSocket Test
```http
GET /api/socket-test
```
Validates WebSocket server status.

## Authentication Endpoints (`/api/auth`)

### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "status": 201,
  "timestamp": "2023-06-12T14:35:42.123Z",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id_here",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "status": 200,
  "timestamp": "2023-06-12T14:35:42.123Z",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id_here",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

### Password Reset
```http
POST /api/auth/reset-password
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

### Email Verification
```http
POST /api/auth/verify-email
```

**Body:**
```json
{
  "token": "verification_token"
}
```

## User Management (`/api/users`)

### Get User Profile
```http
GET /api/users/profile
```
**Authentication Required**

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2023-06-12T14:35:42.123Z",
  "profile": {
    "avatar": "avatar_url",
    "experience": 1250,
    "level": 5,
    "achievements": ["first_artifact", "explorer"]
  }
}
```

### Update User Profile
```http
PUT /api/users/profile
```
**Authentication Required**

**Body:**
```json
{
  "name": "Updated Name",
  "avatar": "new_avatar_url"
}
```

### Get User Progress
```http
GET /api/users/progress
```
**Authentication Required**

### Update User Experience
```http
POST /api/users/experience
```
**Authentication Required**

**Body:**
```json
{
  "experience": 100,
  "action": "artifact_found"
}
```

## Artifact Management (`/api/artifacts`)

### Get All Artifacts
```http
GET /api/artifacts
```

**Query Parameters:**
- `testMode=true` - Enable test mode (bypass database)
- `page=1` - Pagination
- `limit=20` - Items per page

**Response:**
```json
[
  {
    "_id": "artifact_id",
    "name": "Ancient Scroll",
    "description": "A mystical scroll containing ancient wisdom",
    "content": "The scroll reveals secrets of the past...",
    "location": {
      "x": 10,
      "y": 15,
      "mapName": "Overworld"
    },
    "exp": 25,
    "visible": true,
    "area": "Overworld",
    "type": "scroll",
    "createdBy": "user_id",
    "createdAt": "2023-06-12T14:35:42.123Z"
  }
]
```

### Get Artifact by ID
```http
GET /api/artifacts/:id
```

### Create Artifact
```http
POST /api/artifacts
```
**Authentication Required**

**Body:**
```json
{
  "name": "My Artifact",
  "description": "An artifact I created",
  "content": "This artifact contains...",
  "type": "container",
  "location": {
    "x": 5,
    "y": 8,
    "mapName": "Overworld"
  }
}
```

### Update Artifact
```http
PUT /api/artifacts/:id
```
**Authentication Required**

### Delete Artifact
```http
DELETE /api/artifacts/:id
```
**Authentication Required**

### Interact with Artifact
```http
POST /api/artifacts/:id/interact
```
**Authentication Required**

## World Management (`/api/worlds`)

### Get All Worlds
```http
GET /api/worlds
```

**Response:**
```json
[
  {
    "_id": "world_id",
    "name": "Overworld",
    "description": "The main game world",
    "mapData": [[0,1,0], [1,0,1], [0,1,0]],
    "npcs": [],
    "artifacts": [],
    "portals": [],
    "createdAt": "2023-06-12T14:35:42.123Z"
  }
]
```

### Get World by ID
```http
GET /api/worlds/:id
```

### Create World
```http
POST /api/worlds
```
**Authentication Required**

### Update World
```http
PUT /api/worlds/:id
```
**Authentication Required**

## NPC Management (`/api/npcs`)

### Get All NPCs
```http
GET /api/npcs
```

### Get NPCs List
```http
GET /api/npcs/list
```

**Response:**
```json
[
  {
    "_id": "npc_id",
    "name": "Zeus",
    "type": "zeus",
    "dialogue": [
      "Greetings, mortal!",
      "I am the king of the gods!"
    ],
    "position": {
      "x": 192,
      "y": 192
    },
    "sprite": "/assets/npcs/zeus.png"
  }
]
```

### Get NPC by ID
```http
GET /api/npcs/:id
```

### Create NPC
```http
POST /api/npcs
```
**Authentication Required**

## Message System (`/api/messages`)

### Get Messages
```http
GET /api/messages
```
**Authentication Required**

### Send Message
```http
POST /api/messages
```
**Authentication Required**

**Body:**
```json
{
  "recipient": "user_id",
  "content": "Hello there!",
  "type": "direct"
}
```

### Get Conversation
```http
GET /api/messages/conversation/:userId
```
**Authentication Required**

## Progress Tracking (`/api/progress`)

### Get User Progress
```http
GET /api/progress
```
**Authentication Required**

### Update Progress
```http
POST /api/progress
```
**Authentication Required**

**Body:**
```json
{
  "level": 3,
  "action": "level_complete",
  "data": {
    "score": 1500,
    "time": 120
  }
}
```

### Get Leaderboard
```http
GET /api/progress/leaderboard
```

## Feedback System (`/api/feedback`)

### Submit Feedback
```http
POST /api/feedback
```

**Body:**
```json
{
  "type": "bug_report",
  "subject": "Issue with artifact placement",
  "message": "When I try to place an artifact...",
  "email": "user@example.com"
}
```

### Get Feedback (Admin)
```http
GET /api/feedback
```
**Authentication Required (Admin)**

## External API Proxy (`/api/proxy`)

### Shakespeare Quotes
```http
GET /api/proxy/shakespeare
```

### Zen Quotes
```http
GET /api/proxy/zen
```

### Daily Quote
```http
GET /api/proxy/quote
```

## Test Mode

Many endpoints support test mode for automated testing:

**Headers:**
```
X-Test-Mode: true
X-Test-Auth: true
```

**Query Parameter:**
```
?testMode=true
```

This bypasses database operations and returns mock data.

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "status": 400,
    "code": "validation_error",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2023-06-12T14:35:42.123Z",
    "path": "/api/auth/register",
    "method": "POST"
  }
}
```

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Upload**: 10 file uploads per hour per user

## WebSocket Events

The API also supports real-time communication via WebSocket:

**Connection:** `ws://localhost:5000` or `wss://your-domain.com`

**Events:**
- `artifact_created` - New artifact added
- `user_online` - User connected
- `level_completed` - User completed level
- `achievement_unlocked` - User earned achievement

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `/api-docs`
- **JSON Spec**: `/api-docs.json`