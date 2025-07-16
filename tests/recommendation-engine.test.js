/**
 * Recommendation Engine Test Suite
 * Tests AI-powered recommendation algorithms and user behavior tracking
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Mock the recommendation engine components
jest.mock('../client/src/components/RecommendationEngine.jsx', () => {
  return function MockRecommendationEngine({ artifacts, onArtifactSelect, loading }) {
    return {
      type: 'div',
      props: {
        className: 'recommendation-engine',
        children: loading ? 'Loading...' : `Found ${artifacts?.length || 0} recommendations`
      }
    };
  };
});

// Mock the recommendation API
jest.mock('../client/src/api/recommendations.js', () => ({
  getRecommendations: jest.fn(),
  trackInteraction: jest.fn(),
  getUserProfile: jest.fn(),
  getInsights: jest.fn(),
  trackArtifactView: jest.fn(),
  trackArtifactSelection: jest.fn(),
  trackFeedback: jest.fn(),
  getContextualRecommendations: jest.fn(),
  getSerendipitousRecommendations: jest.fn(),
  getCollaborativeRecommendations: jest.fn(),
  getContentBasedRecommendations: jest.fn(),
  getHybridRecommendations: jest.fn(),
  getRecommendationMetrics: jest.fn()
}));

describe('Recommendation Engine', () => {
  let app;
  let testUser;
  let testArtifacts;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test');
    
    // Create test app
    app = require('../server/server.mjs');
    
    // Create test user
    testUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Create test artifacts
    testArtifacts = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Game',
        description: 'A test game artifact',
        type: 'game',
        area: 'yosemite',
        createdBy: testUser._id,
        rating: 4.5,
        exp: 25,
        tags: ['puzzle', 'adventure'],
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Story',
        description: 'A test story artifact',
        type: 'story',
        area: 'yosemite',
        createdBy: testUser._id,
        rating: 4.0,
        exp: 15,
        tags: ['fiction', 'drama'],
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Puzzle',
        description: 'A test puzzle artifact',
        type: 'puzzle',
        area: 'yosemite',
        createdBy: testUser._id,
        rating: 4.8,
        exp: 30,
        tags: ['logic', 'brain-teaser'],
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Generate auth token
    authToken = 'test-auth-token';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await mongoose.connection.db.collection('artifacts').deleteMany({});
    await mongoose.connection.db.collection('users').deleteMany({});
    
    // Insert test data
    await mongoose.connection.db.collection('users').insertOne(testUser);
    await mongoose.connection.db.collection('artifacts').insertMany(testArtifacts);
  });

  describe('Recommendation Algorithms', () => {
    test('should generate collaborative filtering recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ algorithm: 'collaborative' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.algorithm).toBe('collaborative');
    });

    test('should generate content-based filtering recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ algorithm: 'contentBased' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.algorithm).toBe('contentBased');
    });

    test('should generate contextual filtering recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ algorithm: 'contextual' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.algorithm).toBe('contextual');
    });

    test('should generate serendipity filtering recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ algorithm: 'serendipity' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.algorithm).toBe('serendipity');
    });

    test('should generate hybrid recommendations by default', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.algorithm).toBe('hybrid');
    });

    test('should apply diversity filter', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ diversity: 0.8 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
    });

    test('should apply novelty filter', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ novelty: 0.7 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
    });

    test('should limit results', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('User Interaction Tracking', () => {
    test('should track artifact view', async () => {
      const interaction = {
        artifactId: testArtifacts[0]._id.toString(),
        type: 'view',
        algorithm: 'hybrid'
      };

      const response = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interaction)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interaction tracked successfully');
    });

    test('should track artifact selection', async () => {
      const interaction = {
        artifactId: testArtifacts[0]._id.toString(),
        type: 'select',
        algorithm: 'hybrid'
      };

      const response = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interaction)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should track positive feedback', async () => {
      const interaction = {
        artifactId: testArtifacts[0]._id.toString(),
        type: 'feedback',
        feedback: 'positive',
        algorithm: 'hybrid'
      };

      const response = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interaction)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should track negative feedback', async () => {
      const interaction = {
        artifactId: testArtifacts[0]._id.toString(),
        type: 'feedback',
        feedback: 'negative',
        algorithm: 'hybrid'
      };

      const response = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interaction)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should require artifactId and type', async () => {
      const response = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('artifactId and type are required');
    });
  });

  describe('User Profile and Preferences', () => {
    test('should get user profile', async () => {
      const response = await request(app)
        .get('/api/recommendations/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.id).toBeDefined();
      expect(response.body.profile.preferences).toBeDefined();
      expect(response.body.profile.behavior).toBeDefined();
      expect(response.body.profile.learning).toBeDefined();
    });

    test('should return default profile for new user', async () => {
      const response = await request(app)
        .get('/api/recommendations/profile')
        .set('Authorization', `Bearer new-user-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.learning.totalInteractions).toBe(0);
      expect(response.body.profile.learning.confidence).toBe(0.1);
    });
  });

  describe('Recommendation Insights', () => {
    test('should get recommendation insights', async () => {
      const response = await request(app)
        .get('/api/recommendations/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights).toBeDefined();
      expect(response.body.insights.totalInteractions).toBeDefined();
      expect(response.body.insights.favoriteTypes).toBeDefined();
      expect(response.body.insights.favoriteAreas).toBeDefined();
      expect(response.body.insights.favoriteCreators).toBeDefined();
      expect(response.body.insights.interactionTrends).toBeDefined();
      expect(response.body.insights.recommendationsAccuracy).toBeDefined();
    });

    test('should return default insights for new user', async () => {
      const response = await request(app)
        .get('/api/recommendations/insights')
        .set('Authorization', `Bearer new-user-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights.totalInteractions).toBe(0);
      expect(response.body.insights.recommendationsAccuracy).toBe(0);
    });
  });

  describe('Frontend Recommendation Engine Component', () => {
    test('should render recommendation engine with artifacts', () => {
      const { RecommendationEngine } = require('../client/src/components/RecommendationEngine.jsx');
      const artifacts = [
        { id: '1', name: 'Test Artifact 1', type: 'game' },
        { id: '2', name: 'Test Artifact 2', type: 'story' }
      ];

      const component = RecommendationEngine({ 
        artifacts, 
        onArtifactSelect: jest.fn(), 
        loading: false 
      });

      expect(component.props.className).toBe('recommendation-engine');
      expect(component.props.children).toContain('Found 2 recommendations');
    });

    test('should render loading state', () => {
      const { RecommendationEngine } = require('../client/src/components/RecommendationEngine.jsx');
      
      const component = RecommendationEngine({ 
        artifacts: [], 
        onArtifactSelect: jest.fn(), 
        loading: true 
      });

      expect(component.props.children).toBe('Loading...');
    });
  });

  describe('Frontend API Integration', () => {
    test('should call getRecommendations API', async () => {
      const { getRecommendations } = require('../client/src/api/recommendations.js');
      
      getRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts,
        algorithm: 'hybrid'
      });

      const result = await getRecommendations({ algorithm: 'hybrid' });
      
      expect(getRecommendations).toHaveBeenCalledWith({ algorithm: 'hybrid' });
      expect(result.success).toBe(true);
      expect(result.recommendations).toEqual(testArtifacts);
    });

    test('should call trackInteraction API', async () => {
      const { trackInteraction } = require('../client/src/api/recommendations.js');
      
      trackInteraction.mockResolvedValue({
        success: true,
        message: 'Interaction tracked successfully'
      });

      const interaction = {
        artifactId: 'test-id',
        type: 'view',
        algorithm: 'hybrid'
      };

      const result = await trackInteraction(interaction);
      
      expect(trackInteraction).toHaveBeenCalledWith(interaction);
      expect(result.success).toBe(true);
    });

    test('should call getUserProfile API', async () => {
      const { getUserProfile } = require('../client/src/api/recommendations.js');
      
      getUserProfile.mockResolvedValue({
        success: true,
        profile: {
          id: 'test-user',
          preferences: {},
          behavior: {},
          learning: { totalInteractions: 0, confidence: 0.1 }
        }
      });

      const result = await getUserProfile();
      
      expect(getUserProfile).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
    });

    test('should call getInsights API', async () => {
      const { getInsights } = require('../client/src/api/recommendations.js');
      
      getInsights.mockResolvedValue({
        success: true,
        insights: {
          totalInteractions: 10,
          favoriteTypes: [],
          recommendationsAccuracy: 0.8
        }
      });

      const result = await getInsights();
      
      expect(getInsights).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
    });
  });

  describe('Algorithm-Specific API Functions', () => {
    test('should call getContextualRecommendations', async () => {
      const { getContextualRecommendations } = require('../client/src/api/recommendations.js');
      
      getContextualRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts
      });

      const context = { timeOfDay: 'morning', sessionType: 'short' };
      const result = await getContextualRecommendations(context);
      
      expect(getContextualRecommendations).toHaveBeenCalledWith(context);
      expect(result.success).toBe(true);
    });

    test('should call getSerendipitousRecommendations', async () => {
      const { getSerendipitousRecommendations } = require('../client/src/api/recommendations.js');
      
      getSerendipitousRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts
      });

      const result = await getSerendipitousRecommendations(0.5);
      
      expect(getSerendipitousRecommendations).toHaveBeenCalledWith(0.5);
      expect(result.success).toBe(true);
    });

    test('should call getCollaborativeRecommendations', async () => {
      const { getCollaborativeRecommendations } = require('../client/src/api/recommendations.js');
      
      getCollaborativeRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts
      });

      const result = await getCollaborativeRecommendations();
      
      expect(getCollaborativeRecommendations).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should call getContentBasedRecommendations', async () => {
      const { getContentBasedRecommendations } = require('../client/src/api/recommendations.js');
      
      getContentBasedRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts
      });

      const result = await getContentBasedRecommendations();
      
      expect(getContentBasedRecommendations).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should call getHybridRecommendations', async () => {
      const { getHybridRecommendations } = require('../client/src/api/recommendations.js');
      
      getHybridRecommendations.mockResolvedValue({
        success: true,
        recommendations: testArtifacts
      });

      const result = await getHybridRecommendations();
      
      expect(getHybridRecommendations).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('should track artifact view', async () => {
      const { trackArtifactView } = require('../client/src/api/recommendations.js');
      
      trackArtifactView.mockResolvedValue(undefined);

      await trackArtifactView('test-id', 'hybrid');
      
      expect(trackArtifactView).toHaveBeenCalledWith('test-id', 'hybrid');
    });

    test('should track artifact selection', async () => {
      const { trackArtifactSelection } = require('../client/src/api/recommendations.js');
      
      trackArtifactSelection.mockResolvedValue(undefined);

      await trackArtifactSelection('test-id', 'hybrid');
      
      expect(trackArtifactSelection).toHaveBeenCalledWith('test-id', 'hybrid');
    });

    test('should track feedback', async () => {
      const { trackFeedback } = require('../client/src/api/recommendations.js');
      
      trackFeedback.mockResolvedValue(undefined);

      await trackFeedback('test-id', 'positive', 'hybrid');
      
      expect(trackFeedback).toHaveBeenCalledWith('test-id', 'positive', 'hybrid');
    });

    test('should get recommendation metrics', async () => {
      const { getRecommendationMetrics } = require('../client/src/api/recommendations.js');
      
      getRecommendationMetrics.mockResolvedValue({
        profile: { id: 'test-user' },
        insights: { totalInteractions: 10 },
        metrics: { confidence: 0.8 }
      });

      const result = await getRecommendationMetrics();
      
      expect(getRecommendationMetrics).toHaveBeenCalled();
      expect(result.profile).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const { getRecommendations } = require('../client/src/api/recommendations.js');
      
      getRecommendations.mockRejectedValue(new Error('API Error'));

      await expect(getRecommendations()).rejects.toThrow('API Error');
    });

    test('should handle network errors', async () => {
      const { trackInteraction } = require('../client/src/api/recommendations.js');
      
      trackInteraction.mockRejectedValue(new Error('Network Error'));

      await expect(trackInteraction({})).rejects.toThrow('Network Error');
    });

    test('should handle invalid algorithm parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .query({ algorithm: 'invalid' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.algorithm).toBe('hybrid'); // Should default to hybrid
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of artifacts efficiently', async () => {
      // Create many test artifacts
      const manyArtifacts = Array.from({ length: 100 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: `Test Artifact ${i}`,
        type: ['game', 'story', 'puzzle'][i % 3],
        area: 'yosemite',
        rating: 4.0 + (i % 10) * 0.1,
        visible: true
      }));

      await mongoose.connection.db.collection('artifacts').insertMany(manyArtifacts);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/recommendations')
        .query({ limit: 20 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body.recommendations.length).toBeLessThanOrEqual(20);
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/recommendations')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should provide end-to-end recommendation flow', async () => {
      // 1. Get initial recommendations
      const initialResponse = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(initialResponse.body.recommendations.length).toBeGreaterThan(0);

      // 2. Track interaction with a recommendation
      const artifactId = initialResponse.body.recommendations[0]._id;
      await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          artifactId,
          type: 'view',
          algorithm: initialResponse.body.algorithm
        })
        .expect(200);

      // 3. Get updated profile
      const profileResponse = await request(app)
        .get('/api/recommendations/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.profile.learning.totalInteractions).toBeGreaterThan(0);

      // 4. Get new recommendations (should be influenced by interaction)
      const updatedResponse = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedResponse.body.recommendations).toBeDefined();
    });

    test('should learn from user feedback', async () => {
      // 1. Track positive feedback
      await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          artifactId: testArtifacts[0]._id.toString(),
          type: 'feedback',
          feedback: 'positive',
          algorithm: 'hybrid'
        })
        .expect(200);

      // 2. Track negative feedback
      await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          artifactId: testArtifacts[1]._id.toString(),
          type: 'feedback',
          feedback: 'negative',
          algorithm: 'hybrid'
        })
        .expect(200);

      // 3. Check insights
      const insightsResponse = await request(app)
        .get('/api/recommendations/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(insightsResponse.body.insights.totalInteractions).toBeGreaterThan(0);
      expect(insightsResponse.body.insights.recommendationsAccuracy).toBeGreaterThan(0);
    });
  });
}); 