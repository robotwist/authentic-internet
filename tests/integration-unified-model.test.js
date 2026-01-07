/**
 * Integration Tests for Unified Artifact Model
 * 
 * This test suite verifies end-to-end functionality of the unified
 * artifact model across frontend and backend components.
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

// Sample unified artifacts for testing
const sampleArtifacts = [
  {
    id: 'weapon-001',
    name: 'Ancient Sword',
    description: 'A legendary blade that once belonged to a great warrior',
    type: 'WEAPON',
    content: 'The sword pulses with ancient power, its edge never dulling.',
    media: ['/uploads/artifacts/ancient_sword.png'],
    location: { x: 3, y: 2, mapName: 'overworld' },
    exp: 15,
    visible: true,
    area: 'overworld',
    tags: ['legendary', 'weapon', 'warrior'],
    rating: 4.7,
    reviews: [
      { userId: 'user-002', rating: 5, comment: 'Incredible artifact!', createdAt: new Date() }
    ],
    createdBy: 'test-user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'scroll-001',
    name: 'Mystical Scroll',
    description: 'An ancient scroll containing forgotten knowledge',
    type: 'SCROLL',
    content: 'The scroll contains ancient wisdom that has been passed down through generations.',
    media: ['/uploads/artifacts/mystical_scroll.png'],
    location: { x: 7, y: 4, mapName: 'dungeon' },
    exp: 10,
    visible: true,
    area: 'dungeon',
    tags: ['ancient', 'knowledge', 'wisdom'],
    rating: 4.2,
    reviews: [],
    createdBy: 'test-user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'art-001',
    name: 'Beautiful Painting',
    description: 'A stunning piece of artwork that captures the essence of beauty',
    type: 'ART',
    content: 'The painting depicts a serene landscape that seems to come alive.',
    media: ['/uploads/artifacts/beautiful_painting.jpg'],
    location: { x: 12, y: 8, mapName: 'yosemite' },
    exp: 20,
    visible: true,
    area: 'yosemite',
    tags: ['art', 'beauty', 'landscape'],
    rating: 4.9,
    reviews: [
      { userId: 'user-003', rating: 5, comment: 'Absolutely stunning!', createdAt: new Date() },
      { userId: 'user-004', rating: 4, comment: 'Beautiful work', createdAt: new Date() }
    ],
    createdBy: 'test-user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('Integration Tests - Unified Artifact Model', () => {
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

  describe('End-to-End Artifact Creation and Retrieval', () => {
    test('should create and retrieve unified artifacts', async () => {
      // Create artifacts via API
      for (const artifactData of sampleArtifacts) {
        const response = await request(app)
          .post('/api/artifacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(artifactData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.artifact.name).toBe(artifactData.name);
        expect(response.body.artifact.type).toBe(artifactData.type);
      }

      // Retrieve all artifacts
      const getResponse = await request(app)
        .get('/api/artifacts')
        .send();

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.artifacts).toHaveLength(3);

      // Verify unified format
      const artifacts = getResponse.body.artifacts;
      artifacts.forEach(artifact => {
        expect(artifact).toHaveProperty('id');
        expect(artifact).toHaveProperty('name');
        expect(artifact).toHaveProperty('type');
        expect(artifact).toHaveProperty('content');
        expect(artifact).toHaveProperty('media');
        expect(artifact).toHaveProperty('location');
        expect(artifact).toHaveProperty('exp');
        expect(artifact).toHaveProperty('area');
        expect(artifact).toHaveProperty('tags');
        expect(artifact).toHaveProperty('createdBy');
        expect(artifact).toHaveProperty('createdAt');
        expect(artifact).toHaveProperty('updatedAt');
      });
    });

    test('should filter artifacts by type', async () => {
      // Create artifacts
      for (const artifactData of sampleArtifacts) {
        await request(app)
          .post('/api/artifacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(artifactData);
      }

      // Filter by weapon type
      const weaponResponse = await request(app)
        .get('/api/artifacts?type=WEAPON')
        .send();

      expect(weaponResponse.status).toBe(200);
      expect(weaponResponse.body.artifacts).toHaveLength(1);
      expect(weaponResponse.body.artifacts[0].type).toBe('WEAPON');

      // Filter by art type
      const artResponse = await request(app)
        .get('/api/artifacts?type=ART')
        .send();

      expect(artResponse.status).toBe(200);
      expect(artResponse.body.artifacts).toHaveLength(1);
      expect(artResponse.body.artifacts[0].type).toBe('ART');
    });

    test('should filter artifacts by area', async () => {
      // Create artifacts
      for (const artifactData of sampleArtifacts) {
        await request(app)
          .post('/api/artifacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(artifactData);
      }

      // Filter by overworld area
      const overworldResponse = await request(app)
        .get('/api/artifacts?area=overworld')
        .send();

      expect(overworldResponse.status).toBe(200);
      expect(overworldResponse.body.artifacts).toHaveLength(1);
      expect(overworldResponse.body.artifacts[0].area).toBe('overworld');

      // Filter by yosemite area
      const yosemiteResponse = await request(app)
        .get('/api/artifacts?area=yosemite')
        .send();

      expect(yosemiteResponse.status).toBe(200);
      expect(yosemiteResponse.body.artifacts).toHaveLength(1);
      expect(yosemiteResponse.body.artifacts[0].area).toBe('yosemite');
    });

    test('should filter artifacts by tags', async () => {
      // Create artifacts
      for (const artifactData of sampleArtifacts) {
        await request(app)
          .post('/api/artifacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(artifactData);
      }

      // Filter by 'legendary' tag
      const legendaryResponse = await request(app)
        .get('/api/artifacts?tags=legendary')
        .send();

      expect(legendaryResponse.status).toBe(200);
      expect(legendaryResponse.body.artifacts).toHaveLength(1);
      expect(legendaryResponse.body.artifacts[0].tags).toContain('legendary');

      // Filter by 'art' tag
      const artResponse = await request(app)
        .get('/api/artifacts?tags=art')
        .send();

      expect(artResponse.status).toBe(200);
      expect(artResponse.body.artifacts).toHaveLength(1);
      expect(artResponse.body.artifacts[0].tags).toContain('art');
    });
  });

  describe('Artifact Updates and Modifications', () => {
    test('should update artifact with new data', async () => {
      // Create an artifact
      const createResponse = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleArtifacts[0]);

      expect(createResponse.status).toBe(201);
      const artifactId = createResponse.body.artifact.id;

      // Update the artifact
      const updateData = {
        name: 'Updated Ancient Sword',
        description: 'An updated description',
        exp: 25,
        tags: ['legendary', 'weapon', 'warrior', 'updated']
      };

      const updateResponse = await request(app)
        .put(`/api/artifacts/${artifactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.artifact.name).toBe('Updated Ancient Sword');
      expect(updateResponse.body.artifact.description).toBe('An updated description');
      expect(updateResponse.body.artifact.exp).toBe(25);
      expect(updateResponse.body.artifact.tags).toContain('updated');
    });

    test('should reject updates with invalid data', async () => {
      // Create an artifact
      const createResponse = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleArtifacts[0]);

      const artifactId = createResponse.body.artifact.id;

      // Try to update with invalid data
      const invalidUpdate = {
        name: 'a'.repeat(101), // Too long
        type: 'INVALID_TYPE'
      };

      const updateResponse = await request(app)
        .put(`/api/artifacts/${artifactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.errors).toContain('Name cannot exceed 100 characters');
      expect(updateResponse.body.errors).toContain('Invalid artifact type');
    });
  });

  describe('Legacy Data Compatibility', () => {
    test('should handle legacy x/y coordinates', async () => {
      const legacyData = {
        id: 'legacy-001',
        name: 'Legacy Artifact',
        description: 'A legacy artifact with x/y coordinates',
        type: 'artifact',
        content: 'Legacy content',
        x: 10,
        y: 15,
        area: 'overworld',
        createdBy: 'test-user-123'
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

    test('should handle legacy creator field', async () => {
      const legacyData = {
        id: 'legacy-002',
        name: 'Legacy Creator Artifact',
        description: 'A legacy artifact with creator field',
        type: 'artifact',
        content: 'Legacy content',
        location: { x: 5, y: 5, mapName: 'overworld' },
        area: 'overworld',
        creator: 'legacy-creator-123'
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(legacyData);

      expect(response.status).toBe(201);
      expect(response.body.artifact.createdBy).toBe('legacy-creator-123');
    });
  });

  describe('Media and File Handling', () => {
    test('should handle artifacts with media arrays', async () => {
      const mediaArtifact = {
        ...sampleArtifacts[0],
        id: 'media-001',
        media: [
          '/uploads/artifacts/image1.png',
          '/uploads/artifacts/audio1.mp3',
          '/uploads/artifacts/video1.mp4'
        ]
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mediaArtifact);

      expect(response.status).toBe(201);
      expect(response.body.artifact.media).toHaveLength(3);
      expect(response.body.artifact.media).toContain('/uploads/artifacts/image1.png');
      expect(response.body.artifact.media).toContain('/uploads/artifacts/audio1.mp3');
      expect(response.body.artifact.media).toContain('/uploads/artifacts/video1.mp4');
    });

    test('should reject artifacts with too many media files', async () => {
      const tooManyMedia = {
        ...sampleArtifacts[0],
        id: 'too-many-media-001',
        media: Array(11).fill('/uploads/artifacts/test.png')
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tooManyMedia);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Cannot have more than 10 media files');
    });
  });

  describe('Rating and Review System', () => {
    test('should handle artifacts with ratings and reviews', async () => {
      const ratedArtifact = {
        ...sampleArtifacts[0],
        id: 'rated-001',
        rating: 4.5,
        reviews: [
          { userId: 'user-001', rating: 5, comment: 'Excellent!', createdAt: new Date() },
          { userId: 'user-002', rating: 4, comment: 'Very good', createdAt: new Date() }
        ]
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratedArtifact);

      expect(response.status).toBe(201);
      expect(response.body.artifact.rating).toBe(4.5);
      expect(response.body.artifact.reviews).toHaveLength(2);
      expect(response.body.artifact.reviews[0].rating).toBe(5);
      expect(response.body.artifact.reviews[1].rating).toBe(4);
    });

    test('should reject invalid ratings', async () => {
      const invalidRating = {
        ...sampleArtifacts[0],
        id: 'invalid-rating-001',
        rating: 6 // Invalid rating
      };

      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRating);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Rating must be a number between 0 and 5');
    });
  });

  describe('Pagination and Sorting', () => {
    test('should handle pagination correctly', async () => {
      // Create multiple artifacts
      for (let i = 0; i < 5; i++) {
        const artifactData = {
          ...sampleArtifacts[0],
          id: `pagination-${i}`,
          name: `Artifact ${i}`
        };
        await request(app)
          .post('/api/artifacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(artifactData);
      }

      // Test first page
      const page1Response = await request(app)
        .get('/api/artifacts?page=1&limit=2')
        .send();

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.artifacts).toHaveLength(2);
      expect(page1Response.body.pagination.current).toBe(1);
      expect(page1Response.body.pagination.total).toBe(5);

      // Test second page
      const page2Response = await request(app)
        .get('/api/artifacts?page=2&limit=2')
        .send();

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.artifacts).toHaveLength(2);
      expect(page2Response.body.pagination.current).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing authentication', async () => {
      const response = await request(app)
        .post('/api/artifacts')
        .send(sampleArtifacts[0]);

      expect(response.status).toBe(401);
    });

    test('should handle non-existent artifacts', async () => {
      const response = await request(app)
        .get('/api/artifacts/non-existent-id')
        .send();

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/artifacts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
}); 