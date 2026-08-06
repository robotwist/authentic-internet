import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import {
  applyArtifactUploads,
  cleanupUploadedFiles,
  collectUploadedPaths,
} from '../utils/cleanupUploads.js';
import { cleanupOrphanUploads } from '../middleware/cleanupOrphanUploads.js';

describe('cleanupUploads helpers', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-upload-'));
  });

  test('collectUploadedPaths gathers multer single and fields uploads', () => {
    const a = path.join(tempDir, 'a.bin');
    const b = path.join(tempDir, 'b.bin');
    const c = path.join(tempDir, 'c.bin');
    fs.writeFileSync(a, 'a');
    fs.writeFileSync(b, 'b');
    fs.writeFileSync(c, 'c');

    expect(
      collectUploadedPaths({
        file: { path: a },
        files: {
          attachment: [{ path: b }],
          artifactIcon: [{ path: c }],
        },
      }).sort()
    ).toEqual([a, b, c].sort());
  });

  test('cleanupUploadedFiles removes orphan files from disk', () => {
    const filePath = path.join(tempDir, 'orphan.bin');
    fs.writeFileSync(filePath, 'x'.repeat(1024));
    expect(fs.existsSync(filePath)).toBe(true);

    cleanupUploadedFiles({
      files: { attachment: [{ path: filePath }] },
    });

    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('applyArtifactUploads maps attachment and icon into artifact fields', () => {
    const target = {};
    const applied = applyArtifactUploads(
      {
        files: {
          attachment: [
            {
              filename: 'artifact-1.png',
              originalname: 'photo.png',
              mimetype: 'image/png',
            },
          ],
          artifactIcon: [
            {
              filename: 'icon-1.png',
              originalname: 'icon.png',
              mimetype: 'image/png',
            },
          ],
        },
      },
      target
    );

    expect(applied).toBe(true);
    expect(target).toEqual({
      attachment: '/uploads/artifacts/artifact-1.png',
      attachmentOriginalName: 'photo.png',
      attachmentType: 'image',
      image: '/uploads/icons/icon-1.png',
    });
  });
});

describe('cleanupOrphanUploads middleware', () => {
  let tempDir;
  let uploadPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-mw-'));
    uploadPath = path.join(tempDir, 'orphan.bin');
    fs.writeFileSync(uploadPath, 'payload');
  });

  test('deletes uploaded files when the handler does not persist them', async () => {
    const app = express();
    app.post(
      '/fail',
      (req, _res, next) => {
        req.files = { attachment: [{ path: uploadPath }] };
        next();
      },
      cleanupOrphanUploads,
      (_req, res) => {
        res.status(400).json({ message: 'Validation failed' });
      }
    );

    await request(app).post('/fail').expect(400);

    // finish event is synchronous with response completion in supertest
    expect(fs.existsSync(uploadPath)).toBe(false);
  });

  test('keeps uploaded files when handler marks uploadsPersisted', async () => {
    const app = express();
    app.post(
      '/ok',
      (req, _res, next) => {
        req.files = { attachment: [{ path: uploadPath }] };
        next();
      },
      cleanupOrphanUploads,
      (req, res) => {
        req.uploadsPersisted = true;
        res.status(201).json({ ok: true });
      }
    );

    await request(app).post('/ok').expect(201);
    expect(fs.existsSync(uploadPath)).toBe(true);
  });
});

