# Artifact API Implementation

This document explains the setup and usage of the artifact API for the Authentic Internet project, including test implementations.

## Overview

The artifact API provides functionality for creating, retrieving, updating, and deleting artifacts in the game. The API includes special test modes that allow for reliable testing without affecting the database.

## API Endpoints

### Artifact Management

- `GET /api/artifacts` - Fetches all artifacts
- `GET /api/artifacts/:id` - Fetches a single artifact by ID
- `POST /api/artifacts` - Creates a new artifact
- `PUT /api/artifacts/:id` - Updates an artifact
- `DELETE /api/artifacts/:id` - Deletes an artifact

### Special Test Mode

For testing purposes, all endpoints support a special test mode that simulates CRUD operations without affecting the database:

1. Add `?testMode=true` query parameter to the URL
2. Add `X-Test-Mode: true` header to the request
3. For authenticated endpoints, add `X-Test-Auth: true` header

Example test mode request:
```javascript
const response = await fetch('http://localhost:5000/api/artifacts/test-123?testMode=true', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Mode': 'true',
    'X-Test-Auth': 'true'
  },
  body: JSON.stringify({
    name: 'Test Artifact',
    description: 'Test description'
  })
});
```

## Client-Side Usage

```javascript
// Import the API functions
import { 
  fetchArtifacts,
  createArtifact,
  updateArtifact,
  deleteArtifact
} from '../api/api';

// Example usage
async function fetchAllArtifacts() {
  try {
    const artifacts = await fetchArtifacts();
    console.log(artifacts);
  } catch (error) {
    console.error('Failed to fetch artifacts:', error);
  }
}

async function createNewArtifact(artifactData) {
  try {
    const result = await createArtifact(artifactData);
    console.log('Created artifact:', result);
  } catch (error) {
    console.error('Failed to create artifact:', error);
  }
}

async function updateExistingArtifact(id, artifactData) {
  try {
    const result = await updateArtifact(id, artifactData);
    console.log('Updated artifact:', result);
  } catch (error) {
    console.error('Failed to update artifact:', error);
  }
}

async function deleteExistingArtifact(id) {
  try {
    const result = await deleteArtifact(id);
    console.log('Deleted artifact:', result);
  } catch (error) {
    console.error('Failed to delete artifact:', error);
  }
}
```

## Implementation Details

The artifact API implementation includes:

1. **Server-side endpoints** with robust error handling
2. **Authentication** using JWT tokens
3. **Special test mode** for automated testing that bypasses database operations
4. **File upload support** for artifact attachments and icons
5. **Validation** of required fields and file types

## Testing

To test the artifact API functionality, run:

```bash
node test-artifacts.js
```

This script tests:
1. Server connection
2. Basic artifact update (with test mode)
3. Direct fetch update (using the Fetch API)
4. Artifact creation (with test authentication)

The test script uses the special test mode headers to simulate CRUD operations without affecting the database.

## Authentication for Tests

For testing authenticated endpoints, the server includes a special middleware that recognizes the `X-Test-Auth: true` header and provides a mock user object:

```javascript
{
  userId: 'test-user-12345',
  username: 'testuser',
  role: 'user'
}
```

This allows for comprehensive testing of all API functionality without requiring actual user authentication. 