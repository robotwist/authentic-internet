import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

const worldInstances = [];

const createQuery = (result) => ({
  populate: jest.fn(function populate() {
    return this;
  }),
  sort: jest.fn(function sort() {
    return this;
  }),
  limit: jest.fn(function limit() {
    return this;
  }),
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  },
  catch(reject) {
    return Promise.resolve(result).catch(reject);
  },
});

const MockWorld = jest.fn().mockImplementation(function MockWorldDocument(data) {
  Object.assign(this, data);
  this._id = data._id || 'world-object-id';
  this.activePlayers = data.activePlayers || [];
  this.stats = data.stats || {};
  this.artifacts = data.artifacts || [];
  this.save = jest.fn().mockResolvedValue(this);
  this.populate = jest.fn().mockResolvedValue(this);
  this.toObject = jest.fn(() => ({ ...this }));
  worldInstances.push(this);
});

MockWorld.find = jest.fn();
MockWorld.findOne = jest.fn();
MockWorld.findById = jest.fn();

const MockNPC = jest.fn().mockImplementation(function MockNPCDocument(data) {
  Object.assign(this, data);
  this._id = 'npc-id';
  this.save = jest.fn().mockResolvedValue(this);
});

jest.unstable_mockModule('../middleware/auth.js', () => ({
  auth: (req, _res, next) => {
    req.user = { userId: 'user-123' };
    next();
  },
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-123' };
    next();
  },
}));

jest.unstable_mockModule('../models/World.js', () => ({
  default: MockWorld,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: MockNPC,
}));

jest.unstable_mockModule('../models/Chat.js', () => ({
  default: { find: jest.fn(() => createQuery([])) },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../constants.js', () => ({
  MAPS_STRUCTURE: {
    DEFAULT: {
      tiles: [[0]],
      spawnPoints: [{ x: 1, y: 1 }],
    },
  },
}));

const { default: worldsRoutes } = await import('../routes/worlds.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/worlds', worldsRoutes);
  return app;
};

beforeEach(() => {
  jest.clearAllMocks();
  worldInstances.length = 0;
});

describe('world routes', () => {
  test('GET /api/worlds/my-worlds queries current user worlds without invalid populates', async () => {
    const worlds = [
      {
        _id: 'world-id',
        worldId: 'world-one',
        name: 'World One',
        description: 'A test world',
        creator: 'user-123',
        isPublic: false,
      },
    ];
    MockWorld.find.mockReturnValue(createQuery(worlds));

    const response = await request(createApp())
      .get('/api/worlds/my-worlds')
      .expect(200);

    expect(MockWorld.find).toHaveBeenCalledWith({ creator: 'user-123' });
    expect(response.body).toEqual(worlds);
  });

  test('POST /api/worlds creates a schema-compatible development world', async () => {
    MockWorld.findOne.mockResolvedValue(null);

    const response = await request(createApp())
      .post('/api/worlds')
      .send({
        name: 'My Dev World',
        description: 'A private development world',
      })
      .expect(201);

    expect(MockWorld.findOne).toHaveBeenCalledWith({
      name: 'My Dev World',
      creator: 'user-123',
    });
    expect(worldInstances).toHaveLength(1);
    expect(worldInstances[0]).toMatchObject({
      name: 'My Dev World',
      description: 'A private development world',
      creator: 'user-123',
      isPublic: false,
      moderators: ['user-123'],
    });
    expect(worldInstances[0].worldId).toMatch(/^world_/);
    expect(worldInstances[0].save).toHaveBeenCalledTimes(1);
    expect(response.body.world).toMatchObject({
      name: 'My Dev World',
      npcs: [],
      games: [],
      portals: [],
    });
  });

  test('GET /api/worlds/main returns fallback main world when no stored instance exists', async () => {
    MockWorld.findOne.mockReturnValue(createQuery(null));

    const response = await request(createApp())
      .get('/api/worlds/main')
      .expect(200);

    expect(MockWorld.findOne).toHaveBeenCalledWith({ worldId: 'main' });
    expect(response.body).toMatchObject({
      worldId: 'main',
      name: 'Authentic Internet',
      isMainWorld: true,
      mapData: [[0]],
      npcs: [],
      games: [],
      portals: [],
    });
  });
});