describe('artifact create/update orphan cleanup integration', () => {
  const USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  const ARTIFACT_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  let savedArtifacts;
  let uploadDir;
  let iconDir;

  beforeEach(() => {
    jest.resetModules();
    savedArtifacts = [];
    uploadDir = path.join(process.cwd(), 'public/uploads/artifacts');
    iconDir = path.join(process.cwd(), 'public/uploads/icons');
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.mkdirSync(iconDir, { recursive: true });
  });

  async function buildApp() {
    jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
      default: (req, _res, next) => {
        req.user = { userId: USER_ID };
        next();
      },
    }));

    jest.unstable_mockModule('../models/User.js', () => ({
      default: {
        findById: jest.fn().mockResolvedValue({ creationTokens: 0 }),
        findByIdAndUpdate: jest.fn().mockResolvedValue({}),
      },
    }));

    class FakeArtifact {
      constructor(data) {
        Object.assign(this, data);
        this._id = ARTIFACT_ID;
      }

      async save() {
        savedArtifacts.push(this);
        return this;
      }

      toObject() {
        return { ...this };
      }

      static countDocuments = jest.fn().mockResolvedValue(0);

      static findByIdAndUpdate = jest.fn((_id, update) => {
        const doc =
          _id === 'missing'
            ? null
            : {
                ...update,
                _id: ARTIFACT_ID,
                toObject() {
                  return { ...this };
                },
              };
        // Mirror mongoose: await Model.findByIdAndUpdate(...).populate(...)
        return {
          populate: async () => doc,
        };
      });
    }

    jest.unstable_mockModule('../models/Artifact.js', () => ({
      default: FakeArtifact,
    }));

    const { default: artifactRoutes } = await import('../routes/artifactRoutes.js');
    const app = express();
    app.use('/api/artifacts', artifactRoutes);
    return app;
  }

  function listUploadFiles() {
    const artifacts = fs.existsSync(uploadDir)
      ? fs.readdirSync(uploadDir).filter((f) => f.startsWith('artifact-'))
      : [];
    const icons = fs.existsSync(iconDir)
      ? fs.readdirSync(iconDir).filter((f) => f.startsWith('icon-'))
      : [];
    return { artifacts, icons };
  }

  test('POST /api/artifacts deletes orphan uploads when validation fails', async () => {
    const app = await buildApp();
    const before = listUploadFiles();

    await request(app)
      .post('/api/artifacts')
      .attach('attachment', Buffer.alloc(2048, 7), {
        filename: 'fill.bin',
        contentType: 'application/pdf',
      })
      .attach('artifactIcon', Buffer.alloc(1024, 8), {
        filename: 'icon.png',
        contentType: 'image/png',
      })
      .field('name', 'orphan-probe')
      // Missing required description/type/content/area/location → 400 after multer write
      .expect(400);

    const after = listUploadFiles();
    expect(after.artifacts.length).toBe(before.artifacts.length);
    expect(after.icons.length).toBe(before.icons.length);
  });

  test('POST /api/artifacts persists attachment paths on successful create', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/artifacts')
      .attach('attachment', Buffer.from('hello-attachment'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      })
      .field('name', 'With file')
      .field('description', 'Has an attachment')
      .field('type', 'artifact')
      .field('content', 'payload')
      .field('area', 'overworld')
      .field('x', '1')
      .field('y', '2')
      .expect(201);

    expect(savedArtifacts).toHaveLength(1);
    expect(savedArtifacts[0].attachment).toMatch(/^\/uploads\/artifacts\/artifact-/);
    expect(savedArtifacts[0].attachmentOriginalName).toBe('note.txt');
    expect(savedArtifacts[0].attachmentType).toBe('document');
    expect(res.body.attachment).toBe(savedArtifacts[0].attachment);

    const filename = path.basename(savedArtifacts[0].attachment);
    expect(fs.existsSync(path.join(uploadDir, filename))).toBe(true);

    // Cleanup the intentionally persisted test file
    fs.unlinkSync(path.join(uploadDir, filename));
  });

  test('PUT /api/artifacts/:id deletes orphan uploads when artifact is missing', async () => {
    const app = await buildApp();
    const before = listUploadFiles();

    await request(app)
      .put('/api/artifacts/missing')
      .attach('attachment', Buffer.alloc(4096, 9), {
        filename: 'missing-update.pdf',
        contentType: 'application/pdf',
      })
      .field('name', 'Nope')
      .expect(404);

    const after = listUploadFiles();
    expect(after.artifacts.length).toBe(before.artifacts.length);
  });
});
