import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-password-reset';

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
  findOne: jest.fn(async (query) => {
    for (const user of users.values()) {
      if (
        query.resetPasswordToken &&
        user.resetPasswordToken === query.resetPasswordToken &&
        query.resetPasswordExpires?.$gt &&
        user.resetPasswordExpires > query.resetPasswordExpires.$gt
      ) {
        return user;
      }
    }
    return null;
  }),
  findByIdAndUpdate: jest.fn(async (id, update) => {
    const user = users.get(id);
    if (!user) return null;
    if (update.$push?.refreshTokens && !update.$push.refreshTokens.$each) {
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(update.$push.refreshTokens);
    }
    if (update.$set?.refreshTokens) {
      user.refreshTokens = update.$set.refreshTokens;
    }
    users.set(id, user);
    return user;
  }),
  findById: jest.fn(async (id) => users.get(id) || null),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => ({
  authLimiter: (_req, _res, next) => next(),
  passwordResetLimiter: (_req, _res, next) => next(),
  gameStateReadLimiter: (_req, _res, next) => next(),
  gameStateWriteLimiter: (_req, _res, next) => next(),
  recordFailedLoginAttempt: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
  shouldLockout: jest.fn(() => false),
}));

jest.unstable_mockModule('../controllers/passwordResetController.js', () => ({
  validateResetToken: jest.fn((_req, res) => res.json({ success: true })),
}));

jest.unstable_mockModule('../controllers/emailVerificationController.js', () => ({
  sendVerificationEmail: jest.fn((_req, res) => res.json({ success: true })),
}));

const { default: authRoutes } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const STOLEN_REFRESH = 'stolen-refresh-token-from-attacker';

const hashResetToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

describe('password reset critical correctness fixes', () => {
  let rawToken;

  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    rawToken = crypto.randomBytes(32).toString('hex');

    users.set(USER_ID, makeUserDoc({
      _id: USER_ID,
      username: 'alice',
      email: 'alice@example.com',
      password: 'OldPassword1',
      role: 'user',
      experience: 0,
      level: 1,
      avatar: null,
      resetPasswordToken: hashResetToken(rawToken),
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      refreshTokens: [
        {
          token: STOLEN_REFRESH,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: 'attacker',
        },
      ],
    }));
  });

  test('accepts reset token from URL param with body.password (documented API)', async () => {
    const res = await request(app)
      .post(`/api/auth/password/reset/${rawToken}`)
      .send({ password: 'NewPassword1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();

    const user = users.get(USER_ID);
    expect(user.password).toBe('NewPassword1');
    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
  });

  test('accepts reset token from URL param with body.newPassword', async () => {
    const res = await request(app)
      .post(`/api/auth/password/reset/${rawToken}`)
      .send({ newPassword: 'NewPassword2' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = users.get(USER_ID);
    expect(user.password).toBe('NewPassword2');
  });

  test('invalidates existing refresh tokens so stolen sessions cannot survive reset', async () => {
    const res = await request(app)
      .post(`/api/auth/password/reset/${rawToken}`)
      .send({ password: 'NewPassword3' });

    expect(res.status).toBe(200);

    const user = users.get(USER_ID);
    expect(user.refreshTokens.some((t) => t.token === STOLEN_REFRESH)).toBe(false);
    // Only the newly issued post-reset refresh token (if storeRefreshToken ran) may remain
    expect(user.refreshTokens.every((t) => t.token !== STOLEN_REFRESH)).toBe(true);
  });

  test('rejects missing password when only URL token is present', async () => {
    const res = await request(app)
      .post(`/api/auth/password/reset/${rawToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
