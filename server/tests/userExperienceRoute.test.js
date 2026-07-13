import { jest } from '@jest/globals';

const findByIdAndUpdate = jest.fn();
const authenticateToken = jest.fn((req, _res, next) => {
  req.user = { userId: 'user-123' };
  next();
});

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findByIdAndUpdate,
  },
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  default: authenticateToken,
}));

jest.unstable_mockModule('../controllers/userController.js', () => ({
  addFriend: jest.fn(),
  getUserAccess: jest.fn((_req, res) => res.json({ access: [] })),
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => ({
  gameStateReadLimiter: (_req, _res, next) => next(),
  gameStateWriteLimiter: (_req, _res, next) => next(),
}));

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: userRoutes } = await import('../routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const mockSelectedUser = (user) => {
  const select = jest.fn().mockResolvedValue(user);
  findByIdAndUpdate.mockReturnValue({ select });
  return select;
};

describe('PUT /api/users/experience', () => {
  beforeEach(() => {
    findByIdAndUpdate.mockReset();
  });

  it('uses a monotonic update so stale clients cannot lower saved XP', async () => {
    const select = mockSelectedUser({
      username: 'highxp',
      email: 'highxp@example.com',
      experience: 2500,
      level: 26,
    });

    const response = await request(app)
      .put('/api/users/experience')
      .send({ experience: 5 })
      .expect(200);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'user-123',
      { $max: { experience: 5, level: 1 } },
      { new: true },
    );
    expect(select).toHaveBeenCalledWith('username email experience level');
    expect(response.body.experience).toBe(2500);
    expect(response.body.level).toBe(26);
  });

  it('raises level monotonically when incoming XP crosses a level boundary', async () => {
    mockSelectedUser({
      username: 'levelup',
      email: 'levelup@example.com',
      experience: 350,
      level: 4,
    });

    await request(app)
      .put('/api/users/experience')
      .send({ experience: 350 })
      .expect(200);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'user-123',
      { $max: { experience: 350, level: 4 } },
      { new: true },
    );
  });

  it('rejects invalid XP values before writing', async () => {
    await request(app)
      .put('/api/users/experience')
      .send({ experience: -1 })
      .expect(400);

    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
