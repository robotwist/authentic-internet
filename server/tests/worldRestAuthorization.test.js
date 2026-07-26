import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-world-rest';

const users = new Map();
const worlds = new Map();
const chatMessages = [];

const UserMock = {
  findById: jest.fn(async (id) => users.get(id) || null),
};

const WorldMock = {
  findOne: jest.fn((query) => {
    const world = [...worlds.values()].find((entry) => entry.worldId === query.worldId);
    return {
      populate: jest.fn(function populate() {
        return this;
      }),
      then: (resolve, reject) => Promise.resolve(world || null).then(resolve, reject),
    };
  }),
};

const ChatMessageMock = {
  find: jest.fn(() => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([...chatMessages].reverse()),
  })),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

jest.unstable_mockModule('../models/World.js', () => ({
  default: WorldMock,
}));

jest.unstable_mockModule('../models/Chat.js', () => ({
  default: ChatMessageMock,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../constants.js', () => ({
  MAPS_STRUCTURE: {},
}));

const { default: worldRoutes } = await import('../routes/worlds.js');

const app = express();
app.use(express.json());
app.use('/api/worlds', worldRoutes);

const CREATOR = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const OUTSIDER = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const PRIVATE_WORLD = 'world_private_1';
const PUBLIC_WORLD = 'world_public_1';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('world REST authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    worlds.clear();
    chatMessages.length = 0;

    users.set(CREATOR, {
      _id: CREATOR,
      username: 'creator',
      accountStatus: 'active',
    });
    users.set(OUTSIDER, {
      _id: OUTSIDER,
      username: 'outsider',
      accountStatus: 'active',
    });

    worlds.set(PRIVATE_WORLD, {
      worldId: PRIVATE_WORLD,
      name: 'Secret Grove',
      description: 'invite only hangout',
      creator: CREATOR,
      moderators: [CREATOR],
      activePlayers: [
        {
          userId: CREATOR,
          username: 'creator',
          isOnline: true,
          position: { x: 1, y: 2 },
        },
      ],
      maxPlayers: 20,
      settings: { allowChat: true },
      stats: { totalChatMessages: 1 },
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      isPublic: false,
      requiresInvite: true,
      getOnlinePlayers() {
        return this.activePlayers.filter((player) => player.isOnline);
      },
    });

    worlds.set(PUBLIC_WORLD, {
      worldId: PUBLIC_WORLD,
      name: 'Town Square',
      description: 'open world',
      creator: CREATOR,
      moderators: [CREATOR],
      activePlayers: [],
      maxPlayers: 50,
      settings: { allowChat: true },
      stats: { totalChatMessages: 0 },
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      isPublic: true,
      requiresInvite: false,
      getOnlinePlayers() {
        return [];
      },
    });

    chatMessages.push({
      content: 'private planning notes',
      sender: { userId: CREATOR },
    });
  });

  test('rejects unauthenticated private world detail reads', async () => {
    const response = await request(app)
      .get(`/api/worlds/instance/${PRIVATE_WORLD}`)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/authentication required/i);
  });

  test('rejects outsiders from private world chat history', async () => {
    const response = await request(app)
      .get(`/api/worlds/instance/${PRIVATE_WORLD}/chat`)
      .set('Authorization', `Bearer ${tokenFor(OUTSIDER)}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(ChatMessageMock.find).not.toHaveBeenCalled();
  });

  test('rejects outsiders from private world player presence', async () => {
    const response = await request(app)
      .get(`/api/worlds/instance/${PRIVATE_WORLD}/players`)
      .set('Authorization', `Bearer ${tokenFor(OUTSIDER)}`)
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  test('allows creators to read private world chat and players', async () => {
    const chat = await request(app)
      .get(`/api/worlds/instance/${PRIVATE_WORLD}/chat`)
      .set('Authorization', `Bearer ${tokenFor(CREATOR)}`)
      .expect(200);

    expect(chat.body.success).toBe(true);
    expect(chat.body.messages[0].content).toBe('private planning notes');

    const players = await request(app)
      .get(`/api/worlds/instance/${PRIVATE_WORLD}/players`)
      .set('Authorization', `Bearer ${tokenFor(CREATOR)}`)
      .expect(200);

    expect(players.body.success).toBe(true);
    expect(players.body.players).toHaveLength(1);
  });

  test('keeps public worlds readable without auth', async () => {
    const response = await request(app)
      .get(`/api/worlds/instance/${PUBLIC_WORLD}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.world.worldId).toBe(PUBLIC_WORLD);
  });
});
