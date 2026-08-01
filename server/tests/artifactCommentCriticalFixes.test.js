import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const findById = jest.fn();
const save = jest.fn();

jest.unstable_mockModule('../models/Artifact.js', () => ({
  default: {
    findById,
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));

const { addComment } = await import('../controllers/artifactController.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('artifact comment critical correctness fixes', () => {
  beforeEach(() => {
    findById.mockReset();
    save.mockReset();
  });

  test('accepts client `text` payload and persists schema `text` with JWT userId', async () => {
    const comments = [];
    const artifact = {
      _id: 'art-1',
      comments,
      save,
      populate: jest.fn(async function populate() {
        return this;
      }),
    };
    findById.mockResolvedValue(artifact);
    save.mockImplementation(async function saveImpl() {
      // Simulate mongoose assigning subdocument after push+save
      comments[comments.length - 1] = {
        ...comments[comments.length - 1],
        _id: 'comment-1',
      };
      return artifact;
    });

    const req = {
      user: { userId: '507f1f77bcf86cd799439011' },
      params: { id: 'art-1' },
      body: { text: 'Great find!' },
    };
    const res = mockRes();

    await addComment(req, res);

    expect(save).toHaveBeenCalled();
    expect(comments[0]).toEqual(
      expect.objectContaining({
        user: '507f1f77bcf86cd799439011',
        text: 'Great find!',
      })
    );
    expect(comments[0].content).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Comment added successfully',
        comment: expect.objectContaining({
          user: '507f1f77bcf86cd799439011',
          text: 'Great find!',
        }),
      })
    );
  });

  test('rejects empty comments without saving', async () => {
    findById.mockResolvedValue({
      _id: 'art-1',
      comments: [],
      save,
      populate: jest.fn(),
    });

    const req = {
      user: { userId: '507f1f77bcf86cd799439011' },
      params: { id: 'art-1' },
      body: { text: '   ' },
    };
    const res = mockRes();

    await addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(save).not.toHaveBeenCalled();
  });
});
