import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const findByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findByIdAndUpdate,
  },
}));

jest.unstable_mockModule('../../middleware/authMiddleware.js', () => ({
  default: (req, res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

const makeSelectQuery = (user) => ({
  select: jest.fn().mockResolvedValue(user),
});

describe('PUT /api/users/experience', () => {
  let app;

  beforeAll(async () => {
    const { default: userRoutes } = await import('../userRoutes.js');

    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
  });

  beforeEach(() => {
    findByIdAndUpdate.mockReset();
  });

  it('uses a non-decreasing XP update so stale client totals cannot clobber server progress', async () => {
    findByIdAndUpdate.mockReturnValue(makeSelectQuery({
      _id: 'user-1',
      username: 'hero',
      email: 'hero@example.com',
      experience: 500,
      level: 6,
    }));

    const response = await request(app)
      .put('/api/users/experience')
      .send({ experience: 5 })
      .expect(200);

    expect(response.body.experience).toBe(500);
    expect(response.body.level).toBe(6);

    const [userId, updatePipeline, options] = findByIdAndUpdate.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(options).toEqual({ new: true });
    expect(updatePipeline).toEqual([
      {
        $set: {
          experience: {
            $max: [{ $ifNull: ['$experience', 0] }, 5],
          },
          level: {
            $max: [
              { $ifNull: ['$level', 1] },
              {
                $add: [
                  {
                    $floor: {
                      $divide: [
                        { $max: [{ $ifNull: ['$experience', 0] }, 5] },
                        100,
                      ],
                    },
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]);
  });

  it('rejects negative XP totals', async () => {
    const response = await request(app)
      .put('/api/users/experience')
      .send({ experience: -1 })
      .expect(400);

    expect(response.body.message).toBe('Experience must be a non-negative finite number');
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
