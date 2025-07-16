/**
 * Backend Schema Enforcement Tests for Unified Artifact Model
 * 
 * This test suite verifies that the backend properly enforces
 * the unified artifact model schema and validation rules.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server/app.js';
import Artifact from '../server/models/Artifact.js';
import User from '../server/models/User.js';

let mongoServer;
let testUser;
let authToken;

// Sample valid unified artifact data
const validUnifiedArtifact = {
  id: 'test-artifact-001',
  name: 'Test Artifact',
  description: 'A test artifact for validation',
  type: 'WEAPON',
  content: 'This is test content for the artifact',
  media: ['/uploads/test-image.png'],
  location: { x: 5, y: 10, mapName: 'overworld' },
  exp: 25,
  visible: true,
  area: 'overworld',
  tags: ['test', 'weapon', 'validation'],
  rating: 4.5,
  reviews: [
    { userId: 'user-001', rating: 5, comment: 'Great artifact!', createdAt: new Date() }
  ],
  createdBy: 'test-user-123',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Backend Schema Enforcement - Unified Artifact Model', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      emailVerified: true
    });
    await testUser.save();

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear artifacts before each test
    await Artifact.deleteMany({});
  });

  describe('Artifact Model Schema Validation', () => {
    test('should create artifact with valid unified data', async () => {
      const artifact = new Artifact(validUnifiedArtifact);
      const savedArtifact = await artifact.save();
      
      expect(savedArtifact.id).toBe(validUnifiedArtifact.id);
      expect(savedArtifact.name).toBe(validUnifiedArtifact.name);
      expect(savedArtifact.type).toBe(validUnifiedArtifact.type);
      expect(savedArtifact.location.x).toBe(validUnifiedArtifact.location.x);
      expect(savedArtifact.location.y).toBe(validUnifiedArtifact.location.y);
      expect(savedArtifact.media).toEqual(validUnifiedArtifact.media);
      expect(savedArtifact.tags).toEqual(validUnifiedArtifact.tags);
    });

    test('should reject artifact without required fields', async () => {
      const invalidArtifact = { ...validUnifiedArtifact };
      delete invalidArtifact.name;
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with invalid type', async () => {
      const invalidArtifact = { ...validUnifiedArtifact, type: 'INVALID_TYPE' };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with invalid area', async () => {
      const invalidArtifact = { ...validUnifiedArtifact, area: 'INVALID_AREA' };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with negative coordinates', async () => {
      const invalidArtifact = { 
        ...validUnifiedArtifact, 
        location: { x: -1, y: 5, mapName: 'overworld' }
      };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with too many media files', async () => {
      const invalidArtifact = { 
        ...validUnifiedArtifact, 
        media: Array(11).fill('/uploads/test.png')
      };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with too many tags', async () => {
      const invalidArtifact = { 
        ...validUnifiedArtifact, 
        tags: Array(21).fill('tag')
      };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with invalid experience points', async () => {
      const invalidArtifact = { ...validUnifiedArtifact, exp: 1001 };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with invalid rating', async () => {
      const invalidArtifact = { ...validUnifiedArtifact, rating: 6 };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });

    test('should reject artifact with invalid review rating', async () => {
      const invalidArtifact = { 
        ...validUnifiedArtifact, 
        reviews: [{ userId: 'user-001', rating: 6, comment: 'Test' }]
      };
      
      const artifact = new Artifact(invalidArtifact);
      await expect(artifact.save()).rejects.toThrow();
    });
  });

  describe('API Route Validation', () => {
    test('should create artifact via API with valid data', async () => {
      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUnifiedArtifact);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.artifact.name).toBe(validUnifiedArtifact.name);
      expect(response.body.artifact.type).toBe(validUnifiedArtifact.type);
    });

    test('should reject API request without required fields', async () => {
      const invalidData = { ...validUnifiedArtifact };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Name is required');
    });

    test('should reject API request with invalid type', async () => {
      const invalidData = { ...validUnifiedArtifact, type: 'INVALID_TYPE' };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid artifact type');
    });

    test('should reject API request with invalid location', async () => {
      const invalidData = { 
        ...validUnifiedArtifact, 
        location: { x: -1, y: 5, mapName: 'overworld' }
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Location X coordinate must be a non-negative number');
    });

    test('should reject API request with too long name', async () => {
      const invalidData = { 
        ...validUnifiedArtifact, 
        name: 'a'.repeat(101)
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Name cannot exceed 100 characters');
    });

    test('should reject API request with too long description', async () => {
      const invalidData = { 
        ...validUnifiedArtifact, 
        description: 'a'.repeat(501)
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Description cannot exceed 500 characters');
    });

    test('should reject API request with too long content', async () => {
      const invalidData = { 
        ...validUnifiedArtifact, 
        content: 'a'.repeat(5001)
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Content cannot exceed 5000 characters');
    });
  });

  describe('Legacy Data Conversion', () => {
    test('should convert legacy x/y coordinates to location object', async () => {
      const legacyData = {
        ...validUnifiedArtifact,
        x: 10,
        y: 15,
        location: undefined
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(legacyData);

      expect(response.status).toBe(201);
      expect(response.body.artifact.location.x).toBe(10);
      expect(response.body.artifact.location.y).toBe(15);
      expect(response.body.artifact.location.mapName).toBe('overworld');
    });

    test('should convert legacy creator field to createdBy', async () => {
      const legacyData = {
        ...validUnifiedArtifact,
        creator: 'legacy-creator-123',
        createdBy: undefined
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(legacyData);

      expect(response.status).toBe(201);
      expect(response.body.artifact.createdBy).toBe('legacy-creator-123');
    });

    test('should set default type if not provided', async () => {
      const legacyData = {
        ...validUnifiedArtifact,
        type: undefined
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(legacyData);

      expect(response.status).toBe(201);
      expect(response.body.artifact.type).toBe('artifact');
    });

    test('should set default experience if not provided', async () => {
      const legacyData = {
        ...validUnifiedArtifact,
        exp: undefined
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(legacyData);

      expect(response.status).toBe(201);
      expect(response.body.artifact.exp).toBe(10);
    });
  });

  describe('Unified Response Format', () => {
    test('should return artifacts in unified format', async () => {
      // Create a test artifact
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const response = await request(app)
        .get('/api/artifacts')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.artifacts).toHaveLength(1);
      
      const returnedArtifact = response.body.artifacts[0];
      expect(returnedArtifact.id).toBe(validUnifiedArtifact.id);
      expect(returnedArtifact.name).toBe(validUnifiedArtifact.name);
      expect(returnedArtifact.type).toBe(validUnifiedArtifact.type);
      expect(returnedArtifact.media).toEqual(validUnifiedArtifact.media);
      expect(returnedArtifact.tags).toEqual(validUnifiedArtifact.tags);
      expect(returnedArtifact.location).toEqual(validUnifiedArtifact.location);
    });

    test('should return single artifact in unified format', async () => {
      // Create a test artifact
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const response = await request(app)
        .get(`/api/artifacts/${artifact.id}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const returnedArtifact = response.body.artifact;
      expect(returnedArtifact.id).toBe(validUnifiedArtifact.id);
      expect(returnedArtifact.name).toBe(validUnifiedArtifact.name);
      expect(returnedArtifact.type).toBe(validUnifiedArtifact.type);
    });
  });

  describe('Update Validation', () => {
    test('should update artifact with valid data', async () => {
      // Create a test artifact
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const updateData = {
        name: 'Updated Artifact Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/artifacts/${artifact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.artifact.name).toBe('Updated Artifact Name');
      expect(response.body.artifact.description).toBe('Updated description');
    });

    test('should reject update with invalid data', async () => {
      // Create a test artifact
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const invalidUpdate = {
        name: 'a'.repeat(101) // Too long
      };

      const response = await request(app)
        .put(`/api/artifacts/${artifact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Name cannot exceed 100 characters');
    });

    test('should reject update with invalid type', async () => {
      // Create a test artifact
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const invalidUpdate = {
        type: 'INVALID_TYPE'
      };

      const response = await request(app)
        .put(`/api/artifacts/${artifact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid artifact type');
    });
  });

  describe('Model Methods', () => {
    test('should validate unified artifact data', async () => {
      const errors = Artifact.validateUnifiedArtifact(validUnifiedArtifact);
      expect(errors).toHaveLength(0);
    });

    test('should detect validation errors', async () => {
      const invalidData = { ...validUnifiedArtifact };
      delete invalidData.name;

      const errors = Artifact.validateUnifiedArtifact(invalidData);
      expect(errors).toContain('Name is required');
    });

    test('should convert to unified format', async () => {
      const artifact = new Artifact(validUnifiedArtifact);
      await artifact.save();

      const unified = artifact.toUnifiedFormat();
      expect(unified.id).toBe(validUnifiedArtifact.id);
      expect(unified.name).toBe(validUnifiedArtifact.name);
      expect(unified.type).toBe(validUnifiedArtifact.type);
      expect(unified.media).toEqual(validUnifiedArtifact.media);
      expect(unified.tags).toEqual(validUnifiedArtifact.tags);
    });
  });
}); 