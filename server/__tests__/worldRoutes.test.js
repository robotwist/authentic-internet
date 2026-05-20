import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const existingMainWorld = {
  _id: 'world-id',
  worldId: 'main',
  name: 'Authentic Internet',
  isMainWorld: true,
  activePlayers: [],
  stats: {},
};

const makeQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  return query;
};

const WorldModel = jest.fn(function WorldModel(data) {
  Object.assign(this, data);
  this._id = data?._id ?? 'new-world-id';
  this.npcs = data?.npcs ?? [];
  this.save = jest.fn().mockResolvedValue(this);
  this.populate = jest.fn().mockResolvedValue(this);
});
WorldModel.find = jest.fn(() => makeQuery([]));
WorldModel.findOne = jest.fn(() => makeQuery(existingMainWorld));
WorldModel.findById = jest.fn(() => makeQuery(null));

const NPCModel = jest.fn(function NPCModel(data) {
  Object.assign(this, data);
  this._id = data?._id ?? 'npc-id';
  this.save = jest.fn().mockResolvedValue(this);
});

await jest.unstable_mockModule('../models/World.js', () => ({ default: WorldModel }));
await jest.unstable_mockModule('../models/Chat.js', () => ({ default: {} }));
await jest.unstable_mockModule('../models/User.js', () => ({ default: {} }));
await jest.unstable_mockModule('../models/NPC.js', () => ({ default: NPCModel }));

const { default: worldsRouter } = await import('../routes/worlds.js');

describe('world routes', () => {
  let app;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    WorldModel.findOne.mockReturnValue(makeQuery(existingMainWorld));
    app = express();
    app.use(express.json());
    app.use('/api/worlds', worldsRouter);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('serves the main world using the imported world model', async () => {
    const response = await request(app).get('/api/worlds/main');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      worldId: 'main',
      name: 'Authentic Internet',
      isMainWorld: true,
    });
    expect(WorldModel.findOne).toHaveBeenCalledWith({ isMainWorld: true });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
