import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-collab-rest';

const collaborations = new Map();
const artifacts = new Map();

class FakeCollaboration {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || 'session-1';
    this.participants = data.participants || [];
    this.settings = data.settings || { maxParticipants: 10 };
    this.visibility = data.visibility || 'invite-only';
  }

  async save() {
    collaborations.set(this._id.toString(), this);
    return this;
  }

  async populate() {
    return this;
  }
}

class FakeArtifact {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || `artifact-${artifacts.size + 1}`;
    this.versionHistory = data.versionHistory || [];
  }

  async save() {
    artifacts.set(this._id.toString(), this);
    return this;
  }
}

const CollaborationMock = Object.assign(
  function CollaborationConstructor(data) {
    return new FakeCollaboration(data);
  },
  {
    findById: jest.fn(async (id) => collaborations.get(id.toString()) || null),
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
  }
);

const ArtifactMock = Object.assign(
  function ArtifactConstructor(data) {
    return new FakeArtifact(data);
  },
  {
    findById: jest.fn(async (id) => artifacts.get(id.toString()) || null),
  }
);

jest.unstable_mockModule('../models/Collaboration.js', () => ({
  default: CollaborationMock,
}));

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: ArtifactMock,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {},
}));

const { default: collaborationRoutes } = await import('../routes/collaboration.js');

const app = express();
app.use(express.json());
app.use('/api/collaboration', collaborationRoutes);

const CREATOR = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const OUTSIDER = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const EDITOR = 'cccccccccccccccccccccccc';

const tokenFor = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

describe('collaboration REST authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collaborations.clear();
    artifacts.clear();

    const inviteOnly = new FakeCollaboration({
      _id: 'invite-session',
      name: 'Invite Only Room',
      artifactType: 'STORY',
      creator: CREATOR,
      visibility: 'invite-only',
      participants: [{ user: CREATOR, role: 'owner' }],
      settings: { maxParticipants: 10 },
      artifact: 'artifact-1',
    });
    collaborations.set('invite-session', inviteOnly);

    const publicSession = new FakeCollaboration({
      _id: 'public-session',
      name: 'Public Room',
      artifactType: 'GAME',
      creator: CREATOR,
      visibility: 'public',
      participants: [{ user: CREATOR, role: 'owner' }],
      settings: { maxParticipants: 10 },
    });
    collaborations.set('public-session', publicSession);

    artifacts.set(
      'artifact-1',
      new FakeArtifact({
        _id: 'artifact-1',
        name: 'Original',
        description: 'Owned story',
        content: 'secret draft',
        createdBy: CREATOR,
        type: 'STORY',
      })
    );
  });

  test('creates sessions using JWT userId claim', async () => {
    const response = await request(app)
      .post('/api/collaboration/sessions')
      .set('Authorization', `Bearer ${tokenFor(CREATOR)}`)
      .send({
        name: 'New Session',
        description: 'works with userId tokens',
        artifactType: 'PUZZLE',
        visibility: 'public',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.collaboration.creator).toBe(CREATOR);
    expect(response.body.collaboration.participants[0].user).toBe(CREATOR);
    expect(response.body.collaboration.visibility).toBe('public');
  });

  test('blocks self-join into invite-only sessions', async () => {
    const response = await request(app)
      .post('/api/collaboration/sessions/invite-session/join')
      .set('Authorization', `Bearer ${tokenFor(OUTSIDER)}`)
      .send({ role: 'owner' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(collaborations.get('invite-session').participants).toHaveLength(1);
  });

  test('allows public joins but never trusts client owner role', async () => {
    const response = await request(app)
      .post('/api/collaboration/sessions/public-session/join')
      .set('Authorization', `Bearer ${tokenFor(EDITOR)}`)
      .send({ role: 'owner' })
      .expect(200);

    expect(response.body.success).toBe(true);
    const joined = collaborations
      .get('public-session')
      .participants.find((participant) => participant.user === EDITOR);
    expect(joined).toBeTruthy();
    expect(joined.role).toBe('editor');
  });

  test('save ignores forged ownership fields on existing artifacts', async () => {
    const response = await request(app)
      .post('/api/collaboration/sessions/invite-session/save')
      .set('Authorization', `Bearer ${tokenFor(CREATOR)}`)
      .send({
        artifactData: {
          content: 'updated draft',
          createdBy: OUTSIDER,
          collaborators: [OUTSIDER],
          status: 'published',
        },
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const artifact = artifacts.get('artifact-1');
    expect(artifact.content).toBe('updated draft');
    expect(artifact.createdBy).toBe(CREATOR);
    expect(artifact.status).toBeUndefined();
    expect(artifact.collaborators).toBeUndefined();
  });
});
