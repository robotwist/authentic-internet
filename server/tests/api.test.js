import request from 'supertest';
import express from 'express';
import { setupTestDB, clearTestDB, teardownTestDB, createTestUser, createTestArtifact } from './setup.js';
import User from '../models/User.js';
import Artifact from '../models/Artifact.js';
import artifactRoutes from '../routes/artifactRoutes.js';
import userRoutes from '../routes/userRoutes.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/artifacts', artifactRoutes);
app.use('/api/users', userRoutes);

describe('API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Artifact API', () => {
    let testUser;
    let testArtifact;

    beforeEach(async () => {
      // Create test user
      testUser = new User(createTestUser());
      await testUser.save();

      // Create test artifact
      testArtifact = new Artifact(createTestArtifact({ creator: testUser._id }));
      await testArtifact.save();
    });

    describe('GET /api/artifacts/marketplace', () => {
      it('should return marketplace artifacts', async () => {
        const response = await request(app)
          .get('/api/artifacts/marketplace')
          .expect(200);

        expect(response.body).toHaveProperty('artifacts');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.artifacts)).toBe(true);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get('/api/artifacts/marketplace?category=new')
          .expect(200);

        expect(response.body.artifacts).toBeDefined();
      });

      it('should handle pagination', async () => {
        const response = await request(app)
          .get('/api/artifacts/marketplace?page=1&limit=10')
          .expect(200);

        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
      });
    });

    describe('GET /api/artifacts/:id', () => {
      it('should return artifact by ID', async () => {
        const response = await request(app)
          .get(`/api/artifacts/${testArtifact._id}`)
          .expect(200);

        expect(response.body._id).toBe(testArtifact._id.toString());
        expect(response.body.name).toBe(testArtifact.name);
      });

      it('should return 404 for non-existent artifact', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app)
          .get(`/api/artifacts/${fakeId}`)
          .expect(404);
      });

      it('should handle invalid ObjectId', async () => {
        await request(app)
          .get('/api/artifacts/invalid-id')
          .expect(500);
      });
    });
  });

  describe('User API', () => {
    let testUser1;
    let testUser2;

    beforeEach(async () => {
      testUser1 = new User(createTestUser({ username: 'user1', email: 'user1@test.com' }));
      testUser2 = new User(createTestUser({ username: 'user2', email: 'user2@test.com' }));
      await testUser1.save();
      await testUser2.save();
    });

    describe('GET /api/users/friends', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/users/friends')
          .expect(401);
      });
    });

    describe('POST /api/users/friends/request', () => {
      it('should validate request body', async () => {
        const response = await request(app)
          .post('/api/users/friends/request')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Validation failed');
      });

      it('should validate targetUserId format', async () => {
        const response = await request(app)
          .post('/api/users/friends/request')
          .send({ targetUserId: 'invalid-id' })
          .expect(400);

        expect(response.body).toHaveProperty('errors');
      });
    });
  });

  describe('Input Validation', () => {
    describe('Artifact creation', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/artifacts')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Validation failed');
      });

      it('should validate artifact type', async () => {
        const response = await request(app)
          .post('/api/artifacts')
          .send({
            name: 'Test',
            description: 'Test description',
            type: 'invalid-type',
            content: {}
          })
          .expect(400);

        expect(response.body).toHaveProperty('errors');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the app doesn't crash on malformed requests
      const response = await request(app)
        .get('/api/artifacts/invalid-object-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
