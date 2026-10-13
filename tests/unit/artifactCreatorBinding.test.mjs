import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const saved = [];
const tokenUpdates = [];
let createdCount = 0;

class FakeArtifact {
  constructor(data) {
    Object.assign(this, data);
    this._id = "artifact-id";
  }
  save() {
    saved.push({
      name: this.name,
      createdBy: this.createdBy,
    });
    return Promise.resolve(this);
  }
  toObject() {
    return {
      name: this.name,
      createdBy: this.createdBy,
      _id: this._id,
    };
  }
}
FakeArtifact.countDocuments = async () => createdCount;

mock.module(pathToFileURL("/workspace/server/models/Artifact.js").href, {
  defaultExport: FakeArtifact,
});
mock.module(pathToFileURL("/workspace/server/models/User.js").href, {
  defaultExport: {
    findByIdAndUpdate: async (userId, update) => {
      tokenUpdates.push({ userId, update });
      return null;
    },
  },
});

const { createArtifact } = await import(
  "/workspace/server/controllers/artifactController.js"
);
const { convertLegacyArtifact, validateUnifiedArtifact } = await import(
  "/workspace/server/middleware/artifactValidation.js"
);

function runMiddleware(mw, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    mw(req, res, (err) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const artifactBody = {
  name: "spoof",
  description: "forged",
  content: "hello",
  area: "overworld",
  location: { x: 1, y: 2 },
  createdBy: "victim-id",
  creator: "victim-id",
};

test("createArtifact stores the authenticated user, not body createdBy", async () => {
  saved.length = 0;
  tokenUpdates.length = 0;
  createdCount = 0;

  const res = mockRes();
  await createArtifact(
    {
      user: { userId: "attacker-id" },
      body: { ...artifactBody },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(saved[0].createdBy, "attacker-id");
  assert.equal(res.body.createdBy, "attacker-id");
  assert.equal(tokenUpdates.length, 0);
});

test("a second artifact still charges the authenticated user when createdBy is spoofed", async () => {
  saved.length = 0;
  tokenUpdates.length = 0;
  createdCount = 1;

  const res = mockRes();
  await createArtifact(
    {
      user: { userId: "attacker-id" },
      body: { ...artifactBody, name: "second" },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(saved[0].createdBy, "attacker-id");
  assert.equal(tokenUpdates.length, 1);
  assert.equal(tokenUpdates[0].userId, "attacker-id");
  assert.deepEqual(tokenUpdates[0].update, { $inc: { creationTokens: -1 } });
});

test("legacy creator field cannot replace the authenticated author", async () => {
  const req = {
    user: { userId: "attacker-id" },
    body: {
      name: "spoof",
      description: "forged",
      content: "hello",
      area: "overworld",
      location: { x: 3, y: 4 },
      creator: "victim-id",
    },
  };

  await runMiddleware(convertLegacyArtifact, req);
  const validation = await runMiddleware(validateUnifiedArtifact, req);
  assert.equal(validation.statusCode, 0);
  assert.equal(req.body.createdBy, "attacker-id");

  saved.length = 0;
  createdCount = 0;
  const res = mockRes();
  await createArtifact(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(saved[0].createdBy, "attacker-id");
});
