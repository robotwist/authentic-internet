import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const findById = jest.fn();
const findByIdAndUpdate = jest.fn();
const findByIdAndDelete = jest.fn();
const countDocuments = jest.fn();
const save = jest.fn();

class FakeArtifact {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || 'artifact-mongo-id';
    this.toObject = () => ({ ...this });
  }

  save(...args) {
    return save(...args);
  }
}

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: Object.assign(FakeArtifact, {
    findById,
    findByIdAndUpdate,
    findByIdAndDelete,
    countDocuments,
  }),
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));

const {
  createArtifact,
  updateArtifact,
  deleteArtifact,
} = await import('../controllers/artifactController.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('artifact ownership authorization', () => {
  beforeEach(() => {
    findById.mockReset();
    findByIdAndUpdate.mockReset();
    findByIdAndDelete.mockReset();
    countDocuments.mockReset();
    save.mockReset();
  });

  test('rejects updates from non-owners', async () => {
    findById.mockResolvedValue({
      _id: 'art-1',
      createdBy: 'owner-1',
      content: 'original',
    });

    const req = {
      user: { userId: 'attacker-2' },
      params: { id: 'art-1' },
      body: { content: 'hijacked' },
    };
    const res = mockRes();

    await updateArtifact(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Not authorized to update this artifact',
    });
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('rejects deletes from non-owners', async () => {
    findById.mockResolvedValue({
      _id: 'art-1',
      createdBy: 'owner-1',
    });

    const req = {
      user: { userId: 'attacker-2' },
      params: { id: 'art-1' },
    };
    const res = mockRes();

    await deleteArtifact(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Not authorized to delete this artifact',
    });
    expect(findByIdAndDelete).not.toHaveBeenCalled();
  });

  test('allows owners to update whitelisted fields only', async () => {
    findById.mockResolvedValue({
      _id: 'art-1',
      createdBy: 'owner-1',
      content: 'original',
    });

    const updatedDoc = {
      _id: 'art-1',
      createdBy: 'owner-1',
      content: 'safe update',
      toObject() {
        return { _id: this._id, createdBy: this.createdBy, content: this.content };
      },
    };
    findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(updatedDoc),
    });

    const req = {
      user: { userId: 'owner-1' },
      params: { id: 'art-1' },
      body: {
        content: 'safe update',
        createdBy: 'attacker-2',
        experience: 999999,
      },
    };
    const res = mockRes();

    await updateArtifact(req, res);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'art-1',
      expect.objectContaining({ content: 'safe update' }),
      { new: true, runValidators: true },
    );
    const updatePayload = findByIdAndUpdate.mock.calls[0][1];
    expect(updatePayload.createdBy).toBeUndefined();
    expect(updatePayload.experience).toBeUndefined();
    expect(res.json).toHaveBeenCalled();
  });

  test('ignores client-supplied createdBy on create', async () => {
    countDocuments.mockResolvedValue(0);
    save.mockResolvedValue(undefined);

    const req = {
      user: { userId: 'real-user' },
      body: {
        name: 'Forge Test',
        content: 'hello',
        area: 'overworld',
        location: { x: 1, y: 2 },
        createdBy: 'victim-user',
      },
    };
    const res = mockRes();

    await createArtifact(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.createdBy).toBe('real-user');
  });
});
