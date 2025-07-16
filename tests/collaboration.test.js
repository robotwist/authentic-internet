import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server/app.js';
import User from '../server/models/User.js';
import Collaboration from '../server/models/Collaboration.js';
import Artifact from '../server/models/Artifact.js';

let mongoServer;
let testUser;
let testUser2;
let authToken;

describe('Collaboration System Tests', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();

    testUser2 = new User({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123'
    });
    await testUser2.save();

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
    // Clear collections before each test
    await Collaboration.deleteMany({});
    await Artifact.deleteMany({});
  });

  describe('Collaboration Session Management', () => {
    test('should create a new collaboration session', async () => {
      const sessionData = {
        name: 'Test Collaboration',
        description: 'A test collaboration session',
        artifactType: 'GAME',
        settings: {
          allowComments: true,
          allowEditing: true,
          maxParticipants: 10
        }
      };

      const response = await request(app)
        .post('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.collaboration.name).toBe(sessionData.name);
      expect(response.body.collaboration.creator).toBe(testUser._id.toString());
      expect(response.body.collaboration.participants).toHaveLength(1);
      expect(response.body.collaboration.participants[0].role).toBe('owner');
    });

    test('should get all collaboration sessions for user', async () => {
      // Create a test session
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'STORY',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .get('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collaborations).toHaveLength(1);
      expect(response.body.collaborations[0].name).toBe('Test Session');
    });

    test('should get a specific collaboration session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'PUZZLE',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .get(`/api/collaboration/sessions/${collaboration._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collaboration.name).toBe('Test Session');
    });

    test('should update collaboration session settings', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'MUSIC',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const newSettings = {
        allowComments: false,
        maxParticipants: 5
      };

      const response = await request(app)
        .put(`/api/collaboration/sessions/${collaboration._id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: newSettings });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collaboration.settings.allowComments).toBe(false);
      expect(response.body.collaboration.settings.maxParticipants).toBe(5);
    });

    test('should delete a collaboration session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'ART',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .delete(`/api/collaboration/sessions/${collaboration._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify session is deleted
      const deletedSession = await Collaboration.findById(collaboration._id);
      expect(deletedSession).toBeNull();
    });
  });

  describe('Participant Management', () => {
    test('should join a collaboration session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'EXPERIENCE',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'editor' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collaboration.participants).toHaveLength(2);
    });

    test('should leave a collaboration session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'GAME',
        creator: testUser._id,
        participants: [
          { user: testUser._id, role: 'owner' },
          { user: testUser2._id, role: 'editor' }
        ]
      });
      await collaboration.save();

      // Login as second user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const user2Token = loginResponse.body.token;

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/leave`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user left
      const updatedSession = await Collaboration.findById(collaboration._id);
      expect(updatedSession.participants).toHaveLength(1);
    });

    test('should not allow creator to leave session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'STORY',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/leave`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Management', () => {
    test('should save artifact progress', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'GAME',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const artifactData = {
        name: 'Test Game',
        description: 'A test game',
        type: 'GAME',
        content: 'Game content here',
        gameConfig: { level: 1 }
      };

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/save`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          artifactData,
          version: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.artifact.name).toBe('Test Game');
      expect(response.body.artifact.collaborationSession).toBe(collaboration._id.toString());
    });

    test('should publish collaboration artifact', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'PUZZLE',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      // Create an artifact first
      const artifact = new Artifact({
        name: 'Test Puzzle',
        description: 'A test puzzle',
        type: 'PUZZLE',
        createdBy: testUser._id,
        collaborationSession: collaboration._id
      });
      await artifact.save();

      collaboration.artifact = artifact._id;
      await collaboration.save();

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/publish`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.artifact.status).toBe('published');
    });
  });

  describe('Comments and Feedback', () => {
    test('should add a comment to collaboration session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'MUSIC',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }]
      });
      await collaboration.save();

      const commentData = {
        content: 'This is a test comment',
        type: 'general'
      };

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toBe('This is a test comment');
      expect(response.body.comment.user).toBe(testUser._id.toString());
    });

    test('should get comments for a session', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'ART',
        creator: testUser._id,
        participants: [{ user: testUser._id, role: 'owner' }],
        comments: [{
          user: testUser._id,
          content: 'Test comment',
          type: 'general',
          timestamp: new Date()
        }]
      });
      await collaboration.save();

      const response = await request(app)
        .get(`/api/collaboration/sessions/${collaboration._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].content).toBe('Test comment');
    });
  });

  describe('Analytics and Insights', () => {
    test('should get collaboration analytics', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'EXPERIENCE',
        creator: testUser._id,
        participants: [
          { user: testUser._id, role: 'owner' },
          { user: testUser2._id, role: 'editor' }
        ],
        comments: [{
          user: testUser._id,
          content: 'Test comment',
          type: 'general',
          timestamp: new Date()
        }]
      });
      await collaboration.save();

      const response = await request(app)
        .get(`/api/collaboration/sessions/${collaboration._id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics.totalParticipants).toBe(2);
      expect(response.body.analytics.totalComments).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid session ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/collaboration/sessions/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle unauthorized access', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'GAME',
        creator: testUser2._id,
        participants: [{ user: testUser2._id, role: 'owner' }]
      });
      await collaboration.save();

      const response = await request(app)
        .get(`/api/collaboration/sessions/${collaboration._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/collaboration/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    test('should validate required fields for session creation', async () => {
      const response = await request(app)
        .post('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should validate artifact type', async () => {
      const response = await request(app)
        .post('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Session',
          description: 'Test description',
          artifactType: 'INVALID_TYPE'
        });

      expect(response.status).toBe(400);
    });

    test('should validate max participants limit', async () => {
      const collaboration = new Collaboration({
        name: 'Test Session',
        description: 'Test description',
        artifactType: 'GAME',
        creator: testUser._id,
        participants: Array(10).fill().map(() => ({ user: new mongoose.Types.ObjectId(), role: 'editor' })),
        settings: { maxParticipants: 10 }
      });
      await collaboration.save();

      const response = await request(app)
        .post(`/api/collaboration/sessions/${collaboration._id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'editor' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('full');
    });
  });
}); 