import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { jest } from '@jest/globals';
import User from '../models/User.js';
import WorldInstance from '../models/World.js';
import userRoutes from '../routes/userRoutes.js';
import worldRoutes from '../routes/worlds.js';

const userId = '507f1f77bcf86cd799439011';
const makeToken = () => jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET);

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use('/api/worlds', worldRoutes);
  return app;
};

const makeQuery = (result) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  limit() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  }
});

describe('world and experience regressions', () => {
  const originals = {};

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    originals.findUserById = User.findById;
    originals.findWorld = WorldInstance.find;
    originals.findWorldById = WorldInstance.findById;
    originals.findWorldOne = WorldInstance.findOne;
    originals.saveWorld = WorldInstance.prototype.save;
  });

  afterEach(() => {
    User.findById = originals.findUserById;
    WorldInstance.find = originals.findWorld;
    WorldInstance.findById = originals.findWorldById;
    WorldInstance.findOne = originals.findWorldOne;
    WorldInstance.prototype.save = originals.saveWorld;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('creates development worlds with a renderable legacy response shape', async () => {
    const app = makeApp();
    let savedWorld;

    User.findById = async () => ({ _id: userId, accountStatus: 'active' });
    WorldInstance.findOne = (query) => {
      if (query.name) return Promise.resolve(null);
      return makeQuery(null);
    };
    WorldInstance.prototype.save = async function save() {
      savedWorld = this;
      return this;
    };

    const response = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        name: 'Bug World',
        description: 'A world that should create',
        mapType: 'Home'
      })
      .expect(201);

    expect(savedWorld).toBeDefined();
    expect(savedWorld.worldId).toMatch(/^world_/);
    expect(savedWorld.mapType).toBe('Home');
    expect(savedWorld.isPublic).toBe(false);
    expect(savedWorld.requiresInvite).toBe(true);
    expect(response.body.world).toMatchObject({
      name: 'Bug World',
      description: 'A world that should create',
      isPublic: false,
      mapType: 'Home',
      npcs: [],
      games: [],
      portals: [],
      artifacts: []
    });
    expect(Array.isArray(response.body.world.mapData)).toBe(true);
    expect(response.body.world.mapData.length).toBeGreaterThan(0);
  });

  it('fetches a private development world for its authenticated creator', async () => {
    const app = makeApp();
    const world = new WorldInstance({
      worldId: 'world_private',
      name: 'Private World',
      description: 'Only the creator can fetch this world',
      creator: userId,
      mapType: 'Home',
      isPublic: false,
      requiresInvite: true,
      moderators: [userId]
    });

    User.findById = async () => ({ _id: userId, accountStatus: 'active' });
    WorldInstance.findById = () => makeQuery(world);
    WorldInstance.findOne = () => makeQuery(null);

    const response = await request(app)
      .get(`/api/worlds/${world._id}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .expect(200);

    expect(response.body).toMatchObject({
      _id: world._id.toString(),
      worldId: 'world_private',
      name: 'Private World',
      isPublic: false,
      mapType: 'Home'
    });
    expect(Array.isArray(response.body.mapData)).toBe(true);
  });

  it('does not let stale client XP overwrite higher server progress', async () => {
    const app = makeApp();
    const user = {
      _id: userId,
      username: 'xp-user',
      email: 'xp@example.com',
      experience: 500,
      level: 1,
      save: jest.fn(async () => {})
    };

    User.findById = () => ({
      select: async () => user
    });

    const response = await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ experience: 10 })
      .expect(200);

    expect(user.experience).toBe(500);
    expect(user.level).toBe(6);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      _id: userId,
      username: 'xp-user',
      email: 'xp@example.com',
      experience: 500,
      level: 6
    });
  });
});
