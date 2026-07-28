import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const artifactFind = jest.fn();
const artifactFindById = jest.fn();
const userFindById = jest.fn();
const userFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: {
    find: artifactFind,
    findById: artifactFindById,
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: userFindById,
    findByIdAndUpdate: userFindByIdAndUpdate,
  },
}));

const {
  getArtifacts,
  getArtifactById,
  completeArtifact,
  unlockArtifact,
  sanitizeArtifactForClient,
} = await import('../controllers/artifactController.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const leanArtifact = (doc) => ({
  lean: jest.fn().mockResolvedValue(doc),
});

describe('artifact completion and unlock secrets', () => {
  beforeEach(() => {
    artifactFind.mockReset();
    artifactFindById.mockReset();
    userFindById.mockReset();
    userFindByIdAndUpdate.mockReset();
  });

  test('sanitizeArtifactForClient strips unlockAnswer by default', () => {
    const sanitized = sanitizeArtifactForClient({
      _id: 'a1',
      name: 'Puzzle',
      unlockAnswer: 'secret-answer',
      riddle: 'What am I?',
    });

    expect(sanitized.unlockAnswer).toBeUndefined();
    expect(sanitized.riddle).toBe('What am I?');
    expect(sanitized.id).toBe('a1');
  });

  test('GET artifacts never returns unlockAnswer', async () => {
    artifactFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        {
          _id: 'art-1',
          name: 'Locked Box',
          unlockAnswer: 'open-sesame',
          toObject() {
            return {
              _id: this._id,
              name: this.name,
              unlockAnswer: this.unlockAnswer,
            };
          },
        },
      ]),
    });

    const res = mockRes();
    await getArtifacts({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].unlockAnswer).toBeUndefined();
    expect(payload[0].name).toBe('Locked Box');
  });

  test('GET artifact by id strips unlockAnswer for non-creators', async () => {
    artifactFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'art-1',
        createdBy: 'owner-1',
        unlockAnswer: 'open-sesame',
        toObject() {
          return {
            _id: this._id,
            createdBy: this.createdBy,
            unlockAnswer: this.unlockAnswer,
          };
        },
      }),
    });

    const res = mockRes();
    await getArtifactById(
      { params: { id: 'art-1' }, user: { userId: 'attacker-2' } },
      res,
    );

    const payload = res.json.mock.calls[0][0];
    expect(payload.unlockAnswer).toBeUndefined();
  });

  test('completeArtifact rejects puzzle completion without the correct answer', async () => {
    artifactFindById.mockReturnValue(
      leanArtifact({
        _id: 'art-1',
        createdBy: 'owner-1',
        unlockAnswer: 'open-sesame',
      }),
    );

    const res = mockRes();
    await completeArtifact(
      {
        params: { id: 'art-1' },
        user: { userId: 'attacker-2' },
        body: { score: 100 },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(userFindById).not.toHaveBeenCalled();
  });

  test('completeArtifact does not mint creation tokens without unlock proof', async () => {
    const completeArtifactFn = jest.fn();
    const save = jest.fn();

    artifactFindById.mockReturnValue(
      leanArtifact({
        _id: 'art-game',
        createdBy: 'owner-1',
        // no unlockAnswer — previously minted tokens on blind POST
      }),
    );

    userFindById.mockResolvedValue({
      _id: 'attacker-2',
      completedArtifacts: [],
      completeArtifact: completeArtifactFn,
      save,
    });

    const res = mockRes();
    await completeArtifact(
      {
        params: { id: 'art-game' },
        user: { userId: 'attacker-2' },
        body: { score: 999 },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(completeArtifactFn).toHaveBeenCalled();
    expect(userFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        rewards: { creationTokenAwarded: false },
      }),
    );
  });

  test('completeArtifact awards a token only with a correct unlock answer', async () => {
    const completeArtifactFn = jest.fn();
    const save = jest.fn();

    artifactFindById.mockReturnValue(
      leanArtifact({
        _id: 'art-1',
        createdBy: 'owner-1',
        unlockAnswer: 'open-sesame',
      }),
    );

    userFindById.mockResolvedValue({
      _id: 'attacker-2',
      completedArtifacts: [],
      completeArtifact: completeArtifactFn,
      save,
    });

    userFindByIdAndUpdate.mockResolvedValue({});

    const res = mockRes();
    await completeArtifact(
      {
        params: { id: 'art-1' },
        user: { userId: 'attacker-2' },
        body: { answer: 'Open-Sesame', score: 10 },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(userFindByIdAndUpdate).toHaveBeenCalledWith('attacker-2', {
      $inc: { creationTokens: 1 },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        rewards: { creationTokenAwarded: true },
      }),
    );
  });

  test('unlockArtifact requires the correct answer and does not globally open the artifact', async () => {
    const saveArtifact = jest.fn();
    const saveUser = jest.fn();
    const markModified = jest.fn();

    artifactFindById.mockResolvedValue({
      _id: 'art-1',
      unlockAnswer: 'open-sesame',
      visibility: 'locked',
      save: saveArtifact,
    });

    userFindById.mockResolvedValue({
      _id: 'player-1',
      gameState: { unlockedArtifacts: [] },
      markModified,
      save: saveUser,
    });

    const wrong = mockRes();
    await unlockArtifact(
      {
        params: { id: 'art-1' },
        user: { userId: 'player-1' },
        body: { answer: 'wrong' },
      },
      wrong,
    );
    expect(wrong.status).toHaveBeenCalledWith(400);
    expect(saveArtifact).not.toHaveBeenCalled();

    const right = mockRes();
    await unlockArtifact(
      {
        params: { id: 'art-1' },
        user: { userId: 'player-1' },
        body: { answer: 'open-sesame' },
      },
      right,
    );

    expect(right.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, unlockedForUser: true }),
    );
    expect(saveArtifact).not.toHaveBeenCalled();
    expect(saveUser).toHaveBeenCalled();
  });

  test('unlockArtifact rejects artifacts with no unlock challenge instead of force-opening', async () => {
    artifactFindById.mockResolvedValue({
      _id: 'art-1',
      unlockAnswer: undefined,
      visibility: 'locked',
      save: jest.fn(),
    });

    const res = mockRes();
    await unlockArtifact(
      {
        params: { id: 'art-1' },
        user: { userId: 'player-1' },
        body: {},
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'This artifact has no unlock challenge configured.',
    });
  });
});
