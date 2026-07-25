import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';

const characters = new Map();
const users = new Map();

const makeCharacter = (data) => ({
  ...data,
  incrementViews: jest.fn(async function incrementViews() {
    this.views = (this.views || 0) + 1;
    return this;
  }),
  save: jest.fn(async function save() {
    characters.set(this._id, this);
    return this;
  }),
  populate: jest.fn(async function populate() {
    return this;
  }),
});

const CharacterMock = {
  findById: jest.fn((id) => {
    const doc = characters.get(id);
    if (!doc) {
      return {
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(null),
      };
    }
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject),
    };
    // Support awaited populate chains: findById().populate().populate()
    query.populate.mockImplementation(() => query);
    // Final await of the query should resolve the doc
    query.then = (resolve, reject) => Promise.resolve(doc).then(resolve, reject);
    return query;
  }),
};

const UserMock = {
  findById: jest.fn((id) => Promise.resolve(users.get(id) || null)),
};

jest.unstable_mockModule('../models/Character.js', () => ({
  default: CharacterMock,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

const { default: characterRoutes } = await import('../routes/characterRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/characters', characterRoutes);

const USER_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CHAR_PRIVATE = 'cccccccccccccccccccccccc';
const CHAR_PUBLIC = 'dddddddddddddddddddddddd';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('characterRoutes critical correctness fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    characters.clear();
    users.clear();

    users.set(USER_A, { _id: USER_A, username: 'alice' });
    users.set(USER_B, { _id: USER_B, username: 'bob' });

    characters.set(CHAR_PRIVATE, makeCharacter({
      _id: CHAR_PRIVATE,
      name: 'Secret Hero',
      isPublic: false,
      isActive: true,
      creator: USER_A,
      pixelData: { '0,0': '#ff0000' },
      views: 0,
    }));

    characters.set(CHAR_PUBLIC, makeCharacter({
      _id: CHAR_PUBLIC,
      name: 'Public Hero',
      isPublic: true,
      isActive: true,
      creator: USER_A,
      pixelData: { '1,1': '#00ff00' },
      views: 0,
    }));
  });

  test('private character GET is hidden from outsiders', async () => {
    const unauth = await request(app)
      .get(`/api/characters/${CHAR_PRIVATE}`)
      .expect(404);
    expect(unauth.body.error).toMatch(/not found/i);

    const outsider = await request(app)
      .get(`/api/characters/${CHAR_PRIVATE}`)
      .set('Authorization', `Bearer ${tokenFor(USER_B)}`)
      .expect(404);
    expect(outsider.body.error).toMatch(/not found/i);

    const owner = await request(app)
      .get(`/api/characters/${CHAR_PRIVATE}`)
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .expect(200);
    expect(owner.body.name).toBe('Secret Hero');
    expect(owner.body.pixelData).toEqual({ '0,0': '#ff0000' });
  });

  test('public character GET remains readable without auth', async () => {
    const response = await request(app)
      .get(`/api/characters/${CHAR_PUBLIC}`)
      .expect(200);

    expect(response.body.name).toBe('Public Hero');
  });

  test('PUT /:id validates and only updates whitelist fields', async () => {
    const response = await request(app)
      .put(`/api/characters/${CHAR_PUBLIC}`)
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({
        name: 'Renamed Hero',
        description: 'Updated bio',
        isPublic: false,
        creator: USER_B,
        pixelData: { hacked: true },
      })
      .expect(200);

    expect(response.body.character.name).toBe('Renamed Hero');
    expect(response.body.character.description).toBe('Updated bio');
    expect(response.body.character.isPublic).toBe(false);
    expect(characters.get(CHAR_PUBLIC).creator).toBe(USER_A);
    expect(characters.get(CHAR_PUBLIC).pixelData).toEqual({ '1,1': '#00ff00' });
  });
});
