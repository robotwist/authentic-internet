import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const savedWorlds = [];
const savedNpcs = [];

class WorldMock {
  constructor(data) {
    Object.assign(this, {
      _id: 'world-object-id',
      activePlayers: [],
      stats: {},
      npcs: [],
      games: [],
      artifacts: [],
      toObject: () => ({ ...this }),
      populate: jest.fn(async () => this),
      save: jest.fn(async () => {
        savedWorlds.push(this);
        return this;
      }),
    }, data);
  }

  static findOne = jest.fn();
  static find = jest.fn();
  static findById = jest.fn();
}

class NPCMock {
  constructor(data) {
    Object.assign(this, {
      _id: 'npc-object-id',
      save: jest.fn(async () => {
        savedNpcs.push(this);
        return this;
      }),
    }, data);
  }
}

const UserMock = {
  findById: jest.fn(async () => ({ _id: 'user-1', accountStatus: 'active' })),
};

jest.unstable_mockModule('../models/World.js', () => ({
  default: WorldMock,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: NPCMock,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

const { default: worldRoutes } = await import('../routes/worlds.js');

const app = express();
app.use(express.json());
app.use('/api/worlds', worldRoutes);

const tokenFor = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');

describe('world route regressions', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    savedWorlds.length = 0;
    savedNpcs.length = 0;
    WorldMock.findOne.mockResolvedValue(null);
  });

  it('creates a development world using the active WorldInstance model', async () => {
    const response = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        name: 'Test World',
        description: 'A world used for regression coverage',
        mapType: 'Home',
      })
      .expect(201);

    expect(response.body.world).toEqual(
      expect.objectContaining({
        _id: 'world-object-id',
        name: 'Test World',
        worldId: expect.stringMatching(/^world_/),
        creator: 'user-1',
        isMainWorld: false,
        mapData: expect.any(Array),
      }),
    );
    expect(savedNpcs[0]).toEqual(
      expect.objectContaining({
        name: 'Development Guide',
        type: 'GUIDE',
        dialogue: ['A helpful guide for your development world'],
      }),
    );
  });
});
