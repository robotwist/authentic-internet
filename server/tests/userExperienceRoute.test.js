import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const findOneAndUpdate = jest.fn();
const select = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findOneAndUpdate,
  },
}));

jest.unstable_mockModule('../controllers/userController.js', () => ({
  addFriend: jest.fn(),
  getUserAccess: jest.fn(),
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  default: (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  },
}));

const { default: userRoutes } = await import('../routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('PUT /api/users/experience', () => {
  beforeEach(() => {
    findOneAndUpdate.mockReset();
    select.mockReset();
  });

  it('rejects stale absolute totals instead of overwriting account XP', async () => {
    const response = await request(app)
      .put('/api/users/experience')
      .send({ experience: 5 })
      .expect(400);

    expect(response.body.message).toContain('amount earned');
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('increments XP atomically from the persisted server value', async () => {
    const updatedUser = {
      username: 'player',
      email: 'player@example.com',
      experience: 805,
      level: 9,
    };
    select.mockResolvedValue(updatedUser);
    findOneAndUpdate.mockReturnValue({ select });

    const response = await request(app)
      .put('/api/users/experience')
      .send({ amount: 5 })
      .expect(200);

    expect(response.body).toEqual(updatedUser);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-123' },
      [
        {
          $set: {
            experience: {
              $add: [{ $ifNull: ['$experience', 0] }, 5],
            },
            level: {
              $add: [
                {
                  $floor: {
                    $divide: [
                      {
                        $add: [{ $ifNull: ['$experience', 0] }, 5],
                      },
                      100,
                    ],
                  },
                },
                1,
              ],
            },
          },
        },
      ],
      { new: true },
    );
    expect(select).toHaveBeenCalledWith('username email experience level');
  });

  it('rejects oversized XP awards', async () => {
    const response = await request(app)
      .put('/api/users/experience')
      .send({ amount: 1000000 })
      .expect(400);

    expect(response.body.message).toContain('between 1 and 1000');
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });
});
