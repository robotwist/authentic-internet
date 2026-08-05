import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const npcs = new Map();

class FakeQuery {
  constructor(result) {
    this.result = result;
  }

  select() {
    // Mirror Mongoose .select('-memory.conversationHistory ...') by stripping
    // sensitive fields from the resolved document(s).
    if (Array.isArray(this.result)) {
      this.result = this.result.map((npc) => this.#strip(npc));
    } else if (this.result) {
      this.result = this.#strip(this.result);
    }
    return this;
  }

  #strip(npc) {
    const clone = JSON.parse(JSON.stringify(npc));
    if (clone.memory) {
      delete clone.memory.conversationHistory;
    }
    delete clone.quoteCache;
    if (clone.apiConfig) {
      delete clone.apiConfig.apiKey;
    }
    return clone;
  }

  then(resolve, reject) {
    return Promise.resolve(this.result).then(resolve, reject);
  }
}

const NPCMock = {
  findById: jest.fn((id) => {
    const found = npcs.get(String(id));
    return new FakeQuery(found ? JSON.parse(JSON.stringify(found)) : null);
  }),
  find: jest.fn((query = {}) => {
    const all = Array.from(npcs.values()).map((npc) => JSON.parse(JSON.stringify(npc)));
    const filtered = query.world
      ? all.filter((npc) => String(npc.world) === String(query.world))
      : all;
    return new FakeQuery(filtered);
  }),
  findOne: jest.fn(),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findById: jest.fn() },
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

const VICTIM = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const NPC_ID = 'cccccccccccccccccccccccc';
const WORLD_ID = 'dddddddddddddddddddddddd';

describe('NPC public detail memory leak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    npcs.clear();

    npcs.set(NPC_ID, {
      _id: NPC_ID,
      name: 'Guide',
      type: 'guide',
      world: WORLD_ID,
      area: 'overworld',
      apiConfig: { apiKey: 'secret-key' },
      quoteCache: [{ text: 'cached' }],
      memory: {
        conversationHistory: [
          {
            playerId: VICTIM,
            topics: ['my private secret about home'],
            sentiment: 'positive',
            lastInteraction: new Date().toISOString(),
            interactionCount: 4,
            relationship: 'friend',
            playerProgress: {
              level: 7,
              artifactsDiscussed: ['artifact-1'],
              questsGiven: ['quest-1'],
              secretsRevealed: ['hidden-path'],
              personalDetails: ['lives near the river'],
            },
          },
        ],
        globalKnowledge: {
          totalInteractions: 4,
          popularTopics: ['nature'],
        },
      },
    });
  });

  test('GET /api/npcs/:id omits conversationHistory, quoteCache, and api keys', async () => {
    const res = await request(app).get(`/api/npcs/${NPC_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.npc).toBeTruthy();
    expect(res.body.npc.name).toBe('Guide');
    expect(res.body.npc.memory?.conversationHistory).toBeUndefined();
    expect(res.body.npc.quoteCache).toBeUndefined();
    expect(res.body.npc.apiConfig?.apiKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(VICTIM);
    expect(JSON.stringify(res.body)).not.toContain('my private secret about home');
    expect(JSON.stringify(res.body)).not.toContain('lives near the river');
    expect(JSON.stringify(res.body)).not.toContain('secret-key');
  });

  test('GET /api/npcs/world/:worldId omits conversationHistory from every NPC', async () => {
    const res = await request(app).get(`/api/npcs/world/${WORLD_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].memory?.conversationHistory).toBeUndefined();
    expect(res.body[0].quoteCache).toBeUndefined();
    expect(res.body[0].apiConfig?.apiKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(VICTIM);
    expect(JSON.stringify(res.body)).not.toContain('my private secret about home');
  });
});
