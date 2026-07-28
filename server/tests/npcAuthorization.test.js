import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-npc-auth';

const users = new Map();
const npcs = new Map();

const UserMock = {
  findById: jest.fn(async (id) => users.get(String(id)) || null),
};

class FakeNPC {
  constructor(data) {
    Object.assign(this, data);
  }

  getPlayerMemory(playerId) {
    if (!this.memory) this.memory = { conversationHistory: [], globalKnowledge: { totalInteractions: 0 } };
    if (!this.memory.conversationHistory) this.memory.conversationHistory = [];
    let memory = this.memory.conversationHistory.find((c) => String(c.playerId) === String(playerId));
    if (!memory) {
      memory = {
        playerId: String(playerId),
        topics: [],
        sentiment: 'neutral',
        lastInteraction: new Date(),
        interactionCount: 0,
        relationship: 'stranger',
        playerProgress: {
          level: 1,
          artifactsDiscussed: [],
          questsGiven: [],
          secretsRevealed: [],
          personalDetails: [],
        },
      };
      this.memory.conversationHistory.push(memory);
    }
    return memory;
  }

  async interact(message, playerId) {
    const memory = this.getPlayerMemory(playerId);
    memory.interactionCount += 1;
    memory.lastInteraction = new Date();
    if (!this.memory.globalKnowledge) this.memory.globalKnowledge = { totalInteractions: 0 };
    this.memory.globalKnowledge.totalInteractions += 1;
    await this.save();
    return {
      text: `Echo: ${message || 'hello'}`,
      author: this.name,
      relationship: memory.relationship,
      context: { interactionCount: memory.interactionCount },
    };
  }

  markModified() {}

  async save() {
    npcs.set(String(this._id), this);
    return this;
  }
}

const NPCMock = {
  findById: jest.fn(async (id) => {
    const found = npcs.get(String(id));
    return found ? new FakeNPC(JSON.parse(JSON.stringify(found))) : null;
  }),
  find: jest.fn(),
  findOne: jest.fn(),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: NPCMock,
}));

jest.unstable_mockModule('../models/World.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../services/apiIntegrations.js', () => ({
  fetchJohnMuirQuote: jest.fn(),
}));

const { default: npcRoutes } = await import('../routes/npcs.js');

const app = express();
app.use(express.json());
app.use('/api/npcs', npcRoutes);

const PLAYER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const VICTIM = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const NPC_ID = 'cccccccccccccccccccccccc';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('NPC authorization and quest isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    npcs.clear();

    users.set(PLAYER, { _id: PLAYER, username: 'player', accountStatus: 'active' });
    users.set(VICTIM, { _id: VICTIM, username: 'victim', accountStatus: 'active' });

    npcs.set(NPC_ID, {
      _id: NPC_ID,
      name: 'Guide',
      type: 'guide',
      area: 'overworld',
      memory: {
        conversationHistory: [
          {
            playerId: VICTIM,
            topics: ['secret-trail'],
            sentiment: 'positive',
            lastInteraction: new Date().toISOString(),
            interactionCount: 5,
            relationship: 'friend',
            playerProgress: {
              level: 3,
              artifactsDiscussed: ['hidden-map'],
              questsGiven: [],
              secretsRevealed: ['yosemite-path'],
              personalDetails: [],
            },
          },
        ],
        globalKnowledge: { totalInteractions: 5 },
      },
      quests: [
        {
          id: 'quest-1',
          title: 'Find the trail',
          description: 'A shared quest template',
          isActive: true,
          completedBy: [],
          stages: [
            { task: 'Talk to guide', dialogue: 'Hello', completed: false, reward: { exp: 10 } },
            { task: 'Reach meadow', dialogue: 'Go north', completed: false, reward: { exp: 20 } },
          ],
          playerStageProgress: [],
        },
      ],
      personality: { traits: {} },
    });
  });

  test('rejects unauthenticated interact and ignores spoofed body.userId', async () => {
    const unauth = await request(app)
      .post(`/api/npcs/${NPC_ID}/interact`)
      .send({ message: 'hi', userId: VICTIM });

    expect(unauth.status).toBe(401);

    const authRes = await request(app)
      .post(`/api/npcs/${NPC_ID}/interact`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ message: 'hi', userId: VICTIM });

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);

    const stored = npcs.get(NPC_ID);
    const playerMemory = stored.memory.conversationHistory.find(
      (c) => String(c.playerId) === PLAYER,
    );
    const victimMemory = stored.memory.conversationHistory.find(
      (c) => String(c.playerId) === VICTIM,
    );

    expect(playerMemory?.interactionCount).toBe(1);
    // Victim memory must not be mutated by spoofed body.userId
    expect(victimMemory?.interactionCount).toBe(5);
  });

  test('forbids reading another player NPC memory', async () => {
    const res = await request(app)
      .get(`/api/npcs/${NPC_ID}/memory/${VICTIM}`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  test('allows a player to read only their own NPC memory', async () => {
    const res = await request(app)
      .get(`/api/npcs/${NPC_ID}/memory/${PLAYER}`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('quest progress uses token identity and does not mutate shared stage templates', async () => {
    const res = await request(app)
      .post(`/api/npcs/${NPC_ID}/quest/quest-1/progress`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ userId: VICTIM, stageIndex: 0, completed: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.completedStages).toEqual([0]);
    expect(res.body.questCompleted).toBe(false);

    const stored = npcs.get(NPC_ID);
    const quest = stored.quests[0];

    // Shared template stages must remain incomplete for other players
    expect(quest.stages[0].completed).toBe(false);
    expect(quest.stages[1].completed).toBe(false);

    // Progress is attributed to the authenticated player, not body.userId
    expect(quest.completedBy).toEqual([]);
    const playerProgress = quest.playerStageProgress.find(
      (entry) => String(entry.playerId) === PLAYER,
    );
    expect(playerProgress?.completedStages).toEqual([0]);
    expect(
      quest.playerStageProgress.find((entry) => String(entry.playerId) === VICTIM),
    ).toBeUndefined();
  });

  test('completing all stages marks only the authenticated user in completedBy', async () => {
    await request(app)
      .post(`/api/npcs/${NPC_ID}/quest/quest-1/progress`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ stageIndex: 0, completed: true });

    const res = await request(app)
      .post(`/api/npcs/${NPC_ID}/quest/quest-1/progress`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ userId: VICTIM, stageIndex: 1, completed: true });

    expect(res.status).toBe(200);
    expect(res.body.questCompleted).toBe(true);

    const stored = npcs.get(NPC_ID);
    expect(stored.quests[0].stages.every((s) => s.completed === false)).toBe(true);
    expect(stored.quests[0].completedBy.map(String)).toEqual([PLAYER]);
    expect(stored.quests[0].completedBy.map(String)).not.toContain(VICTIM);
  });
});
