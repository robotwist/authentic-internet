import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-progress-quest';

const users = new Map();
const artifacts = new Map();
const questDocs = new Map();
const npcs = new Map();

const UserMock = {
  findById: jest.fn(async (id) => {
    const found = users.get(String(id));
    if (!found) return null;
    return {
      ...found,
      save: jest.fn(async function save() {
        users.set(String(this._id), { ...this });
        // Mimic User pre-save level from experience
        this.level = Math.floor((this.experience || 0) / 100) + 1;
        users.set(String(this._id), {
          _id: this._id,
          username: this.username,
          accountStatus: this.accountStatus,
          experience: this.experience,
          level: this.level,
          inventory: this.inventory,
          gameState: this.gameState,
          achievements: this.achievements,
          lastPosition: this.lastPosition,
        });
        return this;
      }),
    };
  }),
  findByIdAndUpdate: jest.fn(async (id, update) => {
    const existing = users.get(String(id));
    if (!existing) return null;
    const set = update.$set || update;
    const next = { ...existing, ...set };
    users.set(String(id), next);
    return next;
  }),
};

const ArtifactMock = {
  findById: jest.fn(async (id) => {
    const found = artifacts.get(String(id));
    if (!found) return null;
    return {
      ...found,
      save: jest.fn(async function save() {
        artifacts.set(String(this._id), { ...this });
        return this;
      }),
    };
  }),
  findByIdAndUpdate: jest.fn(),
};

class FakeQuestDoc {
  constructor(data) {
    Object.assign(this, data);
    this.activeQuests = data.activeQuests || [];
    this.completedQuests = data.completedQuests || [];
    this.questStats = data.questStats || {
      totalQuestsStarted: 0,
      totalQuestsCompleted: 0,
      totalExpEarned: 0,
      totalItemsEarned: 0,
      totalAbilitiesEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  getActiveQuests() {
    return this.activeQuests;
  }

  getCompletedQuests() {
    return this.completedQuests;
  }

  getQuestProgress(questId) {
    return this.activeQuests.find((q) => q.questId === questId);
  }

  async startQuest(npcId, questData) {
    const questProgress = {
      questId: questData.id,
      npcId,
      title: questData.title,
      description: questData.description,
      stages: questData.stages.map((stage) => ({
        task: stage.task,
        dialogue: stage.dialogue,
        completed: false,
        reward: stage.reward,
      })),
      currentStage: 0,
      isActive: true,
      isCompleted: false,
      startedAt: new Date(),
      totalRewards: { exp: 0, items: [], abilities: [] },
    };
    this.activeQuests.push(questProgress);
    this.questStats.totalQuestsStarted += 1;
    await this.save();
    return questProgress;
  }

  async completeStage(questId, stageIndex) {
    const quest = this.activeQuests.find((q) => q.questId === questId);
    if (!quest || stageIndex >= quest.stages.length) {
      throw new Error('Quest or stage not found');
    }
    if (stageIndex !== quest.currentStage) {
      throw new Error('Stages must be completed in order');
    }
    const stage = quest.stages[stageIndex];
    if (stage.completed) {
      throw new Error('Stage already completed');
    }
    stage.completed = true;
    stage.completedAt = new Date();
    if (stage.reward?.exp) {
      quest.totalRewards.exp += stage.reward.exp;
    }
    const allStagesCompleted = quest.stages.every((s) => s.completed);
    if (allStagesCompleted) {
      quest.isCompleted = true;
      quest.completedAt = new Date();
      this.completedQuests.push({
        questId: quest.questId,
        npcId: quest.npcId,
        title: quest.title,
        completedAt: quest.completedAt,
        totalExp: quest.totalRewards.exp,
      });
      this.questStats.totalQuestsCompleted += 1;
      this.questStats.totalExpEarned += quest.totalRewards.exp;
      this.activeQuests = this.activeQuests.filter((q) => q.questId !== questId);
    } else {
      quest.currentStage = stageIndex + 1;
    }
    await this.save();
    return {
      stage,
      questCompleted: allStagesCompleted,
      rewards: stage.reward,
    };
  }

  async save() {
    questDocs.set(String(this.userId), this);
    return this;
  }
}

const QuestMock = {
  findOrCreateForUser: jest.fn(async (userId) => {
    if (!userId) {
      throw new Error('userId is required');
    }
    let doc = questDocs.get(String(userId));
    if (!doc) {
      doc = new FakeQuestDoc({ userId: String(userId) });
      questDocs.set(String(userId), doc);
    }
    return doc;
  }),
  findOne: jest.fn(async (query) => questDocs.get(String(query.userId)) || null),
};

const NPCMock = {
  findById: jest.fn(async (id) => npcs.get(String(id)) || null),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: UserMock,
}));

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: ArtifactMock,
}));

jest.unstable_mockModule('../models/Quest.js', () => ({
  default: QuestMock,
}));

jest.unstable_mockModule('../models/NPC.js', () => ({
  default: NPCMock,
}));

