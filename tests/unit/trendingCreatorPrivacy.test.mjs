import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clampTrendingLimit,
  publicCreatorLookup,
  selectPublicCreator,
  SENSITIVE_CREATOR_FIELDS,
  PUBLIC_CREATOR_PROJECTION,
  TRENDING_DEFAULT_LIMIT,
  TRENDING_MAX_LIMIT,
} from "../../server/utils/trendingCharacters.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("clampTrendingLimit", () => {
  it("defaults invalid, zero, and negative values", () => {
    assert.equal(clampTrendingLimit(undefined), TRENDING_DEFAULT_LIMIT);
    assert.equal(clampTrendingLimit("abc"), TRENDING_DEFAULT_LIMIT);
    assert.equal(clampTrendingLimit(0), TRENDING_DEFAULT_LIMIT);
    assert.equal(clampTrendingLimit(-5), TRENDING_DEFAULT_LIMIT);
  });

  it("caps unbounded limit query values", () => {
    assert.equal(clampTrendingLimit(8), 8);
    assert.equal(clampTrendingLimit("999999"), TRENDING_MAX_LIMIT);
  });
});

describe("public creator trending lookup", () => {
  it("whitelists only public creator fields in the $lookup pipeline", () => {
    const lookup = publicCreatorLookup();
    const projectStage = lookup.pipeline.find((stage) => stage.$project);

    assert.ok(projectStage, "lookup pipeline must include $project");
    assert.deepEqual(projectStage.$project, PUBLIC_CREATOR_PROJECTION);

    for (const field of SENSITIVE_CREATOR_FIELDS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(projectStage.$project, field),
        false,
        `${field} must not appear in the public creator projection`,
      );
    }
  });

  it("does not use exclusion-only password/email projection (aggregation bypasses toJSON)", () => {
    const lookup = publicCreatorLookup();
    const projectStage = lookup.pipeline.find((stage) => stage.$project);
    const values = Object.values(projectStage.$project);

    assert.ok(
      values.every((value) => value === 1),
      "creator projection must be an inclusion whitelist, not field exclusions",
    );
    assert.equal(projectStage.$project.password, undefined);
    assert.equal(projectStage.$project.email, undefined);
  });

  it("strips refresh tokens and other secrets from a raw user document", () => {
    const leakedCreator = {
      _id: "user-1",
      username: "explorer",
      avatar: "/uploads/avatars/explorer.png",
      password: "$2a$10$notarealhash",
      email: "explorer@example.com",
      refreshTokens: [
        { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stolen", expires: new Date() },
      ],
      resetPasswordToken: "hashed-reset-token",
      emailVerificationToken: "hashed-verify-token",
      isAdmin: true,
      role: "admin",
      gameState: { inventory: ["secret-artifact"] },
      characterSprite: "data:image/png;base64,AAA",
    };

    const publicCreator = selectPublicCreator(leakedCreator);

    assert.deepEqual(publicCreator, {
      _id: "user-1",
      username: "explorer",
      avatar: "/uploads/avatars/explorer.png",
    });

    for (const field of SENSITIVE_CREATOR_FIELDS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(publicCreator, field),
        false,
        `${field} must not be returned for trending creators`,
      );
    }
  });

  it("wires the whitelist lookup into Character.getTrendingCharacters", () => {
    const source = readFileSync(
      join(repoRoot, "server/models/Character.js"),
      "utf8",
    );

    assert.match(source, /publicCreatorLookup\(\)/);
    assert.match(source, /clampTrendingLimit\(limit\)/);
    assert.doesNotMatch(source, /'creator\.password': 0/);
    assert.doesNotMatch(
      source,
      /localField: 'creator'[\s\S]*foreignField: '_id'/,
    );
  });
});
