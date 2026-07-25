import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';

const users = new Map();

const makeUserDoc = (data) => {
  const doc = {
    ...data,
    save: jest.fn(async function save() {
      users.set(this._id, this);
      return this;
    }),
  };
  return doc;
};

const UserMock = {
  findById: jest.fn((id) => {
    const doc = users.get(id);
    if (!doc) {
      return {
        select: jest.fn().mockResolvedValue(null),
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(null),
      };
    }

    const query = {
      select: jest.fn((fields) => {
        if (!fields) return Promise.resolve(doc);
        if (typeof fields === 'string' && fields.startsWith('-')) {
          const projected = { ...doc };
          for (const field of fields.split(/\s+/)) {
            if (field.startsWith('-')) delete projected[field.slice(1)];
          }
          return Promise.resolve(projected);
        }
        if (typeof fields === 'string') {
          const projected = {};
          for (const field of fields.split(/\s+/)) {
            if (field) projected[field] = doc[field];
          }
          return Promise.resolve(projected);
        }
        return Promise.resolve(doc);
      }),
      populate: jest.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject),
    };
    return query;
  }),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => ({
  gameStateReadLimiter: (_req, _res, next) => next(),
  gameStateWriteLimiter: (_req, _res, next) => next(),
}));

jest.unstable_mockModule('../controllers/userController.js', () => ({
  addFriend: jest.fn(),
  getUserAccess: jest.fn((_req, res) => res.json({ access: true })),
}));

const { default: userRoutes } = await import('../routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const USER_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('userRoutes critical correctness fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();

    users.set(USER_A, makeUserDoc({
      _id: USER_A,
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret-hash',
      avatar: '/alice.png',
      characterSprite: 'sprite-a',
      characterName: 'Alice',
      experience: 100,
      level: 2,
      coins: 10,
      inventory: ['private-item'],
      messages: ['private-msg'],
      savedQuotes: [],
      friends: [],
      skills: { exploration: 1 },
      unlockedPowers: ['dash'],
      activePowers: [],
      maxActivePowers: 3,
      dailyChallenges: {
        date: '2026-07-25',
        challenges: [
          {
            id: 'daily-1',
            title: 'Talk to an NPC',
            completed: true,
            claimed: false,
            reward: { experience: 25, coins: 5 },
          },
          {
            id: 'daily-2',
            title: 'Find an artifact',
            completed: false,
            claimed: false,
            reward: { experience: 40, coins: 8 },
          },
        ],
      },
      friendRequests: {
        sent: [],
        received: [{ userId: USER_B, status: 'pending' }],
      },
      acceptFriendRequest: jest.fn(() => ({})),
      declineFriendRequest: jest.fn(() => ({})),
    }));

    users.set(USER_B, makeUserDoc({
      _id: USER_B,
      username: 'bob',
      email: 'bob@example.com',
      password: 'secret-hash',
      avatar: '/bob.png',
      characterSprite: 'sprite-b',
      characterName: 'Bob',
      experience: 50,
      level: 1,
      inventory: ['bob-secret'],
      friends: [],
      friendRequests: {
        sent: [{ userId: USER_A, status: 'pending' }],
        received: [],
      },
    }));
  });

  test('PUT /skills is not shadowed by /:id', async () => {
    const response = await request(app)
      .put('/api/users/skills')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({ skills: { exploration: 3, crafting: 2 } })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.skills).toEqual({ exploration: 3, crafting: 2 });
    expect(users.get(USER_A).skills).toEqual({ exploration: 3, crafting: 2 });
  });

  test('GET /powers is not shadowed by /:id', async () => {
    const response = await request(app)
      .get('/api/users/powers')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.unlockedPowers).toEqual(['dash']);
  });

  test('GET /friends is not shadowed by /:id', async () => {
    const alice = users.get(USER_A);
    // Simulate mongoose populate chain used by the friends list route.
    UserMock.findById.mockImplementationOnce(() => ({
      populate: jest.fn().mockResolvedValue({
        ...alice,
        friends: [{ username: 'bob', avatar: '/bob.png', level: 1 }],
      }),
    }));

    const response = await request(app)
      .get('/api/users/friends')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .expect(200);

    expect(response.body.friendCount).toBe(1);
    expect(response.body.friends[0].username).toBe('bob');
  });

  test('challenge claim rejects client-forged rewards and incomplete challenges', async () => {
    const forged = await request(app)
      .post('/api/users/challenges/claim')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({
        challengeId: 'daily-2',
        reward: { experience: 999999, coins: 999999 },
      })
      .expect(400);

    expect(forged.body.message).toMatch(/not completed/i);
    expect(users.get(USER_A).experience).toBe(100);
    expect(users.get(USER_A).coins).toBe(10);

    const claimed = await request(app)
      .post('/api/users/challenges/claim')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({
        challengeId: 'daily-1',
        reward: { experience: 999999, coins: 999999 },
      })
      .expect(200);

    expect(claimed.body.user.experience).toBe(125);
    expect(claimed.body.user.coins).toBe(15);

    const replay = await request(app)
      .post('/api/users/challenges/claim')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({ challengeId: 'daily-1' })
      .expect(400);

    expect(replay.body.message).toMatch(/already claimed/i);
    expect(users.get(USER_A).experience).toBe(125);
  });

  test('PUT /:id rejects progression mass-assignment', async () => {
    const response = await request(app)
      .put(`/api/users/${USER_A}`)
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({
        avatar: '/new-avatar.png',
        exp: 999999,
        level: 99,
        inventory: ['hacked'],
      })
      .expect(200);

    expect(response.body.user.avatar).toBe('/new-avatar.png');
    expect(users.get(USER_A).avatar).toBe('/new-avatar.png');
    expect(users.get(USER_A).experience).toBe(100);
    expect(users.get(USER_A).level).toBe(2);
    expect(users.get(USER_A).inventory).toEqual(['private-item']);
  });

  test('GET /:id does not leak private profile fields', async () => {
    const response = await request(app)
      .get(`/api/users/${USER_B}`)
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .expect(200);

    expect(response.body).toEqual({
      username: 'bob',
      avatar: '/bob.png',
      characterSprite: 'sprite-b',
      characterName: 'Bob',
      level: 1,
    });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('inventory');
  });

  test('friends accept does not crash from req shadowing', async () => {
    const response = await request(app)
      .post('/api/users/friends/accept')
      .set('Authorization', `Bearer ${tokenFor(USER_A)}`)
      .send({ fromUserId: USER_B })
      .expect(200);

    expect(response.body.message).toMatch(/accepted/i);
    expect(users.get(USER_B).friends).toContain(USER_A);
    expect(users.get(USER_B).friendRequests.sent[0].status).toBe('accepted');
  });
});