jest.unstable_mockModule('../utils/rateLimiting.js', () => ({
  authLimiter: (_req, _res, next) => next(),
  passwordResetLimiter: (_req, _res, next) => next(),
  gameStateReadLimiter: (_req, _res, next) => next(),
  gameStateWriteLimiter: (_req, _res, next) => next(),
  apiLimiter: (_req, _res, next) => next(),
}));

const { default: progressRoutes } = await import('../routes/progressRoutes.js');
const { default: questRoutes } = await import('../routes/questRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/progress', progressRoutes);
app.use('/api/quests', questRoutes);

const PLAYER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ARTIFACT = 'cccccccccccccccccccccccc';
const NPC_ID = 'dddddddddddddddddddddddd';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('progress XP/inventory forgery protections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    artifacts.clear();

    users.set(PLAYER, {
      _id: PLAYER,
      username: 'player',
      accountStatus: 'active',
      experience: 50,
      level: 1,
      inventory: [],
      gameState: { viewedArtifacts: [] },
      achievements: [],
    });

    artifacts.set(ARTIFACT, {
      _id: ARTIFACT,
      name: 'Secret Relic',
      exp: 500,
      views: 0,
      status: 'dropped',
    });
  });

  test('rejects forged arbitrary XP amounts without a valid reason', async () => {
    const res = await request(app)
      .post('/api/progress/experience')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ amount: 999999, reason: 'HACK' });

    expect(res.status).toBe(400);
    expect(users.get(PLAYER).experience).toBe(50);
  });

  test('awards only server-defined XP for a known reason', async () => {
    const res = await request(app)
      .post('/api/progress/experience')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ amount: 999999, reason: 'DAILY_LOGIN' });

    expect(res.status).toBe(200);
    expect(res.body.newExperience).toBe(60); // 50 + 10
    expect(users.get(PLAYER).experience).toBe(60);
  });

  test('ignores client inventory and exp on progress save', async () => {
    const res = await request(app)
      .post('/api/progress/save')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({
        exp: 999999,
        inventory: [ARTIFACT],
        characterPosition: { x: 10, y: 20, facing: 'up' },
      });

    expect(res.status).toBe(200);
    const saved = users.get(PLAYER);
    expect(saved.experience).toBe(50);
    expect(saved.inventory).toEqual([]);
    expect(saved.lastPosition).toEqual({ x: 10, y: 20, facing: 'up' });
  });
});

describe('quest route identity and stage sequencing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    questDocs.clear();
    npcs.clear();

    users.set(PLAYER, {
      _id: PLAYER,
      username: 'player',
      accountStatus: 'active',
      experience: 10,
      level: 1,
      inventory: [],
    });
    users.set(OTHER, {
      _id: OTHER,
      username: 'other',
      accountStatus: 'active',
      experience: 0,
      level: 1,
      inventory: [],
    });

    npcs.set(NPC_ID, {
      _id: NPC_ID,
      name: 'Guide',
      type: 'guide',
      area: 'overworld',
      quests: [
        {
          id: 'quest-1',
          title: 'Find the Key',
          description: 'A short quest',
          isActive: true,
          stages: [
            { task: 'Talk', dialogue: 'Hello', reward: { exp: 5 } },
            { task: 'Fetch', dialogue: 'Done', reward: { exp: 15 } },
          ],
        },
      ],
    });
  });

  test('quest list uses JWT userId and isolates per-user documents', async () => {
    const resA = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`);
    const resB = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${tokenFor(OTHER)}`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(questDocs.has(PLAYER)).toBe(true);
    expect(questDocs.has(OTHER)).toBe(true);
    expect(questDocs.get(PLAYER)).not.toBe(questDocs.get(OTHER));
  });

  test('rejects out-of-order stage completion (no stage skip farm)', async () => {
    await request(app)
      .post(`/api/quests/start/${NPC_ID}`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ questId: 'quest-1' });

    const skip = await request(app)
      .post('/api/quests/complete-stage')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ questId: 'quest-1', stageIndex: 1 });

    expect(skip.status).toBe(400);
    expect(skip.body.message).toMatch(/order/i);
    expect(users.get(PLAYER).experience).toBe(10);
  });

  test('awards server stage XP to user.experience on sequential completion', async () => {
    await request(app)
      .post(`/api/quests/start/${NPC_ID}`)
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ questId: 'quest-1' });

    const stage0 = await request(app)
      .post('/api/quests/complete-stage')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ questId: 'quest-1', stageIndex: 0 });

    expect(stage0.status).toBe(200);
    expect(users.get(PLAYER).experience).toBe(15); // 10 + 5

    const stage1 = await request(app)
      .post('/api/quests/complete-stage')
      .set('Authorization', `Bearer ${tokenFor(PLAYER)}`)
      .send({ questId: 'quest-1', stageIndex: 1 });

    expect(stage1.status).toBe(200);
    expect(stage1.body.data.questCompleted).toBe(true);
    expect(users.get(PLAYER).experience).toBe(30); // 15 + 15
  });
});
