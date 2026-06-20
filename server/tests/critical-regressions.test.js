import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const worldSaveMock = jest.fn();
const worldPopulateMock = jest.fn();
const npcSaveMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();

class MockWorld {
  static findOne = jest.fn();
  static find = jest.fn();
  static findById = jest.fn();
  static findByIdAndUpdate = jest.fn();

  constructor(data) {
    Object.assign(this, data);
    this._id = 'world-1';
    this.npcs = data.npcs || [];
  }

  async save() {
    worldSaveMock(this);
    return this;
  }

  async populate() {
    worldPopulateMock(this);
    return this;
  }

  toObject() {
    return { ...this };
  }
}

class MockNPC {
  constructor(data) {
    Object.assign(this, data);
    this._id = 'npc-1';
  }

  async save() {
    npcSaveMock(this);
    return this;
  }
}

const mockWorldInstance = {
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockUser = {
  findByIdAndUpdate: findByIdAndUpdateMock,
};

jest.unstable_mockModule('../models/World.js', () => ({
  default: mockWorldInstance,
  World: MockWorld,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: MockNPC,
}));

jest.unstable_mockModule('../models/Chat.js', () => ({
  default: { find: jest.fn() },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: mockUser,
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  auth: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  default: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

jest.unstable_mockModule('../controllers/userController.js', () => ({
  addFriend: jest.fn(),
  getUserAccess: jest.fn(),
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => ({
  gameStateReadLimiter: (_req, _res, next) => next(),
  gameStateWriteLimiter: (_req, _res, next) => next(),
}));

jest.unstable_mockModule('../middleware/validation.js', () => ({
  validate: () => (_req, _res, next) => next(),
  schemas: {
    friend: {
      request: {},
      accept: {},
      decline: {},
    },
  },
}));

const { default: worldRoutes } = await import('../routes/worlds.js');
const { default: userRoutes } = await import('../routes/userRoutes.js');

const makeApp = (path, routes) => {
  const app = express();
  app.use(express.json());
  app.use(path, routes);
  return app;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('critical regression coverage', () => {
  it('creates development worlds with the legacy World model and current map constants', async () => {
    MockWorld.findOne.mockResolvedValue(null);

    const response = await request(makeApp('/api/worlds', worldRoutes))
      .post('/api/worlds')
      .send({
        name: 'Dev World',
        description: 'A development world',
        mapType: 'DEFAULT',
      })
      .expect(201);

    expect(MockWorld.findOne).toHaveBeenCalledWith({
      name: 'Dev World',
      creator: 'user-1',
    });
    expect(worldSaveMock).toHaveBeenCalledTimes(2);
    expect(npcSaveMock).toHaveBeenCalledTimes(1);
    expect(response.body.world.mapData).toEqual(expect.any(Array));
    expect(response.body.world.mapData[0]).toEqual(expect.any(Array));
    expect(response.body.world.npcs).toHaveLength(1);
  });

  it('uses an atomic max update so stale XP sync cannot lower progress', async () => {
    const selectMock = jest.fn().mockResolvedValue({
      _id: 'user-1',
      username: 'player',
      experience: 500,
      level: 3,
    });
    findByIdAndUpdateMock.mockReturnValue({ select: selectMock });

    const response = await request(makeApp('/api/users', userRoutes))
      .put('/api/users/experience')
      .send({ experience: 5 })
      .expect(200);

    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-1',
      { $max: { experience: 5 } },
      { new: true },
    );
    expect(selectMock).toHaveBeenCalledWith('username email experience level');
    expect(response.body.experience).toBe(500);
  });
});
