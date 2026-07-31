import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'recommendations-critical-test-secret';

const findByIdMock = jest.fn();
const findMock = jest.fn();

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: {
    findById: findByIdMock,
    find: findMock,
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {},
}));

const { default: recommendationRoutes } = await import('../routes/recommendations.js');

const app = express();
app.use(express.json());
app.use('/api/recommendations', recommendationRoutes);

const tokenFor = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('recommendations critical fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findByIdMock.mockResolvedValue(null);
    findMock.mockResolvedValue([]);
  });

  test('rejects invalid artifactId without calling findById or emitting unhandledRejection', async () => {
    const rejections = [];
    const onUnhandled = (reason) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      const res = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${tokenFor('507f1f77bcf86cd799439011')}`)
        .send({ artifactId: 'not-an-objectid', type: 'view' });

      // Allow any floating promises from the handler to settle.
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setTimeout(resolve, 25));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid ObjectId/i);
      expect(findByIdMock).not.toHaveBeenCalled();
      expect(rejections).toHaveLength(0);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  test('catches findById rejection so preference updates cannot crash the process', async () => {
    const rejections = [];
    const onUnhandled = (reason) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    const artifactId = '507f1f77bcf86cd799439011';
    findByIdMock.mockRejectedValue(
      Object.assign(new Error('Cast to ObjectId failed for value'), { name: 'CastError' })
    );

    try {
      const res = await request(app)
        .post('/api/recommendations/interaction')
        .set('Authorization', `Bearer ${tokenFor('507f1f77bcf86cd799439012')}`)
        .send({ artifactId, type: 'complete' });

      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setTimeout(resolve, 25));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(findByIdMock).toHaveBeenCalledWith(artifactId);
      expect(rejections).toHaveLength(0);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  test('isolates recommendation profiles by JWT userId instead of shared undefined key', async () => {
    const artifactId = '507f1f77bcf86cd799439013';
    findByIdMock.mockResolvedValue({
      type: 'puzzle',
      area: 'forest',
      createdBy: '507f1f77bcf86cd799439099',
      tags: ['logic'],
    });

    const userA = '507f1f77bcf86cd799439021';
    const userB = '507f1f77bcf86cd799439022';

    await request(app)
      .post('/api/recommendations/interaction')
      .set('Authorization', `Bearer ${tokenFor(userA)}`)
      .send({ artifactId, type: 'complete', feedback: 'positive' })
      .expect(200);

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 25));

    const profileA = await request(app)
      .get('/api/recommendations/profile')
      .set('Authorization', `Bearer ${tokenFor(userA)}`);
    const profileB = await request(app)
      .get('/api/recommendations/profile')
      .set('Authorization', `Bearer ${tokenFor(userB)}`);

    expect(profileA.status).toBe(200);
    expect(profileA.body.profile.id).toBe(userA);
    expect(profileA.body.profile.learning.totalInteractions).toBeGreaterThan(0);

    expect(profileB.status).toBe(200);
    expect(profileB.body.profile.id).toBe(userB);
    expect(profileB.body.profile.learning.totalInteractions).toBe(0);
  });
});
