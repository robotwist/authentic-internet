import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'message-privacy-critical-test-secret';

const users = new Map();
const savedMessages = [];

class FakeMessage {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || `msg-${savedMessages.length + 1}`;
  }

  async save() {
    savedMessages.push(this);
    return this;
  }
}

FakeMessage.find = jest.fn();
FakeMessage.findById = jest.fn();
FakeMessage.findByIdAndDelete = jest.fn();
FakeMessage.findOne = jest.fn();

jest.unstable_mockModule('../models/Message.js', () => ({
  default: FakeMessage,
}));

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn((id) => {
      const doc = users.get(String(id));
      return {
        select: jest.fn(async () => doc || null),
        then: (resolve, reject) => Promise.resolve(doc || null).then(resolve, reject),
      };
    }),
  },
}));

jest.unstable_mockModule('../controllers/messageController.js', () => ({
  sendMessage: jest.fn(),
  fetchMessage: jest.fn(),
}));

const { default: messageRoutes } = await import('../routes/messageRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes);

const SENDER = '507f1f77bcf86cd799439011';
const RECIPIENT = '507f1f77bcf86cd799439022';
const FRIEND = '507f1f77bcf86cd799439033';

const tokenFor = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('message privacy critical correctness fixes', () => {
  beforeEach(() => {
    users.clear();
    savedMessages.length = 0;
    jest.clearAllMocks();

    users.set(RECIPIENT, {
      _id: RECIPIENT,
      friends: [FRIEND],
      blockedUsers: [],
      preferences: {
        privacy: {
          allowMessages: 'friends',
        },
      },
    });
  });

  test('rejects non-friend senders when recipient allowMessages is friends (default)', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${tokenFor(SENDER)}`)
      .send({
        recipient: RECIPIENT,
        content: 'hello stranger',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/friends/i);
    expect(savedMessages).toHaveLength(0);
  });

  test('allows friend senders and persists artifactId on the Message schema field', async () => {
    const artifactId = '507f1f77bcf86cd799439044';

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${tokenFor(FRIEND)}`)
      .send({
        recipient: RECIPIENT,
        content: 'hello friend',
        artifactId,
      });

    expect(res.status).toBe(201);
    expect(savedMessages).toHaveLength(1);
    expect(savedMessages[0]).toEqual(
      expect.objectContaining({
        sender: FRIEND,
        recipient: RECIPIENT,
        content: 'hello friend',
        artifactId,
      })
    );
    expect(savedMessages[0].artifact).toBeUndefined();
  });

  test('rejects all senders when recipient allowMessages is none', async () => {
    users.set(RECIPIENT, {
      _id: RECIPIENT,
      friends: [FRIEND],
      blockedUsers: [],
      preferences: {
        privacy: {
          allowMessages: 'none',
        },
      },
    });

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${tokenFor(FRIEND)}`)
      .send({
        recipient: RECIPIENT,
        content: 'should be blocked',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not accepting messages/i);
    expect(savedMessages).toHaveLength(0);
  });
});
