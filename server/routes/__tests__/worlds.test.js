import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockJwtVerify = jest.fn();

class MockWorldInstance {
  constructor(data) {
    Object.assign(this, {
      _id: 'created-world-id',
      activePlayers: [],
      artifacts: [],
      isActive: true,
      maxPlayers: 50,
      settings: {},
      stats: {},
      ...data
    });

    this.save = jest.fn().mockResolvedValue(this);
    this.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  }

  toObject() {
    return { ...this };
  }
}

MockWorldInstance.find = jest.fn();
MockWorldInstance.findOne = jest.fn();

const mockUserFindById = jest.fn();
const mockNpcFind = jest.fn();
const mockChatFind = jest.fn();

jest.unstable_mockModule('../../middleware/auth.js', () => ({
  auth: (req, res, next) => {
    req.user = { userId: 'user-1', role: 'user' };
    req.userId = 'user-1';
    next();
  }
}));

jest.unstable_mockModule('../../models/World.js', () => ({
  default: MockWorldInstance
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: mockUserFindById
  }
}));

jest.unstable_mockModule('../../models/NPC.js', () => ({
  default: {
    find: mockNpcFind
  }
}));

jest.unstable_mockModule('../../models/Chat.js', () => ({
  default: {
    find: mockChatFind
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify
  }
}));

jest.unstable_mockModule('../../constants.js', () => ({
  MAPS_STRUCTURE: [
    {
      name: 'Home',
      data: [[1, 1], [1, 0]]
    },
    {
      name: 'Forest',
      data: [[1, 1], [0, 1]]
    }
  ]
}));

const { default: worldRoutes } = await import('../worlds.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/worlds', worldRoutes);
  return app;
};

const createQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => Promise.resolve(result)),
    limit: jest.fn(() => Promise.resolve(result))
  };

  return query;
};

const createFindOneQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject)
  };

  return query;
};

describe('world routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('returns the static main world without querying a missing legacy model', async () => {
    const response = await request(app)
      .get('/api/worlds/main')
      .expect(200);

    expect(response.body).toMatchObject({
      _id: 'main-world',
      worldId: 'main-world',
      name: 'Authentic Internet',
      isMainWorld: true
    });
    expect(MockWorldInstance.findOne).not.toHaveBeenCalled();
  });

  it('creates a development world with WorldInstance and a dashboard-compatible response', async () => {
    MockWorldInstance.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/worlds')
      .send({
        name: 'Dev World',
        description: 'A development world',
        mapType: 'Forest'
      })
      .expect(201);

    expect(MockWorldInstance.findOne).toHaveBeenCalledWith({
      name: 'Dev World',
      creator: 'user-1',
      isActive: true
    });
    expect(response.body).toMatchObject({
      success: true,
      _id: 'created-world-id',
      isMainWorld: false,
      mapData: [[1, 1], [0, 1]]
    });
    expect(response.body.world).toMatchObject({
      _id: 'created-world-id',
      isMainWorld: false,
      npcs: [],
      games: []
    });
  });

  it('lists active user-owned WorldInstance documents as development worlds', async () => {
    const world = new MockWorldInstance({
      _id: 'owned-world-id',
      worldId: 'world-owned',
      name: 'Owned World',
      description: 'Owned by the authenticated user',
      creator: 'user-1',
      isPublic: false
    });
    const query = createQuery([world]);
    MockWorldInstance.find.mockReturnValue(query);

    const response = await request(app)
      .get('/api/worlds/my-worlds')
      .expect(200);

    expect(MockWorldInstance.find).toHaveBeenCalledWith({
      creator: 'user-1',
      isActive: true
    });
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      _id: 'owned-world-id',
      worldId: 'world-owned',
      isMainWorld: false
    });
  });

  it('allows an owner to fetch a private development world by route id', async () => {
    const privateWorld = new MockWorldInstance({
      _id: 'owned-world-id',
      worldId: 'world-owned',
      name: 'Owned World',
      description: 'Owned by the authenticated user',
      creator: 'user-1',
      isPublic: false
    });

    mockJwtVerify.mockReturnValue({ userId: 'user-1', role: 'user' });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ accountStatus: 'active' })
    });
    MockWorldInstance.findOne.mockReturnValue(createFindOneQuery(privateWorld));

    const response = await request(app)
      .get('/api/worlds/world-owned')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(MockWorldInstance.findOne).toHaveBeenCalledWith({ worldId: 'world-owned' });
    expect(response.body).toMatchObject({
      _id: 'owned-world-id',
      worldId: 'world-owned',
      isPublic: false
    });
  });
});
