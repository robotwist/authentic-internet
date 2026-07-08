import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const users = new Map();

const projectDocument = (doc, selection) => {
  if (!doc || !selection) return doc;

  if (selection.startsWith('-')) {
    const projected = { ...doc };
    for (const field of selection.split(/\s+/)) {
      if (field.startsWith('-')) {
        delete projected[field.slice(1)];
      }
    }
    return projected;
  }

  return selection.split(/\s+/).reduce((projected, field) => {
    if (field && Object.prototype.hasOwnProperty.call(doc, field)) {
      projected[field] = doc[field];
    }
    return projected;
  }, {});
};

const makeQuery = (doc) => ({
  select: jest.fn((selection) => Promise.resolve(projectDocument(doc, selection))),
});

const UserMock = {
  findById: jest.fn((id) => makeQuery(users.get(id))),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

const { default: userRoutes } = await import('../routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const tokenFor = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');

describe('user route regressions', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    users.clear();
    users.set('user-1', {
      _id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      inventory: ['private-artifact'],
      messages: ['private-message'],
      experience: 400,
      level: 5,
    });
    users.set('user-2', {
      _id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      avatar: '/bob.png',
      characterSprite: 'data:image/png;base64,bob',
      characterName: 'Bob',
      inventory: ['secret'],
      messages: ['private'],
      experience: 200,
      level: 3,
    });
  });

  it('does not expose private fields when fetching another user profile', async () => {
    const response = await request(app)
      .get('/api/users/user-2')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);

    expect(response.body).toEqual({
      username: 'bob',
      avatar: '/bob.png',
      characterSprite: 'data:image/png;base64,bob',
      characterName: 'Bob',
      level: 3,
    });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('inventory');
    expect(response.body).not.toHaveProperty('messages');
  });

  it('does not overwrite newer XP with a stale lower total', async () => {
    UserMock.findOneAndUpdate.mockReturnValue(makeQuery(null));

    const response = await request(app)
      .put('/api/users/experience')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ experience: 250 })
      .expect(200);

    expect(UserMock.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'user-1',
        $or: expect.any(Array),
      }),
      { $set: { experience: 250, level: 3 } },
      { new: true },
    );
    expect(response.body.experience).toBe(400);
    expect(response.body.level).toBe(5);
  });
});
