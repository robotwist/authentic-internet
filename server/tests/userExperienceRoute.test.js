import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const findByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findByIdAndUpdate,
  },
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => {
  const passthrough = (req, res, next) => next();

  return {
    gameStateReadLimiter: passthrough,
    gameStateWriteLimiter: passthrough,
  };
});

const { default: userRoutes } = await import('../routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('PUT /api/users/experience', () => {
  const jwtSecret = 'experience-route-test-secret';
  const userId = '507f1f77bcf86cd799439011';
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = jwtSecret;
    token = jwt.sign({ userId }, jwtSecret);
  });

  beforeEach(() => {
    findByIdAndUpdate.mockReset();
  });

  const mockPersistedUser = ({ experience, level }) => {
    const select = jest.fn().mockResolvedValue({
      _id: userId,
      username: 'progress-user',
      email: 'progress@example.com',
      experience,
      level,
    });

    findByIdAndUpdate.mockReturnValue({ select });
  };

  it('does not send an update that can lower existing experience', async () => {
    mockPersistedUser({ experience: 500, level: 6 });

    const response = await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({ experience: 100 })
      .expect(200);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $max: { experience: 100, level: 2 } },
      { new: true, runValidators: true },
    );
    expect(response.body.experience).toBe(500);
    expect(response.body.level).toBe(6);
  });

  it('allows newer higher experience totals to persist', async () => {
    mockPersistedUser({ experience: 550, level: 6 });

    const response = await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({ experience: 550 })
      .expect(200);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $max: { experience: 550, level: 6 } },
      { new: true, runValidators: true },
    );
    expect(response.body.experience).toBe(550);
    expect(response.body.level).toBe(6);
  });

  it('rejects invalid experience totals', async () => {
    await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({ experience: -1 })
      .expect(400);

    await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({ experience: '100' })
      .expect(400);

    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
